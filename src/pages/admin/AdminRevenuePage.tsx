import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { RevenueTransaction } from '@/lib/supabase'
import { cn, formatCurrency, formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingScreen } from '@/components/LoadingScreen'
import { generateReportPDF, exportToCSV } from '@/lib/pdf'
import { IndianRupee, TrendingUp, Wallet, BarChart3, Download, FileText } from 'lucide-react'

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly'

export function AdminRevenuePage() {
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<RevenueTransaction[]>([])
  const [period, setPeriod] = useState<Period>('monthly')

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.from('revenue_transactions').select('*').order('created_at', { ascending: false })
      if (mounted) { setTransactions((data || []) as RevenueTransaction[]); setLoading(false) }
    })()
    return () => { mounted = false }
  }, [])

  const filterByPeriod = (txns: RevenueTransaction[]) => {
    const now = new Date()
    return txns.filter((t) => {
      const d = new Date(t.created_at)
      if (period === 'daily') return d.toDateString() === now.toDateString()
      if (period === 'weekly') { const wkAgo = new Date(); wkAgo.setDate(wkAgo.getDate() - 7); return d >= wkAgo }
      if (period === 'monthly') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      if (period === 'yearly') return d.getFullYear() === now.getFullYear()
      return true
    })
  }

  const filtered = filterByPeriod(transactions)
  const verificationFees = filtered.filter((t) => t.transaction_type === 'verification_fee').reduce((s, t) => s + t.amount, 0)
  const commissions = filtered.filter((t) => t.transaction_type === 'commission').reduce((s, t) => s + t.amount, 0)
  const techEarnings = filtered.filter((t) => t.transaction_type === 'technician_earning').reduce((s, t) => s + t.amount, 0)
  const platformRevenue = verificationFees + commissions

  const byType: Record<string, number> = {}
  filtered.forEach((t) => { byType[t.transaction_type] = (byType[t.transaction_type] || 0) + t.amount })
  const maxAmount = Math.max(...Object.values(byType), 1)

  if (loading) return <LoadingScreen message="Loading revenue..." />

  const cards = [
    { label: 'Verification Fees', value: formatCurrency(verificationFees), icon: IndianRupee, color: 'text-blue-600 bg-blue-50' },
    { label: 'Booking Commission', value: formatCurrency(commissions), icon: TrendingUp, color: 'text-green-600 bg-green-50' },
    { label: 'Technician Earnings', value: formatCurrency(techEarnings), icon: Wallet, color: 'text-amber-600 bg-amber-50' },
    { label: 'Platform Revenue', value: formatCurrency(platformRevenue), icon: BarChart3, color: 'text-purple-600 bg-purple-50' },
  ]

  const periods: { key: Period; label: string }[] = [
    { key: 'daily', label: 'Daily' }, { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' }, { key: 'yearly', label: 'Yearly' },
  ]

  const exportPDF = () => {
    const rows = filtered.map((t) => [formatDateTime(t.created_at), t.transaction_type, formatCurrency(t.amount), t.description || '-'])
    generateReportPDF('Revenue Report', ['Date', 'Type', 'Amount', 'Description'], rows, [
      { label: 'Verification Fees', value: formatCurrency(verificationFees) },
      { label: 'Commission', value: formatCurrency(commissions) },
      { label: 'Technician Earnings', value: formatCurrency(techEarnings) },
      { label: 'Platform Revenue', value: formatCurrency(platformRevenue) },
    ])
  }

  const exportCSV = () => {
    const rows = filtered.map((t) => [formatDateTime(t.created_at), t.transaction_type, t.amount, t.description || '-'])
    exportToCSV('revenue-report', ['Date', 'Type', 'Amount', 'Description'], rows)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Revenue Management</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={exportPDF}><FileText className="h-4 w-4 mr-1" />PDF</Button>
          <Button size="sm" variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-1" />CSV</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => { const Icon = c.icon; return (
          <Card key={c.label}><CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn('rounded-lg p-2.5', c.color)}><Icon className="h-5 w-5" /></div>
              <div><p className="text-sm text-gray-500">{c.label}</p><p className="text-xl font-bold text-gray-900">{c.value}</p></div>
            </div>
          </CardContent></Card>
        )})}
      </div>

      <div className="flex flex-wrap gap-2">
        {periods.map((p) => (
          <button key={p.key} onClick={() => setPeriod(p.key)} className={cn('rounded-full px-3 py-1.5 text-sm font-medium', period === p.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>{p.label}</button>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Revenue Breakdown by Type</CardTitle></CardHeader>
        <CardContent>
          {Object.keys(byType).length === 0 ? <p className="text-gray-500 text-sm">No data for this period.</p> : (
            <div className="space-y-3">
              {Object.entries(byType).map(([type, amount]) => (
                <div key={type}>
                  <div className="flex justify-between text-sm mb-1"><span className="font-medium text-gray-700">{type.replace(/_/g, ' ')}</span><span className="text-gray-900">{formatCurrency(amount)}</span></div>
                  <div className="h-4 w-full rounded bg-gray-100"><div className="h-4 rounded bg-blue-500" style={{ width: `${(amount / maxAmount) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent Transactions ({filtered.length})</CardTitle></CardHeader>
        <CardContent>
          {filtered.length === 0 ? <p className="text-gray-500 text-sm">No transactions found.</p> : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filtered.slice(0, 50).map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div><p className="font-medium text-gray-900 text-sm">{t.transaction_type.replace(/_/g, ' ')}</p><p className="text-xs text-gray-500">{t.description || '-'} · {formatDateTime(t.created_at)}</p></div>
                  <span className="font-bold text-gray-900">{formatCurrency(t.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
