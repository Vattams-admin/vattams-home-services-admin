import { useEffect, useState } from 'react'
import {
  Bell,
  CheckCheck,
  Loader2,
  Info,
  CheckCircle2,
  AlertCircle,
  Filter,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/input'
import { useAuth } from '@/lib/auth'
import { supabase, type Notification } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { cn, formatDateTime } from '@/lib/utils'

const TYPE_FILTERS = [
  { value: 'all', label: 'All Types' },
  { value: 'booking', label: 'Booking' },
  { value: 'payment', label: 'Payment' },
  { value: 'info', label: 'Info' },
  { value: 'alert', label: 'Alerts' },
]

const TYPE_ICONS: Record<string, typeof Info> = {
  booking: CheckCircle2,
  payment: CheckCircle2,
  info: Info,
  alert: AlertCircle,
  success: CheckCircle2,
  warning: AlertCircle,
}

const TYPE_COLORS: Record<string, string> = {
  booking: 'bg-blue-100 text-blue-600',
  payment: 'bg-green-100 text-green-600',
  info: 'bg-slate-100 text-slate-600',
  alert: 'bg-amber-100 text-amber-600',
  success: 'bg-green-100 text-green-600',
  warning: 'bg-amber-100 text-amber-600',
}

export default function CustomerNotificationsPage() {
  const { profile, session } = useAuth()
  const toast = useToast()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [markingAll, setMarkingAll] = useState(false)

  const userId = profile?.id || session?.user?.id

  const loadNotifications = async () => {
    if (!userId) return
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      setNotifications((data as Notification[]) || [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [userId])

  const handleMarkAsRead = async (id: string) => {
    try {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id)
      if (error) throw error
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    } catch {
      toast.error('Failed to mark as read')
    }
  }

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.is_read)
    if (unread.length === 0) return
    setMarkingAll(true)
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in(
          'id',
          unread.map((n) => n.id),
        )
      if (error) throw error
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      toast.success('All marked as read')
    } catch {
      toast.error('Failed to mark all as read')
    } finally {
      setMarkingAll(false)
    }
  }

  const filteredNotifications = notifications.filter((n) => {
    if (typeFilter === 'all') return true
    return n.type === typeFilter
  })

  const unreadCount = notifications.filter((n) => !n.is_read).length

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}.` : 'You are all caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllAsRead} disabled={markingAll}>
            {markingAll ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="mr-1 h-4 w-4" />
            )}
            Mark all as read
          </Button>
        )}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-slate-400" />
        <Select value={typeFilter} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setTypeFilter(e.target.value)} className="w-48">
          {TYPE_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Bell className="h-12 w-12 text-slate-300" />
            <p className="mt-3 text-lg font-medium text-slate-700">
              {notifications.length === 0 ? 'No notifications' : 'No notifications match your filter'}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {notifications.length === 0
                ? 'You will be notified about bookings, payments, and updates here.'
                : 'Try a different filter.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notif) => {
            const Icon = TYPE_ICONS[notif.type] || Info
            const iconColor = TYPE_COLORS[notif.type] || 'bg-slate-100 text-slate-600'
            return (
              <Card
                key={notif.id}
                className={cn('transition-colors', !notif.is_read && 'border-blue-200 bg-blue-50/30')}
              >
                <CardContent className="flex items-start gap-3 p-4">
                  <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', iconColor)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className={cn('text-sm font-medium', notif.is_read ? 'text-slate-700' : 'text-slate-900')}>
                        {notif.title}
                      </p>
                      {!notif.is_read && <Badge color="blue">New</Badge>}
                    </div>
                    <p className="text-sm text-slate-500">{notif.message}</p>
                    <p className="text-xs text-slate-400">{formatDateTime(notif.created_at)}</p>
                  </div>
                  {!notif.is_read && (
                    <Button variant="ghost" size="sm" onClick={() => handleMarkAsRead(notif.id)}>
                      <CheckCheck className="h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
