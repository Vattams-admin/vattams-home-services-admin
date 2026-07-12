import { useEffect, useState } from 'react'
import { TrendingUp, Download, FileText, Calendar, CheckCircle, XCircle, IndianRupee } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Booking, Profile, Invoice, RevenueTransaction } from '@/lib/supabase'
import { cn, formatCurrency, BOOKING_STATUS_COLORS } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/LoadingScreen'
import { generateReportPDF, exportToCSV } from '@/lib/pdf'

export function AdminReportsPage() {
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [transactions, setTransactions] = useState<RevenueTransaction[]>([])

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: bkData } = await supabase.from('bookings').select('*').order('created_at', { ascending: false })
      const { data: profData } = await supabase.from('profiles').select('*')
      const { data: invData } = await supabase.from('invoices').select('*')
      const { data: revData } = await supabase.from('revenue_transactions').select('*')
      if (!mounted) return
      setBookings((bkData || []) as Booking[])
      const profMap: Record<string, Profile> = {}
      ;(profData || []).forEach((p) => { profMap[(p as Profile).id] = p as Profile })
      setProfiles(profMap)
      setInvoices((invData || []) as Invoice[])
      setTransactions((revData || []) as RevenueTransaction[])
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  const totalBookings = bookings.length
  const completedBookings = bookings.filter((b) => b.status === 'completed').length
  const cancelledBookings = bookings.filter((b) => b.status === 'cancelled').length
  const completedRate = totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0
  const cancellationRate = totalBookings > 0 ? Math.round((cancelledBookings / totalBookings) * 100) : 0
  const totalRevenue = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const avgBookingValue = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0

  const statusCounts: Record<string, number> = {}
  bookings.forEach((b) => { statusCounts[b.status] = (statusCounts[b.status] || 0) + 1 })
  const statusBreakdown = Object.entries(statusCounts).sort((a, b) => b[1] - a[1])
  const maxStatusCount = Math.max(...statusBreakdown.map((s) => s[1]), 1)

  const serviceCounts: Record<string, number> = {}
  bookings.forEach((b) => { serviceCounts[b.service_name] = (serviceCounts[b.service_name] || 0) + 1 })
  const topServices = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const techCounts: Record<string, number> = {}
  bookings.filter((b) => b.technician_id && b.status === 'completed').forEach((b) => { if (b.technician_id) techCounts[b.technician_id] = (techCounts[b.technician_id] || 0) + 1 })
  const topTechs = Object.entries(techCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const monthlyRevenue: { month: string; amount: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i)
    const monthName = d.toLocaleDateString('en-IN', { month: 'short' })
    const amount = invoices.filter((inv) => { const id = new Date(inv.created_at); return id.getMonth() === d.getMonth() && id.getFullYear() === d.getFullYear() && inv.status === 'paid' }).reduce((s, inv) => s + inv.amount, 0)
    monthlyRevenue.push({ month: monthName, amount })
  }
  const maxMonthlyRev = Math.max(...monthlyRevenue.map((m) => m.amount), 1)

  const handleExportPDF = () => {
    const headers = ['Metric', 'Value']
    const rows = [
      ['Total Bookings', String(totalBookings)], ['Completed Bookings', String(completedBookings)],
      ['Cancelled Bookings', String(cancelledBookings)], ['Completion Rate', `${completedRate}%`],
      ['Cancellation Rate', `${cancellationRate}%`], ['Total Revenue', formatCurrency(totalRevenue)],
      ['Avg Booking Value', formatCurrency(avgBookingValue)],
      ...topServices.map(([s, c]) => [`Service: ${s}`, String(c)]),
      ...topTechs.map(([t, c]) => [`Tech: ${profiles[t]?.name || t}`, String(c)]),
    ]
    generateReportPDF('Admin Report', headers, rows)
  }

  const handleExportCSV = () => {
    const headers = ['Booking #', 'Service', 'Customer', 'Technician', 'Status', 'Amount', 'Date']
    const rows = bookings.map((b) => [b.booking_number, b.service_name, profiles[b.customer_id]?.name || '-', b.technician_id ? profiles[b.technician_id]?.name || '-' : 'Unassigned', b.status, b.amount, b.scheduled_date])
    exportToCSV('bookings-report', headers, rows)
  }

  if (loading) return <LoadingScreen message="Loading reports..." />

  const statCards = [
    { label: 'Total Bookings', value: totalBookings, icon: Calendar, color: 'text-blue-600 bg-blue-100' },
    { label: 'Completed Rate', value: `${completedRate}%`, icon: CheckCircle, color: 'text-green-600 bg-green-100' },
    { label: 'Cancellation Rate', value: `${cancellationRate}%`, icon: XCircle, color: 'text-red-600 bg-red-100' },
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: IndianRupee, color: 'text-indigo-600 bg-indigo-100' },
    { label: 'Avg Booking Value', value: formatCurrency(avgBookingValue), icon: TrendingUp, color: 'text-purple-600 bg-purple-100' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1><p className="text-sm text-gray-500">Platform performance overview</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPDF}><FileText className="mr-2 h-4 w-4" />Export PDF</Button>
          <Button variant="outline" onClick={handleExportCSV}><Download className="mr-2 h-4 w-4" />Export CSV</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 py-4">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', s.color)}><s.icon className="h-5 w-5" /></div>
              <div><p className="text-lg font-bold text-gray-900">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Bookings by Status</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statusBreakdown.map(([status, count]) => (
                <div key={status}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2"><Badge color={BOOKING_STATUS_COLORS[status]}>{status.replace(/_/g, ' ')}</Badge></span>
                    <span className="font-semibold">{count}</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
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
            <div className="flex items-end justify-between gap-2 h-48">
              {monthlyRevenue.map((m) => (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-xs font-semibold text-gray-700">{formatCurrency(m.amount)}</span>
                  <div className="flex w-full items-end justify-center" style={{ height: '100%' }}>
                    <div className="w-full max-w-[3rem] rounded-t bg-indigo-500 transition-all" style={{ height: `${(m.amount / maxMonthlyRev) * 100}%`, minHeight: m.amount > 0 ? '4px' : '0' }} />
                  </div>
                  <span className="text-xs text-gray-500">{m.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Top Services</CardTitle></CardHeader>
          <CardContent>
            {topServices.length === 0 ? <p className="text-gray-500">No data.</p> : (
              <div className="space-y-2">
                {topServices.map(([service, count], i) => (
                  <div key={service} className="flex items-center justify-between rounded-lg border border-gray-200 p-2">
                    <span className="text-sm font-medium text-gray-700">{i + 1}. {service}</span>
                    <Badge color="bg-blue-100 text-blue-700">{count} bookings</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Top Technicians</CardTitle></CardHeader>
          <CardContent>
            {topTechs.length === 0 ? <p className="text-gray-500">No data.</p> : (
              <div className="space-y-2">
                {topTechs.map(([techId, count], i) => (
                  <div key={techId} className="flex items-center justify-between rounded-lg border border-gray-200 p-2">
                    <span className="text-sm font-medium text-gray-700">{i + 1}. {profiles[techId]?.name || 'Unknown'}</span>
                    <Badge color="bg-green-100 text-green-700">{count} jobs</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
