import { useEffect, useState } from 'react'
import {
  CreditCard,
  Download,
  Loader2,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/input'
import { useAuth } from '@/lib/auth'
import { supabase, type Invoice, type Booking, type Settings } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { cn, formatDate, formatCurrency } from '@/lib/utils'
import { generateInvoicePDF } from '@/lib/pdf'

const STATUS_FILTERS = [
  { value: 'all', label: 'All Payments' },
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'unpaid', label: 'Unpaid' },
]

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  unpaid: 'bg-red-100 text-red-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-blue-100 text-blue-700',
}

const PAYMENT_STATUS_ICONS: Record<string, typeof CheckCircle2> = {
  paid: CheckCircle2,
  pending: Clock,
  unpaid: AlertCircle,
  failed: AlertCircle,
  refunded: CreditCard,
}

export default function CustomerPaymentsPage() {
  const { profile, session } = useAuth()
  const toast = useToast()

  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [bookings, setBookings] = useState<Record<string, Booking>>({})
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')

  const userId = profile?.id || session?.user?.id

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    async function load() {
      try {
        const [invRes, setRes] = await Promise.all([
          supabase
            .from('invoices')
            .select('*')
            .eq('customer_id', userId)
            .order('created_at', { ascending: false }),
          supabase.from('settings').select('*').maybeSingle(),
        ])
        if (cancelled) return

        const allInvoices = (invRes.data as Invoice[]) || []
        setInvoices(allInvoices)
        setSettings((setRes.data as Settings) || null)

        // Fetch related bookings
        const bookingIds = Array.from(new Set(allInvoices.map((i) => i.booking_id).filter(Boolean)))
        if (bookingIds.length > 0) {
          const { data: bookingData } = await supabase
            .from('bookings')
            .select('*')
            .in('id', bookingIds)
          if (bookingData) {
            const map: Record<string, Booking> = {}
            ;(bookingData as Booking[]).forEach((b) => {
              map[b.id] = b
            })
            setBookings(map)
          }
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [userId])

  const handleDownload = async (invoice: Invoice) => {
    setDownloading(invoice.id)
    try {
      const booking = invoice.booking_id ? bookings[invoice.booking_id] : null
      await generateInvoicePDF(invoice, booking, settings?.upi_id || '')
      toast.success('Invoice downloaded', `Invoice ${invoice.invoice_number} has been downloaded.`)
    } catch {
      toast.error('Download failed', 'Could not generate the invoice PDF.')
    } finally {
      setDownloading(null)
    }
  }

  const filteredInvoices = invoices.filter((i) => {
    if (statusFilter === 'all') return true
    return i.status === statusFilter
  })

  const totalPaid = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0)
  const totalPending = invoices
    .filter((i) => i.status === 'pending' || i.status === 'unpaid')
    .reduce((s, i) => s + Number(i.amount), 0)

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payments & Invoices</h1>
        <p className="mt-1 text-sm text-slate-500">View and manage your payment history and invoices.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-50">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Paid</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalPaid)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Pending Payments</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalPending)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-slate-400" />
        <Select value={statusFilter} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setStatusFilter(e.target.value)} className="w-48">
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Invoices List */}
      {filteredInvoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CreditCard className="h-12 w-12 text-slate-300" />
            <p className="mt-3 text-lg font-medium text-slate-700">
              {invoices.length === 0 ? 'No invoices yet' : 'No invoices match your filter'}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {invoices.length === 0
                ? 'Invoices will appear here after you book a service.'
                : 'Try a different filter.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map((invoice) => {
            const StatusIcon = PAYMENT_STATUS_ICONS[invoice.status] || Clock
            const booking = invoice.booking_id ? bookings[invoice.booking_id] : null
            return (
              <Card key={invoice.id}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                      <FileText className="h-6 w-6 text-slate-600" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">{invoice.invoice_number}</p>
                        <Badge className={cn('capitalize', PAYMENT_STATUS_COLORS[invoice.status] || 'bg-gray-100 text-gray-700')}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {invoice.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">{invoice.service_name}</p>
                      <div className="flex flex-wrap items-center gap-x-4 text-xs text-slate-500">
                        <span>{formatDate(invoice.created_at)}</span>
                        {booking && <span>Booking: #{booking.booking_number}</span>}
                        {invoice.paid_at && <span>Paid: {formatDate(invoice.paid_at)}</span>}
                        {invoice.payment_method && <span className="capitalize">via {invoice.payment_method}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                    <p className="text-lg font-bold text-slate-900">{formatCurrency(Number(invoice.amount))}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(invoice)}
                      disabled={downloading === invoice.id}
                    >
                      {downloading === invoice.id ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      ) : (
                        <Download className="mr-1 h-3 w-3" />
                      )}
                      Invoice
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
