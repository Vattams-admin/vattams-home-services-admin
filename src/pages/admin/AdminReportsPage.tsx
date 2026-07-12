import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Booking, Profile, Invoice, RevenueTransaction } from '@/lib/supabase'
import { cn, formatDate, formatCurrency, BOOKING_STATUS_COLORS } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/LoadingScreen'
import { generateReportPDF, exportToCSV } from '@/lib/pdf'
import { Calendar, CheckCircle, XCircle, IndianRupee, TrendingUp, FileText, Download } from 'lucide-react'

export function AdminReportsPage() {
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [transactions, setTransactions] = useState<RevenueTransaction[]>([])

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [{ data: bks }, { data: prs }, { data: invs }, { data: txns }] = await Promise.all([
        supabase.from('bookings').select('*'),
        supabase.from('profiles').select('*'),
        supabase.from('invoices').select('*'),
        supabase.from('revenue_transactions').select('*'),
      ])
      if (!mounted) return
      setBookings((bks || []) as Booking[])
      setProfiles(Object.fromEntries(((prs || []) as Profile[]).map((p) => [p.id, p])))
      setInvoices((invs || []) as Invoice[])
      setTransactions((txns || []) as RevenueTransaction[])
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  const total = bookings.length
  const completed = bookings.filter((b) => b.status === 'completed').length
  const cancelled = bookings.filter((b) => b.status === 'cancelled').length
  const completedRate = total > 0 ? Math.round((completed / total) * 100) : 0
  const cancelRate = total > 0 ? Math.round((cancelled / total) * 100) : 0
  const totalRevenue = invoices.reduce((s, i) => s + i.amount, 0)
  const avgValue = total > 0 ? Math.round(bookings.reduce((s, b) => s + b.amount, 0) / total) : 0

  const byStatus: Record<string, number> = {}
  bookings.forEach((b) => { byStatus[b.status] = (byStatus[b.status] || 0) + 1 })
  const maxStatus = Math.max(...Object.values(byStatus), 1)

  const serviceCount: Record<string, number> = {}
  bookings.forEach((b) => { serviceCount[b.service_name] = (serviceCount[b.service_name] || 0) + 1 })
  const topServices = Object.entries(serviceCount).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const techCount: Record<string, number> = {}
  bookings.filter((b) => b.technician_id && b.status === 'completed').forEach((b) => { techCount[b.technician_id!] = (techCount[b.technician_id!] || 0) + 1 })
  const topTechs = Object.entries(techCount).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const months: { label: string; revenue: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i)
    const m = d.getMonth(); const y = d.getFullYear()
    const rev = invoices.filter((inv) => { const id = new Date(inv.created_at); return id.getMonth() === m && id.getFullYear() === y }).reduce((s, inv) => s + inv.amount, 0)
    months.push({ label: d.toLocaleString('en-IN', { month: 'short' }), revenue: rev })
  }
  const maxMonth = Math.max(...months.map((m) => m.revenue), 1)

  if (loading) return <LoadingScreen message="Loading reports..." />

  const cards = [
    { label: 'Total Bookings', value: total, icon: Calendar, color: 'text-blue-600 bg-blue-50' },
    { label: 'Completed Rate', value: `${completedRate}%`, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
    { label: 'Cancellation Rate', value: `${cancelRate}%`, icon: XCircle, color: 'text-red-600 bg-red-50' },
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: IndianRupee, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Avg Booking Value', value: formatCurrency(avgValue), icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
  ]

  const exportPDF = () => {
    const rows = bookings.map((b) => [b.booking_number, b.service_name, profiles[b.customer_id]?.name || '-', b.status, formatDate(b.created_at), b.amount])
    generateReportPDF('Bookings Report', ['Booking #', 'Service', 'Customer', 'Status', 'Date', 'Amount'], rows, [
      { label: 'Total Bookings', value: String(total) }, { label: 'Completed', value: String(completed) },
      { label: 'Cancelled', value: String(cancelled) }, { label: 'Total Revenue', value: formatCurrency(totalRevenue) },
    ])
  }
  const exportCSV = () => {
    const rows = bookings.map((b) => [b.booking_number, b.service_name, profiles[b.customer_id]?.name || '-', b.status, b.created_at, b.amount])
    exportToCSV('bookings-report', ['Booking #', 'Service', 'Customer', 'Status', 'Date', 'Amount'], rows)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={exportPDF}><FileText className="h-4 w-4 mr-1" />PDF</Button>
          <Button size="sm" variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-1" />CSV</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => { const Icon = c.icon; return (
          <Card key={c.label}><CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn('rounded-lg p-2.5', c.color)}><Icon className="h-5 w-5" /></div>
              <div><p className="text-xs text-gray-500">{c.label}</p><p className="text-lg font-bold text-gray-900">{c.value}</p></div>
            </div>
          </CardContent></Card>
        )})}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Bookings by Status</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(byStatus).map(([status, count]) => (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1"><span className="capitalize">{status.replace(/_/g, ' ')}</span><span>{count}</span></div>
                  <div className="h-3 w-full rounded bg-gray-100"><div className={cn('h-3 rounded', BOOKING_STATUS_COLORS[status])} style={{ width: `${(count / maxStatus) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Revenue by Month (Last 6)</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-48">
              {months.map((m) => (
                <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-blue-500 rounded-t" style={{ height: `${(m.revenue / maxMonth) * 100}%` }} />
                  <span className="text-xs text-gray-500">{m.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Top Services</CardTitle></CardHeader>
          <CardContent>
            {topServices.length === 0 ? <p className="text-gray-500 text-sm">No data.</p> : (
              <div className="space-y-2">
                {topServices.map(([s, c]) => (
                  <div key={s} className="flex items-center justify-between rounded-lg border p-2 text-sm"><span className="font-medium">{s}</span><Badge color="bg-blue-100 text-blue-700">{c} bookings</Badge></div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Top Technicians</CardTitle></CardHeader>
          <CardContent>
            {topTechs.length === 0 ? <p className="text-gray-500 text-sm">No data.</p> : (
              <div className="space-y-2">
                {topTechs.map(([id, c]) => (
                  <div key={id} className="flex items-center justify-between rounded-lg border p-2 text-sm"><span className="font-medium">{profiles[id]?.name || 'Unknown'}</span><Badge color="bg-green-100 text-green-700">{c} completed</Badge></div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
