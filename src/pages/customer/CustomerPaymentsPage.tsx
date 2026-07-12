import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Invoice, Booking, Profile, Settings } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { cn, formatDate, formatCurrency } from '@/lib/utils'
import { generateInvoicePDF } from '@/lib/pdf'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { LoadingScreen } from '@/components/LoadingScreen'
import { CreditCard, CheckCircle, Download, Eye, Smartphone } from 'lucide-react'

const INVOICE_STATUS_COLORS: Record<string, string> = {
  paid: 'bg-green-100 text-green-700', pending: 'bg-amber-100 text-amber-700', overdue: 'bg-red-100 text-red-700',
}

export function CustomerPaymentsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [stats, setStats] = useState({ paid: 0, pending: 0 })
  const [selected, setSelected] = useState<Invoice | null>(null)
  const [payInvoice, setPayInvoice] = useState<Invoice | null>(null)
  const [bookingMap, setBookingMap] = useState<Record<string, Booking>>({})
  const [settings, setSettings] = useState<Settings | null>(null)

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!profile) return
      const { data } = await supabase.from('invoices').select('*').eq('customer_id', profile.id).order('created_at', { ascending: false })
      if (!mounted || !data) return
      setInvoices(data as Invoice[])
      const paid = data.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
      const pending = data.filter((i) => i.status === 'pending').reduce((s, i) => s + i.amount, 0)
      if (mounted) setStats({ paid, pending })
      const bookingIds = [...new Set(data.map((i) => i.booking_id))]
      if (bookingIds.length) {
        const { data: bks } = await supabase.from('bookings').select('*').in('id', bookingIds)
        if (mounted && bks) {
          const m: Record<string, Booking> = {}
          bks.forEach((b) => { m[b.id] = b as Booking })
          setBookingMap(m)
        }
      }
      const { data: s } = await supabase.from('settings').select('*').limit(1).maybeSingle()
      if (mounted && s) setSettings(s as Settings)
      if (mounted) setLoading(false)
    })()
    return () => { mounted = false }
  }, [profile])

  const handleDownload = async (inv: Invoice) => {
    const booking = bookingMap[inv.booking_id] || null
    await generateInvoicePDF(inv, booking, profile, null, settings)
    toast('Invoice downloaded', 'success')
  }

  if (loading) return <LoadingScreen message="Loading payments..." />

  const statCards = [
    { label: 'Total Paid', value: formatCurrency(stats.paid), icon: CheckCircle, color: 'text-green-600 bg-green-50' },
    { label: 'Total Pending', value: formatCurrency(stats.pending), icon: CreditCard, color: 'text-amber-600 bg-amber-50' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Payments & Invoices</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {statCards.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className={cn('rounded-lg p-3', s.color)}><Icon className="h-6 w-6" /></div>
                <div><p className="text-sm text-gray-600">{s.label}</p><p className="text-xl font-bold text-gray-900">{s.value}</p></div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader><CardTitle>Invoices</CardTitle></CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="py-8 text-center text-gray-500">No invoices found.</p>
          ) : (
            <div className="space-y-3">
              {invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                  <div className="space-y-1">
                    <p className="font-medium text-gray-900">{inv.service_name}</p>
                    <p className="text-sm text-gray-500">#{inv.invoice_number} · {formatDate(inv.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900">{formatCurrency(inv.amount)}</span>
                    <Badge color={INVOICE_STATUS_COLORS[inv.status]}>{inv.status}</Badge>
                    <Button size="sm" variant="outline" onClick={() => setSelected(inv)}><Eye className="h-4 w-4" /></Button>
                    <Button size="sm" variant="outline" onClick={() => handleDownload(inv)}><Download className="h-4 w-4" /></Button>
                    {inv.status === 'pending' && <Button size="sm" onClick={() => setPayInvoice(inv)}>Pay</Button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Invoice Details">
        {selected && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p className="text-gray-500">Invoice #</p><p className="text-gray-900">{selected.invoice_number}</p>
              <p className="text-gray-500">Service</p><p className="text-gray-900">{selected.service_name}</p>
              <p className="text-gray-500">Amount</p><p className="text-gray-900">{formatCurrency(selected.amount)}</p>
              <p className="text-gray-500">Status</p><Badge color={INVOICE_STATUS_COLORS[selected.status]}>{selected.status}</Badge>
              <p className="text-gray-500">Payment Method</p><p className="text-gray-900">{selected.payment_method || '-'}</p>
              <p className="text-gray-500">Paid At</p><p className="text-gray-900">{selected.paid_at ? formatDate(selected.paid_at) : '-'}</p>
              <p className="text-gray-500">Created</p><p className="text-gray-900">{formatDate(selected.created_at)}</p>
            </div>
            <Button className="w-full" variant="outline" onClick={() => handleDownload(selected)}><Download className="mr-2 h-4 w-4" />Download PDF</Button>
          </div>
        )}
      </Modal>

      <Modal open={!!payInvoice} onClose={() => setPayInvoice(null)} title="Make Payment">
        {payInvoice && (
          <div className="space-y-4 text-center">
            <p className="text-gray-600">Amount Due: <span className="font-bold text-gray-900">{formatCurrency(payInvoice.amount)}</span></p>
            <div className="rounded-lg border border-gray-200 p-4">
              <Smartphone className="mx-auto mb-2 h-8 w-8 text-blue-600" />
              <p className="text-sm font-medium text-gray-900">UPI Payment</p>
              <p className="text-sm text-gray-500">Scan the QR code in your invoice PDF or use UPI ID: {settings?.upi_id || 'vattams@upi'}</p>
            </div>
            <Button className="w-full" onClick={() => { toast('Payment link sent to your registered mobile', 'info'); setPayInvoice(null) }}>
              I've Paid / Send Confirmation
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
