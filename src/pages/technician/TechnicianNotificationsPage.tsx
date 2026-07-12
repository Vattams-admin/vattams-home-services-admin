import { useEffect, useState } from 'react'
import { Bell, CheckCheck, BellOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Notification } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { LoadingScreen } from '@/components/LoadingScreen'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn, formatDateTime } from '@/lib/utils'

export function TechnicianNotificationsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    if (!profile) return
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from('notifications').select('*').eq('user_id', profile.id).order('created_at', { ascending: false })
      if (mounted) { setNotifications((data || []) as Notification[]); setLoading(false) }
    })()
    return () => { mounted = false }
  }, [profile])

  if (loading) return <LoadingScreen />

  const markAsRead = async (id: string) => {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    if (error) { toast(error.message, 'error'); return }
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n))
  }

  const markAllRead = async () => {
    if (!profile) return
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', profile.id).eq('is_read', false)
    if (error) { toast(error.message, 'error'); return }
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    toast('All notifications marked as read', 'success')
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-600">{unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="mr-2 h-4 w-4" /> Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <BellOff className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900">No notifications yet</p>
              <p className="text-sm text-gray-500">You'll see updates about your jobs and earnings here.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card key={n.id} className={cn('cursor-pointer transition-colors hover:bg-gray-50', !n.is_read && 'border-blue-200 bg-blue-50/50')}>
              <CardContent className="flex items-start gap-3 p-4" onClick={() => !n.is_read && markAsRead(n.id)}>
                <div className={cn('mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full', n.is_read ? 'bg-gray-100' : 'bg-blue-100')}>
                  <Bell className={cn('h-5 w-5', n.is_read ? 'text-gray-400' : 'text-blue-600')} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn('text-sm font-medium', n.is_read ? 'text-gray-700' : 'text-gray-900')}>{n.title}</p>
                    {!n.is_read && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-600" />}
                  </div>
                  <p className="mt-0.5 text-sm text-gray-600">{n.message}</p>
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
