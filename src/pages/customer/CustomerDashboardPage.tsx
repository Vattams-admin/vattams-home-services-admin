import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, CheckCircle, CreditCard, TrendingUp, Plus, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Booking } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { LoadingScreen } from '@/components/LoadingScreen'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency, BOOKING_STATUS_COLORS } from '@/lib/utils'

type Stats = { active: number; completed: number; pendingPayments: number; totalSpent: number }

export function CustomerDashboardPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({ active: 0, completed: 0, pendingPayments: 0, totalSpent: 0 })
  const [bookings, setBookings] = useState<Booking[]>([])

  useEffect(() => {
    if (!profile) return
    let mounted = true;
    (async () => {
      const { data: bk } = await supabase
        .from('bookings').select('*').eq('customer_id', profile.id).order('created_at', { ascending: false })
      if (!mounted || !bk) return
      const all = bk as Booking[]
      const active = all.filter((b) => !['completed', 'cancelled'].includes(b.status)).length
      const completed = all.filter((b) => b.status === 'completed').length
      const { data: inv } = await supabase
        .from('invoices').select('amount, status').eq('customer_id', profile.id)
      const invoices = inv || []
      const pendingPayments = invoices.filter((i) => i.status === 'pending').length
      const totalSpent = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0)
      if (mounted) {
        setStats({ active, completed, pendingPayments, totalSpent })
        setBookings(all.slice(0, 5))
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [profile])

  if (loading) return <LoadingScreen />

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
          <p className="text-sm text-gray-600">Here's an overview of your account</p>
        </div>
        <Button onClick={() => navigate('/customer/booking')}>
          <Plus className="mr-2 h-4 w-4" /> Book New Service
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <CardTitle>Recent Bookings</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/customer/bookings')}>
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500">No bookings yet. Book your first service!</p>
              <Button className="mt-4" onClick={() => navigate('/customer/booking')}>
                <Plus className="mr-2 h-4 w-4" /> Book New Service
              </Button>
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
