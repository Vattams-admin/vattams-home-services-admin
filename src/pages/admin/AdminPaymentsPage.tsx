import { useEffect, useState, useMemo } from 'react'
import {
  Loader2, Eye, CreditCard, Wallet, Clock, TrendingUp,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Invoice, Profile } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { cn, formatCurrency, formatDateTime } from '@/lib/utils'

export function AdminPaymentsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      const [{ data: invData }, { data: profileData }] = await Promise.all([
        supabase.from('invoices').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*'),
      ])
      if (!mounted) return
      setInvoices((invData ?? []) as Invoice[])
      const map: Record<string, Profile> = {}
      for (const p of (profileData ?? []) as Profile[]) map[p.id] = p
      setProfiles(map)
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  const stats = useMemo(() => {
    const total = invoices.reduce((s, i) => s + Number(i.amount), 0)
    const paid = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0)
    const pending = invoices.filter((i) => i.status === 'pending').reduce((s, i) => s + Number(i.amount), 0)
    const now = new Date()
    const thisMonth = invoices
      .filter((i) => {
        const d = new Date(i.created_at)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
      .reduce((s, i) => s + Number(i.amount), 0)
    return { total, paid, pending, thisMonth }
  }, [invoices])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const cards = [
    { label: 'Total Revenue', value: formatCurrency(stats.total), icon: CreditCard, color: 'text-green-600 bg-green-100' },
    { label: 'Total Paid', value: formatCurrency(stats.paid), icon: Wallet, color: 'text-blue-600 bg-blue-100' },
    { label: 'Total Pending', value: formatCurrency(stats.pending), icon: Clock, color: 'text-amber-600 bg-amber-100' },
    { label: 'This Month', value: formatCurrency(stats.thisMonth), icon: TrendingUp, color: 'text-purple-600 bg-purple-100' },
  ]

  const statusVariant = (s: string) => {
    if (s === 'paid') return 'success'
    if (s === 'pending') return 'warning'
    return 'error'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-sm text-gray-500">Track invoices and revenue across the platform.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={cn('rounded-lg p-3', c.color)}>
                <c.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{c.label}</p>
                <p className="text-xl font-bold text-gray-900">{c.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {invoices.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">No invoices found.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {invoices.map((inv) => (
                <div key={inv.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{inv.invoice_number}</p>
                      <Badge variant={statusVariant(inv.status) as any} className="capitalize">{inv.status}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      {inv.service_name} · {profiles[inv.customer_id]?.name ?? 'Customer'}
                      {inv.technician_id ? ` · ${profiles[inv.technician_id]?.name ?? 'Technician'}` : ''}
                    </p>
                    <p className="text-xs text-gray-400">{formatDateTime(inv.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(inv.amount)}</span>
                    <Button variant="outline" size="sm" onClick={() => setViewInvoice(inv)}>
                      <Eye className="mr-1 h-4 w-4" /> View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={!!viewInvoice} onClose={() => setViewInvoice(null)} title="Invoice Details">
        {viewInvoice && (
          <div className="space-y-3 text-sm">
            <div><span className="font-medium text-gray-500">Invoice #:</span> {viewInvoice.invoice_number}</div>
            <div><span className="font-medium text-gray-500">Status:</span> <Badge variant={statusVariant(viewInvoice.status) as any} className="capitalize">{viewInvoice.status}</Badge></div>
            <div><span className="font-medium text-gray-500">Service:</span> {viewInvoice.service_name}</div>
            <div><span className="font-medium text-gray-500">Amount:</span> {formatCurrency(viewInvoice.amount)}</div>
            <div><span className="font-medium text-gray-500">Customer:</span> {profiles[viewInvoice.customer_id]?.name ?? '-'}</div>
            <div><span className="font-medium text-gray-500">Technician:</span> {viewInvoice.technician_id ? (profiles[viewInvoice.technician_id]?.name ?? '-') : 'Unassigned'}</div>
            <div><span className="font-medium text-gray-500">Payment Method:</span> {viewInvoice.payment_method ?? '-'}</div>
            <div><span className="font-medium text-gray-500">Paid At:</span> {viewInvoice.paid_at ? formatDateTime(viewInvoice.paid_at) : '-'}</div>
            <div><span className="font-medium text-gray-500">Created:</span> {formatDateTime(viewInvoice.created_at)}</div>
          </div>
        )}
      </Modal>
    </div>
  )
}
