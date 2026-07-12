import { useEffect, useState, useMemo } from 'react'
import {
  TrendingUp,
  Loader2,
  CheckCircle2,
  Calendar,
  Wrench,
  IndianRupee,
  BarChart3,
  Wallet,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/input'
import { useAuth } from '@/lib/auth'
import { supabase, type Booking, type TechnicianWallet } from '@/lib/supabase'
import { cn, formatDate, formatCurrency, BOOKING_STATUS_COLORS } from '@/lib/utils'

type MonthlyEarning = {
  month: string
  monthLabel: string
  count: number
  total: number
}

export default function TechnicianEarningsPage() {
  const { profile, session } = useAuth()

  const [completedJobs, setCompletedJobs] = useState<Booking[]>([])
  const [wallet, setWallet] = useState<TechnicianWallet | null>(null)
  const [loading, setLoading] = useState(true)
  const [monthFilter, setMonthFilter] = useState('all')

  const userId = profile?.id || session?.user?.id

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    async function load() {
      try {
        const [jobsRes, walletRes] = await Promise.all([
          supabase
            .from('bookings')
            .select('*')
            .eq('technician_id', userId)
            .eq('status', 'completed')
            .order('updated_at', { ascending: false }),
          supabase
            .from('technician_wallets')
            .select('*')
            .eq('technician_id', userId)
            .maybeSingle(),
        ])

        if (cancelled) return
        setCompletedJobs((jobsRes.data as Booking[]) || [])
        setWallet((walletRes.data as TechnicianWallet) || null)
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [userId])

  // Group earnings by month
  const monthlyEarnings = useMemo<MonthlyEarning[]>(() => {
    const map: Record<string, MonthlyEarning> = {}
    completedJobs.forEach((job) => {
      const date = new Date(job.updated_at || job.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
      if (!map[monthKey]) {
        map[monthKey] = { month: monthKey, monthLabel, count: 0, total: 0 }
      }
      map[monthKey].count += 1
      map[monthKey].total += Number(job.amount)
    })
    return Object.values(map).sort((a, b) => b.month.localeCompare(a.month))
  }, [completedJobs])

  // Available months for filter
  const availableMonths = monthlyEarnings.map((m) => ({
    value: m.month,
    label: m.monthLabel,
  }))

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    if (monthFilter === 'all') return completedJobs
    return completedJobs.filter((job) => {
      const date = new Date(job.updated_at || job.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      return monthKey === monthFilter
    })
  }, [completedJobs, monthFilter])

  const totalEarnings = wallet?.total_earnings ?? 0
  const pendingEarnings = wallet?.pending_earnings ?? 0
  const availableBalance = wallet?.balance ?? 0
  const completedCount = wallet?.completed_jobs ?? completedJobs.length

  // Current month earnings
  const currentMonthKey = (() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })()
  const currentMonthData = monthlyEarnings.find((m) => m.month === currentMonthKey)
  const currentMonthEarnings = currentMonthData?.total ?? 0
  const currentMonthJobs = currentMonthData?.count ?? 0

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Earnings</h1>
        <p className="mt-1 text-sm text-slate-500">Track your earnings and completed jobs.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-50">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Earnings</p>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(totalEarnings)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
              <Wallet className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Available Balance</p>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(availableBalance)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50">
              <IndianRupee className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">This Month</p>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(currentMonthEarnings)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50">
              <CheckCircle2 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Completed Jobs</p>
              <p className="text-xl font-bold text-slate-900">{completedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Monthly Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {monthlyEarnings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BarChart3 className="h-10 w-10 text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">No earnings data yet</p>
              <p className="text-xs text-slate-400">Complete jobs to see your monthly earnings here.</p>
            </div>
          ) : (
            monthlyEarnings.map((m) => {
              const maxTotal = Math.max(...monthlyEarnings.map((x) => x.total), 1)
              const barWidth = (m.total / maxTotal) * 100
              return (
                <div key={m.month} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{m.monthLabel}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">{m.count} job{m.count !== 1 ? 's' : ''}</span>
                      <span className="font-semibold text-slate-900">{formatCurrency(m.total)}</span>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        m.month === currentMonthKey ? 'bg-blue-600' : 'bg-blue-400',
                      )}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Completed Jobs List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Completed Jobs</CardTitle>
          {availableMonths.length > 0 && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <Select
                value={monthFilter}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setMonthFilter(e.target.value)}
                className="w-44"
              >
                <option value="all">All Months</option>
                {availableMonths.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Wrench className="h-10 w-10 text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">
                {completedJobs.length === 0 ? 'No completed jobs yet' : 'No jobs in this period'}
              </p>
              <p className="text-xs text-slate-400">
                {completedJobs.length === 0
                  ? 'Your completed jobs and earnings will appear here.'
                  : 'Try a different month filter.'}
              </p>
            </div>
          ) : (
            filteredJobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                    <Wrench className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{job.service_name}</p>
                    <p className="text-xs text-slate-500">
                      #{job.booking_number} · {formatDate(job.updated_at || job.created_at)}
                    </p>
                    <p className="text-xs text-slate-400">{job.city}, {job.district}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={cn(BOOKING_STATUS_COLORS['completed'])}>
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Completed
                  </Badge>
                  <p className="text-lg font-bold text-slate-900">
                    {formatCurrency(Number(job.amount))}
                  </p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
