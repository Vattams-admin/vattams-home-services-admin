import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { RevenueTransaction, Booking, Invoice } from '@/lib/supabase'
import { cn, formatDateTime, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingScreen } from '@/components/LoadingScreen'
import { generateReportPDF, exportToCSV } from '@/lib/pdf'
import { TrendingUp, Download, FileText, Wallet, Receipt } from 'lucide-react'

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly'

export function AdminRevenuePage() {
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<RevenueTransaction[]>([])
  const [period, setPeriod] = useState<Period>('monthly')
  const [stats, setStats] = useState({ verification: 0, commission: 0, techEarnings: 0, platform: 0 })

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: txns } = await supabase.from('revenue_transactions').select('*').order('created_at', { ascending: false })
      if (!mounted) return
      const txList = (txns || []) as RevenueTransaction[]
      setTransactions(txList)
      setStats({
        verification: txList.filter((t) => t.transaction_type === 'verification_fee').reduce((s, t) => s + (t.amount || 0), 0),
        commission: txList.filter((t) => t.transaction_type === 'commission').reduce((s, t) => s + (t.amount || 0), 0),
        techEarnings: txList.filter((t) => t.transaction_type === 'technician_earning').reduce((s, t) => s + (t.amount || 0), 0),
        platform: txList.filter((t) => t.transaction_type === 'commission' || t.transaction_type === 'verification_fee').reduce((s, t) => s + (t.amount || 0), 0),
      })
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  if (loading) return <LoadingScreen message="Loading revenue data..." />

  const getFiltered = () => {
    const now = new Date()
    return transactions.filter((t) => {
      const d = new Date(t.created_at)
      if (period === 'daily') return d.toDateString() === now.toDateString()
      if (period === 'weekly') { const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7); return d >= weekAgo }
      if (period === 'monthly') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      if (period === 'yearly') return d.getFullYear() === now.getFullYear()
      return true
    })
  }

  const filtered = getFiltered()
  const periodStats = {
    verification: filtered.filter((t) => t.transaction_type === 'verification_fee').reduce((s, t) => s + (t.amount || 0), 0),
    commission: filtered.filter((t) => t.transaction_type === 'commission').reduce((s, t) => s + (t.amount || 0), 0),
    techEarnings: filtered.filter((t) => t.transaction_type === 'technician_earning').reduce((s, t) => s + (t.amount || 0), 0),
    refund: filtered.filter((t) => t.transaction_type === 'refund').reduce((s, t) => s + (t.amount || 0), 0),
  }

  const breakdown = [
    { label: 'Verification Fees', value: periodStats.verification, color: 'bg-blue-500' },
    { label: 'Commission', value: periodStats.commission, color: 'bg-green-500' },
    { label: 'Technician Earnings', value: periodStats.techEarnings, color: 'bg-purple-500' },
    { label: 'Refunds', value: periodStats.refund, color: 'bg-red-500' },
  ]
  const maxVal = Math.max(...breakdown.map((b) => b.value), 1)

  const statCards = [
    { label: 'Verification Fee Collection', value: formatCurrency(stats.verification), icon: Receipt, color: 'text-blue-600 bg-blue-50' },
    { label: 'Booking Commission', value: formatCurrency(stats.commission), icon: TrendingUp, color: 'text-green-600 bg-green-50' },
    { label: 'Technician Earnings', value: formatCurrency(stats.techEarnings), icon: Wallet, color: 'text-purple-600 bg-purple-50' },
    { label: 'Platform Revenue', value: formatCurrency(stats.platform), icon: FileText, color: 'text-emerald-600 bg-emerald-50' },
  ]

  const periods: { key: Period; label: string }[] = [
    { key: 'daily', label: 'Daily' }, { key: 'weekly', label: 'Weekly' }, { key: 'monthly', label: 'Monthly' }, { key: 'yearly', label: 'Yearly' },
  ]

  const exportPDF = () => {
    const rows = filtered.map((t) => [formatDateTime(t.created_at), t.transaction_type, formatCurrency(t.amount), t.description || '-'])
    generateReportPDF('Revenue Report', ['Date', 'Type', 'Amount', 'Description'], rows, [
      { label: 'Total Verification Fees', value: formatCurrency(periodStats.verification) },
      { label: 'Total Commission', value: formatCurrency(periodStats.commission) },
      { label: 'Total Technician Earnings', value: formatCurrency(periodStats.techEarnings) },
      { label: 'Total Refunds', value: formatCurrency(periodStats.refund) },
    ])
  }

  const exportCSV = () => {
    const rows = filtered.map((t) => [formatDateTime(t.created_at), t.transaction_type, t.amount, t.description || '-'])
    exportToCSV('revenue-report', ['Date', 'Type', 'Amount', 'Description'], rows)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Revenue Management</h1><p className="text-gray-600">Track platform revenue and transactions</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportPDF}><Download className="mr-2 h-4 w-4" />Export PDF</Button>
          <Button variant="outline" onClick={exportCSV}><Download className="mr-2 h-4 w-4" />Export CSV</Button>
        </div>
      </div>

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

      <div className="flex flex-wrap gap-2">
        {periods.map((p) => <Button key={p.key} size="sm" variant={period === p.key ? 'primary' : 'outline'} onClick={() => setPeriod(p.key)}>{p.label}</Button>)}
      </div>

      <Card>
        <CardHeader><CardTitle>Revenue Breakdown ({period})</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {breakdown.map((b) => (
              <div key={b.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{b.label}</span>
                  <span className="font-medium text-gray-900">{formatCurrency(b.value)}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                  <div className={cn('h-full rounded-full transition-all', b.color)} style={{ width: `${(b.value / maxVal) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
        <CardContent>
          {filtered.length === 0 ? <p className="py-6 text-center text-gray-500">No transactions found for this period.</p> : (
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {filtered.slice(0, 50).map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                  <div className="space-y-1">
                    <p className="font-medium text-gray-900">{t.transaction_type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(t.created_at)}{t.description ? ` · ${t.description}` : ''}</p>
                  </div>
                  <span className="font-medium text-gray-900">{formatCurrency(t.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
