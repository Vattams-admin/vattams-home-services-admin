-- ============================================================================
-- VATTAMS Admin Panel - Complete Database Migration Script
-- Run this in the Supabase SQL Editor for project nfcibyprftnowaiwlxxc
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- TABLES (profiles already exists, skipped)

CREATE TABLE IF NOT EXISTS ai_conversations (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid, role text NOT NULL DEFAULT 'user', messages jsonb NOT NULL DEFAULT '[]', title text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ai_insights (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    insight_type text NOT NULL, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS amc_renewals (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id uuid NOT NULL, service_name text NOT NULL, contract_start timestamptz NOT NULL, contract_end timestamptz NOT NULL, amount numeric NOT NULL DEFAULT 0, status text NOT NULL DEFAULT 'active', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS analytics_events (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    event_name text NOT NULL, event_category text, page_url text, user_id uuid, session_id text, metadata jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS analytics_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    ga4_measurement_id text, ga4_api_secret text, meta_pixel_id text, meta_access_token text, gsc_verification_token text, firebase_config jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS audit_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text, action text NOT NULL, entity_type text NOT NULL, entity_id text, details text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS blog_categories (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL, slug text NOT NULL, description text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS blog_posts (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL, title_ta text, excerpt text, excerpt_ta text, content text NOT NULL, content_ta text, image_url text, author text DEFAULT 'VATTAMS Team', is_published boolean DEFAULT false, published_at timestamptz, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(), category_id uuid, featured_image text, meta_title text, meta_description text, canonical_url text, is_featured boolean NOT NULL DEFAULT false, views_count integer NOT NULL DEFAULT 0, related_post_ids uuid[] NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS blog_tags (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL, slug text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS booking_photos (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id uuid NOT NULL, photo_url text NOT NULL, photo_type text NOT NULL, created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS bookings (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_number text NOT NULL DEFAULT ('BK' || upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 8))), customer_id uuid NOT NULL, technician_id uuid, service_category_id uuid, service_name text NOT NULL, status text NOT NULL DEFAULT 'created', scheduled_date date, scheduled_time text, address text, city text, district text, pincode text, lat double precision, lng double precision, customer_notes text, amount numeric DEFAULT 0, cancelled_by text, cancel_reason text, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(), service_id uuid, notes text, area text
);
CREATE TABLE IF NOT EXISTS campaign_metrics (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id uuid, impressions integer NOT NULL DEFAULT 0, clicks integer NOT NULL DEFAULT 0, conversions integer NOT NULL DEFAULT 0, date timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS coupons (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code text NOT NULL, description text, discount_type text NOT NULL DEFAULT 'percentage', discount_value numeric NOT NULL DEFAULT 0, min_amount numeric NOT NULL DEFAULT 0, max_uses integer NOT NULL DEFAULT 0, used_count integer NOT NULL DEFAULT 0, valid_from timestamptz NOT NULL DEFAULT now(), valid_until timestamptz, is_active boolean NOT NULL DEFAULT true, offer_type text, district text, service_category text, max_discount_amount numeric, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS customer_anniversaries (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id uuid NOT NULL, type text NOT NULL, anniversary_date timestamptz NOT NULL, is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS customer_complaints (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id uuid NOT NULL, booking_id uuid, complaint_type text NOT NULL, description text NOT NULL, status text NOT NULL DEFAULT 'open', resolution text, created_at timestamptz NOT NULL DEFAULT now(), resolved_at timestamptz
);
CREATE TABLE IF NOT EXISTS customer_followups (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id uuid NOT NULL, admin_id uuid, scheduled_date timestamptz NOT NULL, reason text NOT NULL, status text NOT NULL DEFAULT 'pending', notes text, completed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS customer_notes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id uuid NOT NULL, admin_id uuid, note text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS customer_reviews (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_name text NOT NULL, rating integer NOT NULL DEFAULT 5, review_text text NOT NULL, service_name text, is_featured boolean NOT NULL DEFAULT false, is_approved boolean NOT NULL DEFAULT false, source text NOT NULL DEFAULT 'internal', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS email_campaigns (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL, subject text NOT NULL, template text, recipient_type text NOT NULL DEFAULT 'all', status text NOT NULL DEFAULT 'draft', sent_count integer NOT NULL DEFAULT 0, open_count integer NOT NULL DEFAULT 0, click_count integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS email_templates (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL, subject text NOT NULL, body text NOT NULL, category text, is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS google_business_profiles (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    business_name text NOT NULL, business_description text, address text, service_areas text, working_hours text, contact_numbers text, whatsapp text, email text, website text, maps_link text, business_profile_link text, review_link text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS holiday_calendar (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    holiday_name text NOT NULL, holiday_date timestamptz NOT NULL, is_recurring boolean NOT NULL DEFAULT false, description text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS homepage_banners (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL, image_url text, link_url text, position text NOT NULL DEFAULT 'top', is_active boolean NOT NULL DEFAULT true, clicks integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS invoices (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_number text NOT NULL DEFAULT ('INV' || upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 8))), booking_id uuid NOT NULL, customer_id uuid NOT NULL, technician_id uuid, service_name text NOT NULL, amount numeric NOT NULL DEFAULT 0, status text NOT NULL DEFAULT 'pending', payment_method text DEFAULT 'upi', paid_at timestamptz, created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL, type text, channel text, target_audience text, status text NOT NULL DEFAULT 'draft', start_date timestamptz, end_date timestamptz, metrics jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS notifications (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL, title text NOT NULL, message text NOT NULL, type text DEFAULT 'general', is_read boolean DEFAULT false, related_id uuid, created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS payments (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_number text DEFAULT ('PAY' || upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 8))), booking_id uuid, customer_id uuid NOT NULL, amount numeric NOT NULL DEFAULT 0, status text NOT NULL DEFAULT 'pending', method text DEFAULT 'upi', upi_id text, transaction_id text, paid_at timestamptz, created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS popup_announcements (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL, content text NOT NULL, type text NOT NULL DEFAULT 'info', is_active boolean NOT NULL DEFAULT true, start_date timestamptz, end_date timestamptz, dismissible boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS referral_codes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL, code text NOT NULL, is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS referrals (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id uuid NOT NULL, referred_email text, referred_name text, referral_code text, referral_type text NOT NULL DEFAULT 'customer', status text NOT NULL DEFAULT 'pending', reward_amount numeric NOT NULL DEFAULT 0, reward_status text NOT NULL DEFAULT 'pending', created_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz
);
CREATE TABLE IF NOT EXISTS refunds (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    technician_id uuid NOT NULL, amount numeric DEFAULT 50, refund_type text DEFAULT 'verification_fee', refund_method text, status text DEFAULT 'pending', admin_id uuid, admin_notes text, processed_at timestamptz, completed_at timestamptz, created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS revenue_transactions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_type text NOT NULL, amount numeric NOT NULL, technician_id uuid, booking_id uuid, description text, created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS reviews (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id uuid NOT NULL, customer_id uuid NOT NULL, technician_id uuid NOT NULL, rating integer NOT NULL, review_text text, created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS service_areas (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    city text NOT NULL, city_ta text, district text NOT NULL, pincode text, is_active boolean DEFAULT true, created_at timestamptz DEFAULT now(), area text, taluk text, area_type text DEFAULT 'city', state text DEFAULT 'Tamil Nadu'
);
CREATE TABLE IF NOT EXISTS service_categories (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL, name_ta text, description text, description_ta text, icon text, base_price numeric DEFAULT 0, image_url text, is_active boolean DEFAULT true, sort_order integer DEFAULT 0, created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS service_pricing (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    service_name text NOT NULL, category text, base_price numeric NOT NULL DEFAULT 0, description text, is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS service_reminders (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id uuid NOT NULL, service_name text NOT NULL, due_date timestamptz NOT NULL, reminder_type text NOT NULL DEFAULT 'general', status text NOT NULL DEFAULT 'pending', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS settings (
    id integer NOT NULL DEFAULT 1 PRIMARY KEY,
    company_name text DEFAULT 'VATTAMS HOME SERVICES', company_logo text, upi_id text DEFAULT 'vattams@upi', gst_number text, working_hours text DEFAULT '9 AM - 8 PM', service_areas text, customer_support_phone text DEFAULT '+91 8189800575', technician_support_phone text DEFAULT '+91 8189800767', whatsapp_number text DEFAULT '+91 8189800575', updated_at timestamptz DEFAULT now(), email text, website text, invoice_prefix text, theme_primary_color text, theme_accent_color text, language text, technician_whatsapp_number text, google_maps_link text, google_business_link text, google_review_link text, facebook_url text, instagram_url text, youtube_url text, linkedin_url text, twitter_url text, telegram_url text, whatsapp_business_url text, ga4_measurement_id text, meta_pixel_id text, google_site_verification text
);
CREATE TABLE IF NOT EXISTS social_media_links (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    platform text NOT NULL, url text NOT NULL, icon text, is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS technician_documents (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    technician_id uuid NOT NULL, document_type text NOT NULL, document_url text NOT NULL, document_number text, verified boolean DEFAULT false, created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS technician_locations (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    technician_id uuid NOT NULL, booking_id uuid, lat double precision NOT NULL, lng double precision NOT NULL, heading double precision, speed double precision, updated_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS technician_profiles (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL, city text NOT NULL, district text NOT NULL, service_category text NOT NULL, experience text, aadhaar text, profile_photo text, status text NOT NULL DEFAULT 'pending', is_available boolean DEFAULT true, current_lat double precision, current_lng double precision, location_updated_at timestamptz, created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS technician_wallets (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    technician_id uuid NOT NULL, balance numeric DEFAULT 0, verification_fee_paid boolean DEFAULT false, verification_fee_amount numeric DEFAULT 50, verification_fee_paid_at timestamptz, refund_status text DEFAULT 'not_eligible', refund_amount numeric DEFAULT 50, refund_method text, refund_processed_at timestamptz, refund_completed_at timestamptz, total_earnings numeric DEFAULT 0, pending_earnings numeric DEFAULT 0, total_jobs integer DEFAULT 0, completed_jobs integer DEFAULT 0, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS verification_payments (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    technician_id uuid NOT NULL, amount numeric DEFAULT 50, payment_method text DEFAULT 'upi', payment_status text DEFAULT 'pending', transaction_id text, payment_date timestamptz, created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL, template text NOT NULL, category text, is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);

-- UNIQUE CONSTRAINTS
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'blog_categories_slug_key') THEN ALTER TABLE blog_categories ADD CONSTRAINT blog_categories_slug_key UNIQUE (slug); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'blog_tags_slug_key') THEN ALTER TABLE blog_tags ADD CONSTRAINT blog_tags_slug_key UNIQUE (slug); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_booking_number_key') THEN ALTER TABLE bookings ADD CONSTRAINT bookings_booking_number_key UNIQUE (booking_number); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'coupons_code_key') THEN ALTER TABLE coupons ADD CONSTRAINT coupons_code_key UNIQUE (code); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_invoice_number_key') THEN ALTER TABLE invoices ADD CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'referral_codes_code_key') THEN ALTER TABLE referral_codes ADD CONSTRAINT referral_codes_code_key UNIQUE (code); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'technician_wallets_technician_id_key') THEN ALTER TABLE technician_wallets ADD CONSTRAINT technician_wallets_technician_id_key UNIQUE (technician_id); END IF; END $$;

-- FOREIGN KEYS
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_amc_renewals_customer') THEN ALTER TABLE amc_renewals ADD CONSTRAINT fk_amc_renewals_customer FOREIGN KEY (customer_id) REFERENCES profiles(id) ON DELETE CASCADE; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_blog_posts_category') THEN ALTER TABLE blog_posts ADD CONSTRAINT fk_blog_posts_category FOREIGN KEY (category_id) REFERENCES blog_categories(id) ON DELETE SET NULL; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_booking_photos_booking') THEN ALTER TABLE booking_photos ADD CONSTRAINT fk_booking_photos_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_bookings_customer') THEN ALTER TABLE bookings ADD CONSTRAINT fk_bookings_customer FOREIGN KEY (customer_id) REFERENCES profiles(id) ON DELETE CASCADE; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_bookings_technician') THEN ALTER TABLE bookings ADD CONSTRAINT fk_bookings_technician FOREIGN KEY (technician_id) REFERENCES profiles(id) ON DELETE SET NULL; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_bookings_service_category') THEN ALTER TABLE bookings ADD CONSTRAINT fk_bookings_service_category FOREIGN KEY (service_category_id) REFERENCES service_categories(id) ON DELETE SET NULL; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_campaign_metrics_campaign') THEN ALTER TABLE campaign_metrics ADD CONSTRAINT fk_campaign_metrics_campaign FOREIGN KEY (campaign_id) REFERENCES marketing_campaigns(id) ON DELETE CASCADE; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_customer_anniversaries_customer') THEN ALTER TABLE customer_anniversaries ADD CONSTRAINT fk_customer_anniversaries_customer FOREIGN KEY (customer_id) REFERENCES profiles(id) ON DELETE CASCADE; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_customer_complaints_customer') THEN ALTER TABLE customer_complaints ADD CONSTRAINT fk_customer_complaints_customer FOREIGN KEY (customer_id) REFERENCES profiles(id) ON DELETE CASCADE; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_customer_complaints_booking') THEN ALTER TABLE customer_complaints ADD CONSTRAINT fk_customer_complaints_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_customer_followups_customer') THEN ALTER TABLE customer_followups ADD CONSTRAINT fk_customer_followups_customer FOREIGN KEY (customer_id) REFERENCES profiles(id) ON DELETE CASCADE; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_customer_notes_customer') THEN ALTER TABLE customer_notes ADD CONSTRAINT fk_customer_notes_customer FOREIGN KEY (customer_id) REFERENCES profiles(id) ON DELETE CASCADE; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_invoices_technician') THEN ALTER TABLE invoices ADD CONSTRAINT fk_invoices_technician FOREIGN KEY (technician_id) REFERENCES profiles(id) ON DELETE SET NULL; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_invoices_customer') THEN ALTER TABLE invoices ADD CONSTRAINT fk_invoices_customer FOREIGN KEY (customer_id) REFERENCES profiles(id) ON DELETE CASCADE; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_invoices_booking') THEN ALTER TABLE invoices ADD CONSTRAINT fk_invoices_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_payments_customer') THEN ALTER TABLE payments ADD CONSTRAINT fk_payments_customer FOREIGN KEY (customer_id) REFERENCES profiles(id) ON DELETE CASCADE; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_payments_booking') THEN ALTER TABLE payments ADD CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_referral_codes_user') THEN ALTER TABLE referral_codes ADD CONSTRAINT fk_referral_codes_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_referrals_referrer') THEN ALTER TABLE referrals ADD CONSTRAINT fk_referrals_referrer FOREIGN KEY (referrer_id) REFERENCES profiles(id) ON DELETE CASCADE; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_refunds_admin') THEN ALTER TABLE refunds ADD CONSTRAINT fk_refunds_admin FOREIGN KEY (admin_id) REFERENCES profiles(id) ON DELETE NO ACTION; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_refunds_technician') THEN ALTER TABLE refunds ADD CONSTRAINT fk_refunds_technician FOREIGN KEY (technician_id) REFERENCES profiles(id) ON DELETE CASCADE; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_revenue_transactions_technician') THEN ALTER TABLE revenue_transactions ADD CONSTRAINT fk_revenue_transactions_technician FOREIGN KEY (technician_id) REFERENCES profiles(id) ON DELETE NO ACTION; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_revenue_transactions_booking') THEN ALTER TABLE revenue_transactions ADD CONSTRAINT fk_revenue_transactions_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE NO ACTION; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_reviews_technician') THEN ALTER TABLE reviews ADD CONSTRAINT fk_reviews_technician FOREIGN KEY (technician_id) REFERENCES profiles(id) ON DELETE CASCADE; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_reviews_customer') THEN ALTER TABLE reviews ADD CONSTRAINT fk_reviews_customer FOREIGN KEY (customer_id) REFERENCES profiles(id) ON DELETE CASCADE; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_reviews_booking') THEN ALTER TABLE reviews ADD CONSTRAINT fk_reviews_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_service_reminders_customer') THEN ALTER TABLE service_reminders ADD CONSTRAINT fk_service_reminders_customer FOREIGN KEY (customer_id) REFERENCES profiles(id) ON DELETE CASCADE; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_technician_documents_technician') THEN ALTER TABLE technician_documents ADD CONSTRAINT fk_technician_documents_technician FOREIGN KEY (technician_id) REFERENCES profiles(id) ON DELETE CASCADE; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_technician_locations_booking') THEN ALTER TABLE technician_locations ADD CONSTRAINT fk_technician_locations_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_technician_locations_technician') THEN ALTER TABLE technician_locations ADD CONSTRAINT fk_technician_locations_technician FOREIGN KEY (technician_id) REFERENCES profiles(id) ON DELETE CASCADE; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_technician_profiles_user') THEN ALTER TABLE technician_profiles ADD CONSTRAINT fk_technician_profiles_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_technician_wallets_technician') THEN ALTER TABLE technician_wallets ADD CONSTRAINT fk_technician_wallets_technician FOREIGN KEY (technician_id) REFERENCES profiles(id) ON DELETE CASCADE; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_verification_payments_technician') THEN ALTER TABLE verification_payments ADD CONSTRAINT fk_verification_payments_technician FOREIGN KEY (technician_id) REFERENCES profiles(id) ON DELETE CASCADE; END IF; END $$;

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings (customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings (status);
CREATE INDEX IF NOT EXISTS idx_bookings_technician ON bookings (technician_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices (customer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments (booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments (customer_id);
CREATE INDEX IF NOT EXISTS idx_revenue_transactions_created ON revenue_transactions (created_at);
CREATE INDEX IF NOT EXISTS idx_service_areas_active ON service_areas (is_active);
CREATE INDEX IF NOT EXISTS idx_technician_wallets_tech ON technician_wallets (technician_id);

-- ENABLE RLS ON ALL TABLES
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE amc_renewals ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_anniversaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE holiday_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE popup_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE technician_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE technician_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE technician_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE technician_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES (anon CRUD for all tables)
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS anon_select_%s ON %s', t, t);
    EXECUTE format('CREATE POLICY anon_select_%s ON %s FOR SELECT TO anon, authenticated USING (true)', t, t);
    EXECUTE format('DROP POLICY IF EXISTS anon_insert_%s ON %s', t, t);
    EXECUTE format('CREATE POLICY anon_insert_%s ON %s FOR INSERT TO anon, authenticated WITH CHECK (true)', t, t);
    EXECUTE format('DROP POLICY IF EXISTS anon_update_%s ON %s', t, t);
    EXECUTE format('CREATE POLICY anon_update_%s ON %s FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true)', t, t);
    EXECUTE format('DROP POLICY IF EXISTS anon_delete_%s ON %s', t, t);
    EXECUTE format('CREATE POLICY anon_delete_%s ON %s FOR DELETE TO anon, authenticated USING (true)', t, t);
  END LOOP;
END $$;

-- RPC FUNCTIONS
CREATE OR REPLACE FUNCTION approve_technician(tech_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN UPDATE profiles SET verification_status = 'approved', status = 'active' WHERE id = tech_id AND role = 'technician'; RETURN jsonb_build_object('success', true); END; $$;
CREATE OR REPLACE FUNCTION reject_technician(tech_id uuid, reason text DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN UPDATE profiles SET verification_status = 'rejected', status = 'inactive', rejection_reason = reason WHERE id = tech_id AND role = 'technician'; RETURN jsonb_build_object('success', true); END; $$;
CREATE OR REPLACE FUNCTION assign_technician_to_booking(booking_id uuid, tech_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN UPDATE bookings SET technician_id = tech_id, status = 'assigned', updated_at = now() WHERE id = booking_id; RETURN jsonb_build_object('success', true); END; $$;
CREATE OR REPLACE FUNCTION update_booking_status_admin(booking_id uuid, new_status text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN UPDATE bookings SET status = new_status, updated_at = now() WHERE id = booking_id; RETURN jsonb_build_object('success', true); END; $$;
CREATE OR REPLACE FUNCTION get_admin_dashboard_data() RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$ SELECT jsonb_build_object('bookings', COALESCE((SELECT jsonb_agg(to_jsonb(t.*)) FROM bookings t), '[]'), 'pendingTechs', COALESCE((SELECT jsonb_agg(to_jsonb(t.*)) FROM profiles t WHERE role = 'technician' AND verification_status = 'pending_registration'), '[]'), 'notifications', COALESCE((SELECT jsonb_agg(to_jsonb(t.*)) FROM notifications t), '[]'), 'technicians', COALESCE((SELECT jsonb_agg(to_jsonb(t.*)) FROM profiles t WHERE role = 'technician'), '[]'), 'customers', COALESCE((SELECT jsonb_agg(to_jsonb(t.*)) FROM profiles t WHERE role = 'customer'), '[]')); $$;
CREATE OR REPLACE FUNCTION get_admin_settings() RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$ SELECT to_jsonb(t) FROM settings t LIMIT 1; $$;
CREATE OR REPLACE FUNCTION update_admin_settings(settings_data jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ DECLARE v_id integer; BEGIN SELECT id INTO v_id FROM settings LIMIT 1; IF v_id IS NOT NULL THEN UPDATE settings SET company_name = COALESCE(settings_data->>'company_name', company_name), company_logo = COALESCE(settings_data->>'company_logo', company_logo), upi_id = COALESCE(settings_data->>'upi_id', upi_id), gst_number = COALESCE(settings_data->>'gst_number', gst_number), working_hours = COALESCE(settings_data->>'working_hours', working_hours), customer_support_phone = COALESCE(settings_data->>'customer_support_phone', customer_support_phone), technician_support_phone = COALESCE(settings_data->>'technician_support_phone', technician_support_phone), whatsapp_number = COALESCE(settings_data->>'whatsapp_number', whatsapp_number), email = COALESCE(settings_data->>'email', email), website = COALESCE(settings_data->>'website', website), invoice_prefix = COALESCE(settings_data->>'invoice_prefix', invoice_prefix), theme_primary_color = COALESCE(settings_data->>'theme_primary_color', theme_primary_color), theme_accent_color = COALESCE(settings_data->>'theme_accent_color', theme_accent_color), language = COALESCE(settings_data->>'language', language), technician_whatsapp_number = COALESCE(settings_data->>'technician_whatsapp_number', technician_whatsapp_number), google_maps_link = COALESCE(settings_data->>'google_maps_link', google_maps_link), google_business_link = COALESCE(settings_data->>'google_business_link', google_business_link), google_review_link = COALESCE(settings_data->>'google_review_link', google_review_link), facebook_url = COALESCE(settings_data->>'facebook_url', facebook_url), instagram_url = COALESCE(settings_data->>'instagram_url', instagram_url), youtube_url = COALESCE(settings_data->>'youtube_url', youtube_url), linkedin_url = COALESCE(settings_data->>'linkedin_url', linkedin_url), twitter_url = COALESCE(settings_data->>'twitter_url', twitter_url), telegram_url = COALESCE(settings_data->>'telegram_url', telegram_url), whatsapp_business_url = COALESCE(settings_data->>'whatsapp_business_url', whatsapp_business_url), ga4_measurement_id = COALESCE(settings_data->>'ga4_measurement_id', ga4_measurement_id), meta_pixel_id = COALESCE(settings_data->>'meta_pixel_id', meta_pixel_id), google_site_verification = COALESCE(settings_data->>'google_site_verification', google_site_verification), updated_at = now() WHERE id = v_id; ELSE INSERT INTO settings (company_name) VALUES (settings_data->>'company_name'); END IF; RETURN get_admin_settings(); END; $$;
CREATE OR REPLACE FUNCTION get_all_audit_logs() RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$ SELECT COALESCE(jsonb_agg(to_jsonb(t.*) ORDER BY t.created_at DESC), '[]') FROM audit_logs t; $$;
CREATE OR REPLACE FUNCTION get_all_bookings(p_status text DEFAULT NULL) RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$ SELECT COALESCE(jsonb_agg(to_jsonb(t.*)), '[]') FROM bookings t WHERE p_status IS NULL OR status = p_status; $$;
CREATE OR REPLACE FUNCTION get_all_coupons() RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$ SELECT COALESCE(jsonb_agg(to_jsonb(t.*)), '[]') FROM coupons t; $$;
CREATE OR REPLACE FUNCTION get_all_customer_reviews() RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$ SELECT COALESCE(jsonb_agg(to_jsonb(t.*)), '[]') FROM customer_reviews t; $$;
CREATE OR REPLACE FUNCTION get_all_invoices(p_status text DEFAULT NULL) RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$ SELECT COALESCE(jsonb_agg(to_jsonb(t.*)), '[]') FROM invoices t WHERE p_status IS NULL OR status = p_status; $$;
CREATE OR REPLACE FUNCTION get_all_notifications() RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$ SELECT COALESCE(jsonb_agg(to_jsonb(t.*)), '[]') FROM notifications t; $$;
CREATE OR REPLACE FUNCTION get_all_profiles(p_role text DEFAULT NULL) RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$ SELECT COALESCE(jsonb_agg(to_jsonb(t.*)), '[]') FROM profiles t WHERE p_role IS NULL OR role = p_role; $$;
CREATE OR REPLACE FUNCTION get_all_referrals() RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$ SELECT COALESCE(jsonb_agg(to_jsonb(t.*)), '[]') FROM referrals t; $$;
CREATE OR REPLACE FUNCTION get_all_revenue_transactions() RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$ SELECT COALESCE(jsonb_agg(to_jsonb(t.*)), '[]') FROM revenue_transactions t; $$;
CREATE OR REPLACE FUNCTION get_all_service_areas() RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$ SELECT COALESCE(jsonb_agg(to_jsonb(t.*)), '[]') FROM service_areas t; $$;

-- TRIGGER FUNCTIONS
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN INSERT INTO public.profiles (id, email, name, full_name, mobile, role) VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), COALESCE(NEW.raw_user_meta_data->>'mobile', ''), COALESCE(NEW.raw_user_meta_data->>'role', 'customer')) ON CONFLICT (id) DO NOTHING; NEW.email_confirmed_at := now(); RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION create_technician_wallet() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN IF NEW.role = 'technician' THEN INSERT INTO technician_wallets (technician_id) VALUES (NEW.id) ON CONFLICT (technician_id) DO NOTHING; END IF; RETURN NEW; END; $$;

-- TRIGGERS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
DROP TRIGGER IF EXISTS trigger_create_wallet ON profiles;
CREATE TRIGGER trigger_create_wallet AFTER INSERT ON profiles FOR EACH ROW EXECUTE FUNCTION create_technician_wallet();
DROP TRIGGER IF EXISTS blog_posts_updated_at ON blog_posts;
CREATE TRIGGER blog_posts_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS bookings_updated_at ON bookings;
CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS update_google_business_profiles_updated_at ON google_business_profiles;
CREATE TRIGGER update_google_business_profiles_updated_at BEFORE UPDATE ON google_business_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- SEED DATA
INSERT INTO settings (id, company_name, upi_id, working_hours, customer_support_phone, technician_support_phone, whatsapp_number) VALUES (1, 'VATTAMS HOME SERVICES', 'vattams@upi', '9 AM - 8 PM', '+91 8189800575', '+91 8189800767', '+91 8189800575') ON CONFLICT (id) DO NOTHING;
INSERT INTO service_categories (name, name_ta, description, icon, base_price, is_active, sort_order) VALUES ('AC Service', 'AC சர்வீஸ்', 'Professional AC repair and maintenance', 'wind', 499, true, 1), ('AC Installation', 'AC நிறுவல்', 'Expert AC installation service', 'wind', 999, true, 2), ('Gas Filling', 'கேஸ் நிரப்புதல்', 'AC gas refilling service', 'wind', 1499, true, 3), ('Deep Cleaning', 'ஆழமான சுத்தம்', 'Complete deep cleaning for home appliances', 'sparkles', 799, true, 4), ('Refrigerator', 'குளிர்சாதன பெட்டி', 'Refrigerator repair and service', 'snowflake', 399, true, 5), ('Washing Machine', 'துணி துவைக்கும் இயந்திரம்', 'Washing machine repair and service', 'washing-machine', 399, true, 6), ('RO', 'RO', 'Water purifier RO service', 'droplets', 299, true, 7), ('Electrical', 'மின்சாரம்', 'Electrical repair and installation', 'zap', 299, true, 8), ('Plumbing', 'குழாய் வேலை', 'Plumbing repair and installation', 'wrench', 299, true, 9), ('CCTV', 'CCTV', 'CCTV camera installation and repair', 'cctv', 999, true, 10), ('Other', 'மற்றொன்று', 'Other home services', 'more-horizontal', 299, true, 11) ON CONFLICT DO NOTHING;
