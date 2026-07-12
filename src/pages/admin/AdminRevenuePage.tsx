import { useEffect, useState } from 'react'
import { Download, FileText, TrendingUp, DollarSign, Wrench, Wallet } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { RevenueTransaction } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/LoadingScreen'
import { generateReportPDF, exportToCSV } from '@/lib/pdf'
import { formatCurrency, formatDateTime } from '@/lib/utils'

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly'

export function AdminRevenuePage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<RevenueTransaction[]>([])
  const [period, setPeriod] = useState<Period>('monthly')

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.from('revenue_transactions').select('*').order('created_at', { ascending: false })
      if (mounted) { setTransactions((data as RevenueTransaction[]) || []); setLoading(false) }
    })()
    return () => { mounted = false }
  }, [])

  if (loading) return <LoadingScreen message="Loading revenue data..." />

  const filterByPeriod = (txns: RevenueTransaction[]) => {
    const now = new Date()
    return txns.filter((t) => {
      const d = new Date(t.created_at)
      if (period === 'daily') return d.toDateString() === now.toDateString()
      if (period === 'weekly') { const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7); return d >= weekAgo }
      if (period === 'monthly') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      if (period === 'yearly') return d.getFullYear() === now.getFullYear()
      return true
    })
  }

  const filtered = filterByPeriod(transactions)
  const verFee = filtered.filter((t) => t.transaction_type === 'verification_fee').reduce((s, t) => s + t.amount, 0)
  const commission = filtered.filter((t) => t.transaction_type === 'commission').reduce((s, t) => s + t.amount, 0)
  const techEarnings = filtered.filter((t) => t.transaction_type === 'technician_earning').reduce((s, t) => s + t.amount, 0)
  const platformRev = verFee + commission

  const stats = [
    { label: 'Verification Fee', value: formatCurrency(verFee), icon: Wrench, color: 'text-blue-600 bg-blue-50' },
    { label: 'Booking Commission', value: formatCurrency(commission), icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
    { label: 'Technician Earnings', value: formatCurrency(techEarnings), icon: Wallet, color: 'text-amber-600 bg-amber-50' },
    { label: 'Platform Revenue', value: formatCurrency(platformRev), icon: DollarSign, color: 'text-green-600 bg-green-50' },
  ]

  const typeBreakdown = [
    { type: 'Verification Fee', amount: verFee, color: 'bg-blue-500' },
    { type: 'Commission', amount: commission, color: 'bg-purple-500' },
    { type: 'Technician Earnings', amount: techEarnings, color: 'bg-amber-500' },
  ]
  const maxAmount = Math.max(...typeBreakdown.map((t) => t.amount), 1)

  const periods: { key: Period; label: string }[] = [
    { key: 'daily', label: 'Daily' }, { key: 'weekly', label: 'Weekly' }, { key: 'monthly', label: 'Monthly' }, { key: 'yearly', label: 'Yearly' },
  ]

  const exportPDF = () => {
    const rows = filtered.map((t) => [t.transaction_type, formatCurrency(t.amount), t.description || '', formatDateTime(t.created_at)])
    generateReportPDF('Revenue Report', ['Type', 'Amount', 'Description', 'Date'], rows, [
      { label: 'Verification Fee', value: formatCurrency(verFee) }, { label: 'Commission', value: formatCurrency(commission) },
      { label: 'Technician Earnings', value: formatCurrency(techEarnings) }, { label: 'Platform Revenue', value: formatCurrency(platformRev) },
    ])
    toast('PDF exported', 'success')
  }

  const exportCSV = () => {
    const rows = filtered.map((t) => [t.transaction_type, t.amount, t.description || '', t.created_at])
    exportToCSV('revenue-report', ['Type', 'Amount', 'Description', 'Date'], rows)
    toast('CSV exported', 'success')
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Revenue Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportPDF}><FileText className="mr-2 h-4 w-4" /> PDF</Button>
          <Button variant="outline" onClick={exportCSV}><Download className="mr-2 h-4 w-4" /> CSV</Button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {periods.map((p) => (
          <Button key={p.key} size="sm" variant={period === p.key ? 'primary' : 'outline'} onClick={() => setPeriod(p.key)}>{p.label}</Button>
        ))}
      </div>

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

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Revenue Breakdown by Type</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {typeBreakdown.map((t) => (
              <div key={t.type}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-gray-700">{t.type}</span>
                  <span className="font-medium text-gray-900">{formatCurrency(t.amount)}</span>
                </div>
                <div className="h-3 w-full rounded-full bg-gray-100">
                  <div className={`h-3 rounded-full ${t.color}`} style={{ width: `${(t.amount / maxAmount) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent Transactions ({filtered.length})</CardTitle></CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-gray-500">No transactions found for this period.</p>
          ) : (
            <div className="space-y-2">
              {filtered.slice(0, 50).map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                  <div>
                    <p className="font-medium text-gray-900">{t.description || t.transaction_type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-400">{formatDateTime(t.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge color="bg-blue-50 text-blue-700">{t.transaction_type.replace(/_/g, ' ')}</Badge>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(t.amount)}</span>
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
