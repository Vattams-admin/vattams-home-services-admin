import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Invoice, Profile, Settings } from '@/lib/supabase'
import { cn, formatDate, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { LoadingScreen } from '@/components/LoadingScreen'
import { TrendingUp, CheckCircle, Clock, Calendar, Eye } from 'lucide-react'

export function AdminPaymentsPage() {
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [customers, setCustomers] = useState<Record<string, Profile>>({})
  const [techs, setTechs] = useState<Record<string, Profile>>({})
  const [settings, setSettings] = useState<Settings | null>(null)
  const [viewInv, setViewInv] = useState<Invoice | null>(null)
  const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0, thisMonth: 0 })

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: invs } = await supabase.from('invoices').select('*').order('created_at', { ascending: false })
      const { data: custs } = await supabase.from('profiles').select('*').eq('role', 'customer')
      const { data: tList } = await supabase.from('profiles').select('*').eq('role', 'technician')
      const { data: st } = await supabase.from('settings').select('*').eq('id', 1).maybeSingle()
      if (!mounted) return
      setInvoices((invs || []) as Invoice[])
      const cMap: Record<string, Profile> = {}; (custs || []).forEach((c) => { cMap[(c as Profile).id] = c as Profile }); setCustomers(cMap)
      const tMap: Record<string, Profile> = {}; (tList || []).forEach((t) => { tMap[(t as Profile).id] = t as Profile }); setTechs(tMap)
      setSettings(st as Settings | null)
      const invList = (invs || []) as Invoice[]
      const now = new Date()
      setStats({
        total: invList.reduce((s, i) => s + (i.amount || 0), 0),
        paid: invList.filter((i) => i.status === 'paid').reduce((s, i) => s + (i.amount || 0), 0),
        pending: invList.filter((i) => i.status !== 'paid').reduce((s, i) => s + (i.amount || 0), 0),
        thisMonth: invList.filter((i) => { const d = new Date(i.created_at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() }).reduce((s, i) => s + (i.amount || 0), 0),
      })
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  if (loading) return <LoadingScreen message="Loading payments..." />

  const statCards = [
    { label: 'Total Revenue', value: formatCurrency(stats.total), icon: TrendingUp, color: 'text-green-600 bg-green-50' },
    { label: 'Total Paid', value: formatCurrency(stats.paid), icon: CheckCircle, color: 'text-blue-600 bg-blue-50' },
    { label: 'Total Pending', value: formatCurrency(stats.pending), icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: 'This Month', value: formatCurrency(stats.thisMonth), icon: Calendar, color: 'text-purple-600 bg-purple-50' },
  ]

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Payments</h1><p className="text-gray-600">Manage invoices and payments</p></div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label}><CardContent className="flex items-center gap-3 p-4">
              <div className={cn('rounded-lg p-3', s.color)}><Icon className="h-6 w-6" /></div>
              <div><p className="text-sm text-gray-600">{s.label}</p><p className="text-lg font-bold text-gray-900">{s.value}</p></div>
            </CardContent></Card>
          )
        })}
      </div>

      <Card>
        <CardHeader><CardTitle>Invoices ({invoices.length})</CardTitle></CardHeader>
        <CardContent>
          {invoices.length === 0 ? <p className="py-6 text-center text-gray-500">No invoices found.</p> : (
            <div className="space-y-3">
              {invoices.map((inv) => {
                const cust = customers[inv.customer_id]
                const tech = inv.technician_id ? techs[inv.technician_id] : null
                return (
                  <div key={inv.id} className="flex flex-col gap-3 rounded-lg border border-gray-100 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{inv.invoice_number}</p>
                        <Badge color={inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>{inv.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-500">{inv.service_name} · {cust?.name || 'Unknown'} · {tech?.name || 'Unassigned'}</p>
                      <p className="text-sm text-gray-500">{formatDate(inv.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(inv.amount)}</span>
                      <Button size="sm" variant="outline" onClick={() => setViewInv(inv)}><Eye className="mr-1 h-4 w-4" />Details</Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={!!viewInv} onClose={() => setViewInv(null)} title="Invoice Details">
        {viewInv && (() => {
          const cust = customers[viewInv.customer_id]
          const tech = viewInv.technician_id ? techs[viewInv.technician_id] : null
          return (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-gray-500">Invoice #</p><p className="font-medium">{viewInv.invoice_number}</p></div>
                <div><p className="text-gray-500">Status</p><Badge color={viewInv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>{viewInv.status}</Badge></div>
                <div><p className="text-gray-500">Service</p><p className="font-medium">{viewInv.service_name}</p></div>
                <div><p className="text-gray-500">Amount</p><p className="font-medium">{formatCurrency(viewInv.amount)}</p></div>
                <div><p className="text-gray-500">Customer</p><p className="font-medium">{cust?.name || 'Unknown'}</p></div>
                <div><p className="text-gray-500">Technician</p><p className="font-medium">{tech?.name || 'Unassigned'}</p></div>
                <div><p className="text-gray-500">Payment Method</p><p className="font-medium">{viewInv.payment_method || 'N/A'}</p></div>
                <div><p className="text-gray-500">Paid At</p><p className="font-medium">{viewInv.paid_at ? formatDate(viewInv.paid_at) : 'N/A'}</p></div>
                <div><p className="text-gray-500">Created</p><p className="font-medium">{formatDate(viewInv.created_at)}</p></div>
              </div>
              {settings?.upi_id && <p className="text-sm text-gray-500">UPI ID: {settings.upi_id}</p>}
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}
