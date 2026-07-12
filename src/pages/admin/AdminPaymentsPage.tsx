import { useEffect, useState, useCallback } from 'react'
import {
  CreditCard,
  Eye,
  Loader2,
  Search,
  Filter,
  IndianRupee,
  FileText,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/ui/modal'
import {
  supabase,
  type Invoice,
  type Booking,
  type Profile,
} from '@/lib/supabase'
import { cn, formatDate, formatCurrency } from '@/lib/utils'
import { generateInvoicePDF } from '@/lib/pdf'
import { useToast } from '@/hooks/use-toast'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Payment Statuses' },
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
]

type InvoiceWithDetails = Invoice & {
  customer?: Pick<Profile, 'id' | 'name' | 'mobile'>
  technician?: Pick<Profile, 'id' | 'name'> | null
  booking?: Pick<Booking, 'id' | 'booking_number' | 'service_name' | 'address' | 'city' | 'scheduled_date'> | null
}

export default function AdminPaymentsPage() {
  const toast = useToast()

  const [invoices, setInvoices] = useState<InvoiceWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [selectedInvoice, setSelectedInvoice] =
    useState<InvoiceWithDetails | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [updating, setUpdating] = useState(false)

  // Stats
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingPayments: 0,
    totalTransactions: 0,
    failedPayments: 0,
  })

  const loadInvoices = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('invoices')
        .select(
          '*, customer:profiles!invoices_customer_id_fkey(id, name, mobile), technician:profiles!invoices_technician_id_fkey(id, name), booking:bookings!invoices_booking_id_fkey(id, booking_number, service_name, address, city, scheduled_date)',
        )
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query
      if (error) throw error

      let result = (data as InvoiceWithDetails[]) || []

      if (search.trim()) {
        const q = search.toLowerCase()
        result = result.filter(
          (inv) =>
            inv.invoice_number?.toLowerCase().includes(q) ||
            inv.service_name?.toLowerCase().includes(q) ||
            inv.customer?.name?.toLowerCase().includes(q) ||
            inv.booking?.booking_number?.toLowerCase().includes(q),
        )
      }

      setInvoices(result)

      // Calculate stats
      const allInvoices = result
      const totalRevenue = allInvoices
        .filter((i) => i.status === 'paid')
        .reduce((sum, i) => sum + Number(i.amount), 0)
      const pending = allInvoices.filter(
        (i) => i.status === 'pending' || i.status === 'unpaid',
      ).length
      const failed = allInvoices.filter(
        (i) => i.status === 'failed',
      ).length

      setStats({
        totalRevenue,
        pendingPayments: pending,
        totalTransactions: allInvoices.length,
        failedPayments: failed,
      })
    } catch {
      toast.error('Failed to load payments')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search, toast])

  useEffect(() => {
    loadInvoices()
  }, [loadInvoices])

  async function viewInvoice(invoice: InvoiceWithDetails) {
    setSelectedInvoice(invoice)
    setModalLoading(true)
    try {
      // Fetch full booking details if not already loaded
      if (!invoice.booking && invoice.booking_id) {
        const { data: booking } = await supabase
          .from('bookings')
          .select('id, booking_number, service_name, address, city, scheduled_date')
          .eq('id', invoice.booking_id)
          .maybeSingle()
        if (booking) {
          setSelectedInvoice({ ...invoice, booking: booking as Booking })
        }
      }
    } catch {
      // ignore
    } finally {
      setModalLoading(false)
    }
  }

  async function updatePaymentStatus(invoiceId: string, newStatus: string) {
    setUpdating(true)
    try {
      const updateData: Record<string, unknown> = {
        status: newStatus,
      }
      if (newStatus === 'paid') {
        updateData.paid_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', invoiceId)

      if (error) throw error

      toast.success('Payment status updated')
      await loadInvoices()
      setSelectedInvoice(null)
    } catch {
      toast.error('Failed to update payment status')
    } finally {
      setUpdating(false)
    }
  }

  async function downloadInvoice(invoice: InvoiceWithDetails) {
    try {
      let booking: Booking | null = null
      if (invoice.booking_id) {
        const { data } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', invoice.booking_id)
          .maybeSingle()
        booking = (data as Booking) || null
      }

      const { data: settings } = await supabase
        .from('settings')
        .select('upi_id')
        .maybeSingle()

      await generateInvoicePDF(
        invoice,
        booking,
        (settings as { upi_id?: string } | null)?.upi_id || 'vattams@upi',
      )
      toast.success('Invoice downloaded')
    } catch {
      toast.error('Failed to download invoice')
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  const statCards = [
    {
      label: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: IndianRupee,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Pending Payments',
      value: stats.pendingPayments,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Total Transactions',
      value: stats.totalTransactions,
      icon: CreditCard,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Failed Payments',
      value: stats.failedPayments,
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage payment transactions and invoices
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 p-5">
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-lg',
                    stat.bg,
                  )}
                >
                  <Icon className={cn('h-6 w-6', stat.color)} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {stat.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label>Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by invoice no, customer, service..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-1.5 sm:w-56">
            <Label>
              <span className="flex items-center gap-1">
                <Filter className="h-3 w-3" /> Payment Status
              </span>
            </Label>
            <Select
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setStatusFilter(e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      {invoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CreditCard className="h-12 w-12 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-500">
              No invoices found
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Invoice
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Service
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Method
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Date
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {invoice.invoice_number}
                        </div>
                        {invoice.booking?.booking_number && (
                          <div className="text-xs text-slate-500">
                            Booking: {invoice.booking.booking_number}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-900">
                          {invoice.customer?.name || 'N/A'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {invoice.customer?.mobile || ''}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {invoice.service_name}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {invoice.payment_method || 'N/A'}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {formatCurrency(invoice.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          color={
                            invoice.status === 'paid'
                              ? 'green'
                              : invoice.status === 'failed'
                                ? 'red'
                                : invoice.status === 'refunded'
                                  ? 'purple'
                                  : 'amber'
                          }
                        >
                          {invoice.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatDate(invoice.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewInvoice(invoice)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadInvoice(invoice)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <Modal
          title="Invoice Details"
          onClose={() => setSelectedInvoice(null)}
          className="max-w-2xl"
        >
          {modalLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="space-y-5">
              {/* Invoice Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {selectedInvoice.invoice_number}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {selectedInvoice.service_name}
                  </p>
                </div>
                <Badge
                  color={
                    selectedInvoice.status === 'paid'
                      ? 'green'
                      : selectedInvoice.status === 'failed'
                        ? 'red'
                        : selectedInvoice.status === 'refunded'
                          ? 'purple'
                          : 'amber'
                  }
                >
                  {selectedInvoice.status}
                </Badge>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
                    Customer
                  </p>
                  <p className="text-sm font-medium text-slate-900">
                    {selectedInvoice.customer?.name || 'N/A'}
                  </p>
                  <p className="text-sm text-slate-600">
                    {selectedInvoice.customer?.mobile || 'N/A'}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
                    Technician
                  </p>
                  <p className="text-sm font-medium text-slate-900">
                    {selectedInvoice.technician?.name || 'Not assigned'}
                  </p>
                </div>
              </div>

              {/* Payment Details */}
              <div className="space-y-3 rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Amount</span>
                  <span className="text-lg font-bold text-slate-900">
                    {formatCurrency(selectedInvoice.amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Payment Method</span>
                  <span className="text-sm font-medium text-slate-900">
                    {selectedInvoice.payment_method || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Created</span>
                  <span className="text-sm text-slate-900">
                    {formatDate(selectedInvoice.created_at)}
                  </span>
                </div>
                {selectedInvoice.paid_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Paid At</span>
                    <span className="text-sm text-slate-900">
                      {formatDate(selectedInvoice.paid_at)}
                    </span>
                  </div>
                )}
              </div>

              {/* Booking Info */}
              {selectedInvoice.booking && (
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
                    Booking Details
                  </p>
                  <p className="text-sm font-medium text-slate-900">
                    {selectedInvoice.booking.booking_number}
                  </p>
                  <p className="text-sm text-slate-600">
                    {selectedInvoice.booking.address},{' '}
                    {selectedInvoice.booking.city}
                  </p>
                  <p className="text-xs text-slate-500">
                    Scheduled: {formatDate(selectedInvoice.booking.scheduled_date)}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
                <Button
                  onClick={() => downloadInvoice(selectedInvoice)}
                  variant="outline"
                >
                  <Download className="mr-1 h-4 w-4" /> Download PDF
                </Button>
                {selectedInvoice.status !== 'paid' && (
                  <Button
                    onClick={() =>
                      updatePaymentStatus(selectedInvoice.id, 'paid')
                    }
                    disabled={updating}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="mr-1 h-4 w-4" /> Mark as Paid
                  </Button>
                )}
                {selectedInvoice.status === 'paid' && (
                  <Button
                    onClick={() =>
                      updatePaymentStatus(selectedInvoice.id, 'refunded')
                    }
                    disabled={updating}
                    variant="outline"
                  >
                    Mark as Refunded
                  </Button>
                )}
                {selectedInvoice.status !== 'failed' && (
                  <Button
                    onClick={() =>
                      updatePaymentStatus(selectedInvoice.id, 'failed')
                    }
                    disabled={updating}
                    variant="danger"
                  >
                    <XCircle className="mr-1 h-4 w-4" /> Mark as Failed
                  </Button>
                )}
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
