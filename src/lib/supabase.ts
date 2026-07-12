import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
})

export type UserRole = 'customer' | 'technician' | 'admin' | 'super_admin'

export type VerificationStatus =
  | 'pending_registration' | 'fee_pending' | 'under_review'
  | 'approved' | 'rejected' | 'suspended'

export type Profile = {
  id: string; email: string; name: string; mobile: string; role: UserRole
  full_name: string | null; address: string | null; district: string | null
  city: string | null; pincode: string | null; experience: string | null
  skills: string[] | null; bio: string | null; status: string | null
  is_available: boolean | null; rejection_reason: string | null
  verification_status: VerificationStatus | null; created_at: string
}

export type BookingStatus =
  | 'created' | 'confirmed' | 'assigned' | 'accepted'
  | 'on_the_way' | 'arrived' | 'work_started' | 'completed' | 'cancelled'

export type Booking = {
  id: string; booking_number: string; customer_id: string; technician_id: string | null
  service_name: string; service_category_id: string | null; status: BookingStatus
  scheduled_date: string; scheduled_time: string | null; address: string
  city: string; district: string; pincode: string; customer_notes: string | null
  amount: number; cancelled_by: string | null; cancel_reason: string | null
  created_at: string; updated_at: string
}

export type BookingPhoto = {
  id: string; booking_id: string; photo_type: 'before' | 'after'
  photo_url: string; description: string | null; created_at: string
}

export type Notification = {
  id: string; user_id: string; title: string; message: string
  type: string; is_read: boolean; created_at: string
}

export type Invoice = {
  id: string; invoice_number: string; booking_id: string; customer_id: string
  technician_id: string | null; service_name: string; amount: number
  status: string; payment_method: string; paid_at: string | null; created_at: string
}

export type Review = {
  id: string; booking_id: string; customer_id: string; technician_id: string
  rating: number; review_text: string; created_at: string
}

export type Payment = {
  id: string; booking_id: string; customer_id: string; amount: number
  payment_method: string; payment_status: string; transaction_id: string | null; created_at: string
}

export type ServiceArea = {
  id: string; city: string; city_ta: string | null; district: string; pincode: string | null
  is_active: boolean; state: string | null; taluk: string | null; area: string | null
  area_type: string | null; lat: number | null; lng: number | null
  created_at: string; updated_at: string | null
}

export type Settings = {
  id: string; company_name: string | null; company_logo: string | null
  upi_id: string | null; gst_number: string | null; working_hours: string | null
  customer_support_phone: string | null; technician_support_phone: string | null
  whatsapp_number: string | null; updated_at: string | null
}

export type Coupon = {
  id: string; code: string; description: string | null
  discount_type: 'percentage' | 'fixed'; discount_value: number; min_amount: number
  max_uses: number; used_count: number; valid_from: string; valid_until: string | null
  is_active: boolean; created_at: string
}

export type AuditLog = {
  id: string; user_id: string; action: string; entity_type: string
  entity_id: string | null; details: string | null; created_at: string
}

export type TechnicianWallet = {
  id: string; technician_id: string; balance: number
  verification_fee_paid: boolean; verification_fee_amount: number
  verification_fee_paid_at: string | null
  refund_status: 'not_eligible' | 'eligible' | 'approved' | 'rejected' | 'processed' | 'completed'
  refund_amount: number; refund_method: string | null
  refund_processed_at: string | null; refund_completed_at: string | null
  total_earnings: number; pending_earnings: number
  total_jobs: number; completed_jobs: number
  created_at: string; updated_at: string
}

export type TechnicianDocument = {
  id: string; technician_id: string; document_type: string
  document_url: string; document_number: string | null
  verified: boolean; created_at: string
}

export type VerificationPayment = {
  id: string; technician_id: string; amount: number
  payment_method: string; payment_status: string
  transaction_id: string | null; payment_date: string | null; created_at: string
}

export type Refund = {
  id: string; technician_id: string; amount: number
  refund_type: string; refund_method: string | null
  status: 'pending' | 'approved' | 'rejected' | 'processed' | 'completed'
  admin_id: string | null; admin_notes: string | null
  processed_at: string | null; completed_at: string | null; created_at: string
}

export type RevenueTransaction = {
  id: string; transaction_type: string; amount: number
  technician_id: string | null; booking_id: string | null
  description: string | null; created_at: string
}
