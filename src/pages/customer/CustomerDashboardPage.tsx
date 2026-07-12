import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Calendar, CheckCircle, CreditCard, TrendingUp, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Booking } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/LoadingScreen'
import { formatCurrency, formatDate, BOOKING_STATUS_COLORS } from '@/lib/utils'

export function CustomerDashboardPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [stats, setStats] = useState({ active: 0, completed: 0, pendingPayments: 0, totalSpent: 0 })

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!profile) return
      const { data: bks } = await supabase.from('bookings').select('*').eq('customer_id', profile.id).order('created_at', { ascending: false })
      if (!mounted) return
      const all = (bks as Booking[]) || []
      setBookings(all.slice(0, 5))
      const active = all.filter((b) => !['completed', 'cancelled'].includes(b.status)).length
      const completed = all.filter((b) => b.status === 'completed').length
      const { data: invoices } = await supabase.from('invoices').select('amount, status').eq('customer_id', profile.id)
      const inv = invoices || []
      const pendingPayments = inv.filter((i: { status: string }) => i.status !== 'paid').length
      const totalSpent = inv.filter((i: { status: string }) => i.status === 'paid').reduce((s: number, i: { amount: number }) => s + i.amount, 0)
      if (mounted) { setStats({ active, completed, pendingPayments, totalSpent }); setLoading(false) }
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
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {profile?.name}!</h1>
          <p className="text-gray-600">Here's an overview of your services</p>
        </div>
        <Button onClick={() => navigate('/customer/book')}><Plus className="mr-2 h-4 w-4" /> Book New Service</Button>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => { const Icon = s.icon; return (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`rounded-lg p-3 ${s.color}`}><Icon className="h-6 w-6" /></div>
              <div><p className="text-sm text-gray-600">{s.label}</p><p className="text-xl font-bold text-gray-900">{s.value}</p></div>
            </CardContent>
          </Card>
        )})}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Bookings</CardTitle>
          <Link to="/customer/bookings" className="text-sm font-medium text-blue-600 hover:underline">View All</Link>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <p className="py-8 text-center text-gray-500">No bookings yet. Book your first service!</p>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">{b.service_name}</p>
                    <p className="text-sm text-gray-500">#{b.booking_number} • {formatDate(b.scheduled_date)}</p>
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
