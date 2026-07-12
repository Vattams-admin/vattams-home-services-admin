import { useEffect, useState, useCallback } from 'react'
import { TrendingUp, IndianRupee, Loader as Loader2, Download, ArrowUp, ArrowDown, Calendar, Wrench } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  supabase,
  type RevenueTransaction,
  type Invoice,
} from '@/lib/supabase'
import { cn, formatDate, formatCurrency } from '@/lib/utils'
import { SERVICE_CATEGORIES } from '@/lib/constants'
import { generateReportPDF, exportToCSV } from '@/lib/pdf'
import { useToast } from '@/hooks/use-toast'

type Period = 'week' | 'month' | 'quarter' | 'year'

export default function AdminRevenuePage() {
  const toast = useToast()

  const [transactions, setTransactions] = useState<RevenueTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('month')

  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    avgTransaction: 0,
    revenueChange: 0,
  })

  const [revenueByCategory, setRevenueByCategory] = useState<
    { category: string; amount: number; count: number }[]
  >([])
  const [monthlyTrends, setMonthlyTrends] = useState<
    { month: string; revenue: number; count: number }[]
  >([])

  const getPeriodStartDate = (p: Period): Date => {
    const now = new Date()
    switch (p) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1)
      case 'quarter':
        return new Date(
          now.getFullYear(),
          Math.floor(now.getMonth() / 3) * 3,
          1,
        )
      case 'year':
        return new Date(now.getFullYear(), 0, 1)
    }
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const startDate = getPeriodStartDate(period)
      const startDateStr = startDate.toISOString()

      const [transactionsRes, invoicesRes, allInvoicesRes] = await Promise.all([
        supabase
          .from('revenue_transactions')
          .select('*')
          .gte('created_at', startDateStr)
          .order('created_at', { ascending: false }),
        supabase
          .from('invoices')
          .select('amount, status, service_name, created_at')
          .gte('created_at', startDateStr),
        supabase.from('invoices').select('amount, status, service_name, created_at'),
      ])

      const txns = (transactionsRes.data as RevenueTransaction[]) || []
      const invoices =
        (invoicesRes.data as {
          amount: number
          status: string
          service_name: string
          created_at: string
        }[]) || []
      const allInvoices =
        (allInvoicesRes.data as {
          amount: number
          status: string
          service_name: string
          created_at: string
        }[]) || []

      setTransactions(txns)

      // Calculate revenue from paid invoices
      const paidInvoices = invoices.filter((i) => i.status === 'paid')
      const totalRevenue = paidInvoices.reduce(
        (sum, inv) => sum + Number(inv.amount),
        0,
      )
      const totalTxns = txns.length + paidInvoices.length
      const avgTxn = totalTxns > 0 ? totalRevenue / totalTxns : 0

      // Calculate change vs previous period
      const prevPeriodStart = new Date(
        startDate.getTime() -
          (new Date().getTime() - startDate.getTime()),
      )
      const prevInvoices = allInvoices.filter(
        (i) =>
          i.status === 'paid' &&
          new Date(i.created_at) >= prevPeriodStart &&
          new Date(i.created_at) < startDate,
      )
      const prevRevenue = prevInvoices.reduce(
        (sum, inv) => sum + Number(inv.amount),
        0,
      )
      const change =
        prevRevenue > 0
          ? ((totalRevenue - prevRevenue) / prevRevenue) * 100
          : 0

      setStats({
        totalRevenue,
        totalTransactions: totalTxns,
        avgTransaction: Math.round(avgTxn),
        revenueChange: Math.round(change),
      })

      // Revenue by service category
      const categoryMap = new Map<string, { amount: number; count: number }>()
      paidInvoices.forEach((inv) => {
        const category = inv.service_name || 'Other'
        const cur = categoryMap.get(category) || { amount: 0, count: 0 }
        cur.amount += Number(inv.amount)
        cur.count += 1
        categoryMap.set(category, cur)
      })
      const categoryData = Array.from(categoryMap.entries())
        .map(([category, data]) => ({ category, ...data }))
        .sort((a, b) => b.amount - a.amount)
      setRevenueByCategory(categoryData)

      // Monthly trends (last 6 months)
      const monthlyMap = new Map<string, { revenue: number; count: number }>()
      const now = new Date()
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const key = d.toLocaleDateString('en-IN', {
          month: 'short',
          year: '2-digit',
        })
        monthlyMap.set(key, { revenue: 0, count: 0 })
      }
      allInvoices
        .filter((i) => i.status === 'paid')
        .forEach((inv) => {
          const d = new Date(inv.created_at)
          const key = d.toLocaleDateString('en-IN', {
            month: 'short',
            year: '2-digit',
          })
          const cur = monthlyMap.get(key)
          if (cur) {
            cur.revenue += Number(inv.amount)
            cur.count += 1
          }
        })
      setMonthlyTrends(
        Array.from(monthlyMap.entries()).map(([month, data]) => ({
          month,
          ...data,
        })),
      )
    } catch {
      toast.error('Failed to load revenue data')
    } finally {
      setLoading(false)
    }
  }, [period, toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  function exportRevenuePDF() {
    const headers = ['Date', 'Type', 'Description', 'Amount']
    const rows = transactions.map((t) => [
      formatDate(t.created_at),
      t.transaction_type,
      t.description || '-',
      formatCurrency(t.amount),
    ])
    generateReportPDF('Revenue Report', headers, rows)
    toast.success('PDF exported')
  }

  function exportRevenueCSV() {
    const headers = ['Date', 'Type', 'Description', 'Amount']
    const rows = transactions.map((t) => [
      formatDate(t.created_at),
      t.transaction_type,
      t.description || '-',
      t.amount,
    ])
    exportToCSV('revenue-report', headers, rows)
    toast.success('CSV exported')
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  const maxMonthlyRevenue = Math.max(
    ...monthlyTrends.map((m) => m.revenue),
    1,
  )
  const maxCategoryRevenue = Math.max(
    ...revenueByCategory.map((c) => c.amount),
    1,
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Revenue</h1>
          <p className="mt-1 text-sm text-slate-500">
            Revenue overview and financial analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportRevenueCSV}>
            <Download className="mr-1 h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportRevenuePDF}>
            <Download className="mr-1 h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      {/* Period Filter */}
      <div className="flex items-end gap-3">
        <div className="space-y-1.5">
          <Label>Period</Label>
          <Select
            value={period}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setPeriod(e.target.value as Period)}
            className="w-40"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-50">
                <IndianRupee className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Revenue</p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(stats.totalRevenue)}
                </p>
              </div>
            </div>
            {stats.revenueChange !== 0 && (
              <div
                className={cn(
                  'mt-2 flex items-center gap-1 text-xs',
                  stats.revenueChange > 0
                    ? 'text-green-600'
                    : 'text-red-600',
                )}
              >
                {stats.revenueChange > 0 ? (
                  <ArrowUp className="h-3 w-3" />
                ) : (
                  <ArrowDown className="h-3 w-3" />
                )}
                {Math.abs(stats.revenueChange)}% vs previous period
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Transactions</p>
                <p className="text-2xl font-bold text-slate-900">
                  {stats.totalTransactions}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Avg Transaction</p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(stats.avgTransaction)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50">
                <Wrench className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Service Categories</p>
                <p className="text-2xl font-bold text-slate-900">
                  {revenueByCategory.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Monthly Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue Trends</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyTrends.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-slate-500">
                No data available
              </div>
            ) : (
              <div className="space-y-3">
                {monthlyTrends.map((item) => (
                  <div key={item.month} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{item.month}</span>
                      <span className="font-medium text-slate-900">
                        {formatCurrency(item.revenue)}
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all"
                        style={{
                          width: `${(item.revenue / maxMonthlyRevenue) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-slate-400">
                      {item.count} transactions
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Service Category</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueByCategory.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-slate-500">
                No data available
              </div>
            ) : (
              <div className="space-y-3">
                {revenueByCategory.map((item) => (
                  <div key={item.category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{item.category}</span>
                      <span className="font-medium text-slate-900">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all"
                        style={{
                          width: `${(item.amount / maxCategoryRevenue) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-slate-400">
                      {item.count} bookings
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transaction List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Recent Transactions</CardTitle>
          <Badge color="gray">{transactions.length} total</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <IndianRupee className="h-10 w-10 text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">
                No transactions in this period
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Description
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.slice(0, 20).map((txn) => (
                    <tr key={txn.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-500">
                        {formatDate(txn.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          color={
                            txn.transaction_type === 'refund'
                              ? 'red'
                              : txn.transaction_type === 'commission'
                                ? 'amber'
                                : 'green'
                          }
                        >
                          {txn.transaction_type.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {txn.description || '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">
                        {formatCurrency(txn.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
