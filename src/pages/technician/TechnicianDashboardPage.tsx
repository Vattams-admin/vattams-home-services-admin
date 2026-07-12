import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Wrench, CircleCheck as CheckCircle2, Clock, Star, Wallet, Bell, Loader as Loader2, CircleAlert as AlertCircle, ShieldCheck, TrendingUp, Calendar, MapPin, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth'
import {
  supabase,
  type Booking,
  type TechnicianWallet,
  type Notification,
  type Review,
} from '@/lib/supabase'
import {
  cn,
  formatDate,
  formatCurrency,
  BOOKING_STATUS_COLORS,
  VERIFICATION_STATUS_COLORS,
  VERIFICATION_STATUS_LABELS,
} from '@/lib/utils'
import { VERIFICATION_FEE } from '@/lib/constants'

type Stats = {
  activeJobs: number
  completedJobs: number
  earnings: number
  rating: number
  unreadNotifications: number
}

const ACTIVE_STATUSES = ['assigned', 'accepted', 'on_the_way', 'arrived', 'work_started']

export default function TechnicianDashboardPage() {
  const { profile, session } = useAuth()
  const navigate = useNavigate()

  const [stats, setStats] = useState<Stats | null>(null)
  const [recentJobs, setRecentJobs] = useState<Booking[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const userId = profile?.id || session?.user?.id
  const verificationStatus = profile?.verification_status || 'pending_registration'
  const isApproved = verificationStatus === 'approved'

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    async function load() {
      try {
        const [bookingsRes, walletRes, notifRes, reviewsRes] = await Promise.all([
          supabase
            .from('bookings')
            .select('*')
            .eq('technician_id', userId)
            .order('created_at', { ascending: false }),
          supabase
            .from('technician_wallets')
            .select('*')
            .eq('technician_id', userId)
            .maybeSingle(),
          supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .eq('is_read', false)
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('reviews')
            .select('rating')
            .eq('technician_id', userId),
        ])

        if (cancelled) return

        const bookings = (bookingsRes.data as Booking[]) || []
        const wallet = (walletRes.data as TechnicianWallet) || null
        const notifs = (notifRes.data as Notification[]) || []
        const reviews = (reviewsRes.data as Review[]) || []

        const activeJobs = bookings.filter((b) => ACTIVE_STATUSES.includes(b.status)).length
        const completedJobs = bookings.filter((b) => b.status === 'completed').length
        const earnings = wallet?.total_earnings || 0
        const rating =
          reviews.length > 0
            ? reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length
            : 0

        setStats({
          activeJobs,
          completedJobs,
          earnings,
          rating: Math.round(rating * 10) / 10,
          unreadNotifications: notifs.length,
        })
        setRecentJobs(bookings.slice(0, 5))
        setNotifications(notifs)
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
    { label: 'Active Jobs', value: stats?.activeJobs ?? 0, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Completed', value: stats?.completedJobs ?? 0, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total Earnings', value: formatCurrency(stats?.earnings ?? 0), icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Rating', value: stats?.rating ? `${stats.rating} ★` : 'N/A', icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
  ]

  const quickActions = [
    { label: 'View Jobs', icon: Wrench, path: '/technician/jobs', color: 'bg-blue-600 hover:bg-blue-700' },
    { label: 'Wallet', icon: Wallet, path: '/technician/wallet', color: 'bg-green-600 hover:bg-green-700' },
    { label: 'Service Areas', icon: MapPin, path: '/technician/areas', color: 'bg-indigo-600 hover:bg-indigo-700' },
    { label: 'Earnings', icon: TrendingUp, path: '/technician/earnings', color: 'bg-purple-600 hover:bg-purple-700' },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">Welcome, {profile?.name || 'Technician'}!</h1>
        <p className="mt-1 text-blue-100">Manage your jobs, earnings, and service areas.</p>
      </div>

      {/* Verification Status Banner */}
      {!isApproved && (
        <Card
          className={cn(
            'border-2',
            verificationStatus === 'rejected' || verificationStatus === 'suspended'
              ? 'border-red-200 bg-red-50'
              : 'border-amber-200 bg-amber-50',
          )}
        >
          <CardContent className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center">
            <div
              className={cn(
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg',
                verificationStatus === 'rejected' || verificationStatus === 'suspended'
                  ? 'bg-red-100'
                  : 'bg-amber-100',
              )}
            >
              {verificationStatus === 'rejected' || verificationStatus === 'suspended' ? (
                <AlertCircle className="h-6 w-6 text-red-600" />
              ) : (
                <ShieldCheck className="h-6 w-6 text-amber-600" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-slate-900">Verification Status:</p>
                <Badge
                  className={cn(
                    VERIFICATION_STATUS_COLORS[verificationStatus] || 'bg-gray-100 text-gray-700',
                  )}
                >
                  {VERIFICATION_STATUS_LABELS[verificationStatus] || verificationStatus}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                {verificationStatus === 'pending_registration' &&
                  'Please complete your profile and submit documents for verification.'}
                {verificationStatus === 'fee_pending' &&
                  `A ${formatCurrency(VERIFICATION_FEE)} verification fee is required to proceed with your application.`}
                {verificationStatus === 'under_review' &&
                  'Your documents are being reviewed. This usually takes 1-2 business days.'}
                {verificationStatus === 'rejected' &&
                  `Your application was rejected. ${profile?.rejection_reason ? `Reason: ${profile.rejection_reason}` : 'Please contact support.'}`}
                {verificationStatus === 'suspended' &&
                  'Your account has been suspended. Please contact support for assistance.'}
              </p>
            </div>
            {(verificationStatus === 'fee_pending' || verificationStatus === 'pending_registration') && (
              <Button onClick={() => navigate('/technician/wallet')} variant="outline">
                {verificationStatus === 'fee_pending' ? 'Pay Fee' : 'Complete Setup'}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </CardContent>
        </Card>
      )}

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
        {/* Recent Jobs */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Recent Jobs</CardTitle>
            <Link to="/technician/jobs">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Wrench className="h-10 w-10 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">No jobs assigned yet</p>
                <p className="text-xs text-slate-400">New job assignments will appear here.</p>
              </div>
            ) : (
              recentJobs.map((job) => (
                <Link
                  key={job.id}
                  to="/technician/jobs"
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                      <Wrench className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{job.service_name}</p>
                      <p className="text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {formatDate(job.scheduled_date)} · {job.city}
                        </span>
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={cn('capitalize', BOOKING_STATUS_COLORS[job.status] || 'bg-gray-100 text-gray-700')}
                  >
                    {job.status.replace(/_/g, ' ')}
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
            <Link to="/technician/notifications">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Bell className="h-10 w-10 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">No new notifications</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div key={notif.id} className="rounded-lg border border-slate-200 p-3">
                  <p className="text-sm font-medium text-slate-900">{notif.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{notif.message}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
