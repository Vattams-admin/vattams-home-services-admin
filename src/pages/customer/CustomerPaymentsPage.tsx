import { useEffect, useState } from 'react'
import { Download, Eye, IndianRupee, Clock, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Invoice, Booking, Profile, Settings } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { LoadingScreen } from '@/components/LoadingScreen'
import { cn, formatDate, formatCurrency } from '@/lib/utils'
import { generateInvoicePDF } from '@/lib/pdf'

const statusColors: Record<string, string> = {
  paid: 'bg-green-100 text-green-700', pending: 'bg-amber-100 text-amber-700', failed: 'bg-red-100 text-red-700',
}

export function CustomerPaymentsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [stats, setStats] = useState({ paid: 0, pending: 0 })
  const [selected, setSelected] = useState<Invoice | null>(null)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [technician, setTechnician] = useState<Profile | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [payModal, setPayModal] = useState<Invoice | null>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!profile) return
    let mounted = true;
    (async () => {
      const { data: invs } = await supabase.from('invoices').select('*').eq('customer_id', profile.id).order('created_at', { ascending: false })
      const { data: settingsData } = await supabase.from('settings').select('*').maybeSingle()
      if (!mounted) return
      const invoiceList = (invs || []) as Invoice[]
      setInvoices(invoiceList)
      setSettings(settingsData as Settings | null)
      const paid = invoiceList.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
      const pending = invoiceList.filter((i) => i.status === 'pending').reduce((s, i) => s + i.amount, 0)
      setStats({ paid, pending })
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [profile])

  const viewInvoice = async (inv: Invoice) => {
    setSelected(inv)
    setBooking(null); setTechnician(null)
    const { data: bk } = await supabase.from('bookings').select('*').eq('id', inv.booking_id).maybeSingle()
    if (bk) { setBooking(bk as Booking); if ((bk as Booking).technician_id) { const { data: tech } = await supabase.from('profiles').select('*').eq('id', (bk as Booking).technician_id as string).maybeSingle(); setTechnician(tech as Profile | null) } }
  }

  const handleDownload = async (inv: Invoice) => {
    setDownloading(true)
    try { await generateInvoicePDF(inv, booking, profile, technician, settings); toast('Invoice downloaded', 'success') }
    catch { toast('Failed to download invoice', 'error') }
    setDownloading(false)
  }

  if (loading) return <LoadingScreen message="Loading payments..." />
  if (!profile) return null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Payments</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card><CardContent className="flex items-center gap-4 py-4"><div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600"><CheckCircle className="h-6 w-6" /></div><div><p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.paid)}</p><p className="text-sm text-gray-500">Total Paid</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 py-4"><div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 text-amber-600"><Clock className="h-6 w-6" /></div><div><p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.pending)}</p><p className="text-sm text-gray-500">Total Pending</p></div></CardContent></Card>
      </div>

      {invoices.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><p className="text-gray-500">No invoices found.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => (
            <Card key={inv.id}>
              <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-gray-400">#{inv.invoice_number}</span>
                    <p className="font-medium text-gray-900">{inv.service_name}</p>
                    <Badge color={statusColors[inv.status] || 'bg-gray-100 text-gray-700'}>{inv.status}</Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                    <span className="font-semibold text-gray-700">{formatCurrency(inv.amount)}</span>
                    {inv.paid_at && <span>Paid: {formatDate(inv.paid_at)}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => viewInvoice(inv)}><Eye className="mr-1 h-4 w-4" />View</Button>
                  {inv.status === 'pending' && <Button size="sm" onClick={() => setPayModal(inv)}><IndianRupee className="mr-1 h-4 w-4" />Pay</Button>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Invoice #${selected?.invoice_number || ''}`}>
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-gray-500">Service</p><p className="font-medium">{selected.service_name}</p></div>
              <div><p className="text-gray-500">Status</p><Badge color={statusColors[selected.status]}>{selected.status}</Badge></div>
              <div><p className="text-gray-500">Amount</p><p className="font-medium">{formatCurrency(selected.amount)}</p></div>
              <div><p className="text-gray-500">Payment Method</p><p className="font-medium">{selected.payment_method || '-'}</p></div>
              <div><p className="text-gray-500">Created</p><p className="font-medium">{formatDate(selected.created_at)}</p></div>
              {selected.paid_at && <div><p className="text-gray-500">Paid On</p><p className="font-medium">{formatDate(selected.paid_at)}</p></div>}
              {booking && <div className="col-span-2"><p className="text-gray-500">Booking</p><p className="font-medium">#{booking.booking_number} - {booking.service_name}</p></div>}
            </div>
            <div className="flex justify-end border-t pt-4">
              <Button onClick={() => handleDownload(selected)} disabled={downloading}><Download className="mr-2 h-4 w-4" />{downloading ? 'Generating...' : 'Download PDF'}</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!payModal} onClose={() => setPayModal(null)} title="Payment Options">
        {payModal && (
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-4 text-center">
              <p className="text-sm text-gray-500">Amount to Pay</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(payModal.amount)}</p>
            </div>
            <p className="text-center text-sm text-gray-500">UPI payment and other payment methods will be available soon. Please contact support for payment assistance.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPayModal(null)}>Close</Button>
              <a href={`tel:+918189800757`}><Button variant="outline">Call Support</Button></a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
