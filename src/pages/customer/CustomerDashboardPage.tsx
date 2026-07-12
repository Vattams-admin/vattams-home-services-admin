import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Booking } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { cn, formatDate, formatCurrency, BOOKING_STATUS_COLORS } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/LoadingScreen'
import { Calendar, CheckCircle, CreditCard, TrendingUp, Plus, Wrench } from 'lucide-react'

export function CustomerDashboardPage() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [stats, setStats] = useState({ active: 0, completed: 0, pendingPayments: 0, totalSpent: 0 })

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!profile) return
      const { data: bks } = await supabase
        .from('bookings')
        .select('*')
        .eq('customer_id', profile.id)
        .order('created_at', { ascending: false })
      if (!mounted || !bks) return
      setBookings(bks as Booking[])
      const active = bks.filter((b) => !['completed', 'cancelled'].includes(b.status)).length
      const completed = bks.filter((b) => b.status === 'completed').length
      const totalSpent = bks.filter((b) => b.status === 'completed').reduce((s, b) => s + b.amount, 0)
      const { data: invoices } = await supabase
        .from('invoices')
        .select('amount,status')
        .eq('customer_id', profile.id)
        .eq('status', 'pending')
      const pendingPayments = invoices?.length || 0
      if (mounted) {
        setStats({ active, completed, pendingPayments, totalSpent })
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [profile])

  if (loading) return <LoadingScreen message="Loading dashboard..." />

  const statCards = [
    { label: 'Active Bookings', value: stats.active, icon: Calendar, color: 'text-blue-600 bg-blue-50' },
    { label: 'Completed Services', value: stats.completed, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
    { label: 'Pending Payments', value: stats.pendingPayments, icon: CreditCard, color: 'text-amber-600 bg-amber-50' },
    { label: 'Total Spent', value: formatCurrency(stats.totalSpent), icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {profile?.name}!</h1>
          <p className="text-gray-600">Here's your service overview</p>
        </div>
        <Link to="/customer/booking">
          <Button><Plus className="mr-2 h-4 w-4" />Book New Service</Button>
        </Link>
      </div>

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
          <CardTitle>Recent Bookings</CardTitle>
          <Link to="/customer/bookings" className="text-sm text-blue-600 hover:underline">View All</Link>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Wrench className="h-12 w-12 text-gray-300" />
              <p className="text-gray-500">No bookings yet. Book your first service!</p>
              <Link to="/customer/booking"><Button size="sm"><Plus className="mr-2 h-4 w-4" />Book Now</Button></Link>
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
