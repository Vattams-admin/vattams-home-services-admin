import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Notification } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { cn, formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/LoadingScreen'
import { CheckCheck, Bell, Info, CircleCheck as CheckCircle, Circle as XCircle, CircleAlert as AlertCircle } from 'lucide-react'

const icons: Record<string, typeof Info> = {
  info: Info, success: CheckCircle, error: XCircle, warning: AlertCircle,
}

export function AdminNotificationsPage() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])

  const fetchNotifications = async () => {
    if (!profile?.id) return
    const { data } = await supabase.from('notifications').select('*').eq('user_id', profile.id).order('created_at', { ascending: false })
    setNotifications((data || []) as Notification[])
    setLoading(false)
  }

  useEffect(() => {
    let mounted = true;
    (async () => { await fetchNotifications(); if (!mounted) return })()
    return () => { mounted = false }
  }, [profile?.id])

  const markRead = async (n: Notification) => {
    if (n.is_read) return
    await supabase.from('notifications').update({ is_read: true }).eq('id', n.id)
    setNotifications((ns) => ns.map((x) => x.id === n.id ? { ...x, is_read: true } : x))
  }

  const markAllRead = async () => {
    if (!profile?.id) return
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', profile.id).eq('is_read', false)
    setNotifications((ns) => ns.map((x) => ({ ...x, is_read: true })))
  }

  if (loading) return <LoadingScreen message="Loading notifications..." />

  const unread = notifications.filter((n) => !n.is_read).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unread > 0 && <p className="text-sm text-gray-500">{unread} unread</p>}
        </div>
        {unread > 0 && <Button size="sm" variant="outline" onClick={markAllRead}><CheckCheck className="h-4 w-4 mr-1" />Mark all read</Button>}
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-blue-600" />All Notifications ({notifications.length})</CardTitle></CardHeader>
        <CardContent>
          {notifications.length === 0 ? <p className="text-gray-500 text-sm">No notifications.</p> : (
            <div className="space-y-2">
              {notifications.map((n) => { const Icon = icons[n.type] || Info; return (
                <div key={n.id} onClick={() => markRead(n)} className={cn('flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors', n.is_read ? 'bg-white' : 'bg-blue-50/50 border-blue-200')}>
                  <div className={cn('rounded-lg p-2 flex-shrink-0', n.is_read ? 'bg-gray-100' : 'bg-blue-100')}><Icon className={cn('h-4 w-4', n.is_read ? 'text-gray-400' : 'text-blue-600')} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn('text-sm font-medium', n.is_read ? 'text-gray-700' : 'text-gray-900')}>{n.title}</p>
                      {!n.is_read && <Badge color="bg-blue-100 text-blue-700">New</Badge>}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDateTime(n.created_at)}</p>
                  </div>
                </div>
              )})}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
