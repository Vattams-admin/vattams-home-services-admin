import { useEffect, useState } from 'react'
import { Wrench, CircleCheck as CheckCircle, TrendingUp, Power, ArrowRight, BadgeCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Booking } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { LoadingScreen } from '@/components/LoadingScreen'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency, BOOKING_STATUS_COLORS, VERIFICATION_STATUS_COLORS, VERIFICATION_STATUS_LABELS, cn } from '@/lib/utils'

type Stats = { active: number; completed: number; totalEarnings: number }

export function TechnicianDashboardPage() {
  const { profile, refreshProfile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [stats, setStats] = useState<Stats>({ active: 0, completed: 0, totalEarnings: 0 })
  const [bookings, setBookings] = useState<Booking[]>([])

  useEffect(() => {
    if (!profile) return
    let mounted = true;
    (async () => {
      const { data: bk } = await supabase
        .from('bookings').select('*').eq('technician_id', profile.id).order('created_at', { ascending: false })
      if (!mounted || !bk) return
      const all = bk as Booking[]
      const active = all.filter((b) => !['completed', 'cancelled'].includes(b.status)).length
      const completed = all.filter((b) => b.status === 'completed').length
      const { data: w } = await supabase
        .from('technician_wallets').select('total_earnings').eq('technician_id', profile.id).maybeSingle()
      if (mounted) {
        setStats({ active, completed, totalEarnings: Number(w?.total_earnings || 0) })
        setBookings(all.slice(0, 5))
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [profile])

  if (loading) return <LoadingScreen />

  const toggleAvailability = async () => {
    if (!profile) return
    setToggling(true)
    const newVal = !profile.is_available
    const { error } = await supabase.from('profiles').update({ is_available: newVal }).eq('id', profile.id)
    if (error) { toast(error.message, 'error'); setToggling(false); return }
    await refreshProfile()
    toast(`You are now ${newVal ? 'available' : 'unavailable'} for jobs`, 'success')
    setToggling(false)
  }

  const statCards = [
    { label: 'Active Jobs', value: stats.active, icon: Wrench, color: 'text-blue-600 bg-blue-50' },
    { label: 'Completed Jobs', value: stats.completed, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
    { label: 'Total Earnings', value: formatCurrency(stats.totalEarnings), icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {profile?.name}!</h1>
          <p className="text-sm text-gray-600">Here's an overview of your work</p>
        </div>
        <div className="flex items-center gap-3">
          {profile?.verification_status && (
            <Badge color={VERIFICATION_STATUS_COLORS[profile.verification_status]}>
              <BadgeCheck className="mr-1 h-3 w-3" />
              {VERIFICATION_STATUS_LABELS[profile.verification_status] || profile.verification_status}
            </Badge>
          )}
          <Button variant={profile?.is_available ? 'primary' : 'outline'} disabled={toggling} onClick={toggleAvailability}>
            <Power className="mr-2 h-4 w-4" />
            {toggling ? 'Updating...' : profile?.is_available ? 'Available' : 'Unavailable'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${s.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
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
          <Button variant="ghost" size="sm" onClick={() => window.location.assign('/technician/jobs')}>
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500">No jobs assigned yet. Set yourself as available to receive jobs!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{b.service_name}</p>
                    <p className="text-sm text-gray-500">{b.booking_number} · {formatDate(b.scheduled_date)}</p>
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
