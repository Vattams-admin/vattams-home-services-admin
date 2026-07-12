import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, CheckCircle, Clock, Loader2, Wallet, Wrench } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Booking } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BOOKING_STATUS_COLORS, BOOKING_STATUS_FLOW, cn, formatCurrency, formatDate } from '@/lib/utils'

const ACTIVE_STATUSES = ['assigned', 'accepted', 'on_the_way', 'work_started']

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export function TechnicianDashboardPage() {
  const { profile, refreshProfile } = useAuth()
  const { toast } = useToast()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    if (!profile?.id) return
    let mounted = true
    ;(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('technician_id', profile.id)
        .order('created_at', { ascending: false })
      if (!mounted) return
      setBookings((data ?? []) as Booking[])
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [profile?.id])

  const today = todayStr()
  const todaysJobs = bookings.filter((b) => b.scheduled_date === today)
  const activeJobs = bookings.filter((b) => ACTIVE_STATUSES.includes(b.status))
  const completedJobs = bookings.filter((b) => b.status === 'completed')
  const totalEarnings = completedJobs.reduce((s, b) => s + Number(b.amount), 0)

  const toggleAvailability = async () => {
    if (!profile?.id) return
    setToggling(true)
    try {
      const next = !profile.is_available
      const { error } = await supabase
        .from('profiles')
        .update({ is_available: next })
        .eq('id', profile.id)
      if (error) throw error
      await refreshProfile()
      toast({
        title: next ? 'You are now available' : 'You are now unavailable',
        variant: 'success',
      })
    } catch (err) {
      toast({ title: 'Update failed', description: (err as Error).message, variant: 'error' })
    } finally {
      setToggling(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const cards = [
    { label: "Today's Jobs", value: todaysJobs.length, icon: Calendar, color: 'text-blue-600 bg-blue-100' },
    { label: 'Active Jobs', value: activeJobs.length, icon: Clock, color: 'text-amber-600 bg-amber-100' },
    { label: 'Completed Jobs', value: completedJobs.length, icon: CheckCircle, color: 'text-green-600 bg-green-100' },
    { label: 'Total Earnings', value: formatCurrency(totalEarnings), icon: Wallet, color: 'text-purple-600 bg-purple-100' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {profile?.name || 'Technician'}!
          </h1>
          <p className="text-sm text-gray-500">Here's your work overview for today.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Availability</span>
          <button
            onClick={toggleAvailability}
            disabled={toggling}
            className={cn(
              'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
              profile?.is_available ? 'bg-green-500' : 'bg-gray-300',
            )}
          >
            {toggling && <Loader2 className="absolute h-4 w-4 animate-spin text-white" />}
            <span
              className={cn(
                'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                profile?.is_available ? 'translate-x-6' : 'translate-x-1',
              )}
            />
          </button>
          <Badge variant={profile?.is_available ? 'success' : 'secondary'}>
            {profile?.is_available ? 'Available' : 'Unavailable'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={cn('rounded-lg p-3', c.color)}>
                <c.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{c.label}</p>
                <p className="text-xl font-bold text-gray-900">{c.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Today's Jobs</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/technician/jobs">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {todaysJobs.length === 0 ? (
            <div className="py-12 text-center">
              <Wrench className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-500">No jobs scheduled for today.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todaysJobs.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{b.service_name}</p>
                    <p className="text-sm text-gray-500">
                      {b.booking_number} · {formatDate(b.scheduled_date)} {b.scheduled_time ?? ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(b.amount)}</span>
                    <Badge className={BOOKING_STATUS_COLORS[b.status]}>
                      {BOOKING_STATUS_FLOW[b.status] ?? b.status}
                    </Badge>
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
