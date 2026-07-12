/*
# Phase 3: Payments, GPS Tracking, Enhanced Profiles

## Changes:
1. Add full_name, address, experience, skills, bio, status, is_available columns to profiles
2. Create payments table for UPI payment tracking
3. Create technician_locations table for live GPS tracking
4. Add RLS policies for all new tables
5. Create is_admin() helper function if not exists
6. Add area column to service_areas if not exists
7. Add service_id column to bookings for service reference
*/

-- 1. Add columns to profiles
DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS district text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pincode text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS experience text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skills text[];
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Update full_name from name where full_name is null
UPDATE public.profiles SET full_name = name WHERE full_name IS NULL AND name IS NOT NULL;

-- 2. Add area column to service_areas if not exists
DO $$ BEGIN
  ALTER TABLE public.service_areas ADD COLUMN IF NOT EXISTS area text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.service_areas ADD COLUMN IF NOT EXISTS taluk text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.service_areas ADD COLUMN IF NOT EXISTS area_type text DEFAULT 'city';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.service_areas ADD COLUMN IF NOT EXISTS state text DEFAULT 'Tamil Nadu';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- 3. Add service_id to bookings if not exists
DO $$ BEGIN
  ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS service_id uuid;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS notes text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS area text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- 4. Create is_admin() helper function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
$$;

-- 5. Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_number text UNIQUE DEFAULT ('PAY' || upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 8))),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  method text DEFAULT 'upi',
  upi_id text,
  transaction_id text,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_payments" ON public.payments;
CREATE POLICY "select_own_payments" ON public.payments FOR SELECT
  TO authenticated USING (auth.uid() = customer_id OR public.is_admin());

DROP POLICY IF EXISTS "insert_own_payments" ON public.payments;
CREATE POLICY "insert_own_payments" ON public.payments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "update_own_payments" ON public.payments;
CREATE POLICY "update_own_payments" ON public.payments FOR UPDATE
  TO authenticated USING (auth.uid() = customer_id OR public.is_admin()) WITH CHECK (auth.uid() = customer_id OR public.is_admin());

-- 6. Create technician_locations table for live GPS tracking
CREATE TABLE IF NOT EXISTS public.technician_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  heading double precision,
  speed double precision,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.technician_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_technician_locations" ON public.technician_locations;
CREATE POLICY "select_technician_locations" ON public.technician_locations FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_location" ON public.technician_locations;
CREATE POLICY "insert_own_location" ON public.technician_locations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = technician_id);

DROP POLICY IF EXISTS "update_own_location" ON public.technician_locations;
CREATE POLICY "update_own_location" ON public.technician_locations FOR UPDATE
  TO authenticated USING (auth.uid() = technician_id) WITH CHECK (auth.uid() = technician_id);

DROP POLICY IF EXISTS "delete_own_location" ON public.technician_locations;
CREATE POLICY "delete_own_location" ON public.technician_locations FOR DELETE
  TO authenticated USING (auth.uid() = technician_id);

-- Index for efficient location queries
CREATE INDEX IF NOT EXISTS idx_technician_locations_technician_id ON public.technician_locations(technician_id);
CREATE INDEX IF NOT EXISTS idx_technician_locations_booking_id ON public.technician_locations(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON public.payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);

-- 7. Update profiles RLS to allow self-update
DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
CREATE POLICY "update_own_profile" ON public.profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
CREATE POLICY "select_own_profile" ON public.profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR public.is_admin());

-- 8. Update bookings RLS
DROP POLICY IF EXISTS "select_own_bookings" ON public.bookings;
CREATE POLICY "select_own_bookings" ON public.bookings FOR SELECT
  TO authenticated USING (auth.uid() = customer_id OR auth.uid() = technician_id OR public.is_admin());

DROP POLICY IF EXISTS "insert_own_bookings" ON public.bookings;
CREATE POLICY "insert_own_bookings" ON public.bookings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "update_own_bookings" ON public.bookings;
CREATE POLICY "update_own_bookings" ON public.bookings FOR UPDATE
  TO authenticated USING (auth.uid() = customer_id OR auth.uid() = technician_id OR public.is_admin()) WITH CHECK (auth.uid() = customer_id OR auth.uid() = technician_id OR public.is_admin());

-- 9. Update invoices RLS
DROP POLICY IF EXISTS "select_own_invoices" ON public.invoices;
CREATE POLICY "select_own_invoices" ON public.invoices FOR SELECT
  TO authenticated USING (auth.uid() = customer_id OR auth.uid() = technician_id OR public.is_admin());

DROP POLICY IF EXISTS "insert_own_invoices" ON public.invoices;
CREATE POLICY "insert_own_invoices" ON public.invoices FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = customer_id OR public.is_admin());

-- 10. Update notifications RLS
DROP POLICY IF EXISTS "select_own_notifications" ON public.notifications;
CREATE POLICY "select_own_notifications" ON public.notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notifications" ON public.notifications;
CREATE POLICY "insert_own_notifications" ON public.notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "update_own_notifications" ON public.notifications;
CREATE POLICY "update_own_notifications" ON public.notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

-- 11. Update reviews RLS
DROP POLICY IF EXISTS "select_reviews" ON public.reviews;
CREATE POLICY "select_reviews" ON public.reviews FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_reviews" ON public.reviews;
CREATE POLICY "insert_own_reviews" ON public.reviews FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = customer_id);

-- 12. Service areas RLS
DROP POLICY IF EXISTS "select_service_areas" ON public.service_areas;
CREATE POLICY "select_service_areas" ON public.service_areas FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_service_areas" ON public.service_areas;
CREATE POLICY "admin_service_areas" ON public.service_areas FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
