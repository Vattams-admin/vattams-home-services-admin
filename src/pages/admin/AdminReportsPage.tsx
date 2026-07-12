import { useEffect, useState, useCallback } from 'react'
import { FileText, Download, Loader as Loader2, Calendar, IndianRupee, Wrench, Users, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  supabase,
  type Booking,
  type Invoice,
  type Profile,
  type Review,
} from '@/lib/supabase'
import { cn, formatDate, formatCurrency, BOOKING_STATUS_COLORS } from '@/lib/utils'
import { generateReportPDF, exportToCSV } from '@/lib/pdf'
import { useToast } from '@/hooks/use-toast'

type ReportType = 'bookings' | 'revenue' | 'technician_performance'

type TechPerformance = {
  technician: Profile
  totalJobs: number
  completedJobs: number
  cancelledJobs: number
  totalEarnings: number
  avgRating: number
  ratingCount: number
}

export default function AdminReportsPage() {
  const toast = useToast()

  const [reportType, setReportType] = useState<ReportType>('bookings')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)

  const [bookings, setBookings] = useState<Booking[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [techPerformance, setTechPerformance] = useState<TechPerformance[]>([])

  const generateReport = useCallback(async () => {
    setLoading(true)
    try {
      const start = startDate
        ? new Date(startDate).toISOString()
        : new Date(0).toISOString()
      const end = endDate
        ? new Date(endDate + 'T23:59:59').toISOString()
        : new Date().toISOString()

      if (reportType === 'bookings') {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .gte('created_at', start)
          .lte('created_at', end)
          .order('created_at', { ascending: false })

        if (error) throw error
        setBookings((data as Booking[]) || [])
      } else if (reportType === 'revenue') {
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .gte('created_at', start)
          .lte('created_at', end)
          .order('created_at', { ascending: false })

        if (error) throw error
        setInvoices((data as Invoice[]) || [])
      } else if (reportType === 'technician_performance') {
        const [techsRes, bookingsRes, reviewsRes, walletsRes] =
          await Promise.all([
            supabase
              .from('profiles')
              .select('*')
              .eq('role', 'technician')
              .order('name', { ascending: true }),
            supabase
              .from('bookings')
              .select('technician_id, status, amount')
              .gte('created_at', start)
              .lte('created_at', end),
            supabase.from('reviews').select('technician_id, rating'),
            supabase
              .from('technician_wallets')
              .select('technician_id, total_earnings'),
          ])

        const techs = (techsRes.data as Profile[]) || []
        const allBookings =
          (bookingsRes.data as {
            technician_id: string
            status: string
            amount: number
          }[]) || []
        const reviews = (reviewsRes.data as Review[]) || []
        const wallets =
          (walletsRes.data as {
            technician_id: string
            total_earnings: number
          }[]) || []

        const walletMap = new Map<string, number>()
        wallets.forEach((w) =>
          walletMap.set(w.technician_id, w.total_earnings),
        )

        const reviewMap = new Map<string, { sum: number; count: number }>()
        reviews.forEach((r) => {
          const cur = reviewMap.get(r.technician_id) || { sum: 0, count: 0 }
          cur.sum += Number(r.rating)
          cur.count += 1
          reviewMap.set(r.technician_id, cur)
        })

        const performance: TechPerformance[] = techs.map((tech) => {
          const techBookings = allBookings.filter(
            (b) => b.technician_id === tech.id,
          )
          const completed = techBookings.filter(
            (b) => b.status === 'completed',
          )
          const cancelled = techBookings.filter(
            (b) => b.status === 'cancelled',
          )
          const review = reviewMap.get(tech.id)
          return {
            technician: tech,
            totalJobs: techBookings.length,
            completedJobs: completed.length,
            cancelledJobs: cancelled.length,
            totalEarnings: walletMap.get(tech.id) || 0,
            avgRating: review ? review.sum / review.count : 0,
            ratingCount: review?.count || 0,
          }
        })

        setTechPerformance(
          performance.sort((a, b) => b.totalJobs - a.totalJobs),
        )
      }

      toast.success('Report generated successfully')
    } catch {
      toast.error('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }, [reportType, startDate, endDate, toast])

  useEffect(() => {
    generateReport()
  }, [generateReport])

  function exportPDF() {
    if (reportType === 'bookings') {
      if (bookings.length === 0) {
        toast.warning('No data to export')
        return
      }
      const headers = [
        'Booking No',
        'Service',
        'City',
        'Date',
        'Amount',
        'Status',
      ]
      const rows = bookings.map((b) => [
        b.booking_number,
        b.service_name,
        b.city,
        formatDate(b.scheduled_date),
        formatCurrency(b.amount),
        b.status,
      ])
      generateReportPDF('Bookings Report', headers, rows)
    } else if (reportType === 'revenue') {
      if (invoices.length === 0) {
        toast.warning('No data to export')
        return
      }
      const headers = [
        'Invoice No',
        'Service',
        'Amount',
        'Status',
        'Method',
        'Date',
      ]
      const rows = invoices.map((i) => [
        i.invoice_number,
        i.service_name,
        formatCurrency(i.amount),
        i.status,
        i.payment_method || '-',
        formatDate(i.created_at),
      ])
      generateReportPDF('Revenue Report', headers, rows)
    } else {
      if (techPerformance.length === 0) {
        toast.warning('No data to export')
        return
      }
      const headers = [
        'Technician',
        'Total Jobs',
        'Completed',
        'Cancelled',
        'Earnings',
        'Rating',
      ]
      const rows = techPerformance.map((t) => [
        t.technician.name,
        t.totalJobs,
        t.completedJobs,
        t.cancelledJobs,
        formatCurrency(t.totalEarnings),
        t.avgRating ? t.avgRating.toFixed(1) : 'N/A',
      ])
      generateReportPDF('Technician Performance Report', headers, rows)
    }
    toast.success('PDF exported')
  }

  function exportCSV() {
    if (reportType === 'bookings') {
      if (bookings.length === 0) {
        toast.warning('No data to export')
        return
      }
      const headers = [
        'Booking No',
        'Service',
        'City',
        'Date',
        'Amount',
        'Status',
      ]
      const rows = bookings.map((b) => [
        b.booking_number,
        b.service_name,
        b.city,
        b.scheduled_date,
        b.amount,
        b.status,
      ])
      exportToCSV('bookings-report', headers, rows)
    } else if (reportType === 'revenue') {
      if (invoices.length === 0) {
        toast.warning('No data to export')
        return
      }
      const headers = [
        'Invoice No',
        'Service',
        'Amount',
        'Status',
        'Method',
        'Date',
      ]
      const rows = invoices.map((i) => [
        i.invoice_number,
        i.service_name,
        i.amount,
        i.status,
        i.payment_method || '-',
        i.created_at,
      ])
      exportToCSV('revenue-report', headers, rows)
    } else {
      if (techPerformance.length === 0) {
        toast.warning('No data to export')
        return
      }
      const headers = [
        'Technician',
        'Total Jobs',
        'Completed',
        'Cancelled',
        'Earnings',
        'Rating',
      ]
      const rows = techPerformance.map((t) => [
        t.technician.name,
        t.totalJobs,
        t.completedJobs,
        t.cancelledJobs,
        t.totalEarnings,
        t.avgRating ? t.avgRating.toFixed(1) : 'N/A',
      ])
      exportToCSV('technician-performance', headers, rows)
    }
    toast.success('CSV exported')
  }

  const reportTypes = [
    {
      value: 'bookings',
      label: 'Bookings Report',
      icon: Calendar,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      value: 'revenue',
      label: 'Revenue Report',
      icon: IndianRupee,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      value: 'technician_performance',
      label: 'Technician Performance',
      icon: Wrench,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="mt-1 text-sm text-slate-500">
          Generate and export platform reports
        </p>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {reportTypes.map((rt) => {
          const Icon = rt.icon
          return (
            <button
              key={rt.value}
              onClick={() => setReportType(rt.value as ReportType)}
              className={cn(
                'flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-colors',
                reportType === rt.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 bg-white hover:bg-slate-50',
              )}
            >
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg',
                  rt.bg,
                )}
              >
                <Icon className={cn('h-5 w-5', rt.color)} />
              </div>
              <span
                className={cn(
                  'text-sm font-medium',
                  reportType === rt.value
                    ? 'text-blue-900'
                    : 'text-slate-700',
                )}
              >
                {rt.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Date Filters */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end">
          <div className="space-y-1.5">
            <Label>Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setStartDate(e.target.value)}
              className="sm:w-48"
            />
          </div>
          <div className="space-y-1.5">
            <Label>End Date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setEndDate(e.target.value)}
              className="sm:w-48"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={generateReport} loading={loading}>
              Generate
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export Buttons */}
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={exportPDF}>
          <Download className="mr-1 h-4 w-4" /> Export PDF
        </Button>
        <Button variant="outline" onClick={exportCSV}>
          <Download className="mr-1 h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Report Data */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : reportType === 'bookings' ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Bookings Report</CardTitle>
            <Badge color="gray">{bookings.length} records</Badge>
          </CardHeader>
          <CardContent className="p-0">
            {bookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-10 w-10 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">No bookings found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        Booking No
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        Service
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        City
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookings.slice(0, 50).map((booking) => (
                      <tr key={booking.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {booking.booking_number}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {booking.service_name}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {booking.city}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {formatDate(booking.scheduled_date)}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {formatCurrency(booking.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={cn(
                              'capitalize',
                              BOOKING_STATUS_COLORS[booking.status] ||
                                'bg-gray-100 text-gray-700',
                            )}
                          >
                            {booking.status.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : reportType === 'revenue' ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Revenue Report</CardTitle>
            <Badge color="gray">
              {invoices.length} records ·{' '}
              {formatCurrency(
                invoices
                  .filter((i) => i.status === 'paid')
                  .reduce((sum, i) => sum + Number(i.amount), 0),
              )}
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            {invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <IndianRupee className="h-10 w-10 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">
                  No invoices found
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        Invoice No
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        Service
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        Method
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.slice(0, 50).map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {inv.invoice_number}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {inv.service_name}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {formatCurrency(inv.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            color={
                              inv.status === 'paid'
                                ? 'green'
                                : inv.status === 'failed'
                                  ? 'red'
                                  : 'amber'
                            }
                          >
                            {inv.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {inv.payment_method || '-'}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {formatDate(inv.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Technician Performance Report</CardTitle>
            <Badge color="gray">{techPerformance.length} technicians</Badge>
          </CardHeader>
          <CardContent className="p-0">
            {techPerformance.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-10 w-10 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">
                  No technicians found
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        Technician
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        Total Jobs
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        Completed
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        Cancelled
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        Earnings
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        Rating
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {techPerformance.map((tp) => (
                      <tr key={tp.technician.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">
                            {tp.technician.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {tp.technician.mobile}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge color="blue">{tp.totalJobs}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge color="green">{tp.completedJobs}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            color={tp.cancelledJobs > 0 ? 'red' : 'gray'}
                          >
                            {tp.cancelledJobs}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {formatCurrency(tp.totalEarnings)}
                        </td>
                        <td className="px-4 py-3">
                          {tp.avgRating > 0 ? (
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4 text-amber-500" />
                              <span className="font-medium text-slate-900">
                                {tp.avgRating.toFixed(1)}
                              </span>
                              <span className="text-xs text-slate-400">
                                ({tp.ratingCount})
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
