import { useEffect, useState } from 'react'
import { Eye, IndianRupee, Clock, CircleCheck as CheckCircle, TrendingUp, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Invoice, Booking, Profile, Settings } from '@/lib/supabase'
import { cn, formatDate, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { LoadingScreen } from '@/components/LoadingScreen'

const statusColors: Record<string, string> = {
  paid: 'bg-green-100 text-green-700', pending: 'bg-amber-100 text-amber-700', failed: 'bg-red-100 text-red-700',
}

export function AdminPaymentsPage() {
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [customers, setCustomers] = useState<Record<string, Profile>>({})
  const [techs, setTechs] = useState<Record<string, Profile>>({})
  const [settings, setSettings] = useState<Settings | null>(null)
  const [selected, setSelected] = useState<Invoice | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: invs } = await supabase.from('invoices').select('*').order('created_at', { ascending: false })
      const { data: custData } = await supabase.from('profiles').select('*').in('role', ['customer'])
      const { data: techData } = await supabase.from('profiles').select('*').eq('role', 'technician')
      const { data: settingsData } = await supabase.from('settings').select('*').maybeSingle()
      if (!mounted) return
      setInvoices((invs || []) as Invoice[])
      const custMap: Record<string, Profile> = {}
      ;(custData || []).forEach((c) => { custMap[(c as Profile).id] = c as Profile })
      setCustomers(custMap)
      const techMap: Record<string, Profile> = {}
      ;(techData || []).forEach((t) => { techMap[(t as Profile).id] = t as Profile })
      setTechs(techMap)
      setSettings(settingsData as Settings | null)
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  const totalRevenue = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const totalPaid = invoices.filter((i) => i.status === 'paid').length
  const totalPending = invoices.filter((i) => i.status === 'pending').reduce((s, i) => s + i.amount, 0)
  const now = new Date()
  const thisMonth = invoices.filter((i) => { const d = new Date(i.created_at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && i.status === 'paid' }).reduce((s, i) => s + i.amount, 0)

  const viewInvoice = async (inv: Invoice) => {
    setSelected(inv)
    setSelectedBooking(null)
    const { data: bk } = await supabase.from('bookings').select('*').eq('id', inv.booking_id).maybeSingle()
    if (bk) setSelectedBooking(bk as Booking)
  }

  if (loading) return <LoadingScreen message="Loading payments..." />

  const statCards = [
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: TrendingUp, color: 'text-indigo-600 bg-indigo-100' },
    { label: 'Total Paid', value: totalPaid, icon: CheckCircle, color: 'text-green-600 bg-green-100' },
    { label: 'Total Pending', value: formatCurrency(totalPending), icon: Clock, color: 'text-amber-600 bg-amber-100' },
    { label: 'This Month', value: formatCurrency(thisMonth), icon: Calendar, color: 'text-blue-600 bg-blue-100' },
  ]

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Payments</h1><p className="text-sm text-gray-500">Manage all invoices and payments</p></div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 py-4">
              <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg', s.color)}><s.icon className="h-6 w-6" /></div>
              <div><p className="text-xl font-bold text-gray-900">{s.value}</p><p className="text-sm text-gray-500">{s.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>All Invoices ({invoices.length})</CardTitle></CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="py-8 text-center text-gray-500">No invoices found.</p>
          ) : (
            <div className="space-y-3">
              {invoices.map((inv) => (
                <div key={inv.id} className="flex flex-col gap-3 rounded-lg border border-gray-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-gray-400">#{inv.invoice_number}</span>
                      <p className="font-medium text-gray-900">{inv.service_name}</p>
                      <Badge color={statusColors[inv.status] || 'bg-gray-100 text-gray-700'}>{inv.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Customer: {customers[inv.customer_id]?.name || 'Unknown'}
                      {inv.technician_id && techs[inv.technician_id] ? ` • Tech: ${techs[inv.technician_id].name}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900">{formatCurrency(inv.amount)}</span>
                    <Button size="sm" variant="outline" onClick={() => viewInvoice(inv)}><Eye className="mr-1 h-4 w-4" />View</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Invoice #${selected?.invoice_number || ''}`}>
        {selected && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-gray-500">Service</p><p className="font-medium">{selected.service_name}</p></div>
            <div><p className="text-gray-500">Status</p><Badge color={statusColors[selected.status] || 'bg-gray-100'}>{selected.status}</Badge></div>
            <div><p className="text-gray-500">Amount</p><p className="font-medium">{formatCurrency(selected.amount)}</p></div>
            <div><p className="text-gray-500">Payment Method</p><p className="font-medium">{selected.payment_method || '-'}</p></div>
            <div><p className="text-gray-500">Customer</p><p className="font-medium">{customers[selected.customer_id]?.name || 'Unknown'}</p></div>
            <div><p className="text-gray-500">Technician</p><p className="font-medium">{selected.technician_id ? techs[selected.technician_id]?.name || 'Unknown' : 'Unassigned'}</p></div>
            <div><p className="text-gray-500">Created</p><p className="font-medium">{formatDate(selected.created_at)}</p></div>
            {selected.paid_at && <div><p className="text-gray-500">Paid On</p><p className="font-medium">{formatDate(selected.paid_at)}</p></div>}
            {selectedBooking && <div className="col-span-2"><p className="text-gray-500">Booking</p><p className="font-medium">#{selectedBooking.booking_number} - {selectedBooking.service_name}</p></div>}
          </div>
        )}
      </Modal>
    </div>
  )
}
