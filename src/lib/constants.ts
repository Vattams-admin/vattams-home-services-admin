export const PRIMARY_PHONE = '9876543210'
export const SUPPORT_PHONE = '9876543210'
export const WHATSAPP_NUMBER = '919876543210'
export const YOUTUBE_URL = 'https://www.youtube.com/@vattams'
export const YOUTUBE_CHANNEL = '@vattams'

export function telLink(phone: string) { return `tel:+91${phone}` }
export function whatsappLink(phone: string, message?: string) {
  const text = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${phone}${text}`
}
export function whatsappSupportLink(message?: string) { return whatsappLink(WHATSAPP_NUMBER, message) }

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
