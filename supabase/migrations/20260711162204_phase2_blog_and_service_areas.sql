/*
# Phase 2: Blog CMS and Service Area Management

## Overview
Adds blog_posts table for admin-managed blog content and service_areas table for managing serviceable cities, districts, and pincodes.

## New Tables
1. **blog_posts** - Admin-authored blog articles with title, content, excerpt, image, published status, and Tamil translations
2. **service_areas** - Manageable service areas: city, district, pincode, and availability toggle

## Security
- blog_posts: public read for published posts, admin-only write
- service_areas: public read, admin-only write
*/

-- ============ BLOG POSTS ============
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  title_ta text,
  excerpt text,
  excerpt_ta text,
  content text NOT NULL,
  content_ta text,
  image_url text,
  author text DEFAULT 'VATTAMS Team',
  is_published boolean DEFAULT false,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Public can read published posts
DROP POLICY IF EXISTS "blog_public_read" ON public.blog_posts;
CREATE POLICY "blog_public_read" ON public.blog_posts FOR SELECT
  TO anon, authenticated USING (is_published = true);

-- Admins can read all (including drafts)
DROP POLICY IF EXISTS "blog_admin_read_all" ON public.blog_posts;
CREATE POLICY "blog_admin_read_all" ON public.blog_posts FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Admins can insert
DROP POLICY IF EXISTS "blog_admin_insert" ON public.blog_posts;
CREATE POLICY "blog_admin_insert" ON public.blog_posts FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Admins can update
DROP POLICY IF EXISTS "blog_admin_update" ON public.blog_posts;
CREATE POLICY "blog_admin_update" ON public.blog_posts FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Admins can delete
DROP POLICY IF EXISTS "blog_admin_delete" ON public.blog_posts;
CREATE POLICY "blog_admin_delete" ON public.blog_posts FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============ SERVICE AREAS ============
CREATE TABLE IF NOT EXISTS public.service_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  city_ta text,
  district text NOT NULL,
  pincode text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.service_areas ENABLE ROW LEVEL SECURITY;

-- Public can read active service areas
DROP POLICY IF EXISTS "areas_public_read" ON public.service_areas;
CREATE POLICY "areas_public_read" ON public.service_areas FOR SELECT
  TO anon, authenticated USING (true);

-- Admins can insert
DROP POLICY IF EXISTS "areas_admin_insert" ON public.service_areas;
CREATE POLICY "areas_admin_insert" ON public.service_areas FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Admins can update
DROP POLICY IF EXISTS "areas_admin_update" ON public.service_areas;
CREATE POLICY "areas_admin_update" ON public.service_areas FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Admins can delete
DROP POLICY IF EXISTS "areas_admin_delete" ON public.service_areas;
CREATE POLICY "areas_admin_delete" ON public.service_areas FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_blog_published ON public.blog_posts(is_published);
CREATE INDEX IF NOT EXISTS idx_service_areas_active ON public.service_areas(is_active);
CREATE INDEX IF NOT EXISTS idx_service_areas_city ON public.service_areas(city);

-- ============ TRIGGER: update blog updated_at ============
DROP TRIGGER IF EXISTS blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============ SEED SERVICE AREAS ============
INSERT INTO public.service_areas (city, city_ta, district, pincode, is_active) VALUES
('Chennai', 'சென்னை', 'Chennai', '600001', true),
('Coimbatore', 'கோயம்புத்தூர்', 'Coimbatore', '641001', true),
('Madurai', 'மதுரை', 'Madurai', '625001', true),
('Tiruchirappalli', 'திருச்சிராப்பள்ளி', 'Tiruchirappalli', '620001', true),
('Salem', 'சேலம்', 'Salem', '636001', true),
('Tirunelveli', 'திருநெல்வேலி', 'Tirunelveli', '627001', true),
('Vellore', 'வேலூர்', 'Vellore', '632001', true),
('Erode', 'ஈரோடு', 'Erode', '638001', true),
('Tiruppur', 'திருப்பூர்', 'Tiruppur', '641601', true),
('Thanjavur', 'தஞ்சாவூர்', 'Thanjavur', '613001', true)
ON CONFLICT DO NOTHING;
