import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Invoice, Settings } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { cn, formatDate, formatCurrency } from '@/lib/utils'
import { generateInvoicePDF } from '@/lib/pdf'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/LoadingScreen'
import { TrendingUp, Calendar, Clock, Download, Eye, FileText } from 'lucide-react'

const INVOICE_STATUS_COLORS: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  overdue: 'bg-red-100 text-red-700',
}

export function TechnicianEarningsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [selected, setSelected] = useState<Invoice | null>(null)
  const [stats, setStats] = useState({ totalEarnings: 0, thisMonth: 0, pendingPayments: 0 })

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!profile) return
      const { data } = await supabase
        .from('invoices')
        .select('*')
        .eq('technician_id', profile.id)
        .order('created_at', { ascending: false })
      if (!mounted || !data) return
      setInvoices(data as Invoice[])
      const totalEarnings = data.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
      const now = new Date()
      const thisMonth = data
        .filter((i) => i.status === 'paid' && new Date(i.created_at).getMonth() === now.getMonth() && new Date(i.created_at).getFullYear() === now.getFullYear())
        .reduce((s, i) => s + i.amount, 0)
      const pendingPayments = data.filter((i) => i.status === 'pending').reduce((s, i) => s + i.amount, 0)
      if (mounted) setStats({ totalEarnings, thisMonth, pendingPayments })
      const { data: s } = await supabase.from('settings').select('*').limit(1).maybeSingle()
      if (mounted && s) setSettings(s as Settings)
      if (mounted) setLoading(false)
    })()
    return () => { mounted = false }
  }, [profile])

  const handleDownload = async (inv: Invoice) => {
    await generateInvoicePDF(inv, null, null, profile, settings)
    toast('Invoice downloaded', 'success')
  }

  if (loading) return <LoadingScreen message="Loading earnings..." />

  const statCards = [
    { label: 'Total Earnings', value: formatCurrency(stats.totalEarnings), icon: TrendingUp, color: 'text-green-600 bg-green-50' },
    { label: 'This Month', value: formatCurrency(stats.thisMonth), icon: Calendar, color: 'text-blue-600 bg-blue-50' },
    { label: 'Pending Payments', value: formatCurrency(stats.pendingPayments), icon: Clock, color: 'text-amber-600 bg-amber-50' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Earnings & Invoices</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {statCards.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className={cn('rounded-lg p-3', s.color)}><Icon className="h-6 w-6" /></div>
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
        <CardHeader><CardTitle>Invoices</CardTitle></CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <FileText className="h-12 w-12 text-gray-300" />
              <p className="text-gray-500">No invoices found.</p>
            </div>
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 w-full max-w-lg rounded-lg bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Invoice Details</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-6 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p className="text-gray-500">Invoice #</p><p className="text-gray-900">{selected.invoice_number}</p>
                <p className="text-gray-500">Service</p><p className="text-gray-900">{selected.service_name}</p>
                <p className="text-gray-500">Amount</p><p className="text-gray-900">{formatCurrency(selected.amount)}</p>
                <p className="text-gray-500">Status</p><Badge color={INVOICE_STATUS_COLORS[selected.status]}>{selected.status}</Badge>
                <p className="text-gray-500">Payment Method</p><p className="text-gray-900">{selected.payment_method || '-'}</p>
                <p className="text-gray-500">Paid At</p><p className="text-gray-900">{selected.paid_at ? formatDate(selected.paid_at) : '-'}</p>
                <p className="text-gray-500">Created</p><p className="text-gray-900">{formatDate(selected.created_at)}</p>
              </div>
              <Button className="w-full" variant="outline" onClick={() => handleDownload(selected)}>
                <Download className="mr-2 h-4 w-4" />Download PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
