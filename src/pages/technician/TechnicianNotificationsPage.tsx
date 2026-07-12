import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Notification } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { cn, formatDateTime } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingScreen } from '@/components/LoadingScreen'
import { Bell, CheckCheck, BellOff } from 'lucide-react'

export function TechnicianNotificationsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!profile) return
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
      if (mounted && data) setNotifications(data as Notification[])
      if (mounted) setLoading(false)
    })()
    return () => { mounted = false }
  }, [profile])

  const markAsRead = async (id: string) => {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    if (error) { toast('Failed to mark as read', 'error'); return }
    setNotifications((ns) => ns.map((n) => n.id === id ? { ...n, is_read: true } : n))
  }

  const markAllRead = async () => {
    if (!profile) return
    const unread = notifications.filter((n) => !n.is_read)
    if (unread.length === 0) { toast('All notifications already read', 'info'); return }
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', profile.id).eq('is_read', false)
    if (error) { toast('Failed to mark all as read', 'error'); return }
    setNotifications((ns) => ns.map((n) => ({ ...n, is_read: true })))
    toast('All notifications marked as read', 'success')
  }

  if (loading) return <LoadingScreen message="Loading notifications..." />

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && <p className="text-sm text-gray-600">{unreadCount} unread</p>}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllRead}>
            <CheckCheck className="mr-2 h-4 w-4" />Mark All Read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <BellOff className="h-12 w-12 text-gray-300" />
            <p className="text-gray-500">No notifications yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card key={n.id} className={cn('cursor-pointer transition-colors hover:bg-gray-50', !n.is_read && 'border-blue-200 bg-blue-50/50')} onClick={() => !n.is_read && markAsRead(n.id)}>
              <CardContent className="flex items-start gap-3 p-4">
                <div className={cn('mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full', n.is_read ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-600')}>
                  <Bell className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className={cn('font-medium', n.is_read ? 'text-gray-700' : 'text-gray-900')}>{n.title}</p>
                    {!n.is_read && <span className="h-2 w-2 rounded-full bg-blue-600" />}
                  </div>
                  <p className="text-sm text-gray-600">{n.message}</p>
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
