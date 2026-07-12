import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  Plus,
  MapPin,
  Search,
  Sparkles,
  Users,
  Loader2,
  Wrench,
  Bell,
  TrendingUp,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth'
import { supabase, type Booking, type Invoice, type Notification } from '@/lib/supabase'
import { cn, formatDate, formatCurrency, BOOKING_STATUS_COLORS } from '@/lib/utils'

type Stats = {
  activeBookings: number
  completedBookings: number
  pendingPayments: number
  totalSpent: number
  unreadNotifications: number
}

const ACTIVE_STATUSES = ['created', 'confirmed', 'assigned', 'accepted', 'on_the_way', 'arrived', 'work_started']

export default function CustomerDashboardPage() {
  const { profile, session } = useAuth()
  const navigate = useNavigate()

  const [stats, setStats] = useState<Stats | null>(null)
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const userId = profile?.id || session?.user?.id

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    async function load() {
      try {
        const [bookingsRes, invoicesRes, notifRes] = await Promise.all([
          supabase.from('bookings').select('*').eq('customer_id', userId).order('created_at', { ascending: false }),
          supabase.from('invoices').select('amount, status').eq('customer_id', userId),
          supabase.from('notifications').select('*').eq('user_id', userId).eq('is_read', false).order('created_at', { ascending: false }).limit(5),
        ])

        if (cancelled) return

        const bookings = (bookingsRes.data as Booking[]) || []
        const invoices = (invoicesRes.data as { amount: number; status: string }[]) || []
        const notifications = (notifRes.data as Notification[]) || []

        const activeBookings = bookings.filter((b) => ACTIVE_STATUSES.includes(b.status)).length
        const completedBookings = bookings.filter((b) => b.status === 'completed').length
        const pendingPayments = invoices.filter((i) => i.status === 'pending' || i.status === 'unpaid').length
        const totalSpent = invoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + Number(i.amount), 0)

        setStats({
          activeBookings,
          completedBookings,
          pendingPayments,
          totalSpent,
          unreadNotifications: notifications.length,
        })
        setRecentBookings(bookings.slice(0, 5))
        setRecentNotifications(notifications)
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [userId])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  const statCards = [
    { label: 'Active Bookings', value: stats?.activeBookings ?? 0, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Completed', value: stats?.completedBookings ?? 0, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Pending Payments', value: stats?.pendingPayments ?? 0, icon: CreditCard, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Total Spent', value: formatCurrency(stats?.totalSpent ?? 0), icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  const quickActions = [
    { label: 'Book a Service', icon: Plus, path: '/dashboard/book', color: 'bg-blue-600 hover:bg-blue-700' },
    { label: 'Track Bookings', icon: Search, path: '/dashboard/tracking', color: 'bg-indigo-600 hover:bg-indigo-700' },
    { label: 'Pay Now', icon: CreditCard, path: '/dashboard/payments', color: 'bg-green-600 hover:bg-green-700' },
    { label: 'AI Assistant', icon: Sparkles, path: '/dashboard/ai-assistant', color: 'bg-purple-600 hover:bg-purple-700' },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">Welcome back, {profile?.name || 'Customer'}!</h1>
        <p className="mt-1 text-blue-100">Here's what's happening with your home services.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg', stat.bg)}>
                  <Icon className={cn('h-6 w-6', stat.color)} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl p-4 text-white shadow-sm transition-colors',
                  action.color,
                )}
              >
                <Icon className="h-6 w-6" />
                <span className="text-sm font-medium">{action.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Bookings */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Recent Bookings</CardTitle>
            <Link to="/dashboard/bookings">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CalendarCheck className="h-10 w-10 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">No bookings yet</p>
                <Link to="/dashboard/book">
                  <Button size="sm" className="mt-3">
                    <Plus className="mr-1 h-4 w-4" /> Book a Service
                  </Button>
                </Link>
              </div>
            ) : (
              recentBookings.map((booking) => (
                <Link
                  key={booking.id}
                  to="/dashboard/tracking"
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                      <Wrench className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{booking.service_name}</p>
                      <p className="text-xs text-slate-500">
                        {formatDate(booking.scheduled_date)} · {booking.city}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={cn('capitalize', BOOKING_STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-700')}
                  >
                    {booking.status.replace(/_/g, ' ')}
                  </Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Notifications</CardTitle>
            <Link to="/dashboard/notifications">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Bell className="h-10 w-10 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">No new notifications</p>
              </div>
            ) : (
              recentNotifications.map((notif) => (
                <div key={notif.id} className="rounded-lg border border-slate-200 p-3">
                  <p className="text-sm font-medium text-slate-900">{notif.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{notif.message}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Referral Banner */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardContent className="flex flex-col items-center justify-between gap-4 p-6 sm:flex-row">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100">
              <Users className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Refer & Earn</p>
              <p className="text-sm text-slate-600">Invite friends and earn rewards for every successful referral.</p>
            </div>
          </div>
          <Link to="/dashboard/referrals">
            <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100">
              View Referrals
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
