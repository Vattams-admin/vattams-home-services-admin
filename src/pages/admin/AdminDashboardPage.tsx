import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarCheck,
  IndianRupee,
  Wrench,
  Users,
  ShieldCheck,
  TrendingUp,
  Clock,
  AlertCircle,
  Loader2,
  ChevronRight,
  Bell,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth'
import {
  supabase,
  type Booking,
  type Profile,
  type Notification,
} from '@/lib/supabase'
import {
  cn,
  formatDate,
  formatCurrency,
  BOOKING_STATUS_COLORS,
  VERIFICATION_STATUS_COLORS,
  VERIFICATION_STATUS_LABELS,
} from '@/lib/utils'

type Stats = {
  totalBookings: number
  totalRevenue: number
  activeTechnicians: number
  totalCustomers: number
  pendingVerifications: number
}

type RecentActivity = {
  id: string
  type: 'booking' | 'verification' | 'notification'
  title: string
  subtitle: string
  created_at: string
  status?: string
}

export default function AdminDashboardPage() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
  const [pendingTechs, setPendingTechs] = useState<Profile[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [
          bookingsRes,
          revenueRes,
          techsRes,
          customersRes,
          pendingRes,
          notifRes,
        ] = await Promise.all([
          supabase
            .from('bookings')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10),
          supabase
            .from('invoices')
            .select('amount, status')
            .eq('status', 'paid'),
          supabase
            .from('profiles')
            .select('id')
            .eq('role', 'technician')
            .eq('verification_status', 'approved'),
          supabase
            .from('profiles')
            .select('id')
            .eq('role', 'customer'),
          supabase
            .from('profiles')
            .select('*')
            .eq('role', 'technician')
            .in('verification_status', [
              'pending_registration',
              'fee_pending',
              'under_review',
            ])
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5),
        ])

        if (cancelled) return

        const bookings = (bookingsRes.data as Booking[]) || []
        const paidInvoices =
          (revenueRes.data as { amount: number; status: string }[]) || []
        const pending = (pendingRes.data as Profile[]) || []
        const notifications = (notifRes.data as Notification[]) || []

        const totalRevenue = paidInvoices.reduce(
          (sum, inv) => sum + Number(inv.amount),
          0,
        )

        setStats({
          totalBookings: bookings.length,
          totalRevenue,
          activeTechnicians: techsRes.data?.length || 0,
          totalCustomers: customersRes.data?.length || 0,
          pendingVerifications: pending.length,
        })
        setRecentBookings(bookings.slice(0, 5))
        setPendingTechs(pending)

        // Build recent activity feed
        const activity: RecentActivity[] = [
          ...bookings.slice(0, 5).map((b) => ({
            id: b.id,
            type: 'booking' as const,
            title: `Booking ${b.booking_number}`,
            subtitle: `${b.service_name} · ${b.city}`,
            created_at: b.created_at,
            status: b.status,
          })),
          ...pending.slice(3).map((p) => ({
            id: p.id,
            type: 'verification' as const,
            title: `${p.name} submitted for verification`,
            subtitle: `Mobile: ${p.mobile}`,
            created_at: p.created_at,
            status: p.verification_status || undefined,
          })),
          ...notifications.map((n) => ({
            id: n.id,
            type: 'notification' as const,
            title: n.title,
            subtitle: n.message,
            created_at: n.created_at,
          })),
        ]
        activity.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        setRecentActivity(activity.slice(0, 8))
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
  }, [])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  const statCards = [
    {
      label: 'Total Bookings',
      value: stats?.totalBookings ?? 0,
      icon: CalendarCheck,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(stats?.totalRevenue ?? 0),
      icon: IndianRupee,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Active Technicians',
      value: stats?.activeTechnicians ?? 0,
      icon: Wrench,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'Customers',
      value: stats?.totalCustomers ?? 0,
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
  ]

  const quickLinks = [
    {
      label: 'Verifications',
      icon: ShieldCheck,
      path: '/admin/verifications',
      color: 'bg-blue-600 hover:bg-blue-700',
      badge: stats?.pendingVerifications || 0,
    },
    {
      label: 'Bookings',
      icon: CalendarCheck,
      path: '/admin/bookings',
      color: 'bg-indigo-600 hover:bg-indigo-700',
    },
    {
      label: 'Customers',
      icon: Users,
      path: '/admin/customers',
      color: 'bg-purple-600 hover:bg-purple-700',
    },
    {
      label: 'Technicians',
      icon: Wrench,
      path: '/admin/technicians',
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      label: 'Revenue',
      icon: TrendingUp,
      path: '/admin/revenue',
      color: 'bg-amber-600 hover:bg-amber-700',
    },
    {
      label: 'Reports',
      icon: LayoutDashboard,
      path: '/admin/reports',
      color: 'bg-slate-700 hover:bg-slate-800',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="mt-1 text-slate-300">
          Welcome back, {profile?.name || 'Admin'}. Here's your platform
          overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 p-5">
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-lg',
                    stat.bg,
                  )}
                >
                  <Icon className={cn('h-6 w-6', stat.color)} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {stat.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Pending Verifications Alert */}
      {(stats?.pendingVerifications ?? 0) > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">
                  {stats?.pendingVerifications} technician(s) pending
                  verification
                </p>
                <p className="text-sm text-slate-600">
                  Review and approve/reject technician applications.
                </p>
              </div>
            </div>
            <Link to="/admin/verifications">
              <Button variant="outline" size="sm">
                Review Now <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">
          Quick Access
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {quickLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link key={link.label} to={link.path}>
                <div
                  className={cn(
                    'relative flex flex-col items-center gap-2 rounded-xl p-4 text-white shadow-sm transition-colors',
                    link.color,
                  )}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-sm font-medium">{link.label}</span>
                  {link.badge != null && link.badge > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                      {link.badge}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Bookings */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Recent Bookings</CardTitle>
            <Link to="/admin/bookings">
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
              </div>
            ) : (
              recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                      <Wrench className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {booking.booking_number}
                      </p>
                      <p className="text-xs text-slate-500">
                        {booking.service_name} · {booking.city} ·{' '}
                        {formatDate(booking.scheduled_date)}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={cn(
                      'capitalize',
                      BOOKING_STATUS_COLORS[booking.status] ||
                        'bg-gray-100 text-gray-700',
                    )}
                  >
                    {booking.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Clock className="h-10 w-10 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">No recent activity</p>
              </div>
            ) : (
              recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="rounded-lg border border-slate-200 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900">
                      {activity.title}
                    </p>
                    {activity.status && activity.type === 'verification' && (
                      <Badge
                        className={cn(
                          VERIFICATION_STATUS_COLORS[activity.status] ||
                            'bg-gray-100 text-gray-700',
                        )}
                      >
                        {VERIFICATION_STATUS_LABELS[activity.status] ||
                          activity.status}
                      </Badge>
                    )}
                    {activity.status && activity.type === 'booking' && (
                      <Badge
                        className={cn(
                          'capitalize',
                          BOOKING_STATUS_COLORS[activity.status] ||
                            'bg-gray-100 text-gray-700',
                        )}
                      >
                        {activity.status.replace(/_/g, ' ')}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {activity.subtitle}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {formatDate(activity.created_at)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bookings Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-slate-200">
              <div className="text-center">
                <TrendingUp className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm text-slate-400">
                  Chart visualization placeholder
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Service Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-slate-200">
              <div className="text-center">
                <IndianRupee className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm text-slate-400">
                  Chart visualization placeholder
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Verifications List */}
      {pendingTechs.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Pending Verifications</CardTitle>
            <Link to="/admin/verifications">
              <Button variant="ghost" size="sm">
                View All <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingTechs.map((tech) => (
              <div
                key={tech.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                    <ShieldCheck className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{tech.name}</p>
                    <p className="text-xs text-slate-500">
                      {tech.mobile} · {tech.city || 'N/A'} ·{' '}
                      {tech.skills?.join(', ') || 'No skills listed'}
                    </p>
                  </div>
                </div>
                <Badge
                  className={cn(
                    VERIFICATION_STATUS_COLORS[
                      tech.verification_status || 'pending_registration'
                    ] || 'bg-gray-100 text-gray-700',
                  )}
                >
                  {VERIFICATION_STATUS_LABELS[
                    tech.verification_status || 'pending_registration'
                  ] || 'Pending'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
