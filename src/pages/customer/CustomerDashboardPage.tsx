import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Calendar, CircleCheck as CheckCircle, CreditCard, TrendingUp, Plus, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Booking, Profile } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/LoadingScreen'
import { cn, formatDate, formatCurrency, BOOKING_STATUS_COLORS } from '@/lib/utils'

type Stats = { active: number; completed: number; pendingPayments: number; totalSpent: number }
type BookingWithTech = Booking & { technician: Profile | null }

export function CustomerDashboardPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({ active: 0, completed: 0, pendingPayments: 0, totalSpent: 0 })
  const [bookings, setBookings] = useState<BookingWithTech[]>([])

  useEffect(() => {
    if (!profile) return
    let mounted = true;
    (async () => {
      const activeStatuses = ['created', 'confirmed', 'assigned', 'accepted', 'on_the_way', 'arrived', 'work_started']
      const { count: active } = await supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('customer_id', profile.id).in('status', activeStatuses)
      const { count: completed } = await supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('customer_id', profile.id).eq('status', 'completed')
      const { count: pendingPayments } = await supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('customer_id', profile.id).eq('status', 'pending')
      const { data: paidInvoices } = await supabase.from('invoices').select('amount').eq('customer_id', profile.id).eq('status', 'paid')
      const totalSpent = (paidInvoices || []).reduce((sum, inv) => sum + (inv.amount || 0), 0)
      const { data: recentBookings } = await supabase.from('bookings').select('*, technician:technician_id(*)').eq('customer_id', profile.id).order('created_at', { ascending: false }).limit(5)
      if (!mounted) return
      setStats({ active: active || 0, completed: completed || 0, pendingPayments: pendingPayments || 0, totalSpent })
      setBookings((recentBookings || []) as BookingWithTech[])
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [profile])

  if (loading) return <LoadingScreen message="Loading dashboard..." />
  if (!profile) return null

  const statCards = [
    { label: 'Active Bookings', value: stats.active, icon: Calendar, color: 'text-blue-600 bg-blue-100' },
    { label: 'Completed Services', value: stats.completed, icon: CheckCircle, color: 'text-green-600 bg-green-100' },
    { label: 'Pending Payments', value: stats.pendingPayments, icon: CreditCard, color: 'text-amber-600 bg-amber-100' },
    { label: 'Total Spent', value: formatCurrency(stats.totalSpent), icon: TrendingUp, color: 'text-purple-600 bg-purple-100' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {profile.name}!</h1>
          <p className="text-sm text-gray-500">Here&apos;s an overview of your services</p>
        </div>
        <Button onClick={() => navigate('/customer/booking')}><Plus className="mr-2 h-4 w-4" />Book New Service</Button>
      </div>

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
          <CardTitle>Recent Bookings</CardTitle>
          <Link to="/customer/bookings" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">View All <ArrowRight className="h-4 w-4" /></Link>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-500">No bookings yet. Book your first service today!</p>
              <Button className="mt-4" onClick={() => navigate('/customer/booking')}><Plus className="mr-2 h-4 w-4" />Book New Service</Button>
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
                    <p className="mt-1 text-sm text-gray-500">{formatDate(b.scheduled_date)}{b.technician ? ` • ${b.technician.name}` : ''}</p>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(b.amount)}</p>
                    <Link to={`/customer/track/${b.id}`} className="text-sm text-blue-600 hover:text-blue-700">Track</Link>
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
