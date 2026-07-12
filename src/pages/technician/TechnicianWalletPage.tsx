import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { TechnicianWallet } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { cn, formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/LoadingScreen'
import { VERIFICATION_FEE, REFUND_ELIGIBLE_JOBS } from '@/lib/constants'
import { Wallet, CheckCircle, Clock, TrendingUp, DollarSign, Briefcase, Award, Info } from 'lucide-react'

const REFUND_STATUS_COLORS: Record<string, string> = {
  not_eligible: 'bg-gray-100 text-gray-700',
  eligible: 'bg-blue-100 text-blue-700',
  approved: 'bg-cyan-100 text-cyan-700',
  rejected: 'bg-red-100 text-red-700',
  processed: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
}

const REFUND_STATUS_LABELS: Record<string, string> = {
  not_eligible: 'Not Eligible',
  eligible: 'Eligible',
  approved: 'Approved',
  rejected: 'Rejected',
  processed: 'Processed',
  completed: 'Completed',
}

export function TechnicianWalletPage() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [wallet, setWallet] = useState<TechnicianWallet | null>(null)

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!profile) return
      const { data } = await supabase
        .from('technician_wallets')
        .select('*')
        .eq('technician_id', profile.id)
        .maybeSingle()
      if (mounted && data) setWallet(data as TechnicianWallet)
      if (mounted) setLoading(false)
    })()
    return () => { mounted = false }
  }, [profile])

  if (loading) return <LoadingScreen message="Loading wallet..." />

  if (!wallet) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">My Wallet</h1>
        <Card><CardContent className="py-12 text-center text-gray-500">No wallet found. Please contact support.</CardContent></Card>
      </div>
    )
  }

  const progressPercent = Math.min((wallet.completed_jobs / REFUND_ELIGIBLE_JOBS) * 100, 100)
  const showRefund = wallet.refund_status !== 'not_eligible'

  const statCards = [
    { label: 'Wallet Balance', value: formatCurrency(wallet.balance), icon: Wallet, color: 'text-blue-600 bg-blue-50' },
    { label: 'Total Earnings', value: formatCurrency(wallet.total_earnings), icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
    { label: 'Pending Earnings', value: formatCurrency(wallet.pending_earnings), icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: 'Total Jobs', value: wallet.total_jobs, icon: Briefcase, color: 'text-indigo-600 bg-indigo-50' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Wallet</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Verification Fee</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Amount</span>
              <span className="font-semibold text-gray-900">{formatCurrency(wallet.verification_fee_amount || VERIFICATION_FEE)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              {wallet.verification_fee_paid ? (
                <Badge color="bg-green-100 text-green-700"><CheckCircle className="mr-1 h-3 w-3" />Paid</Badge>
              ) : (
                <Badge color="bg-amber-100 text-amber-700">Pending</Badge>
              )}
            </div>
            {wallet.verification_fee_paid_at && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Paid On</span>
                <span className="text-sm text-gray-900">{formatDate(wallet.verification_fee_paid_at)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Completed Jobs</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Completed</span>
              <span className="font-semibold text-gray-900">{wallet.completed_jobs} jobs</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-gray-600">Refund eligibility: {wallet.completed_jobs}/{REFUND_ELIGIBLE_JOBS} jobs</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div className="bg-blue-600 h-3 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
            <p className="text-xs text-gray-500">
              {wallet.completed_jobs >= REFUND_ELIGIBLE_JOBS
                ? 'You are eligible for a verification fee refund!'
                : `${REFUND_ELIGIBLE_JOBS - wallet.completed_jobs} more job(s) needed for refund eligibility.`}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Refund Status</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Status</span>
            <Badge color={REFUND_STATUS_COLORS[wallet.refund_status]}>{REFUND_STATUS_LABELS[wallet.refund_status]}</Badge>
          </div>
          {showRefund && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Refund Amount</span>
                <span className="font-semibold text-gray-900">{formatCurrency(wallet.refund_amount)}</span>
              </div>
              {wallet.refund_method && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Method</span>
                  <span className="text-sm text-gray-900">{wallet.refund_method}</span>
                </div>
              )}
              {wallet.refund_processed_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Processed At</span>
                  <span className="text-sm text-gray-900">{formatDateTime(wallet.refund_processed_at)}</span>
                </div>
              )}
              {wallet.refund_completed_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Completed At</span>
                  <span className="text-sm text-gray-900">{formatDateTime(wallet.refund_completed_at)}</span>
                </div>
              )}
            </>
          )}
          {wallet.refund_status === 'not_eligible' && (
            <p className="text-sm text-gray-500">Complete {REFUND_ELIGIBLE_JOBS} jobs to become eligible for a refund of your verification fee.</p>
          )}
        </CardContent>
      </Card>

      {!wallet.verification_fee_paid && (
        <Card>
          <CardHeader><CardTitle>Pay Verification Fee</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Info className="h-4 w-4" />
              Pay the one-time verification fee to activate your technician account.
            </div>
            <div className="rounded-lg border border-gray-200 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Amount</span>
                <span className="font-bold text-gray-900">{formatCurrency(VERIFICATION_FEE)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">UPI ID</span>
                <span className="text-sm font-medium text-gray-900">vattams@upi</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <DollarSign className="h-4 w-4" />
                Pay via UPI using the ID above and contact support with your transaction ID.
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
