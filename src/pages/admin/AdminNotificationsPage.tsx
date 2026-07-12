import { useEffect, useState } from 'react'
import { Loader as Loader2, Bell, CheckCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Notification } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn, formatDateTime } from '@/lib/utils'

export function AdminNotificationsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [actioning, setActioning] = useState(false)

  useEffect(() => {
    if (!profile?.id) return
    let mounted = true
    ;(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
      if (!mounted) return
      setNotifications((data ?? []) as Notification[])
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [profile?.id])

  const markAsRead = async (n: Notification) => {
    if (n.is_read) return
    setActioning(true)
    try {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', n.id)
      if (error) throw error
      setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, is_read: true } : x))
    } catch (err) {
      toast({ title: 'Failed to update', description: (err as Error).message, variant: 'error' })
    } finally {
      setActioning(false)
    }
  }

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.is_read)
    if (unread.length === 0) return
    setActioning(true)
    try {
      const ids = unread.map((n) => n.id)
      const { error } = await supabase.from('notifications').update({ is_read: true }).in('id', ids)
      if (error) throw error
      setNotifications((prev) => prev.map((x) => ({ ...x, is_read: true })))
      toast({ title: 'All notifications marked as read', variant: 'success' })
    } catch (err) {
      toast({ title: 'Failed to update', description: (err as Error).message, variant: 'error' })
    } finally {
      setActioning(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllRead} disabled={actioning}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark All as Read
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-500">No notifications yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markAsRead(n)}
                  disabled={actioning || n.is_read}
                  className={cn(
                    'flex w-full items-start gap-3 p-4 text-left transition-colors',
                    n.is_read ? 'bg-white hover:bg-gray-50' : 'bg-blue-50/50 hover:bg-blue-50',
                    !n.is_read && !actioning && 'cursor-pointer',
                  )}
                >
                  <div className={cn('mt-0.5 rounded-lg p-2', n.is_read ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-600')}>
                    <Bell className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={cn('text-sm', n.is_read ? 'font-normal text-gray-700' : 'font-semibold text-gray-900')}>
                        {n.title}
                      </p>
                      {!n.is_read && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-600" />}
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500">{n.message}</p>
                    <p className="mt-1 text-xs text-gray-400">{formatDateTime(n.created_at)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
