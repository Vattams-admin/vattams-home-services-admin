import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Booking, TechnicianWallet } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { cn, formatDate, formatCurrency, BOOKING_STATUS_COLORS, VERIFICATION_STATUS_COLORS, VERIFICATION_STATUS_LABELS } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/LoadingScreen'
import { Calendar, CheckCircle, TrendingUp, Wrench, Power } from 'lucide-react'

export function TechnicianDashboardPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [wallet, setWallet] = useState<TechnicianWallet | null>(null)
  const [toggling, setToggling] = useState(false)
  const [stats, setStats] = useState({ active: 0, completed: 0, totalEarnings: 0 })

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!profile) return
      const { data: bks } = await supabase
        .from('bookings')
        .select('*')
        .eq('technician_id', profile.id)
        .order('created_at', { ascending: false })
      if (!mounted || !bks) return
      setBookings(bks as Booking[])
      const active = bks.filter((b) => !['completed', 'cancelled'].includes(b.status)).length
      const completed = bks.filter((b) => b.status === 'completed').length
      const { data: w } = await supabase
        .from('technician_wallets')
        .select('*')
        .eq('technician_id', profile.id)
        .maybeSingle()
      if (mounted && w) setWallet(w as TechnicianWallet)
      if (mounted) {
        setStats({ active, completed, totalEarnings: (w as TechnicianWallet)?.total_earnings || 0 })
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [profile])

  const toggleAvailability = async () => {
    if (!profile) return
    setToggling(true)
    const newValue = !profile.is_available
    const { error } = await supabase.from('profiles').update({ is_available: newValue }).eq('id', profile.id)
    if (error) { toast('Failed to update availability', 'error'); setToggling(false); return }
    toast(newValue ? 'You are now available for jobs' : 'You are now unavailable', 'success')
    setToggling(false)
    setStats((s) => ({ ...s }))
    window.location.reload()
  }

  if (loading) return <LoadingScreen message="Loading dashboard..." />

  const statCards = [
    { label: 'Active Jobs', value: stats.active, icon: Calendar, color: 'text-blue-600 bg-blue-50' },
    { label: 'Completed Jobs', value: stats.completed, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
    { label: 'Total Earnings', value: formatCurrency(stats.totalEarnings), icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
    { label: 'Available Status', value: profile?.is_available ? 'Available' : 'Unavailable', icon: Power, color: profile?.is_available ? 'text-emerald-600 bg-emerald-50' : 'text-gray-600 bg-gray-100' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {profile?.name}!</h1>
          <p className="text-gray-600">Here's your technician overview</p>
        </div>
        <Button variant={profile?.is_available ? 'danger' : 'primary'} onClick={toggleAvailability} disabled={toggling}>
          <Power className="mr-2 h-4 w-4" />
          {toggling ? 'Updating...' : profile?.is_available ? 'Go Unavailable' : 'Go Available'}
        </Button>
      </div>

      {profile?.verification_status && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Verification:</span>
          <Badge color={VERIFICATION_STATUS_COLORS[profile.verification_status]}>
            {VERIFICATION_STATUS_LABELS[profile.verification_status] || profile.verification_status}
          </Badge>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className={cn('rounded-lg p-3', s.color)}><Icon className="h-6 w-6" /></div>
                <div>
                  <p className="text-sm text-gray-600">{s.label}</p>
                  <p className="text-xl font-bold text-gray-900">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Jobs</CardTitle>
          <Link to="/technician/jobs" className="text-sm text-blue-600 hover:underline">View All</Link>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Wrench className="h-12 w-12 text-gray-300" />
              <p className="text-gray-500">No jobs assigned yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.slice(0, 5).map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                  <div className="space-y-1">
                    <p className="font-medium text-gray-900">{b.service_name}</p>
                    <p className="text-sm text-gray-500">#{b.booking_number} · {formatDate(b.scheduled_date)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(b.amount)}</span>
                    <Badge color={BOOKING_STATUS_COLORS[b.status]}>{b.status.replace(/_/g, ' ')}</Badge>
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
