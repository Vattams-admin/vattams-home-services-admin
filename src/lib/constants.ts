export const PRIMARY_PHONE = '+918189800575'
export const SUPPORT_PHONE = '+918189800767'
export const PRIMARY_PHONE_DISPLAY = '+91 81898 00575'
export const SUPPORT_PHONE_DISPLAY = '+91 81898 00767'
export const WHATSAPP_NUMBER = '918189800575'

export const telLink = (phone: string) => `tel:${phone.replace(/\s/g, '')}`
export const whatsappLink = (phone: string, message: string) =>
  `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
export const whatsappSupportLink = (message: string) => whatsappLink(WHATSAPP_NUMBER, message)

export const SERVICE_AREAS = [
  'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem',
  'Tirunelveli', 'Tiruppur', 'Vellore', 'Thoothukudi', 'Dindigul',
].sort()
