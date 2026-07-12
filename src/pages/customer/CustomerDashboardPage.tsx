import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, CheckCircle, Clock, Loader2, Plus, Wallet } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Booking } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BOOKING_STATUS_COLORS, BOOKING_STATUS_FLOW, formatCurrency, formatDate } from '@/lib/utils'

const ACTIVE_STATUSES = ['created', 'confirmed', 'assigned', 'accepted', 'on_the_way', 'work_started']

export function CustomerDashboardPage() {
  const { profile } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, spent: 0 })

  useEffect(() => {
    if (!profile?.id) return
    let mounted = true
    ;(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('customer_id', profile.id)
        .order('created_at', { ascending: false })
      if (!mounted) return
      const all = (data ?? []) as Booking[]
      setBookings(all.slice(0, 5))
      setStats({
        total: all.length,
        active: all.filter((b) => ACTIVE_STATUSES.includes(b.status)).length,
        completed: all.filter((b) => b.status === 'completed').length,
        spent: all.filter((b) => b.status === 'completed').reduce((s, b) => s + Number(b.amount), 0),
      })
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [profile?.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const cards = [
    { label: 'Total Bookings', value: stats.total, icon: Calendar, color: 'text-blue-600 bg-blue-100' },
    { label: 'Active Bookings', value: stats.active, icon: Clock, color: 'text-amber-600 bg-amber-100' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-green-600 bg-green-100' },
    { label: 'Total Spent', value: formatCurrency(stats.spent), icon: Wallet, color: 'text-purple-600 bg-purple-100' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {profile?.name || 'Customer'}!
          </h1>
          <p className="text-sm text-gray-500">Here's an overview of your service bookings.</p>
        </div>
        <Button asChild>
          <Link to="/customer/booking">
            <Plus className="mr-2 h-4 w-4" /> Book a Service
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-lg p-3 ${c.color}`}>
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
          <CardTitle>Recent Bookings</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/customer/bookings">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="py-12 text-center">
              <Calendar className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-500">No bookings yet. Book your first service!</p>
              <Button className="mt-4" asChild>
                <Link to="/customer/booking">Book a Service</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{b.service_name}</p>
                    <p className="text-sm text-gray-500">
                      {b.booking_number} · {formatDate(b.scheduled_date)}
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
