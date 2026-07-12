import { useEffect, useState } from 'react'
import { Bell, CheckCheck, BellOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Notification } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/LoadingScreen'
import { formatDateTime, cn } from '@/lib/utils'

export function CustomerNotificationsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])

  const fetchNotifs = async () => {
    if (!profile) return
    const { data } = await supabase.from('notifications').select('*').eq('user_id', profile.id).order('created_at', { ascending: false })
    setNotifications((data as Notification[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    let mounted = true;
    (async () => { if (profile) { await fetchNotifs(); if (!mounted) return } })()
    return () => { mounted = false }
  }, [profile])

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n))
  }

  const markAllRead = async () => {
    if (!profile) return
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', profile.id).eq('is_read', false)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    toast('All notifications marked as read', 'success')
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  if (loading) return <LoadingScreen message="Loading notifications..." />

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && <p className="text-sm text-gray-600">{unreadCount} unread</p>}
        </div>
        {unreadCount > 0 && <Button variant="outline" onClick={markAllRead}><CheckCheck className="mr-2 h-4 w-4" /> Mark All Read</Button>}
      </div>

      {notifications.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-12">
          <BellOff className="h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">No notifications yet.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card key={n.id} className={cn('cursor-pointer transition-colors hover:bg-gray-50', !n.is_read && 'border-blue-200 bg-blue-50/30')} onClick={() => !n.is_read && markRead(n.id)}>
              <CardContent className="flex items-start gap-3 p-4">
                <div className={`mt-0.5 rounded-full p-2 ${n.is_read ? 'bg-gray-100' : 'bg-blue-100'}`}>
                  <Bell className={`h-4 w-4 ${n.is_read ? 'text-gray-400' : 'text-blue-600'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">{n.title}</p>
                    {!n.is_read && <Badge color="bg-blue-100 text-blue-700">New</Badge>}
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
