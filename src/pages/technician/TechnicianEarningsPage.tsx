import { useEffect, useState } from 'react'
import { Download, TrendingUp, Calendar, Clock, Loader as Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Invoice, Settings } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/LoadingScreen'
import { cn, formatDate, formatCurrency } from '@/lib/utils'
import { generateInvoicePDF } from '@/lib/pdf'

const statusColors: Record<string, string> = {
  paid: 'bg-green-100 text-green-700', pending: 'bg-amber-100 text-amber-700', failed: 'bg-red-100 text-red-700',
}

export function TechnicianEarningsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, pending: 0 })

  useEffect(() => {
    if (!profile) return
    let mounted = true;
    (async () => {
      const { data: invs } = await supabase.from('invoices').select('*').eq('technician_id', profile.id).order('created_at', { ascending: false })
      const { data: settingsData } = await supabase.from('settings').select('*').maybeSingle()
      if (!mounted) return
      const invoiceList = (invs || []) as Invoice[]
      setInvoices(invoiceList)
      setSettings(settingsData as Settings | null)
      const paid = invoiceList.filter((i) => i.status === 'paid')
      const total = paid.reduce((s, i) => s + i.amount, 0)
      const now = new Date()
      const thisMonth = paid.filter((i) => { const d = new Date(i.created_at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() }).reduce((s, i) => s + i.amount, 0)
      const pending = invoiceList.filter((i) => i.status === 'pending').reduce((s, i) => s + i.amount, 0)
      setStats({ total, thisMonth, pending })
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [profile])

  const handleDownload = async (inv: Invoice) => {
    setDownloadingId(inv.id)
    try { await generateInvoicePDF(inv, null, null, profile, settings); toast('Invoice downloaded', 'success') }
    catch { toast('Failed to download invoice', 'error') }
    setDownloadingId(null)
  }

  if (loading) return <LoadingScreen message="Loading earnings..." />
  if (!profile) return null

  const statCards = [
    { label: 'Total Earnings', value: formatCurrency(stats.total), icon: TrendingUp, color: 'text-green-600 bg-green-100' },
    { label: 'This Month', value: formatCurrency(stats.thisMonth), icon: Calendar, color: 'text-blue-600 bg-blue-100' },
    { label: 'Pending Payments', value: formatCurrency(stats.pending), icon: Clock, color: 'text-amber-600 bg-amber-100' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 py-4">
              <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg', s.color)}><s.icon className="h-6 w-6" /></div>
              <div><p className="text-2xl font-bold text-gray-900">{s.value}</p><p className="text-sm text-gray-500">{s.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {invoices.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><p className="text-gray-500">No invoices found.</p><p className="mt-1 text-sm text-gray-400">Your earnings will appear here once you complete jobs.</p></CardContent></Card>
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
                    <span>Created: {formatDate(inv.created_at)}</span>
                    {inv.paid_at && <span>Paid: {formatDate(inv.paid_at)}</span>}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleDownload(inv)} disabled={downloadingId === inv.id}>
                  {downloadingId === inv.id ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" />Generating...</> : <><Download className="mr-1 h-4 w-4" />Download PDF</>}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
