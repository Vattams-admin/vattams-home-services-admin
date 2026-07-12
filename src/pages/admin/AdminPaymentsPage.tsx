import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Invoice, Profile, Settings } from '@/lib/supabase'
import { cn, formatDate, formatDateTime, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { LoadingScreen } from '@/components/LoadingScreen'
import { IndianRupee, CheckCircle, Clock, Calendar, Eye } from 'lucide-react'

export function AdminPaymentsPage() {
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [customers, setCustomers] = useState<Record<string, Profile>>({})
  const [techs, setTechs] = useState<Record<string, Profile>>({})
  const [settings, setSettings] = useState<Settings | null>(null)
  const [viewInv, setViewInv] = useState<Invoice | null>(null)

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: invs } = await supabase.from('invoices').select('*').order('created_at', { ascending: false })
      if (!mounted) return
      setInvoices((invs || []) as Invoice[])
      const cIds = [...new Set((invs || []).map((i) => i.customer_id))]
      const tIds = [...new Set((invs || []).map((i) => i.technician_id).filter(Boolean))] as string[]
      const [{ data: cs }, { data: ts }, { data: s }] = await Promise.all([
        cIds.length ? supabase.from('profiles').select('*').in('id', cIds) : Promise.resolve({ data: [] }),
        tIds.length ? supabase.from('profiles').select('*').in('id', tIds) : Promise.resolve({ data: [] }),
        supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
      ])
      if (!mounted) return
      setCustomers(Object.fromEntries(((cs || []) as Profile[]).map((c) => [c.id, c])))
      setTechs(Object.fromEntries(((ts || []) as Profile[]).map((t) => [t.id, t])))
      setSettings(s as Settings)
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  const totalRevenue = invoices.reduce((s, i) => s + i.amount, 0)
  const totalPaid = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const totalPending = invoices.filter((i) => i.status !== 'paid').reduce((s, i) => s + i.amount, 0)
  const now = new Date()
  const thisMonth = invoices.filter((i) => { const d = new Date(i.created_at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() }).reduce((s, i) => s + i.amount, 0)

  if (loading) return <LoadingScreen message="Loading payments..." />

  const cards = [
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: IndianRupee, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Total Paid', value: formatCurrency(totalPaid), icon: CheckCircle, color: 'text-green-600 bg-green-50' },
    { label: 'Total Pending', value: formatCurrency(totalPending), icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: 'This Month', value: formatCurrency(thisMonth), icon: Calendar, color: 'text-purple-600 bg-purple-50' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => { const Icon = c.icon; return (
          <Card key={c.label}><CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn('rounded-lg p-2.5', c.color)}><Icon className="h-5 w-5" /></div>
              <div><p className="text-sm text-gray-500">{c.label}</p><p className="text-xl font-bold text-gray-900">{c.value}</p></div>
            </div>
          </CardContent></Card>
        )})}
      </div>

      <Card>
        <CardHeader><CardTitle>Invoices ({invoices.length})</CardTitle></CardHeader>
        <CardContent>
          {invoices.length === 0 ? <p className="text-gray-500 text-sm">No invoices found.</p> : (
            <div className="space-y-2">
              {invoices.map((i) => (
                <div key={i.id} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{i.invoice_number}</p>
                    <p className="text-sm text-gray-500">Customer: {customers[i.customer_id]?.name || '-'} · Tech: {i.technician_id ? (techs[i.technician_id]?.name || '-') : '-'}</p>
                    <p className="text-xs text-gray-400">{formatDate(i.created_at)} · {formatCurrency(i.amount)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color={i.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>{i.status}</Badge>
                    <Button size="sm" variant="outline" onClick={() => setViewInv(i)}><Eye className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={!!viewInv} onClose={() => setViewInv(null)} title="Invoice Details">
        {viewInv && (
          <div className="space-y-1.5 text-sm">
            <p><span className="font-medium">Invoice #:</span> {viewInv.invoice_number}</p>
            <p><span className="font-medium">Customer:</span> {customers[viewInv.customer_id]?.name || '-'}</p>
            <p><span className="font-medium">Technician:</span> {viewInv.technician_id ? (techs[viewInv.technician_id]?.name || '-') : '-'}</p>
            <p><span className="font-medium">Amount:</span> {formatCurrency(viewInv.amount)}</p>
            <p><span className="font-medium">GST (18%):</span> {formatCurrency(Math.round(viewInv.amount * 0.18))}</p>
            <p><span className="font-medium">Total:</span> {formatCurrency(viewInv.amount + Math.round(viewInv.amount * 0.18))}</p>
            <p><span className="font-medium">Payment Method:</span> {viewInv.payment_method || '-'}</p>
            <p><span className="font-medium">Status:</span> <Badge color={viewInv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>{viewInv.status}</Badge></p>
            <p><span className="font-medium">Paid At:</span> {viewInv.paid_at ? formatDateTime(viewInv.paid_at) : '-'}</p>
            <p><span className="font-medium">Created:</span> {formatDateTime(viewInv.created_at)}</p>
          </div>
        )}
      </Modal>
    </div>
  )
}
