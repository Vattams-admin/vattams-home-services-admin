import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Wrench, CircleCheck as CheckCircle, TrendingUp, Power, ArrowRight, BadgeCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Booking, Profile, TechnicianWallet } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/LoadingScreen'
import { cn, formatDate, formatCurrency, BOOKING_STATUS_COLORS, VERIFICATION_STATUS_COLORS, VERIFICATION_STATUS_LABELS } from '@/lib/utils'

type BookingWithCustomer = Booking & { customer: Profile | null }
type Stats = { active: number; completed: number; totalEarnings: number }

export function TechnicianDashboardPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({ active: 0, completed: 0, totalEarnings: 0 })
  const [bookings, setBookings] = useState<BookingWithCustomer[]>([])
  const [wallet, setWallet] = useState<TechnicianWallet | null>(null)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    if (!profile) return
    let mounted = true;
    (async () => {
      const activeStatuses = ['assigned', 'accepted', 'on_the_way', 'arrived', 'work_started']
      const { count: active } = await supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('technician_id', profile.id).in('status', activeStatuses)
      const { count: completed } = await supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('technician_id', profile.id).eq('status', 'completed')
      const { data: recentBookings } = await supabase.from('bookings').select('*, customer:customer_id(*)').eq('technician_id', profile.id).order('created_at', { ascending: false }).limit(5)
      const { data: walletData } = await supabase.from('technician_wallets').select('*').eq('technician_id', profile.id).maybeSingle()
      if (!mounted) return
      setStats({ active: active || 0, completed: completed || 0, totalEarnings: walletData?.total_earnings || 0 })
      setBookings((recentBookings || []) as BookingWithCustomer[])
      setWallet(walletData as TechnicianWallet | null)
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [profile])

  const toggleAvailability = async () => {
    if (!profile) return
    setToggling(true)
    const newValue = !profile.is_available
    const { error } = await supabase.from('profiles').update({ is_available: newValue }).eq('id', profile.id)
    setToggling(false)
    if (error) { toast('Failed to update availability', 'error'); return }
    toast(newValue ? 'You are now available for jobs' : 'You are now unavailable', 'success')
    setStats((s) => s) // trigger re-render
    // Force profile refresh via window event
    window.dispatchEvent(new Event('profile-updated'))
  }

  if (loading) return <LoadingScreen message="Loading dashboard..." />
  if (!profile) return null

  const statCards = [
    { label: 'Active Jobs', value: stats.active, icon: Wrench, color: 'text-blue-600 bg-blue-100' },
    { label: 'Completed Jobs', value: stats.completed, icon: CheckCircle, color: 'text-green-600 bg-green-100' },
    { label: 'Total Earnings', value: formatCurrency(stats.totalEarnings), icon: TrendingUp, color: 'text-purple-600 bg-purple-100' },
    { label: 'Available Status', value: profile.is_available ? 'Available' : 'Unavailable', icon: Power, color: profile.is_available ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {profile.name}!</h1>
          <p className="text-sm text-gray-500">Here&apos;s an overview of your work</p>
        </div>
        <Button variant={profile.is_available ? 'outline' : 'primary'} onClick={toggleAvailability} disabled={toggling}>
          <Power className="mr-2 h-4 w-4" />{profile.is_available ? 'Go Unavailable' : 'Go Available'}
        </Button>
      </div>

      {profile.verification_status && (
        <div className="flex items-center gap-2">
          <BadgeCheck className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-500">Verification:</span>
          <Badge color={VERIFICATION_STATUS_COLORS[profile.verification_status] || 'bg-gray-100 text-gray-700'}>
            {VERIFICATION_STATUS_LABELS[profile.verification_status] || profile.verification_status}
          </Badge>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 py-4">
              <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg', s.color)}><s.icon className="h-6 w-6" /></div>
              <div><p className="text-2xl font-bold text-gray-900">{s.value}</p><p className="text-sm text-gray-500">{s.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Jobs</CardTitle>
          <Link to="/technician/jobs" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">View All <ArrowRight className="h-4 w-4" /></Link>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-500">No jobs assigned yet.</p>
              <p className="mt-1 text-sm text-gray-400">Make sure you are available to receive job assignments.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">{b.service_name}</p>
                      <Badge color={BOOKING_STATUS_COLORS[b.status]}>{b.status.replace(/_/g, ' ')}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{formatDate(b.scheduled_date)}{b.customer ? ` • ${b.customer.name}` : ''}</p>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(b.amount)}</p>
                    <Link to="/technician/jobs" className="text-sm text-blue-600 hover:text-blue-700">View</Link>
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
