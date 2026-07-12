import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Notification } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { cn, formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingScreen } from '@/components/LoadingScreen'
import { CheckCheck, Bell } from 'lucide-react'

export function AdminNotificationsPage() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!profile) return
      const { data } = await supabase.from('notifications').select('*').eq('user_id', profile.id).order('created_at', { ascending: false })
      if (mounted) { setNotifications((data || []) as Notification[]); setLoading(false) }
    })()
    return () => { mounted = false }
  }, [profile])

  const markAsRead = async (id: string) => {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    if (error) return
    setNotifications((ns) => ns.map((n) => n.id === id ? { ...n, is_read: true } : n))
  }

  const markAllAsRead = async () => {
    if (!profile) return
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', profile.id).eq('is_read', false)
    if (error) return
    setNotifications((ns) => ns.map((n) => ({ ...n, is_read: true })))
  }

  if (loading) return <LoadingScreen message="Loading notifications..." />

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Notifications</h1><p className="text-gray-600">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p></div>
        {unreadCount > 0 && <Button variant="outline" onClick={markAllAsRead}><CheckCheck className="mr-2 h-4 w-4" />Mark All Read</Button>}
      </div>

      <Card>
        <CardHeader><CardTitle>All Notifications</CardTitle></CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Bell className="h-12 w-12 text-gray-300" />
              <p className="text-gray-500">No notifications yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <div key={n.id} className={cn('flex items-start gap-3 rounded-lg border p-3', n.is_read ? 'border-gray-100 bg-white' : 'border-blue-100 bg-blue-50')}>
                  <div className={cn('mt-1 h-2 w-2 flex-shrink-0 rounded-full', n.is_read ? 'bg-gray-300' : 'bg-blue-600')} />
                  <div className="flex-1 cursor-pointer" onClick={() => !n.is_read && markAsRead(n.id)}>
                    <div className="flex items-center justify-between">
                      <p className={cn('font-medium', n.is_read ? 'text-gray-700' : 'text-gray-900')}>{n.title}</p>
                      <span className="text-xs text-gray-500">{formatDateTime(n.created_at)}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{n.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
