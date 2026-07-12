import { useEffect, useState, useMemo } from 'react'
import { Loader as Loader2, BarChart3, CircleCheck as CheckCircle, Circle as XCircle, CreditCard, TrendingUp, Wrench } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Booking, Profile, Invoice } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  cn, formatCurrency, BOOKING_STATUS_COLORS, BOOKING_STATUS_FLOW,
} from '@/lib/utils'

export function AdminReportsPage() {
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      const [{ data: bData }, { data: pData }, { data: iData }] = await Promise.all([
        supabase.from('bookings').select('*'),
        supabase.from('profiles').select('*'),
        supabase.from('invoices').select('*'),
      ])
      if (!mounted) return
      setBookings((bData ?? []) as Booking[])
      setProfiles((pData ?? []) as Profile[])
      setInvoices((iData ?? []) as Invoice[])
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  const stats = useMemo(() => {
    const total = bookings.length
    const completed = bookings.filter((b) => b.status === 'completed').length
    const cancelled = bookings.filter((b) => b.status === 'cancelled').length
    const revenue = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0)
    const avgValue = total > 0 ? bookings.reduce((s, b) => s + Number(b.amount), 0) / total : 0
    return {
      total,
      completedRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      cancelRate: total > 0 ? Math.round((cancelled / total) * 100) : 0,
      revenue,
      avgValue,
    }
  }, [bookings, invoices])

  const byStatus = useMemo(() => {
    const map: Record<string, number> = {}
    for (const b of bookings) map[b.status] = (map[b.status] ?? 0) + 1
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [bookings])

  const topServices = useMemo(() => {
    const map: Record<string, number> = {}
    for (const b of bookings) map[b.service_name] = (map[b.service_name] ?? 0) + 1
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [bookings])

  const topTechs = useMemo(() => {
    const map: Record<string, number> = {}
    for (const b of bookings) {
      if (b.status === 'completed' && b.technician_id) {
        map[b.technician_id] = (map[b.technician_id] ?? 0) + 1
      }
    }
    return Object.entries(map)
      .map(([id, count]) => ({ name: profiles.find((p) => p.id === id)?.name ?? 'Unknown', count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [bookings, profiles])

  const monthlyRevenue = useMemo(() => {
    const months: { label: string; value: number }[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const label = d.toLocaleDateString('en-IN', { month: 'short' })
      const value = invoices
        .filter((inv) => {
          const id = new Date(inv.created_at)
          return id.getMonth() === d.getMonth() && id.getFullYear() === d.getFullYear() && inv.status === 'paid'
        })
        .reduce((s, inv) => s + Number(inv.amount), 0)
      months.push({ label, value })
    }
    return months
  }, [invoices])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const cards = [
    { label: 'Total Bookings', value: stats.total, icon: BarChart3, color: 'text-blue-600 bg-blue-100' },
    { label: 'Completed Rate', value: `${stats.completedRate}%`, icon: CheckCircle, color: 'text-green-600 bg-green-100' },
    { label: 'Cancellation Rate', value: `${stats.cancelRate}%`, icon: XCircle, color: 'text-red-600 bg-red-100' },
    { label: 'Total Revenue', value: formatCurrency(stats.revenue), icon: CreditCard, color: 'text-purple-600 bg-purple-100' },
    { label: 'Avg Booking Value', value: formatCurrency(stats.avgValue), icon: TrendingUp, color: 'text-cyan-600 bg-cyan-100' },
  ]

  const maxStatus = Math.max(...byStatus.map(([, n]) => n), 1)
  const maxMonthly = Math.max(...monthlyRevenue.map((m) => m.value), 1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-sm text-gray-500">Platform performance and key metrics.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Bookings by Status</CardTitle></CardHeader>
          <CardContent>
            {byStatus.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">No data available.</p>
            ) : (
              <div className="space-y-3">
                {byStatus.map(([status, count]) => (
                  <div key={status}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <Badge className={BOOKING_STATUS_COLORS[status]}>{BOOKING_STATUS_FLOW[status] ?? status}</Badge>
                      <span className="font-medium text-gray-700">{count}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100">
                      <div className={cn('h-2 rounded-full', BOOKING_STATUS_COLORS[status])} style={{ width: `${(count / maxStatus) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Top Services</CardTitle></CardHeader>
          <CardContent>
            {topServices.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">No data available.</p>
            ) : (
              <div className="space-y-3">
                {topServices.map(([name, count], i) => (
                  <div key={name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">{i + 1}</span>
                      <span className="text-sm font-medium text-gray-900">{name}</span>
                    </div>
                    <span className="text-sm text-gray-500">{count} bookings</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Top Technicians</CardTitle></CardHeader>
          <CardContent>
            {topTechs.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">No completed jobs yet.</p>
            ) : (
              <div className="space-y-3">
                {topTechs.map((t, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">{i + 1}</span>
                      <span className="text-sm font-medium text-gray-900">{t.name}</span>
                    </div>
                    <span className="text-sm text-gray-500">{t.count} jobs</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Revenue by Month (Last 6 Months)</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-2" style={{ height: '200px' }}>
              {monthlyRevenue.map((m) => (
                <div key={m.label} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-blue-500 to-blue-400 transition-all"
                      style={{ height: `${(m.value / maxMonthly) * 100}%`, minHeight: m.value > 0 ? '4px' : '0' }}
                      title={formatCurrency(m.value)}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{m.label}</span>
                  <span className="text-xs font-medium text-gray-700">{formatCurrency(m.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
