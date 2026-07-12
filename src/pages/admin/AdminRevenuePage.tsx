import { useEffect, useState } from 'react'
import { TrendingUp, Download, FileText, IndianRupee, Wrench, Wallet } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { RevenueTransaction } from '@/lib/supabase'
import { cn, formatDateTime, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingScreen } from '@/components/LoadingScreen'
import { generateReportPDF, exportToCSV } from '@/lib/pdf'

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly'

export function AdminRevenuePage() {
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<RevenueTransaction[]>([])
  const [period, setPeriod] = useState<Period>('monthly')

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.from('revenue_transactions').select('*').order('created_at', { ascending: false })
      if (!mounted) return
      setTransactions((data || []) as RevenueTransaction[])
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

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
  const verificationFees = filtered.filter((t) => t.transaction_type === 'verification_fee').reduce((s, t) => s + t.amount, 0)
  const commission = filtered.filter((t) => t.transaction_type === 'commission').reduce((s, t) => s + t.amount, 0)
  const techEarnings = filtered.filter((t) => t.transaction_type === 'technician_earning').reduce((s, t) => s + t.amount, 0)
  const platformRevenue = verificationFees + commission

  const breakdown = [
    { type: 'Verification Fee', amount: verificationFees, color: 'bg-blue-500' },
    { type: 'Booking Commission', amount: commission, color: 'bg-green-500' },
    { type: 'Technician Earnings', amount: techEarnings, color: 'bg-purple-500' },
    { type: 'Platform Revenue', amount: platformRevenue, color: 'bg-indigo-500' },
  ]
  const maxAmount = Math.max(...breakdown.map((b) => b.amount), 1)

  const handleExportPDF = () => {
    const headers = ['Date', 'Type', 'Amount', 'Description']
    const rows = filtered.map((t) => [formatDateTime(t.created_at), t.transaction_type, formatCurrency(t.amount), t.description || '-'])
    generateReportPDF('Revenue Report', headers, rows, [
      { label: 'Period', value: period }, { label: 'Total Transactions', value: String(filtered.length) },
      { label: 'Verification Fees', value: formatCurrency(verificationFees) }, { label: 'Commission', value: formatCurrency(commission) },
      { label: 'Platform Revenue', value: formatCurrency(platformRevenue) },
    ])
  }

  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Amount', 'Description']
    const rows = filtered.map((t) => [formatDateTime(t.created_at), t.transaction_type, t.amount, t.description || '-'])
    exportToCSV('revenue-report', headers, rows)
  }

  if (loading) return <LoadingScreen message="Loading revenue data..." />

  const statCards = [
    { label: 'Verification Fee Collection', value: formatCurrency(verificationFees), icon: IndianRupee, color: 'text-blue-600 bg-blue-100' },
    { label: 'Booking Commission', value: formatCurrency(commission), icon: Wrench, color: 'text-green-600 bg-green-100' },
    { label: 'Technician Earnings', value: formatCurrency(techEarnings), icon: Wallet, color: 'text-purple-600 bg-purple-100' },
    { label: 'Platform Revenue', value: formatCurrency(platformRevenue), icon: TrendingUp, color: 'text-indigo-600 bg-indigo-100' },
  ]
  const periods: { key: Period; label: string }[] = [
    { key: 'daily', label: 'Daily' }, { key: 'weekly', label: 'Weekly' }, { key: 'monthly', label: 'Monthly' }, { key: 'yearly', label: 'Yearly' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Revenue Management</h1><p className="text-sm text-gray-500">Track platform revenue and transactions</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPDF}><FileText className="mr-2 h-4 w-4" />Export PDF</Button>
          <Button variant="outline" onClick={handleExportCSV}><Download className="mr-2 h-4 w-4" />Export CSV</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {periods.map((p) => (
          <button key={p.key} onClick={() => setPeriod(p.key)} className={cn('rounded-full px-3 py-1.5 text-sm font-medium', period === p.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>{p.label}</button>
        ))}
      </div>

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
        <CardHeader><CardTitle>Revenue Breakdown by Type</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {breakdown.map((b) => (
              <div key={b.type}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{b.type}</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(b.amount)}</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                  <div className={cn('h-full rounded-full transition-all', b.color)} style={{ width: `${(b.amount / maxAmount) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent Revenue Transactions ({filtered.length})</CardTitle></CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-gray-500">No transactions found for this period.</p>
          ) : (
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {filtered.slice(0, 50).map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                  <div>
                    <p className="font-medium text-gray-900">{t.transaction_type.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-gray-500">{t.description || '-'}</p>
                    <p className="text-xs text-gray-400">{formatDateTime(t.created_at)}</p>
                  </div>
                  <span className="font-semibold text-gray-900">{formatCurrency(t.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
