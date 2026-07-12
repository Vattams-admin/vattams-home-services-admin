import { useEffect, useState } from 'react'
import { Bell, CheckCheck, BellOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Notification } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingScreen } from '@/components/LoadingScreen'
import { cn, formatDateTime } from '@/lib/utils'

export function CustomerNotificationsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    if (!profile) return
    let mounted = true;
    (async () => {
      const { data } = await supabase.from('notifications').select('*').eq('user_id', profile.id).order('created_at', { ascending: false })
      if (!mounted) return
      setNotifications((data || []) as Notification[])
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [profile])

  const markAsRead = async (id: string) => {
    const notif = notifications.find((n) => n.id === id)
    if (notif && notif.is_read) return
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n))
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  }

  const markAllAsRead = async () => {
    if (!profile) return
    const unread = notifications.filter((n) => !n.is_read)
    if (unread.length === 0) { toast('No unread notifications', 'info'); return }
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', profile.id).eq('is_read', false)
    toast('All notifications marked as read', 'success')
  }

  if (loading) return <LoadingScreen message="Loading notifications..." />
  if (!profile) return null

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && <p className="text-sm text-gray-500">{unreadCount} unread</p>}
        </div>
        {notifications.length > 0 && unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}><CheckCheck className="mr-2 h-4 w-4" />Mark All as Read</Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16">
            <BellOff className="h-12 w-12 text-gray-300" />
            <p className="text-gray-500">No notifications yet.</p>
            <p className="text-sm text-gray-400">You&apos;ll see updates about your bookings here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card key={n.id} className={cn('cursor-pointer transition-colors hover:bg-gray-50', !n.is_read && 'border-blue-200 bg-blue-50/50')} onClick={() => markAsRead(n.id)}>
              <CardContent className="flex items-start gap-3 py-4">
                <div className={cn('mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full', n.is_read ? 'bg-gray-100' : 'bg-blue-100')}>
                  <Bell className={cn('h-5 w-5', n.is_read ? 'text-gray-400' : 'text-blue-600')} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn('text-sm', n.is_read ? 'font-medium text-gray-700' : 'font-semibold text-gray-900')}>{n.title}</p>
                    {!n.is_read && <span className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-600" />}
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{n.message}</p>
                  <p className="mt-1 text-xs text-gray-400">{formatDateTime(n.created_at)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
