import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Booking, Profile, Invoice, RevenueTransaction } from '@/lib/supabase'
import { cn, formatDate, formatCurrency, BOOKING_STATUS_COLORS } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/LoadingScreen'
import { generateReportPDF, exportToCSV } from '@/lib/pdf'
import { TrendingUp, Calendar, CheckCircle, XCircle, Download, Wrench, Star } from 'lucide-react'

export function AdminReportsPage() {
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [stats, setStats] = useState({ total: 0, completedRate: 0, cancelRate: 0, revenue: 0, avgValue: 0 })

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: bks } = await supabase.from('bookings').select('*').order('created_at', { ascending: false })
      const { data: profs } = await supabase.from('profiles').select('*')
      const { data: invs } = await supabase.from('invoices').select('*')
      if (!mounted) return
      const bkList = (bks || []) as Booking[]
      setBookings(bkList)
      setProfiles((profs || []) as Profile[])
      setInvoices((invs || []) as Invoice[])
      const completed = bkList.filter((b) => b.status === 'completed').length
      const cancelled = bkList.filter((b) => b.status === 'cancelled').length
      const revenue = (invs || []).filter((i) => i.status === 'paid').reduce((s, i) => s + (i.amount || 0), 0)
      setStats({
        total: bkList.length,
        completedRate: bkList.length > 0 ? Math.round((completed / bkList.length) * 100) : 0,
        cancelRate: bkList.length > 0 ? Math.round((cancelled / bkList.length) * 100) : 0,
        revenue,
        avgValue: bkList.length > 0 ? Math.round(revenue / bkList.length) : 0,
      })
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  if (loading) return <LoadingScreen message="Loading reports..." />

  const techMap: Record<string, Profile> = {}
  profiles.filter((p) => p.role === 'technician').forEach((t) => { techMap[t.id] = t })

  const statusCounts: Record<string, number> = {}
  bookings.forEach((b) => { statusCounts[b.status] = (statusCounts[b.status] || 0) + 1 })
  const maxStatusCount = Math.max(...Object.values(statusCounts), 1)

  const serviceCounts: Record<string, number> = {}
  bookings.forEach((b) => { serviceCounts[b.service_name] = (serviceCounts[b.service_name] || 0) + 1 })
  const topServices = Object.entries(serviceCounts).sort(([, a], [, b]) => b - a).slice(0, 5)

  const techBookingCounts: Record<string, number> = {}
  bookings.forEach((b) => { if (b.technician_id) techBookingCounts[b.technician_id] = (techBookingCounts[b.technician_id] || 0) + 1 })
  const topTechs = Object.entries(techBookingCounts).sort(([, a], [, b]) => b - a).slice(0, 5)

  const now = new Date()
  const monthlyRevenue: { month: string; revenue: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthName = d.toLocaleDateString('en-IN', { month: 'short' })
    const rev = invoices.filter((inv) => { const id = new Date(inv.created_at); return id.getMonth() === d.getMonth() && id.getFullYear() === d.getFullYear() && inv.status === 'paid' }).reduce((s, i) => s + (i.amount || 0), 0)
    monthlyRevenue.push({ month: monthName, revenue: rev })
  }
  const maxMonthlyRev = Math.max(...monthlyRevenue.map((m) => m.revenue), 1)

  const statCards = [
    { label: 'Total Bookings', value: stats.total, icon: Calendar, color: 'text-blue-600 bg-blue-50' },
    { label: 'Completed Rate', value: `${stats.completedRate}%`, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
    { label: 'Cancellation Rate', value: `${stats.cancelRate}%`, icon: XCircle, color: 'text-red-600 bg-red-50' },
    { label: 'Total Revenue', value: formatCurrency(stats.revenue), icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
    { label: 'Avg Booking Value', value: formatCurrency(stats.avgValue), icon: Star, color: 'text-amber-600 bg-amber-50' },
  ]

  const exportPDF = () => {
    const rows = bookings.map((b) => [b.booking_number, b.service_name, b.status, formatDate(b.scheduled_date), formatCurrency(b.amount)])
    generateReportPDF('Bookings Report', ['Booking #', 'Service', 'Status', 'Date', 'Amount'], rows, [
      { label: 'Total Bookings', value: String(stats.total) },
      { label: 'Completed Rate', value: `${stats.completedRate}%` },
      { label: 'Cancellation Rate', value: `${stats.cancelRate}%` },
      { label: 'Total Revenue', value: formatCurrency(stats.revenue) },
      { label: 'Avg Booking Value', value: formatCurrency(stats.avgValue) },
    ])
  }

  const exportCSV = () => {
    const rows = bookings.map((b) => [b.booking_number, b.service_name, b.status, b.scheduled_date, b.amount])
    exportToCSV('bookings-report', ['Booking #', 'Service', 'Status', 'Date', 'Amount'], rows)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1><p className="text-gray-600">Platform performance overview</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportPDF}><Download className="mr-2 h-4 w-4" />Export PDF</Button>
          <Button variant="outline" onClick={exportCSV}><Download className="mr-2 h-4 w-4" />Export CSV</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label}><CardContent className="flex items-center gap-3 p-4">
              <div className={cn('rounded-lg p-3', s.color)}><Icon className="h-6 w-6" /></div>
              <div><p className="text-xs text-gray-600">{s.label}</p><p className="text-lg font-bold text-gray-900">{s.value}</p></div>
            </CardContent></Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Bookings by Status</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <Badge color={BOOKING_STATUS_COLORS[status]}>{status.replace(/_/g, ' ')}</Badge>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${(count / maxStatusCount) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Revenue by Month (Last 6 Months)</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monthlyRevenue.map((m) => (
                <div key={m.month} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{m.month}</span>
                    <span className="font-medium text-gray-900">{formatCurrency(m.revenue)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-green-500" style={{ width: `${(m.revenue / maxMonthlyRev) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Top Services</CardTitle></CardHeader>
          <CardContent>
            {topServices.length === 0 ? <p className="text-center text-gray-500">No data available.</p> : (
              <div className="space-y-2">
                {topServices.map(([service, count], i) => (
                  <div key={service} className="flex items-center justify-between rounded-lg border border-gray-100 p-2">
                    <div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">{i + 1}</span><span className="text-sm font-medium">{service}</span></div>
                    <Badge color="bg-blue-50 text-blue-700">{count} bookings</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Top Technicians</CardTitle></CardHeader>
          <CardContent>
            {topTechs.length === 0 ? <p className="text-center text-gray-500">No data available.</p> : (
              <div className="space-y-2">
                {topTechs.map(([techId, count], i) => {
                  const tech = techMap[techId]
                  return (
                    <div key={techId} className="flex items-center justify-between rounded-lg border border-gray-100 p-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">{i + 1}</span>
                        <Wrench className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium">{tech?.name || 'Unknown'}</span>
                      </div>
                      <Badge color="bg-purple-50 text-purple-700">{count} jobs</Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
