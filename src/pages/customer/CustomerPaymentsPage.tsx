import { useEffect, useState } from 'react'
import { Download, Eye, CreditCard, CheckCircle, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Invoice, Booking, Profile, Settings } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { LoadingScreen } from '@/components/LoadingScreen'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { formatDate, formatCurrency, cn } from '@/lib/utils'
import { generateInvoicePDF } from '@/lib/pdf'
import { whatsappSupportLink } from '@/lib/constants'

type InvoiceWithBooking = Invoice & { booking?: Booking | null }

export function CustomerPaymentsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<InvoiceWithBooking[]>([])
  const [stats, setStats] = useState({ paid: 0, pending: 0 })
  const [selected, setSelected] = useState<InvoiceWithBooking | null>(null)
  const [paying, setPaying] = useState<InvoiceWithBooking | null>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!profile) return
    let mounted = true;
    (async () => {
      const { data: inv } = await supabase
        .from('invoices').select('*').eq('customer_id', profile.id).order('created_at', { ascending: false })
      if (!mounted || !inv) return
      const all = inv as Invoice[]
      const bookingIds = [...new Set(all.map((i) => i.booking_id))]
      const bookings: Record<string, Booking> = {}
      if (bookingIds.length) {
        const { data: bk } = await supabase.from('bookings').select('*').in('id', bookingIds)
        ;(bk || []).forEach((b) => { bookings[b.id] = b as Booking })
      }
      const enriched = all.map((i) => ({ ...i, booking: bookings[i.booking_id] }))
      const paid = all.filter((i) => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0)
      const pending = all.filter((i) => i.status === 'pending').reduce((s, i) => s + Number(i.amount), 0)
      if (mounted) { setInvoices(enriched); setStats({ paid, pending }); setLoading(false) }
    })()
    return () => { mounted = false }
  }, [profile])

  if (loading) return <LoadingScreen />

  const handleDownload = async (inv: InvoiceWithBooking) => {
    setDownloading(true)
    try {
      const { data: settings } = await supabase.from('settings').select('*').maybeSingle()
      const { data: tech } = inv.booking?.technician_id
        ? await supabase.from('profiles').select('*').eq('id', inv.booking.technician_id).maybeSingle()
        : { data: null }
      await generateInvoicePDF(inv, inv.booking || null, profile, tech as Profile | null, settings as Settings | null)
      toast('Invoice downloaded', 'success')
    } catch {
      toast('Failed to generate PDF', 'error')
    }
    setDownloading(false)
  }

  const statusColor = (s: string) => s === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Payments & Invoices</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-50">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div><p className="text-sm text-gray-600">Total Paid</p><p className="text-xl font-bold text-gray-900">{formatCurrency(stats.paid)}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div><p className="text-sm text-gray-600">Total Pending</p><p className="text-xl font-bold text-gray-900">{formatCurrency(stats.pending)}</p></div>
          </CardContent>
        </Card>
      </div>

      {invoices.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-gray-500">No invoices yet.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => (
            <Card key={inv.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{inv.invoice_number}</p>
                    <Badge color={statusColor(inv.status)}>{inv.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {inv.service_name} · {formatDate(inv.created_at)}
                    {inv.paid_at && ` · Paid on ${formatDate(inv.paid_at)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{formatCurrency(Number(inv.amount))}</span>
                  <Button variant="outline" size="sm" onClick={() => setSelected(inv)}><Eye className="mr-1 h-4 w-4" />View</Button>
                  {inv.status === 'pending' && (
                    <Button size="sm" onClick={() => setPaying(inv)}><CreditCard className="mr-1 h-4 w-4" />Pay</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Invoice Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Invoice Details">
        {selected && (
          <div className="space-y-3 text-sm">
            <Row label="Invoice No." value={selected.invoice_number} />
            <Row label="Service" value={selected.service_name} />
            <Row label="Status" value={<Badge color={statusColor(selected.status)}>{selected.status}</Badge>} />
            <Row label="Amount" value={formatCurrency(Number(selected.amount))} />
            <Row label="Payment Method" value={selected.payment_method || '—'} />
            <Row label="Created" value={formatDate(selected.created_at)} />
            {selected.paid_at && <Row label="Paid On" value={formatDate(selected.paid_at)} />}
            {selected.booking && <Row label="Booking No." value={selected.booking.booking_number} />}
            <div className="pt-2">
              <Button onClick={() => handleDownload(selected)} disabled={downloading} className="w-full">
                <Download className="mr-2 h-4 w-4" />{downloading ? 'Generating...' : 'Download PDF'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Pay Modal */}
      <Modal open={!!paying} onClose={() => setPaying(null)} title="Make Payment">
        {paying && (
          <div className="space-y-4 text-center">
            <p className="text-sm text-gray-600">Invoice <span className="font-semibold">{paying.invoice_number}</span></p>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(Number(paying.amount))}</p>
            <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
              <p className="font-medium">UPI Payment</p>
              <p className="mt-1">Click below to contact us on WhatsApp for payment assistance. Our team will share the UPI payment link.</p>
            </div>
            <a href={whatsappSupportLink(`I want to pay invoice ${paying.invoice_number} for ${formatCurrency(Number(paying.amount))}.`)} target="_blank" rel="noreferrer">
              <Button className="w-full"><CreditCard className="mr-2 h-4 w-4" />Pay via WhatsApp</Button>
            </a>
            <p className="text-xs text-gray-400">You'll be redirected to WhatsApp to complete the payment.</p>
          </div>
        )}
      </Modal>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex justify-between gap-4"><span className="text-gray-500">{label}</span><span className="text-right font-medium text-gray-900">{value}</span></div>
}
