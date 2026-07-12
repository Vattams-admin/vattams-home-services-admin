import { useEffect, useState } from 'react'
import { CreditCard, Download, TrendingUp, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Invoice, Settings } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { LoadingScreen } from '@/components/LoadingScreen'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { generateInvoicePDF } from '@/lib/pdf'

const STATUS_COLORS: Record<string, string> = { paid: 'bg-green-100 text-green-700', pending: 'bg-amber-100 text-amber-700', overdue: 'bg-red-100 text-red-700' }

export function CustomerPaymentsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [selected, setSelected] = useState<Invoice | null>(null)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!profile) return
      const { data: inv } = await supabase.from('invoices').select('*').eq('customer_id', profile.id).order('created_at', { ascending: false })
      const { data: set } = await supabase.from('settings').select('*').limit(1).maybeSingle()
      if (mounted) { setInvoices((inv as Invoice[]) || []); setSettings(set as Settings); setLoading(false) }
    })()
    return () => { mounted = false }
  }, [profile])

  const totalPaid = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const totalPending = invoices.filter((i) => i.status !== 'paid').reduce((s, i) => s + i.amount, 0)

  const handleDownload = async (inv: Invoice) => {
    try { await generateInvoicePDF(inv, null, profile, null, settings); toast('Invoice downloaded', 'success') }
    catch { toast('Failed to download invoice', 'error') }
  }

  const handlePay = async (inv: Invoice) => {
    setPaying(true)
    const { error } = await supabase.from('invoices').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', inv.id)
    setPaying(false)
    if (error) { toast('Payment failed', 'error'); return }
    setInvoices((prev) => prev.map((i) => i.id === inv.id ? { ...i, status: 'paid', paid_at: new Date().toISOString() } : i))
    toast('Payment successful!', 'success')
    setSelected(null)
  }

  if (loading) return <LoadingScreen message="Loading payments..." />

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Payments</h1>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="rounded-lg bg-green-50 p-3"><TrendingUp className="h-6 w-6 text-green-600" /></div><div><p className="text-sm text-gray-600">Total Paid</p><p className="text-xl font-bold text-gray-900">{formatCurrency(totalPaid)}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="rounded-lg bg-amber-50 p-3"><Clock className="h-6 w-6 text-amber-600" /></div><div><p className="text-sm text-gray-600">Total Pending</p><p className="text-xl font-bold text-gray-900">{formatCurrency(totalPending)}</p></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Invoices</CardTitle></CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="py-8 text-center text-gray-500">No invoices found.</p>
          ) : (
            <div className="space-y-3">
              {invoices.map((inv) => (
                <div key={inv.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-100 p-3 hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">#{inv.invoice_number}</p>
                    <p className="text-sm text-gray-500">{inv.service_name}</p>
                    <p className="text-xs text-gray-400">{formatDateTime(inv.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-900">{formatCurrency(inv.amount)}</span>
                    <Badge color={STATUS_COLORS[inv.status] || 'bg-gray-100 text-gray-700'}>{inv.status}</Badge>
                    <Button size="sm" variant="outline" onClick={() => setSelected(inv)}>View</Button>
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
            <div><p className="text-sm text-gray-500">Invoice Number</p><p className="font-medium">#{selected.invoice_number}</p></div>
            <div><p className="text-sm text-gray-500">Service</p><p className="font-medium">{selected.service_name}</p></div>
            <div><p className="text-sm text-gray-500">Amount</p><p className="font-medium">{formatCurrency(selected.amount)}</p></div>
            <div><p className="text-sm text-gray-500">Status</p><Badge color={STATUS_COLORS[selected.status] || 'bg-gray-100 text-gray-700'}>{selected.status}</Badge></div>
            <div><p className="text-sm text-gray-500">Payment Method</p><p className="font-medium">{selected.payment_method || 'N/A'}</p></div>
            {selected.paid_at && <div><p className="text-sm text-gray-500">Paid At</p><p className="font-medium">{formatDateTime(selected.paid_at)}</p></div>}
            <div><p className="text-sm text-gray-500">Created</p><p className="font-medium">{formatDateTime(selected.created_at)}</p></div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => handleDownload(selected)}><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
              {selected.status !== 'paid' && <Button onClick={() => handlePay(selected)} disabled={paying}><CreditCard className="mr-2 h-4 w-4" /> {paying ? 'Processing...' : 'Pay Now'}</Button>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
