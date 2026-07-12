import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

export type UserRole = 'customer' | 'technician' | 'admin' | 'super_admin'

export type Profile = {
  id: string
  email: string
  name: string
  mobile: string
  role: UserRole
  full_name?: string | null
  address?: string | null
  district?: string | null
  city?: string | null
  pincode?: string | null
  experience?: string | null
  skills?: string[] | null
  bio?: string | null
  status: string
  is_available?: boolean
  created_at?: string
}

export type ServiceCategory = {
  id: string
  name: string
  name_ta?: string | null
  description?: string | null
  icon: string
  base_price: number
  image_url?: string | null
  is_active: boolean
  sort_order: number
}

export type BookingStatus =
  | 'created' | 'confirmed' | 'assigned' | 'accepted'
  | 'on_the_way' | 'work_started' | 'completed' | 'cancelled' | 'rejected'

export type Booking = {
  id: string
  booking_number: string
  customer_id: string
  technician_id: string | null
  service_category_id: string | null
  service_name: string
  status: BookingStatus
  scheduled_date: string | null
  scheduled_time: string | null
  address: string | null
  city: string | null
  district: string | null
  pincode: string | null
  lat: number | null
  lng: number | null
  customer_notes: string | null
  amount: number
  cancelled_by: string | null
  cancel_reason: string | null
  created_at: string
  updated_at: string
  notes?: string | null
  area?: string | null
}

export type BookingPhoto = {
  id: string
  booking_id: string
  photo_url: string
  photo_type: 'before' | 'after'
  created_at: string
}

export type Notification = {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  is_read: boolean
  related_id: string | null
  created_at: string
}

export type Invoice = {
  id: string
  invoice_number: string
  booking_id: string
  customer_id: string
  technician_id: string | null
  service_name: string
  amount: number
  status: string
  payment_method: string | null
  paid_at: string | null
  created_at: string
}

export type Review = {
  id: string
  booking_id: string
  customer_id: string
  technician_id: string
  rating: number
  review_text: string
  created_at: string
}

export type Payment = {
  id: string
  booking_id: string | null
  customer_id: string
  technician_id: string | null
  amount: number
  status: string
  payment_method: string | null
  transaction_id: string | null
  created_at: string
}

export type ServiceArea = {
  id: string
  district: string
  city: string
  pincode: string
  is_active: boolean
  created_at: string
}

export type Settings = {
  id: number
  company_name: string
  company_logo: string | null
  upi_id: string | null
  gst_number: string | null
  working_hours: string | null
  customer_support_phone: string | null
  technician_support_phone: string | null
  whatsapp_number: string | null
  updated_at?: string
}
