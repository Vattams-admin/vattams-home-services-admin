import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://0ec90b57d6e95fcbda19832f.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw'

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  { auth: { persistSession: true, autoRefreshToken: true } },
)

export type UserRole = 'customer' | 'technician' | 'admin' | 'super_admin'
export type VerificationStatus = 'pending_registration' | 'fee_pending' | 'under_review' | 'approved' | 'rejected' | 'suspended'
export type BookingStatus = 'created' | 'confirmed' | 'assigned' | 'accepted' | 'on_the_way' | 'arrived' | 'work_started' | 'completed' | 'cancelled'

export type Profile = {
  id: string; email: string; name: string; mobile: string; role: UserRole
  full_name: string | null; address: string | null; district: string | null
  city: string | null; pincode: string | null; experience: string | null
  skills: string[] | null; bio: string | null; status: string | null
  is_available: boolean | null; rejection_reason: string | null
  verification_status: VerificationStatus | null; created_at: string
}

export type Booking = {
  id: string; booking_number: string; customer_id: string; technician_id: string | null
  service_name: string; service_category_id: string | null; status: BookingStatus
  scheduled_date: string; scheduled_time: string | null; address: string
  city: string; district: string; pincode: string; customer_notes: string | null
  amount: number; cancelled_by: string | null; cancel_reason: string | null
  created_at: string; updated_at: string
}

export type BookingPhoto = { id: string; booking_id: string; photo_type: 'before' | 'after'; photo_url: string; description: string | null; created_at: string }
export type Notification = { id: string; user_id: string; title: string; message: string; type: string; is_read: boolean; created_at: string }
export type Invoice = { id: string; invoice_number: string; booking_id: string; customer_id: string; technician_id: string | null; service_name: string; amount: number; status: string; payment_method: string; paid_at: string | null; created_at: string }
export type Review = { id: string; booking_id: string; customer_id: string; technician_id: string; rating: number; review_text: string; created_at: string }
export type ServiceArea = { id: string; city: string; city_ta: string | null; district: string; pincode: string | null; is_active: boolean; state: string | null; taluk: string | null; area: string | null; area_type: string | null; lat: number | null; lng: number | null; created_at: string; updated_at: string | null }

export type Settings = {
  id: string; company_name: string | null; company_logo: string | null
  upi_id: string | null; gst_number: string | null; working_hours: string | null
  customer_support_phone: string | null; technician_support_phone: string | null
  whatsapp_number: string | null; updated_at: string | null
  email: string | null; website: string | null; invoice_prefix: string | null
  theme_primary_color: string | null; theme_accent_color: string | null; language: string | null
  technician_whatsapp_number: string | null; google_maps_link: string | null
  google_business_link: string | null; google_review_link: string | null
  facebook_url: string | null; instagram_url: string | null; youtube_url: string | null
  linkedin_url: string | null; twitter_url: string | null; telegram_url: string | null
  whatsapp_business_url: string | null; ga4_measurement_id: string | null
  meta_pixel_id: string | null; google_site_verification: string | null
}

export type Coupon = {
  id: string; code: string; description: string | null
  discount_type: 'percentage' | 'fixed'; discount_value: number; min_amount: number
  max_uses: number; used_count: number; valid_from: string; valid_until: string | null
  is_active: boolean; created_at: string
  offer_type: string | null; district: string | null; service_category: string | null; max_discount_amount: number | null
}

export type AuditLog = { id: string; user_id: string; action: string; entity_type: string; entity_id: string | null; details: string | null; created_at: string }
export type TechnicianWallet = { id: string; technician_id: string; balance: number; verification_fee_paid: boolean; verification_fee_amount: number; verification_fee_paid_at: string | null; refund_status: 'not_eligible' | 'eligible' | 'approved' | 'rejected' | 'processed' | 'completed'; refund_amount: number; refund_method: string | null; refund_processed_at: string | null; refund_completed_at: string | null; total_earnings: number; pending_earnings: number; total_jobs: number; completed_jobs: number; created_at: string; updated_at: string }
export type TechnicianDocument = { id: string; technician_id: string; document_type: string; document_url: string; document_number: string | null; verified: boolean; created_at: string }
export type VerificationPayment = { id: string; technician_id: string; amount: number; payment_method: string; payment_status: string; transaction_id: string | null; payment_date: string | null; created_at: string }
export type Refund = { id: string; technician_id: string; amount: number; refund_type: string; refund_method: string | null; status: 'pending' | 'approved' | 'rejected' | 'processed' | 'completed'; admin_id: string | null; admin_notes: string | null; processed_at: string | null; completed_at: string | null; created_at: string }
export type RevenueTransaction = { id: string; transaction_type: string; amount: number; technician_id: string | null; booking_id: string | null; description: string | null; created_at: string }

export type CustomerNote = { id: string; customer_id: string; admin_id: string | null; note: string; created_at: string }
export type CustomerFollowup = { id: string; customer_id: string; admin_id: string | null; scheduled_date: string; reason: string; status: string; notes: string | null; completed_at: string | null; created_at: string }
export type CustomerComplaint = { id: string; customer_id: string; booking_id: string | null; complaint_type: string; description: string; status: string; resolution: string | null; created_at: string; resolved_at: string | null }
export type ServiceReminder = { id: string; customer_id: string; service_name: string; due_date: string; reminder_type: string; status: string; created_at: string }
export type CustomerAnniversary = { id: string; customer_id: string; type: string; anniversary_date: string; is_active: boolean; created_at: string }
export type AmcRenewal = { id: string; customer_id: string; service_name: string; contract_start: string; contract_end: string; amount: number; status: string; created_at: string }

export type ReferralCode = { id: string; user_id: string; code: string; is_active: boolean; created_at: string }
export type Referral = { id: string; referrer_id: string; referred_email: string | null; referred_name: string | null; referral_code: string; referral_type: string; status: string; reward_amount: number; reward_status: string; created_at: string; completed_at: string | null }

export type HomepageBanner = { id: string; title: string; image_url: string | null; link_url: string | null; position: string; is_active: boolean; clicks: number; created_at: string }
export type PopupAnnouncement = { id: string; title: string; content: string; type: string; is_active: boolean; start_date: string | null; end_date: string | null; dismissible: boolean; created_at: string }
export type MarketingCampaign = { id: string; name: string; type: string; channel: string; target_audience: string | null; status: string; start_date: string | null; end_date: string | null; metrics: Record<string, unknown>; created_at: string }
export type WhatsappTemplate = { id: string; name: string; template: string; category: string; is_active: boolean; created_at: string }
export type SocialMediaLink = { id: string; platform: string; url: string; icon: string | null; is_active: boolean; created_at: string }
export type CampaignMetric = { id: string; campaign_id: string | null; impressions: number; clicks: number; conversions: number; date: string; created_at: string }

export type ServicePricing = { id: string; service_name: string; category: string | null; base_price: number; description: string | null; is_active: boolean; created_at: string }
export type HolidayCalendar = { id: string; holiday_name: string; holiday_date: string; is_recurring: boolean; description: string | null; created_at: string }

export type AiConversation = { id: string; user_id: string; role: string; messages: Array<{ role: string; content: string; timestamp: string }>; title: string | null; created_at: string }
export type AiInsight = { id: string; insight_type: string; data: Record<string, unknown>; created_at: string }

export type GoogleBusinessProfile = { id: string; business_name: string; business_description: string | null; address: string | null; service_areas: string | null; working_hours: string | null; contact_numbers: string | null; whatsapp: string | null; email: string | null; website: string | null; maps_link: string | null; business_profile_link: string | null; review_link: string | null; created_at: string; updated_at: string }
export type AnalyticsEvent = { id: string; event_name: string; event_category: string; page_url: string | null; user_id: string | null; session_id: string | null; metadata: Record<string, unknown>; created_at: string }
export type AnalyticsSettings = { id: string; ga4_measurement_id: string | null; ga4_api_secret: string | null; meta_pixel_id: string | null; meta_access_token: string | null; gsc_verification_token: string | null; firebase_config: Record<string, unknown>; created_at: string; updated_at: string }
export type EmailCampaign = { id: string; name: string; subject: string; template: string; recipient_type: string; status: string; sent_count: number; open_count: number; click_count: number; created_at: string; updated_at: string }
export type EmailTemplate = { id: string; name: string; subject: string; body: string; category: string; is_active: boolean; created_at: string }
export type CustomerReview = { id: string; customer_name: string; rating: number; review_text: string; service_name: string | null; is_featured: boolean; is_approved: boolean; source: string; created_at: string }
export type BlogCategory = { id: string; name: string; slug: string; description: string | null; created_at: string }
export type BlogTag = { id: string; name: string; slug: string; created_at: string }
export type BlogPost = {
  id: string; title: string; title_ta: string | null; excerpt: string; excerpt_ta: string | null
  content: string; content_ta: string | null; image_url: string | null; author: string | null
  is_published: boolean; published_at: string | null; created_at: string; updated_at: string | null
  category_id: string | null; featured_image: string | null; meta_title: string | null
  meta_description: string | null; canonical_url: string | null; is_featured: boolean
  views_count: number; related_post_ids: string[]
}
