import { useCallback, useEffect, useState } from 'react'
import { Bell, CheckCheck, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Notification } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn, formatDateTime } from '@/lib/utils'

export function CustomerNotificationsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    if (!profile?.id) return
    setLoading(true)
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
    setNotifications((data ?? []) as Notification[])
    setLoading(false)
  }, [profile?.id])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
  }

  const markAllAsRead = async () => {
    if (!profile?.id) return
    const unread = notifications.filter((n) => !n.is_read)
    if (unread.length === 0) return
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', profile.id)
      .eq('is_read', false)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    toast({ title: 'All notifications marked as read', variant: 'success' })
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <CheckCheck className="mr-2 h-4 w-4" /> Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500">No notifications yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={cn(
                'cursor-pointer transition-colors hover:bg-gray-50',
                !n.is_read && 'border-blue-200 bg-blue-50/50',
              )}
              onClick={() => !n.is_read && markAsRead(n.id)}
            >
              <CardContent className="flex items-start gap-3 p-4">
                <div className="mt-1">
                  {!n.is_read ? (
                    <span className="block h-2.5 w-2.5 rounded-full bg-blue-600" />
                  ) : (
                    <span className="block h-2.5 w-2.5 rounded-full bg-gray-300" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn('text-sm font-medium', n.is_read ? 'text-gray-700' : 'text-gray-900')}>
                      {n.title}
                    </p>
                    <span className="shrink-0 text-xs text-gray-400">{formatDateTime(n.created_at)}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{n.message}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
