import { supabase } from '@/lib/supabase'

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: string,
  relatedId?: string | null,
) {
  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      title,
      message,
      type,
      is_read: false,
      related_id: relatedId ?? null,
    })
  } catch {
    // notifications are best-effort
  }
}

export function statusTimeline(status: string): { label: string; done: boolean }[] {
  const flow = ['created', 'confirmed', 'assigned', 'accepted', 'on_the_way', 'work_started', 'completed']
  const idx = flow.indexOf(status)
  if (status === 'cancelled' || status === 'rejected') return []
  return flow.map((s, i) => ({
    label: s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    done: i <= idx,
  }))
}
