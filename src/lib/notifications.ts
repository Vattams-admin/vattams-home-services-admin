import { supabase } from '@/lib/supabase'
import type { BookingStatus } from '@/lib/supabase'

export async function createNotification(userId: string, title: string, message: string, type = 'info') {
  try { await supabase.from('notifications').insert({ user_id: userId, title, message, type }) } catch {}
}
export async function createAuditLog(userId: string, action: string, entityType: string, entityId: string | null, details: string | null = null) {
  try { await supabase.from('audit_logs').insert({ user_id: userId, action, entity_type: entityType, entity_id: entityId, details }) } catch {}
}
export async function createRevenueTransaction(type: string, amount: number, technicianId: string | null = null, bookingId: string | null = null, description: string | null = null) {
  try { await supabase.from('revenue_transactions').insert({ transaction_type: type, amount, technician_id: technicianId, booking_id: bookingId, description }) } catch {}
}
export function statusTimeline(currentStatus: BookingStatus): { status: BookingStatus; label: string; completed: boolean }[] {
  const flow: BookingStatus[] = ['created', 'confirmed', 'assigned', 'accepted', 'on_the_way', 'arrived', 'work_started', 'completed']
  const labels: Record<string, string> = { created: 'Booking Created', confirmed: 'Confirmed', assigned: 'Technician Assigned', accepted: 'Accepted', on_the_way: 'On the Way', arrived: 'Arrived', work_started: 'Work Started', completed: 'Completed' }
  const idx = flow.indexOf(currentStatus)
  return flow.map((s, i) => ({ status: s, label: labels[s] || s, completed: i <= idx }))
}
export async function trackEvent(eventName: string, eventCategory: string, metadata: Record<string, unknown> = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('analytics_events').insert({ event_name: eventName, event_category: eventCategory, page_url: window.location.pathname, user_id: user?.id || null, session_id: sessionStorage.getItem('session_id') || null, metadata })
  } catch {}
}
