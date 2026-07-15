export const PRIMARY_PHONE = '8189800757'
export const SUPPORT_PHONE = '8189800757'
export const TECHNICIAN_SUPPORT_PHONE = '8189800767'
export const WHATSAPP_NUMBER = '918189800757'
export const TECHNICIAN_WHATSAPP_NUMBER = '918189800767'
export const YOUTUBE_URL = 'https://www.youtube.com/@vattams'
export const YOUTUBE_CHANNEL = '@vattams'

export function telLink(phone: string) { return `tel:+91${phone}` }
export function whatsappLink(phone: string, message?: string) {
  const text = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${phone}${text}`
}
export function whatsappSupportLink(message?: string) { return whatsappLink(WHATSAPP_NUMBER, message) }
export function whatsappTechnicianLink(message?: string) { return whatsappLink(TECHNICIAN_WHATSAPP_NUMBER, message) }

export const TAMIL_NADU_DISTRICTS = [
  'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore',
  'Dharmapuri', 'Dindigul', 'Erode', 'Kallakurichi', 'Kancheepuram',
  'Kanyakumari', 'Karur', 'Krishnagiri', 'Madurai', 'Mayiladuthurai',
  'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai',
  'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga', 'Tenkasi',
  'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli',
  'Tirupathur', 'Tiruppur', 'Tiruvarur', 'Vellore', 'Viluppuram',
  'Virudhunagar',
]

export const SERVICE_CITIES = [
  'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem',
  'Tirunelveli', 'Vellore', 'Erode', 'Dindigul', 'Thanjavur',
]

export const VERIFICATION_FEE = 50
export const REFUND_ELIGIBLE_JOBS = 4

export const SERVICE_CATEGORIES = [
  'AC Service',
  'AC Installation',
  'AC Gas Refill',
  'Deep Cleaning',
  'Refrigerator Repair',
  'Washing Machine Repair',
  'Electrician',
  'Plumbing',
  'CCTV Installation',
]

export const COUPON_OFFER_TYPES = [
  'flat', 'percentage', 'festival', 'seasonal', 'first_booking', 'referral',
] as const

export const SOCIAL_PLATFORMS = [
  'Facebook', 'Instagram', 'YouTube', 'WhatsApp Business', 'LinkedIn', 'X (Twitter)', 'Telegram',
] as const

export const CONTACT = {
  customerPhone: PRIMARY_PHONE,
  technicianPhone: TECHNICIAN_SUPPORT_PHONE,
  email: 'info@vattams.net',
  address: 'Tamil Nadu, India',
  social: {
    facebook: 'https://facebook.com/vattams',
    instagram: 'https://instagram.com/vattams',
    linkedin: 'https://linkedin.com/company/vattams',
    twitter: 'https://twitter.com/vattams',
    telegram: 'https://t.me/vattams',
    youtube: YOUTUBE_URL,
    whatsapp: `https://wa.me/${WHATSAPP_NUMBER}`,
  },
}
