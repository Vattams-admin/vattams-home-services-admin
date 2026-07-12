import { WHATSAPP_BOOKING, WHATSAPP_SUPPORT } from '@/lib/constants';
import type { Booking } from '@/lib/supabase';

export function sendBookingConfirmation(booking: { booking_number: string; service_name: string; scheduled_date: string | null; scheduled_time: string | null; city: string | null; address: string | null }) {
  const msg = `*VATTAMS Booking Confirmed*\n\nBooking: ${booking.booking_number}\nService: ${booking.service_name}\nDate: ${booking.scheduled_date || 'TBD'}\nTime: ${booking.scheduled_time || 'TBD'}\nLocation: ${booking.city || ''}, ${booking.address || ''}\n\nThank you for choosing VATTAMS!`;
  window.open(`https://wa.me/${WHATSAPP_BOOKING}?text=${encodeURIComponent(msg)}`, '_blank');
}

export function sendSupportMessage(message: string) {
  window.open(`https://wa.me/${WHATSAPP_SUPPORT}?text=${encodeURIComponent(message)}`, '_blank');
}

export function sendBookingToWhatsApp(booking: Booking) {
  sendBookingConfirmation(booking);
}

export function sendTechnicianAssignedMessage(booking: Booking, technicianName: string, technicianMobile: string) {
  const msg = `*Technician Assigned*\n\nBooking: ${booking.booking_number}\nTechnician: ${technicianName}\nMobile: ${technicianMobile}\n\nYour technician is on the way!`;
  window.open(`https://wa.me/${WHATSAPP_BOOKING}?text=${encodeURIComponent(msg)}`, '_blank');
}

export function sendJobCompletedMessage(booking: Booking) {
  const msg = `*Job Completed*\n\nBooking: ${booking.booking_number}\nService: ${booking.service_name}\n\nYour service has been completed. Please make the payment to receive your invoice.`;
  window.open(`https://wa.me/${WHATSAPP_BOOKING}?text=${encodeURIComponent(msg)}`, '_blank');
}
