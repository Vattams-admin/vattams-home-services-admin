import { useEffect, useState } from 'react'
import { Eye, TrendingUp, CheckCircle, Clock, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Invoice, Profile, Settings } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { LoadingScreen } from '@/components/LoadingScreen'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'

export function AdminPaymentsPage() {
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [customers, setCustomers] = useState<Record<string, Profile>>({})
  const [technicians, setTechnicians] = useState<Record<string, Profile>>({})
  const [settings, setSettings] = useState<Settings | null>(null)
  const [viewInv, setViewInv] = useState<Invoice | null>(null)

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: invs } = await supabase.from('invoices').select('*').order('created_at', { ascending: false })
      const { data: profs } = await supabase.from('profiles').select('*')
      const { data: settings } = await supabase.from('settings').select('*').eq('id', 1).maybeSingle()
      const cMap: Record<string, Profile> = {}; const tMap: Record<string, Profile> = {}
      ;(profs as Profile[] || []).forEach((p) => { if (p.role === 'customer') cMap[p.id] = p; if (p.role === 'technician') tMap[p.id] = p })
      if (mounted) { setInvoices((invs as Invoice[]) || []); setCustomers(cMap); setTechnicians(tMap); setSettings(settings as Settings); setLoading(false) }
    })()
    return () => { mounted = false }
  }, [])

  if (loading) return <LoadingScreen message="Loading payments..." />

  const totalRev = invoices.reduce((s, i) => s + i.amount, 0)
  const totalPaid = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const totalPending = invoices.filter((i) => i.status === 'pending' || i.status === 'unpaid').reduce((s, i) => s + i.amount, 0)
  const now = new Date(); const thisMonth = invoices.filter((i) => { const d = new Date(i.created_at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() }).reduce((s, i) => s + i.amount, 0)

  const stats = [
    { label: 'Total Revenue', value: formatCurrency(totalRev), icon: TrendingUp, color: 'text-green-600 bg-green-50' },
    { label: 'Total Paid', value: formatCurrency(totalPaid), icon: CheckCircle, color: 'text-blue-600 bg-blue-50' },
    { label: 'Total Pending', value: formatCurrency(totalPending), icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: 'This Month', value: formatCurrency(thisMonth), icon: Calendar, color: 'text-purple-600 bg-purple-50' },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Payments</h1>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => { const Icon = s.icon; return (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`rounded-lg p-2.5 ${s.color}`}><Icon className="h-5 w-5" /></div>
              <div><p className="text-xs text-gray-600">{s.label}</p><p className="text-lg font-bold text-gray-900">{s.value}</p></div>
            </CardContent>
          </Card>
        )})}
      </div>

      <Card>
        <CardHeader><CardTitle>Invoices ({invoices.length})</CardTitle></CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="py-8 text-center text-gray-500">No invoices found.</p>
          ) : (
            <div className="space-y-3">
              {invoices.map((inv) => {
                const cust = customers[inv.customer_id]; const tech = inv.technician_id ? technicians[inv.technician_id] : null
                return (
                  <div key={inv.id} className="flex flex-col gap-3 rounded-lg border border-gray-100 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{settings?.invoice_prefix || 'VAT'}-{inv.invoice_number}</p>
                      <p className="text-sm text-gray-500">{inv.service_name} • {cust?.name || 'N/A'}</p>
                      {tech && <p className="text-xs text-gray-400">Tech: {tech.name}</p>}
                      <p className="text-xs text-gray-400">{formatDate(inv.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(inv.amount)}</span>
                      <Badge color={inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>{inv.status}</Badge>
                      <Button size="sm" variant="outline" onClick={() => setViewInv(inv)}><Eye className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={!!viewInv} onClose={() => setViewInv(null)} title="Invoice Details">
        {viewInv && (
          <div className="space-y-2">
            <p><span className="font-medium">Invoice #:</span> {settings?.invoice_prefix || 'VAT'}-{viewInv.invoice_number}</p>
            <p><span className="font-medium">Service:</span> {viewInv.service_name}</p>
            <p><span className="font-medium">Customer:</span> {customers[viewInv.customer_id]?.name || 'N/A'}</p>
            <p><span className="font-medium">Technician:</span> {viewInv.technician_id ? technicians[viewInv.technician_id]?.name || 'N/A' : 'N/A'}</p>
            <p><span className="font-medium">Amount:</span> {formatCurrency(viewInv.amount)}</p>
            <p><span className="font-medium">Status:</span> {viewInv.status}</p>
            <p><span className="font-medium">Payment Method:</span> {viewInv.payment_method || 'N/A'}</p>
            <p><span className="font-medium">Paid At:</span> {viewInv.paid_at ? formatDateTime(viewInv.paid_at) : 'N/A'}</p>
            <p><span className="font-medium">Created:</span> {formatDateTime(viewInv.created_at)}</p>
          </div>
        )}
      </Modal>
    </div>
  )
}
