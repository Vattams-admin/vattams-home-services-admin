/*
# VATTAMS Home Services - Core Schema

## Overview
Creates the complete database schema for a multi-role home services platform with customers, technicians, and admins.

## New Tables
1. **profiles** - Extends auth.users with role (customer/technician/admin), name, mobile
2. **technician_profiles** - Technician-specific data: city, district, category, experience, aadhaar, photo, approval status, availability
3. **service_categories** - Catalog of services (AC, Refrigerator, etc.) with base price
4. **bookings** - Service bookings with status tracking, technician assignment, scheduling, location
5. **booking_photos** - Before/after photos uploaded by technician
6. **invoices** - Generated invoices with UPI payment tracking
7. **notifications** - In-app notifications for all roles
8. **reviews** - Customer ratings and reviews for technicians
9. **settings** - Business settings (company logo, UPI, GST, working hours, service areas)

## Security
- RLS enabled on every table
- Customers see only their own bookings/invoices/notifications
- Technicians see only bookings assigned to them
- Admins see everything (via service role or admin role check)
- Public read access for service categories, settings, and reviews (for SEO website)
*/

-- ============ PROFILES ============
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text NOT NULL,
  mobile text NOT NULL,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','technician','admin')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- Admins can read all profiles
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
CREATE POLICY "profiles_admin_all" ON public.profiles FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============ TECHNICIAN PROFILES ============
CREATE TABLE IF NOT EXISTS public.technician_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  city text NOT NULL,
  district text NOT NULL,
  service_category text NOT NULL,
  experience text,
  aadhaar text,
  profile_photo text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','suspended')),
  is_available boolean DEFAULT true,
  current_lat double precision,
  current_lng double precision,
  location_updated_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.technician_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tech_profiles_select_own" ON public.technician_profiles;
CREATE POLICY "tech_profiles_select_own" ON public.technician_profiles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "tech_profiles_update_own" ON public.technician_profiles;
CREATE POLICY "tech_profiles_update_own" ON public.technician_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "tech_profiles_insert_own" ON public.technician_profiles;
CREATE POLICY "tech_profiles_insert_own" ON public.technician_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Admins can see/update all technician profiles
DROP POLICY IF EXISTS "tech_profiles_admin_select" ON public.technician_profiles;
CREATE POLICY "tech_profiles_admin_select" ON public.technician_profiles FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "tech_profiles_admin_update" ON public.technician_profiles;
CREATE POLICY "tech_profiles_admin_update" ON public.technician_profiles FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Customers can see approved technician profiles (for booking)
DROP POLICY IF EXISTS "tech_profiles_customer_select" ON public.technician_profiles;
CREATE POLICY "tech_profiles_customer_select" ON public.technician_profiles FOR SELECT
  TO authenticated USING (
    status = 'approved'
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'customer')
  );

-- ============ SERVICE CATEGORIES ============
CREATE TABLE IF NOT EXISTS public.service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_ta text,
  description text,
  description_ta text,
  icon text,
  base_price numeric DEFAULT 0,
  image_url text,
  is_active boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

-- Public read for SEO website
DROP POLICY IF EXISTS "categories_public_read" ON public.service_categories;
CREATE POLICY "categories_public_read" ON public.service_categories FOR SELECT
  TO anon, authenticated USING (true);

-- Admins can manage categories
DROP POLICY IF EXISTS "categories_admin_insert" ON public.service_categories;
CREATE POLICY "categories_admin_insert" ON public.service_categories FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "categories_admin_update" ON public.service_categories;
CREATE POLICY "categories_admin_update" ON public.service_categories FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "categories_admin_delete" ON public.service_categories;
CREATE POLICY "categories_admin_delete" ON public.service_categories FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============ BOOKINGS ============
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number text UNIQUE NOT NULL DEFAULT 'BK' || upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 8)),
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  technician_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  service_category_id uuid REFERENCES public.service_categories(id) ON DELETE SET NULL,
  service_name text NOT NULL,
  status text NOT NULL DEFAULT 'created' CHECK (status IN ('created','assigned','accepted','on_the_way','arrived','started','completed','payment','invoice','closed','cancelled','rejected')),
  scheduled_date date,
  scheduled_time text,
  address text,
  city text,
  district text,
  pincode text,
  lat double precision,
  lng double precision,
  customer_notes text,
  amount numeric DEFAULT 0,
  cancelled_by text,
  cancel_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Customers: CRUD own bookings
DROP POLICY IF EXISTS "bookings_customer_select" ON public.bookings;
CREATE POLICY "bookings_customer_select" ON public.bookings FOR SELECT
  TO authenticated USING (
    auth.uid() = customer_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    OR auth.uid() = technician_id
  );

DROP POLICY IF EXISTS "bookings_customer_insert" ON public.bookings;
CREATE POLICY "bookings_customer_insert" ON public.bookings FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = customer_id
  );

DROP POLICY IF EXISTS "bookings_customer_update" ON public.bookings;
CREATE POLICY "bookings_customer_update" ON public.bookings FOR UPDATE
  TO authenticated USING (
    auth.uid() = customer_id
    OR auth.uid() = technician_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  ) WITH CHECK (
    auth.uid() = customer_id
    OR auth.uid() = technician_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "bookings_customer_delete" ON public.bookings;
CREATE POLICY "bookings_customer_delete" ON public.bookings FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============ BOOKING PHOTOS ============
CREATE TABLE IF NOT EXISTS public.booking_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  photo_type text NOT NULL CHECK (photo_type IN ('before','after')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.booking_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "photos_select" ON public.booking_photos;
CREATE POLICY "photos_select" ON public.booking_photos FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND (b.customer_id = auth.uid() OR b.technician_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')))
  );

DROP POLICY IF EXISTS "photos_insert" ON public.booking_photos;
CREATE POLICY "photos_insert" ON public.booking_photos FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND (b.technician_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')))
  );

-- ============ INVOICES ============
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL DEFAULT 'INV' || upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 8)),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  technician_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  service_name text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','refunded')),
  payment_method text DEFAULT 'upi',
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoices_select" ON public.invoices;
CREATE POLICY "invoices_select" ON public.invoices FOR SELECT
  TO authenticated USING (
    auth.uid() = customer_id
    OR auth.uid() = technician_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "invoices_insert" ON public.invoices;
CREATE POLICY "invoices_insert" ON public.invoices FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    OR auth.uid() = customer_id
  );

DROP POLICY IF EXISTS "invoices_update" ON public.invoices;
CREATE POLICY "invoices_update" ON public.invoices FOR UPDATE
  TO authenticated USING (
    auth.uid() = customer_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  ) WITH CHECK (
    auth.uid() = customer_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============ NOTIFICATIONS ============
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'general',
  is_read boolean DEFAULT false,
  related_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_select_own" ON public.notifications;
CREATE POLICY "notif_select_own" ON public.notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notif_update_own" ON public.notifications;
CREATE POLICY "notif_update_own" ON public.notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notif_insert_own" ON public.notifications;
CREATE POLICY "notif_insert_own" ON public.notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Admin can insert notifications for any user
DROP POLICY IF EXISTS "notif_admin_insert" ON public.notifications;
CREATE POLICY "notif_admin_insert" ON public.notifications FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "notif_delete_own" ON public.notifications;
CREATE POLICY "notif_delete_own" ON public.notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ REVIEWS ============
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  technician_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Public can read reviews (SEO)
DROP POLICY IF EXISTS "reviews_public_read" ON public.reviews;
CREATE POLICY "reviews_public_read" ON public.reviews FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "reviews_customer_insert" ON public.reviews;
CREATE POLICY "reviews_customer_insert" ON public.reviews FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = customer_id
  );

DROP POLICY IF EXISTS "reviews_customer_delete" ON public.reviews;
CREATE POLICY "reviews_customer_delete" ON public.reviews FOR DELETE
  TO authenticated USING (auth.uid() = customer_id);

-- ============ SETTINGS ============
CREATE TABLE IF NOT EXISTS public.settings (
  id int PRIMARY KEY DEFAULT 1,
  company_name text DEFAULT 'VATTAMS HOME SERVICES',
  company_logo text,
  upi_id text DEFAULT 'vattams@upi',
  gst_number text,
  working_hours text DEFAULT '9 AM - 8 PM',
  service_areas text,
  customer_support_phone text DEFAULT '+91 8189800575',
  technician_support_phone text DEFAULT '+91 8189800767',
  whatsapp_number text DEFAULT '+91 8189800575',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Public read for settings
DROP POLICY IF EXISTS "settings_public_read" ON public.settings;
CREATE POLICY "settings_public_read" ON public.settings FOR SELECT
  TO anon, authenticated USING (true);

-- Admin can update settings
DROP POLICY IF EXISTS "settings_admin_update" ON public.settings;
CREATE POLICY "settings_admin_update" ON public.settings FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_technician ON public.bookings(technician_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_technician ON public.reviews(technician_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ============ TRIGGER: auto-create profile on signup ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, mobile, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'mobile', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ TRIGGER: update updated_at on bookings ============
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bookings_updated_at ON public.bookings;
CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============ INSERT DEFAULT DATA ============
INSERT INTO public.settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.service_categories (name, name_ta, description, description_ta, icon, base_price, sort_order) VALUES
('AC Service', 'AC சர்வீஸ்', 'Professional AC repair and maintenance', 'தொழில்முறை AC பழுதுபார்த்தல் மற்றும் பராமரிப்பு', 'wind', 499, 1),
('AC Installation', 'AC நிறுவல்', 'Expert AC installation service', 'நிபுணர் AC நிறுவல் சேவை', 'wind', 999, 2),
('Gas Filling', 'கேஸ் நிரப்புதல்', 'AC gas refilling service', 'AC கேஸ் மறுநிரப்பு சேவை', 'wind', 1499, 3),
('Deep Cleaning', 'ஆழமான சுத்தம்', 'Complete deep cleaning for home appliances', 'வீட்டு உபகரணங்களுக்கான முழு ஆழமான சுத்தம்', 'sparkles', 799, 4),
('Refrigerator', 'குளிர்சாதன பெட்டி', 'Refrigerator repair and service', 'குளிர்சாதன பெட்டி பழுதுபார்த்தல் மற்றும் சேவை', 'snowflake', 399, 5),
('Washing Machine', 'துணி துவைக்கும் இயந்திரம்', 'Washing machine repair and service', 'துணி துவைக்கும் இயந்திரம் பழுதுபார்த்தல்', 'washing-machine', 399, 6),
('RO', 'RO', 'Water purifier RO service', 'நீர் சுத்திகரிப்பு RO சேவை', 'droplets', 299, 7),
('Electrical', 'மின்சாரம்', 'Electrical repair and installation', 'மின்சார பழுதுபார்த்தல் மற்றும் நிறுவல்', 'zap', 299, 8),
('Plumbing', 'குழாய் வேலை', 'Plumbing repair and installation', 'குழாய் பழுதுபார்த்தல் மற்றும் நிறுவல்', 'wrench', 299, 9),
('CCTV', 'CCTV', 'CCTV camera installation and repair', 'CCTV கேமரா நிறுவல் மற்றும் பழுதுபார்த்தல்', 'cctv', 999, 10),
('Other', 'மற்றொன்று', 'Other home services', 'பிற வீட்டு சேவைகள்', 'more-horizontal', 299, 11)
ON CONFLICT DO NOTHING;
