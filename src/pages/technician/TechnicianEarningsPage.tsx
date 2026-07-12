import { useEffect, useState } from 'react'
import { Download, Eye, TrendingUp, Calendar, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Invoice, Booking, Profile, Settings } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { LoadingScreen } from '@/components/LoadingScreen'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { formatDate, formatCurrency } from '@/lib/utils'
import { generateInvoicePDF } from '@/lib/pdf'

type InvoiceWithBooking = Invoice & { booking?: Booking | null }

export function TechnicianEarningsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<InvoiceWithBooking[]>([])
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, pending: 0 })
  const [selected, setSelected] = useState<InvoiceWithBooking | null>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!profile) return
    let mounted = true;
    (async () => {
      const { data: inv } = await supabase
        .from('invoices').select('*').eq('technician_id', profile.id).order('created_at', { ascending: false })
      if (!mounted || !inv) return
      const all = inv as Invoice[]
      const bookingIds = [...new Set(all.map((i) => i.booking_id))]
      const bookings: Record<string, Booking> = {}
      if (bookingIds.length) {
        const { data: bk } = await supabase.from('bookings').select('*').in('id', bookingIds)
        ;(bk || []).forEach((b) => { bookings[b.id] = b as Booking })
      }
      const enriched = all.map((i) => ({ ...i, booking: bookings[i.booking_id] }))
      const paid = all.filter((i) => i.status === 'paid')
      const total = paid.reduce((s, i) => s + Number(i.amount), 0)
      const now = new Date()
      const thisMonth = paid.filter((i) => {
        const d = new Date(i.created_at)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      }).reduce((s, i) => s + Number(i.amount), 0)
      const pending = all.filter((i) => i.status === 'pending').reduce((s, i) => s + Number(i.amount), 0)
      if (mounted) { setInvoices(enriched); setStats({ total, thisMonth, pending }); setLoading(false) }
    })()
    return () => { mounted = false }
  }, [profile])

  if (loading) return <LoadingScreen />

  const handleDownload = async (inv: InvoiceWithBooking) => {
    setDownloading(true)
    try {
      const { data: settings } = await supabase.from('settings').select('*').maybeSingle()
      const { data: cust } = inv.booking?.customer_id
        ? await supabase.from('profiles').select('*').eq('id', inv.booking.customer_id).maybeSingle()
        : { data: null }
      await generateInvoicePDF(inv, inv.booking || null, cust as Profile | null, profile, settings as Settings | null)
      toast('Invoice downloaded', 'success')
    } catch {
      toast('Failed to generate PDF', 'error')
    }
    setDownloading(false)
  }

  const statusColor = (s: string) => s === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'

  const cards = [
    { label: 'Total Earnings', value: formatCurrency(stats.total), icon: TrendingUp, color: 'text-green-600 bg-green-50' },
    { label: 'This Month', value: formatCurrency(stats.thisMonth), icon: Calendar, color: 'text-blue-600 bg-blue-50' },
    { label: 'Pending Payments', value: formatCurrency(stats.pending), icon: Clock, color: 'text-amber-600 bg-amber-50' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Earnings & Invoices</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${s.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{s.label}</p>
                  <p className="text-xl font-bold text-gray-900">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No invoices yet. Your earnings will appear here after completing jobs.</div>
          ) : (
            <div className="space-y-3">
              {invoices.map((inv) => (
                <div key={inv.id} className="flex flex-col gap-3 rounded-lg border border-gray-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{inv.invoice_number}</p>
                      <Badge color={statusColor(inv.status)}>{inv.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {inv.booking?.service_name || 'Service'} · {formatDate(inv.created_at)}
                      {inv.paid_at && ` · Paid on ${formatDate(inv.paid_at)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{formatCurrency(Number(inv.amount))}</span>
                    <Button variant="outline" size="sm" onClick={() => setSelected(inv)}><Eye className="mr-1 h-4 w-4" />View</Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownload(inv)}><Download className="mr-1 h-4 w-4" />PDF</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Invoice Details">
        {selected && (
          <div className="space-y-3 text-sm">
            <Row label="Invoice No." value={selected.invoice_number} />
            <Row label="Service" value={selected.service_name || selected.booking?.service_name || '—'} />
            <Row label="Booking No." value={selected.booking?.booking_number || '—'} />
            <Row label="Status" value={<Badge color={statusColor(selected.status)}>{selected.status}</Badge>} />
            <Row label="Amount" value={formatCurrency(Number(selected.amount))} />
            <Row label="GST (18%)" value={formatCurrency(Math.round(Number(selected.amount) * 0.18))} />
            <Row label="Total" value={formatCurrency(Number(selected.amount) + Math.round(Number(selected.amount) * 0.18))} />
            <Row label="Payment Method" value={selected.payment_method || '—'} />
            <Row label="Created" value={formatDate(selected.created_at)} />
            {selected.paid_at && <Row label="Paid On" value={formatDate(selected.paid_at)} />}
            <div className="pt-2">
              <Button onClick={() => handleDownload(selected)} disabled={downloading} className="w-full">
                <Download className="mr-2 h-4 w-4" />{downloading ? 'Generating...' : 'Download PDF'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex justify-between gap-4"><span className="text-gray-500">{label}</span><span className="text-right font-medium text-gray-900">{value}</span></div>
}
