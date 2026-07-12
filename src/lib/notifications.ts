import { supabase } from '@/lib/supabase'
import type { BookingStatus } from '@/lib/supabase'

export async function createNotification(userId: string, title: string, message: string, type = 'info') {
  try {
    await supabase.from('notifications').insert({ user_id: userId, title, message, type, is_read: false })
  } catch (e) { console.error('Failed to create notification:', e) }
}

export async function createAuditLog(userId: string, action: string, entityType: string, entityId: string | null, details: string | null) {
  try {
    await supabase.from('audit_logs').insert({ user_id: userId, action, entity_type: entityType, entity_id: entityId, details })
  } catch (e) { console.error('Failed to create audit log:', e) }
}

export async function createRevenueTransaction(type: string, amount: number, technicianId: string | null, bookingId: string | null, description: string | null) {
  try {
    await supabase.from('revenue_transactions').insert({ transaction_type: type, amount, technician_id: technicianId, booking_id: bookingId, description })
  } catch (e) { console.error('Failed to create revenue transaction:', e) }
}

export function statusTimeline(status: BookingStatus | undefined): { label: string; done: boolean }[] {
  const flow = ['created', 'confirmed', 'assigned', 'accepted', 'on_the_way', 'arrived', 'work_started', 'completed']
  if (!status || status === 'cancelled') return []
  const idx = flow.indexOf(status)
  const labels = ['Created', 'Confirmed', 'Assigned', 'Accepted', 'On the Way', 'Arrived', 'Work Started', 'Completed']
  return flow.map((s, i) => ({ label: labels[i], done: i <= idx }))
}
