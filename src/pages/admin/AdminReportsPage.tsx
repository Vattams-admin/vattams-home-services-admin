import { useEffect, useState } from 'react'
import { Download, FileText, Calendar, CheckCircle, XCircle, TrendingUp, DollarSign } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Booking, Profile, Invoice, RevenueTransaction } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/LoadingScreen'
import { generateReportPDF, exportToCSV } from '@/lib/pdf'
import { formatCurrency, formatDate, BOOKING_STATUS_COLORS } from '@/lib/utils'

export function AdminReportsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [transactions, setTransactions] = useState<RevenueTransaction[]>([])

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: bks } = await supabase.from('bookings').select('*').order('created_at', { ascending: false })
      const { data: profs } = await supabase.from('profiles').select('*')
      const { data: invs } = await supabase.from('invoices').select('*')
      const { data: txns } = await supabase.from('revenue_transactions').select('*')
      if (mounted) { setBookings((bks as Booking[]) || []); setProfiles((profs as Profile[]) || []); setInvoices((invs as Invoice[]) || []); setTransactions((txns as RevenueTransaction[]) || []); setLoading(false) }
    })()
    return () => { mounted = false }
  }, [])

  if (loading) return <LoadingScreen message="Loading reports..." />

  const totalBookings = bookings.length
  const completed = bookings.filter((b) => b.status === 'completed').length
  const cancelled = bookings.filter((b) => b.status === 'cancelled').length
  const completedRate = totalBookings > 0 ? ((completed / totalBookings) * 100).toFixed(1) : '0'
  const cancelRate = totalBookings > 0 ? ((cancelled / totalBookings) * 100).toFixed(1) : '0'
  const totalRevenue = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const avgValue = bookings.length > 0 ? bookings.reduce((s, b) => s + b.amount, 0) / bookings.length : 0

  const stats = [
    { label: 'Total Bookings', value: totalBookings, icon: Calendar, color: 'text-blue-600 bg-blue-50' },
    { label: 'Completed Rate', value: `${completedRate}%`, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
    { label: 'Cancellation Rate', value: `${cancelRate}%`, icon: XCircle, color: 'text-red-600 bg-red-50' },
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
    { label: 'Avg Booking Value', value: formatCurrency(avgValue), icon: DollarSign, color: 'text-amber-600 bg-amber-50' },
  ]

  const statusCounts: Record<string, number> = {}
  bookings.forEach((b) => { statusCounts[b.status] = (statusCounts[b.status] || 0) + 1 })
  const maxStatusCount = Math.max(...Object.values(statusCounts), 1)

  const serviceCounts: Record<string, number> = {}
  bookings.forEach((b) => { serviceCounts[b.service_name] = (serviceCounts[b.service_name] || 0) + 1 })
  const topServices = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const techCounts: Record<string, { name: string; count: number }> = {}
  bookings.filter((b) => b.technician_id).forEach((b) => {
    const tech = profiles.find((p) => p.id === b.technician_id)
    if (tech) { if (!techCounts[b.technician_id!]) techCounts[b.technician_id!] = { name: tech.name, count: 0 }; techCounts[b.technician_id!].count++ }
  })
  const topTechs = Object.entries(techCounts).sort((a, b) => b[1].count - a[1].count).slice(0, 5)

  const monthlyRev: { month: string; amount: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i)
    const monthName = d.toLocaleString('en-IN', { month: 'short' })
    const amount = invoices.filter((inv) => { const id = new Date(inv.created_at); return id.getMonth() === d.getMonth() && id.getFullYear() === d.getFullYear() && inv.status === 'paid' }).reduce((s, inv) => s + inv.amount, 0)
    monthlyRev.push({ month: monthName, amount })
  }
  const maxMonthlyRev = Math.max(...monthlyRev.map((m) => m.amount), 1)

  const exportPDF = () => {
    const rows = bookings.map((b) => [b.booking_number, b.service_name, b.status, formatCurrency(b.amount), formatDate(b.created_at)])
    generateReportPDF('Bookings Report', ['Booking #', 'Service', 'Status', 'Amount', 'Date'], rows, stats.map((s) => ({ label: s.label, value: String(s.value) })))
    toast('PDF exported', 'success')
  }

  const exportCSV = () => {
    const rows = bookings.map((b) => [b.booking_number, b.service_name, b.status, b.amount, b.created_at])
    exportToCSV('bookings-report', ['Booking #', 'Service', 'Status', 'Amount', 'Date'], rows)
    toast('CSV exported', 'success')
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportPDF}><FileText className="mr-2 h-4 w-4" /> PDF</Button>
          <Button variant="outline" onClick={exportCSV}><Download className="mr-2 h-4 w-4" /> CSV</Button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => { const Icon = s.icon; return (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`rounded-lg p-2.5 ${s.color}`}><Icon className="h-5 w-5" /></div>
              <div><p className="text-xs text-gray-600">{s.label}</p><p className="text-lg font-bold text-gray-900">{s.value}</p></div>
            </CardContent>
          </Card>
        )})}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Bookings by Status</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <Badge color={BOOKING_STATUS_COLORS[status]}>{status.replace(/_/g, ' ')}</Badge>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-gray-100"><div className="h-2.5 rounded-full bg-blue-500" style={{ width: `${(count / maxStatusCount) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Revenue by Month (Last 6 Months)</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monthlyRev.map((m) => (
                <div key={m.month}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-gray-700">{m.month}</span>
                    <span className="font-medium text-gray-900">{formatCurrency(m.amount)}</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-gray-100"><div className="h-2.5 rounded-full bg-green-500" style={{ width: `${(m.amount / maxMonthlyRev) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Top Services</CardTitle></CardHeader>
          <CardContent>
            {topServices.length === 0 ? <p className="text-center text-gray-500">No data.</p> : (
              <div className="space-y-2">
                {topServices.map(([service, count], i) => (
                  <div key={service} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                    <div className="flex items-center gap-2"><span className="text-sm font-bold text-gray-400">#{i + 1}</span><span className="text-sm font-medium text-gray-900">{service}</span></div>
                    <Badge color="bg-blue-100 text-blue-700">{count} bookings</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Top Technicians</CardTitle></CardHeader>
          <CardContent>
            {topTechs.length === 0 ? <p className="text-center text-gray-500">No data.</p> : (
              <div className="space-y-2">
                {topTechs.map(([id, data], i) => (
                  <div key={id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                    <div className="flex items-center gap-2"><span className="text-sm font-bold text-gray-400">#{i + 1}</span><span className="text-sm font-medium text-gray-900">{data.name}</span></div>
                    <Badge color="bg-green-100 text-green-700">{data.count} jobs</Badge>
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
