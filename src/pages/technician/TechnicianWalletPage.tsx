import { useEffect, useState } from 'react'
import { Wallet, TrendingUp, Clock, Briefcase, CircleCheck as CheckCircle, RotateCcw, CreditCard } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { TechnicianWallet } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/LoadingScreen'
import { cn, formatCurrency, formatDateTime } from '@/lib/utils'
import { VERIFICATION_FEE, REFUND_ELIGIBLE_JOBS } from '@/lib/constants'

const REFUND_STATUS_COLORS: Record<string, string> = {
  not_eligible: 'bg-gray-100 text-gray-700',
  eligible: 'bg-blue-100 text-blue-700',
  approved: 'bg-cyan-100 text-cyan-700',
  rejected: 'bg-red-100 text-red-700',
  processed: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
}
const REFUND_STATUS_LABELS: Record<string, string> = {
  not_eligible: 'Not Eligible', eligible: 'Eligible', approved: 'Approved',
  rejected: 'Rejected', processed: 'Processing', completed: 'Completed',
}

export function TechnicianWalletPage() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [wallet, setWallet] = useState<TechnicianWallet | null>(null)

  useEffect(() => {
    if (!profile) return
    let mounted = true;
    (async () => {
      const { data } = await supabase.from('technician_wallets').select('*').eq('technician_id', profile.id).maybeSingle()
      if (!mounted) return
      setWallet(data as TechnicianWallet | null)
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [profile])

  if (loading) return <LoadingScreen message="Loading wallet..." />
  if (!profile) return null

  const completedJobs = wallet?.completed_jobs || 0
  const progressPct = Math.min(100, (completedJobs / REFUND_ELIGIBLE_JOBS) * 100)
  const showRefund = wallet?.refund_status && wallet.refund_status !== 'not_eligible'

  const statCards = [
    { label: 'Wallet Balance', value: formatCurrency(wallet?.balance || 0), icon: Wallet, color: 'text-blue-600 bg-blue-100' },
    { label: 'Total Earnings', value: formatCurrency(wallet?.total_earnings || 0), icon: TrendingUp, color: 'text-green-600 bg-green-100' },
    { label: 'Pending Earnings', value: formatCurrency(wallet?.pending_earnings || 0), icon: Clock, color: 'text-amber-600 bg-amber-100' },
    { label: 'Total Jobs', value: wallet?.total_jobs || 0, icon: Briefcase, color: 'text-purple-600 bg-purple-100' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Wallet</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 py-4">
              <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg', s.color)}><s.icon className="h-6 w-6" /></div>
              <div><p className="text-2xl font-bold text-gray-900">{s.value}</p><p className="text-sm text-gray-500">{s.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Verification Fee */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />Verification Fee</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Fee Amount</span>
              <span className="font-semibold">{formatCurrency(wallet?.verification_fee_amount || VERIFICATION_FEE)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Status</span>
              {wallet?.verification_fee_paid ? (
                <Badge color="bg-green-100 text-green-700"><CheckCircle className="mr-1 h-3 w-3" />Paid</Badge>
              ) : (
                <Badge color="bg-amber-100 text-amber-700">Pending</Badge>
              )}
            </div>
            {wallet?.verification_fee_paid && wallet.verification_fee_paid_at && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Paid On</span>
                <span className="text-sm">{formatDateTime(wallet.verification_fee_paid_at)}</span>
              </div>
            )}
            {!wallet?.verification_fee_paid && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 space-y-2">
                <p className="font-medium text-amber-800">Pay {formatCurrency(VERIFICATION_FEE)} Verification Fee</p>
                <p className="text-sm text-amber-700">Pay via UPI to activate your technician account.</p>
                <div className="rounded-md bg-white p-3 text-sm">
                  <p className="text-gray-500">UPI ID</p>
                  <p className="font-mono font-semibold text-gray-900">vattams@upi</p>
                </div>
                <p className="text-xs text-amber-600">After payment, your account will be verified by our team. Contact support with your transaction ID.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Refund Status */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><RotateCcw className="h-5 w-5" />Refund Status</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Status</span>
              <Badge color={REFUND_STATUS_COLORS[wallet?.refund_status || 'not_eligible']}>
                {REFUND_STATUS_LABELS[wallet?.refund_status || 'not_eligible']}
              </Badge>
            </div>
            {showRefund && (
              <>
                {wallet?.refund_amount ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Refund Amount</span>
                    <span className="font-semibold">{formatCurrency(wallet.refund_amount)}</span>
                  </div>
                ) : null}
                {wallet?.refund_method && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Method</span>
                    <span className="text-sm">{wallet.refund_method}</span>
                  </div>
                )}
                {wallet?.refund_processed_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Processed On</span>
                    <span className="text-sm">{formatDateTime(wallet.refund_processed_at)}</span>
                  </div>
                )}
                {wallet?.refund_completed_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Completed On</span>
                    <span className="text-sm">{formatDateTime(wallet.refund_completed_at)}</span>
                  </div>
                )}
              </>
            )}
            {!showRefund && (
              <p className="text-sm text-gray-500">Complete {REFUND_ELIGIBLE_JOBS} jobs to become eligible for a refund of your verification fee.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Refund Eligibility Progress */}
      <Card>
        <CardHeader><CardTitle>Refund Eligibility Progress</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Completed Jobs</span>
            <span className="font-semibold">{completedJobs} / {REFUND_ELIGIBLE_JOBS}</span>
          </div>
          <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200">
            <div className={cn('h-full rounded-full transition-all', progressPct >= 100 ? 'bg-green-500' : 'bg-blue-600')} style={{ width: `${progressPct}%` }} />
          </div>
          <p className="text-sm text-gray-500">
            {progressPct >= 100
              ? 'Congratulations! You are eligible for a refund of your verification fee.'
              : `${REFUND_ELIGIBLE_JOBS - completedJobs} more job${REFUND_ELIGIBLE_JOBS - completedJobs !== 1 ? 's' : ''} to go for refund eligibility.`}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
