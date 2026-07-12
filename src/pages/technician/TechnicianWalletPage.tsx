import { useEffect, useState } from 'react'
import { Wallet, Loader as Loader2, CircleCheck as CheckCircle2, Clock, CircleArrowDown as ArrowDownCircle, CircleArrowUp as ArrowUpCircle, IndianRupee, ShieldCheck, TrendingUp, Gift } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth'
import { supabase, type TechnicianWallet, type RevenueTransaction } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { cn, formatDate, formatCurrency } from '@/lib/utils'
import { VERIFICATION_FEE, REFUND_ELIGIBLE_JOBS } from '@/lib/constants'

const REFUND_STATUS_LABELS: Record<string, string> = {
  not_eligible: 'Not Eligible',
  eligible: 'Eligible',
  approved: 'Approved',
  rejected: 'Rejected',
  processed: 'Processed',
  completed: 'Completed',
}

const REFUND_STATUS_COLORS: Record<string, string> = {
  not_eligible: 'bg-gray-100 text-gray-700',
  eligible: 'bg-amber-100 text-amber-700',
  approved: 'bg-blue-100 text-blue-700',
  rejected: 'bg-red-100 text-red-700',
  processed: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
}

export default function TechnicianWalletPage() {
  const { profile, session } = useAuth()
  const toast = useToast()

  const [wallet, setWallet] = useState<TechnicianWallet | null>(null)
  const [transactions, setTransactions] = useState<RevenueTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)

  const userId = profile?.id || session?.user?.id

  const loadWallet = async () => {
    if (!userId) return
    try {
      const [walletRes, txnRes] = await Promise.all([
        supabase
          .from('technician_wallets')
          .select('*')
          .eq('technician_id', userId)
          .maybeSingle(),
        supabase
          .from('revenue_transactions')
          .select('*')
          .eq('technician_id', userId)
          .order('created_at', { ascending: false })
          .limit(50),
      ])

      setWallet((walletRes.data as TechnicianWallet) || null)
      setTransactions((txnRes.data as RevenueTransaction[]) || [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWallet()
  }, [userId])

  const handlePayVerificationFee = async () => {
    setPaying(true)
    try {
      // Record a verification payment and update the wallet
      const { error: payError } = await supabase.from('verification_payments').insert({
        technician_id: userId,
        amount: VERIFICATION_FEE,
        payment_method: 'upi',
        payment_status: 'paid',
        payment_date: new Date().toISOString(),
      })
      if (payError) throw payError

      // Update wallet
      if (wallet) {
        const { error: walletError } = await supabase
          .from('technician_wallets')
          .update({
            verification_fee_paid: true,
            verification_fee_paid_at: new Date().toISOString(),
          })
          .eq('id', wallet.id)
        if (walletError) throw walletError
      }

      toast.success('Payment successful', `Verification fee of ${formatCurrency(VERIFICATION_FEE)} paid.`)
      loadWallet()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed.'
      toast.error('Payment failed', message)
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  const balance = wallet?.balance ?? 0
  const totalEarnings = wallet?.total_earnings ?? 0
  const pendingEarnings = wallet?.pending_earnings ?? 0
  const completedJobs = wallet?.completed_jobs ?? 0
  const totalJobs = wallet?.total_jobs ?? 0
  const feePaid = wallet?.verification_fee_paid ?? false
  const refundStatus = wallet?.refund_status ?? 'not_eligible'
  // Null guard for refund_amount — may be null in DB
  const refundAmount = wallet?.refund_amount ?? 0
  const isRefundEligible = completedJobs >= REFUND_ELIGIBLE_JOBS

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Wallet</h1>
        <p className="mt-1 text-sm text-slate-500">Track your balance, verification fee, and transactions.</p>
      </div>

      {/* Wallet Balance Card */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-0">
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm text-blue-100">Available Balance</p>
            <p className="mt-1 text-3xl font-bold">{formatCurrency(balance)}</p>
            <div className="mt-3 flex gap-4 text-xs text-blue-100">
              <span>Pending: {formatCurrency(pendingEarnings)}</span>
              <span>Total Earned: {formatCurrency(totalEarnings)}</span>
            </div>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
            <Wallet className="h-8 w-8 text-white" />
          </div>
        </CardContent>
      </Card>

      {/* Verification Fee & Refund */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Verification Fee */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              Verification Fee
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Amount</span>
              <span className="font-semibold text-slate-900">{formatCurrency(VERIFICATION_FEE)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Status</span>
              {feePaid ? (
                <Badge color="green">
                  <CheckCircle2 className="mr-1 h-3 w-3" /> Paid
                </Badge>
              ) : (
                <Badge color="amber">
                  <Clock className="mr-1 h-3 w-3" /> Pending
                </Badge>
              )}
            </div>
            {wallet?.verification_fee_paid_at && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Paid On</span>
                <span className="text-sm text-slate-700">{formatDate(wallet.verification_fee_paid_at)}</span>
              </div>
            )}
            {!feePaid && (
              <Button onClick={handlePayVerificationFee} disabled={paying} className="w-full">
                {paying ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <IndianRupee className="mr-1 h-4 w-4" />
                )}
                Pay {formatCurrency(VERIFICATION_FEE)} Fee
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Refund Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-amber-600" />
              Fee Refund Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Eligibility</span>
              <span className="text-sm font-medium text-slate-700">
                {completedJobs} / {REFUND_ELIGIBLE_JOBS} completed jobs
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Refund Status</span>
              <Badge className={cn(REFUND_STATUS_COLORS[refundStatus] || 'bg-gray-100 text-gray-700')}>
                {REFUND_STATUS_LABELS[refundStatus] || refundStatus}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Refund Amount</span>
              <span className="font-semibold text-slate-900">{formatCurrency(refundAmount)}</span>
            </div>
            <div
              className={cn(
                'rounded-lg p-3 text-xs',
                isRefundEligible ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-500',
              )}
            >
              {isRefundEligible
                ? 'You are eligible for a refund of the verification fee!'
                : `Complete ${REFUND_ELIGIBLE_JOBS - completedJobs} more job(s) to become eligible for a refund.`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Pending Earnings</p>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(pendingEarnings)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50">
              <CheckCircle2 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Jobs Completed</p>
              <p className="text-xl font-bold text-slate-900">{completedJobs} / {totalJobs}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Wallet className="h-10 w-10 text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">No transactions yet</p>
              <p className="text-xs text-slate-400">Your earnings and payments will appear here.</p>
            </div>
          ) : (
            transactions.map((txn) => {
              const isCredit = txn.transaction_type === 'earning' || txn.transaction_type === 'refund'
              return (
                <div
                  key={txn.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg',
                        isCredit ? 'bg-green-50' : 'bg-red-50',
                      )}
                    >
                      {isCredit ? (
                        <ArrowDownCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <ArrowUpCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 capitalize">
                        {txn.transaction_type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDate(txn.created_at)}
                        {txn.description && ` · ${txn.description}`}
                      </p>
                    </div>
                  </div>
                  <p
                    className={cn(
                      'text-sm font-semibold',
                      isCredit ? 'text-green-600' : 'text-red-600',
                    )}
                  >
                    {isCredit ? '+' : '-'}
                    {formatCurrency(Number(txn.amount))}
                  </p>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
