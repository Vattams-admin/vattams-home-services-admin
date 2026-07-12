import { useEffect, useState } from 'react'
import { Calendar, Loader2, TrendingUp, Wallet } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Booking } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'

export function TechnicianEarningsPage() {
  const { profile } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) return
    let mounted = true
    ;(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('technician_id', profile.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
      if (!mounted) return
      setBookings((data ?? []) as Booking[])
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

  const total = bookings.reduce((s, b) => s + Number(b.amount), 0)
  const now = new Date()
  const thisMonth = bookings
    .filter((b) => {
      const d = new Date(b.created_at)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    .reduce((s, b) => s + Number(b.amount), 0)
  const avg = bookings.length ? total / bookings.length : 0

  // Monthly earnings for last 6 months
  const months: { label: string; value: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = d.toLocaleDateString('en-IN', { month: 'short' })
    const value = bookings
      .filter((b) => {
        const bd = new Date(b.created_at)
        return bd.getMonth() === d.getMonth() && bd.getFullYear() === d.getFullYear()
      })
      .reduce((s, b) => s + Number(b.amount), 0)
    months.push({ label, value })
  }
  const maxMonthly = Math.max(...months.map((m) => m.value), 1)

  const stats = [
    { label: 'Total Earnings', value: formatCurrency(total), icon: Wallet, color: 'text-purple-600 bg-purple-100' },
    { label: 'This Month', value: formatCurrency(thisMonth), icon: TrendingUp, color: 'text-green-600 bg-green-100' },
    { label: 'Completed Jobs', value: bookings.length, icon: Calendar, color: 'text-blue-600 bg-blue-100' },
    { label: 'Average per Job', value: formatCurrency(avg), icon: TrendingUp, color: 'text-amber-600 bg-amber-100' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-lg p-3 ${s.color}`}>
                <s.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Monthly Earnings (Last 6 Months)</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-3 pt-4" style={{ height: '200px' }}>
            {months.map((m) => (
              <div key={m.label} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs font-medium text-gray-600">
                  {m.value > 0 ? formatCurrency(m.value) : ''}
                </span>
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-blue-500 to-blue-400 transition-all"
                  style={{ height: `${(m.value / maxMonthly) * 140}px`, minHeight: m.value > 0 ? '8px' : '2px' }}
                />
                <span className="text-xs text-gray-500">{m.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Earnings History</CardTitle></CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="py-12 text-center">
              <Wallet className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-500">No earnings yet. Complete jobs to start earning!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {bookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{b.service_name}</p>
                    <p className="text-sm text-gray-500">
                      {b.booking_number} · {formatDate(b.created_at)}
                    </p>
                  </div>
                  <span className="text-lg font-bold text-green-600">{formatCurrency(b.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
