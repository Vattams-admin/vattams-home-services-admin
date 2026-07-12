import { useEffect, useState } from 'react'
import { TrendingUp, Download, Clock, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Invoice, Settings } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingScreen } from '@/components/LoadingScreen'
import { formatCurrency, formatDateTime, formatDate } from '@/lib/utils'
import { generateInvoicePDF } from '@/lib/pdf'

const STATUS_COLORS: Record<string, string> = { paid: 'bg-green-100 text-green-700', pending: 'bg-amber-100 text-amber-700' }

export function TechnicianEarningsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!profile) return
      const { data: inv } = await supabase.from('invoices').select('*').eq('technician_id', profile.id).order('created_at', { ascending: false })
      const { data: set } = await supabase.from('settings').select('*').limit(1).maybeSingle()
      if (mounted) { setInvoices((inv as Invoice[]) || []); setSettings(set as Settings); setLoading(false) }
    })()
    return () => { mounted = false }
  }, [profile])

  const totalEarnings = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const now = new Date()
  const thisMonth = invoices.filter((i) => { const d = new Date(i.created_at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && i.status === 'paid' }).reduce((s, i) => s + i.amount, 0)
  const pendingPayments = invoices.filter((i) => i.status !== 'paid').reduce((s, i) => s + i.amount, 0)

  const handleDownload = async (inv: Invoice) => {
    try { await generateInvoicePDF(inv, null, profile, profile, settings); toast('Invoice downloaded', 'success') }
    catch { toast('Failed to download invoice', 'error') }
  }

  if (loading) return <LoadingScreen message="Loading earnings..." />

  const statCards = [
    { label: 'Total Earnings', value: formatCurrency(totalEarnings), icon: TrendingUp, color: 'text-green-600 bg-green-50' },
    { label: 'This Month', value: formatCurrency(thisMonth), icon: Calendar, color: 'text-blue-600 bg-blue-50' },
    { label: 'Pending Payments', value: formatCurrency(pendingPayments), icon: Clock, color: 'text-amber-600 bg-amber-50' },
  ]

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Earnings</h1>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {statCards.map((s) => { const Icon = s.icon; return (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`rounded-lg p-3 ${s.color}`}><Icon className="h-6 w-6" /></div>
              <div><p className="text-sm text-gray-600">{s.label}</p><p className="text-xl font-bold text-gray-900">{s.value}</p></div>
            </CardContent>
          </Card>
        )})}
      </div>

      <Card>
        <CardHeader><CardTitle>Invoice History</CardTitle></CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="py-8 text-center text-gray-500">No invoices yet.</p>
          ) : (
            <div className="space-y-3">
              {invoices.map((inv) => (
                <div key={inv.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-100 p-3 hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">#{inv.invoice_number}</p>
                    <p className="text-sm text-gray-500">{inv.service_name}</p>
                    <p className="text-xs text-gray-400">{formatDate(inv.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-900">{formatCurrency(inv.amount)}</span>
                    <Badge color={STATUS_COLORS[inv.status] || 'bg-gray-100 text-gray-700'}>{inv.status}</Badge>
                    <Button size="sm" variant="outline" onClick={() => handleDownload(inv)}><Download className="mr-1 h-3.5 w-3.5" /> PDF</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
