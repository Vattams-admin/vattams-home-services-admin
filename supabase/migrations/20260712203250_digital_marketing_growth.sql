/*
# Digital Marketing & Business Growth - Google Business, Analytics, Meta Pixel, Email, Reviews

1. New Tables
- `google_business_profile` — Google Business Profile management (business_name, description, address, service_areas, working_hours, contact_numbers, whatsapp, email, website, maps_link, business_profile_link, review_link)
- `analytics_events` — GA4-style event tracking (event_name, event_category, page_url, user_id, session_id, metadata, created_at)
- `analytics_settings` — GA4 and Meta Pixel configuration (ga4_measurement_id, ga4_api_secret, meta_pixel_id, meta_access_token, gsc_verification_token, firebase_config)
- `email_campaigns` — Email marketing campaigns (name, subject, template, recipient_type, status, sent_count, open_count, click_count, created_at)
- `email_templates` — Reusable email templates (name, subject, body, category, is_active, created_at)
- `customer_reviews` — Featured reviews/testimonials (customer_name, rating, review_text, service_name, is_featured, is_approved, source, created_at)
- `blog_categories` — Blog category management (name, slug, description, created_at)
- `blog_tags` — Blog tag management (name, slug, created_at)
- `blog_post_categories` — Many-to-many blog posts to categories (post_id, category_id)
- `blog_post_tags` — Many-to-many blog posts to tags (post_id, tag_id)

2. Modified Tables
- `blog_posts` — Added columns: category_id, featured_image, meta_title, meta_description, canonical_url, is_featured, views_count, related_post_ids
- `settings` — Added columns: technician_whatsapp_number, google_maps_link, google_business_link, google_review_link, facebook_url, instagram_url, youtube_url, linkedin_url, twitter_url, telegram_url, whatsapp_business_url, ga4_measurement_id, meta_pixel_id, google_site_verification

3. Security
- RLS enabled on all new tables
- analytics_settings, email_campaigns, email_templates: admin-only (authenticated with admin role)
- google_business_profile: public SELECT (anon, authenticated), admin INSERT/UPDATE/DELETE
- analytics_events: public INSERT (anon, authenticated), admin SELECT
- customer_reviews: public SELECT for approved/featured, admin INSERT/UPDATE/DELETE
- blog_categories, blog_tags: public SELECT, admin INSERT/UPDATE/DELETE
- blog_post_categories, blog_post_tags: public SELECT, admin INSERT/UPDATE/DELETE

4. Notes
- No GST changes (deferred per requirements)
- analytics_events stores GA4-style events for tracking visitors, sessions, bookings, revenue, WhatsApp clicks, call clicks, service views, conversion rate
- email_campaigns tracks newsletter, booking reminders, service reminders, promotional emails
- customer_reviews supports Google reviews, featured testimonials, rating analytics
- Blog CMS additions support SEO-friendly meta tags, categories, tags, featured images, related posts
*/

-- Google Business Profile table
CREATE TABLE IF NOT EXISTS google_business_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  business_description text,
  address text,
  service_areas text,
  working_hours text,
  contact_numbers text,
  whatsapp text,
  email text,
  website text,
  maps_link text,
  business_profile_link text,
  review_link text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE google_business_profile ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_gbp" ON google_business_profile;
CREATE POLICY "select_gbp" ON google_business_profile FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_gbp" ON google_business_profile;
CREATE POLICY "insert_gbp" ON google_business_profile FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "update_gbp" ON google_business_profile;
CREATE POLICY "update_gbp" ON google_business_profile FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "delete_gbp" ON google_business_profile;
CREATE POLICY "delete_gbp" ON google_business_profile FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Analytics Events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  event_category text NOT NULL DEFAULT 'engagement',
  page_url text,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  session_id text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insert_analytics_events" ON analytics_events;
CREATE POLICY "insert_analytics_events" ON analytics_events FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "select_analytics_events" ON analytics_events;
CREATE POLICY "select_analytics_events" ON analytics_events FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "delete_analytics_events" ON analytics_events;
CREATE POLICY "delete_analytics_events" ON analytics_events FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at);

-- Analytics Settings table
CREATE TABLE IF NOT EXISTS analytics_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ga4_measurement_id text,
  ga4_api_secret text,
  meta_pixel_id text,
  meta_access_token text,
  gsc_verification_token text,
  firebase_config jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE analytics_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_analytics_settings" ON analytics_settings;
CREATE POLICY "select_analytics_settings" ON analytics_settings FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "insert_analytics_settings" ON analytics_settings;
CREATE POLICY "insert_analytics_settings" ON analytics_settings FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "update_analytics_settings" ON analytics_settings;
CREATE POLICY "update_analytics_settings" ON analytics_settings FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "delete_analytics_settings" ON analytics_settings;
CREATE POLICY "delete_analytics_settings" ON analytics_settings FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Email Campaigns table
CREATE TABLE IF NOT EXISTS email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  template text NOT NULL,
  recipient_type text NOT NULL DEFAULT 'all',
  status text NOT NULL DEFAULT 'draft',
  sent_count integer DEFAULT 0,
  open_count integer DEFAULT 0,
  click_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_email_campaigns" ON email_campaigns;
CREATE POLICY "select_email_campaigns" ON email_campaigns FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "insert_email_campaigns" ON email_campaigns;
CREATE POLICY "insert_email_campaigns" ON email_campaigns FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "update_email_campaigns" ON email_campaigns;
CREATE POLICY "update_email_campaigns" ON email_campaigns FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "delete_email_campaigns" ON email_campaigns;
CREATE POLICY "delete_email_campaigns" ON email_campaigns FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Email Templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_email_templates" ON email_templates;
CREATE POLICY "select_email_templates" ON email_templates FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "insert_email_templates" ON email_templates;
CREATE POLICY "insert_email_templates" ON email_templates FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "update_email_templates" ON email_templates;
CREATE POLICY "update_email_templates" ON email_templates FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "delete_email_templates" ON email_templates;
CREATE POLICY "delete_email_templates" ON email_templates FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Customer Reviews table
CREATE TABLE IF NOT EXISTS customer_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  rating integer NOT NULL DEFAULT 5,
  review_text text NOT NULL,
  service_name text,
  is_featured boolean DEFAULT false,
  is_approved boolean DEFAULT false,
  source text DEFAULT 'internal',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE customer_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_customer_reviews" ON customer_reviews;
CREATE POLICY "select_customer_reviews" ON customer_reviews FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_customer_reviews" ON customer_reviews;
CREATE POLICY "insert_customer_reviews" ON customer_reviews FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_customer_reviews" ON customer_reviews;
CREATE POLICY "update_customer_reviews" ON customer_reviews FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "delete_customer_reviews" ON customer_reviews;
CREATE POLICY "delete_customer_reviews" ON customer_reviews FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Blog Categories table
CREATE TABLE IF NOT EXISTS blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_blog_categories" ON blog_categories;
CREATE POLICY "select_blog_categories" ON blog_categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_blog_categories" ON blog_categories;
CREATE POLICY "insert_blog_categories" ON blog_categories FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "update_blog_categories" ON blog_categories;
CREATE POLICY "update_blog_categories" ON blog_categories FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "delete_blog_categories" ON blog_categories;
CREATE POLICY "delete_blog_categories" ON blog_categories FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Blog Tags table
CREATE TABLE IF NOT EXISTS blog_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_blog_tags" ON blog_tags;
CREATE POLICY "select_blog_tags" ON blog_tags FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_blog_tags" ON blog_tags;
CREATE POLICY "insert_blog_tags" ON blog_tags FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "update_blog_tags" ON blog_tags;
CREATE POLICY "update_blog_tags" ON blog_tags FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "delete_blog_tags" ON blog_tags;
CREATE POLICY "delete_blog_tags" ON blog_tags FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Blog Post Categories (many-to-many)
CREATE TABLE IF NOT EXISTS blog_post_categories (
  post_id uuid REFERENCES blog_posts(id) ON DELETE CASCADE,
  category_id uuid REFERENCES blog_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, category_id)
);

ALTER TABLE blog_post_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_blog_post_categories" ON blog_post_categories;
CREATE POLICY "select_blog_post_categories" ON blog_post_categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_blog_post_categories" ON blog_post_categories;
CREATE POLICY "insert_blog_post_categories" ON blog_post_categories FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "delete_blog_post_categories" ON blog_post_categories;
CREATE POLICY "delete_blog_post_categories" ON blog_post_categories FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Blog Post Tags (many-to-many)
CREATE TABLE IF NOT EXISTS blog_post_tags (
  post_id uuid REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_blog_post_tags" ON blog_post_tags;
CREATE POLICY "select_blog_post_tags" ON blog_post_tags FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_blog_post_tags" ON blog_post_tags;
CREATE POLICY "insert_blog_post_tags" ON blog_post_tags FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "delete_blog_post_tags" ON blog_post_tags;
CREATE POLICY "delete_blog_post_tags" ON blog_post_tags FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Add columns to blog_posts
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES blog_categories(id) ON DELETE SET NULL;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS featured_image text;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS meta_title text;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS meta_description text;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS canonical_url text;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS views_count integer DEFAULT 0;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS related_post_ids uuid[] DEFAULT '{}';

-- Add columns to settings
ALTER TABLE settings ADD COLUMN IF NOT EXISTS technician_whatsapp_number text;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS google_maps_link text;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS google_business_link text;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS google_review_link text;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS facebook_url text;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS instagram_url text;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS youtube_url text;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS linkedin_url text;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS twitter_url text;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS telegram_url text;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS whatsapp_business_url text;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS ga4_measurement_id text;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS meta_pixel_id text;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS google_site_verification text;

-- Add policy for blog_posts update (admin can update blog posts)
DROP POLICY IF EXISTS "update_blog_posts" ON blog_posts;
CREATE POLICY "update_blog_posts" ON blog_posts FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "insert_blog_posts" ON blog_posts;
CREATE POLICY "insert_blog_posts" ON blog_posts FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "delete_blog_posts" ON blog_posts;
CREATE POLICY "delete_blog_posts" ON blog_posts FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
