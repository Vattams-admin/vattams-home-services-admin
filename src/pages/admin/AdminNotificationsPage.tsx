import { useEffect, useState } from 'react'
import { Bell, CheckCheck, BellOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Notification } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { cn, formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/LoadingScreen'

export function AdminNotificationsPage() {
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

  const markAsRead = async (n: Notification) => {
    if (n.is_read) return
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', n.id)
    if (error) { toast('Failed to update', 'error'); return }
    setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, is_read: true } : x))
  }

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.is_read)
    if (unread.length === 0) return
    const ids = unread.map((n) => n.id)
    const { error } = await supabase.from('notifications').update({ is_read: true }).in('id', ids)
    if (error) { toast('Failed to update', 'error'); return }
    setNotifications((prev) => prev.map((x) => ({ ...x, is_read: true })))
    toast('All notifications marked as read', 'success')
  }

  if (loading) return <LoadingScreen message="Loading notifications..." />
  if (!profile) return null

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Notifications</h1><p className="text-sm text-gray-500">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p></div>
        {unreadCount > 0 && <Button variant="outline" onClick={markAllRead}><CheckCheck className="mr-2 h-4 w-4" />Mark All Read</Button>}
      </div>

      {notifications.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-12">
          <BellOff className="h-12 w-12 text-gray-300" />
          <p className="text-gray-500">No notifications yet.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card key={n.id} className={cn('cursor-pointer transition-colors hover:bg-gray-50', !n.is_read && 'border-blue-300 bg-blue-50/30')} >
              <CardContent className="py-4" onClick={() => markAsRead(n)}>
                <div className="flex items-start gap-3">
                  <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full', n.is_read ? 'bg-gray-100' : 'bg-blue-100')}>
                    <Bell className={cn('h-5 w-5', n.is_read ? 'text-gray-400' : 'text-blue-600')} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{n.title}</p>
                      {!n.is_read && <Badge color="bg-blue-100 text-blue-700">New</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{n.message}</p>
                    <p className="mt-1 text-xs text-gray-400">{formatDateTime(n.created_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
