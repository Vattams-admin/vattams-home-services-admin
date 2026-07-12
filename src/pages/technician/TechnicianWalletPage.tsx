import { useEffect, useState } from 'react'
import { Wallet, BadgeCheck, TrendingUp, Clock, Briefcase, CheckCircle, ArrowRightCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { TechnicianWallet } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { LoadingScreen } from '@/components/LoadingScreen'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { VERIFICATION_FEE, REFUND_ELIGIBLE_JOBS, whatsappSupportLink } from '@/lib/constants'

const REFUND_STATUS_COLORS: Record<string, string> = {
  not_eligible: 'bg-gray-100 text-gray-700',
  eligible: 'bg-blue-100 text-blue-700',
  approved: 'bg-indigo-100 text-indigo-700',
  rejected: 'bg-red-100 text-red-700',
  processed: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
}

const REFUND_STATUS_LABELS: Record<string, string> = {
  not_eligible: 'Not Eligible',
  eligible: 'Eligible',
  approved: 'Approved',
  rejected: 'Rejected',
  processed: 'Processing',
  completed: 'Completed',
}

export function TechnicianWalletPage() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [wallet, setWallet] = useState<TechnicianWallet | null>(null)

  useEffect(() => {
    if (!profile) return
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from('technician_wallets').select('*').eq('technician_id', profile.id).maybeSingle()
      if (mounted) { setWallet(data as TechnicianWallet | null); setLoading(false) }
    })()
    return () => { mounted = false }
  }, [profile])

  if (loading) return <LoadingScreen />

  if (!wallet) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">My Wallet</h1>
        <Card><CardContent className="py-12 text-center text-gray-500">Wallet not found. Please contact support.</CardContent></Card>
      </div>
    )
  }

  const progressPct = Math.min((wallet.completed_jobs / REFUND_ELIGIBLE_JOBS) * 100, 100)

  const cards = [
    { label: 'Wallet Balance', value: formatCurrency(wallet.balance), icon: Wallet, color: 'text-blue-600 bg-blue-50' },
    { label: 'Total Earnings', value: formatCurrency(wallet.total_earnings), icon: TrendingUp, color: 'text-green-600 bg-green-50' },
    { label: 'Pending Earnings', value: formatCurrency(wallet.pending_earnings), icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: 'Total Jobs', value: wallet.total_jobs, icon: Briefcase, color: 'text-purple-600 bg-purple-50' },
    { label: 'Completed Jobs', value: wallet.completed_jobs, icon: CheckCircle, color: 'text-indigo-600 bg-indigo-50' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Wallet</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${s.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{s.label}</p>
                  <p className="text-xl font-bold text-gray-900">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Verification Fee Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BadgeCheck className="h-5 w-5 text-blue-600" />Verification Fee</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Fee Amount</span>
            <span className="font-semibold text-gray-900">{formatCurrency(wallet.verification_fee_amount || VERIFICATION_FEE)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Payment Status</span>
            {wallet.verification_fee_paid ? (
              <Badge color="bg-green-100 text-green-700">Paid {wallet.verification_fee_paid_at && `on ${formatDate(wallet.verification_fee_paid_at)}`}</Badge>
            ) : (
              <Badge color="bg-red-100 text-red-700">Unpaid</Badge>
            )}
          </div>
          {!wallet.verification_fee_paid && (
            <div className="rounded-lg bg-blue-50 p-4 space-y-3">
              <p className="text-sm font-medium text-blue-900">Pay ₹{VERIFICATION_FEE} Verification Fee</p>
              <p className="text-sm text-blue-700">Complete your verification by paying the one-time fee. Contact us on WhatsApp to make the payment.</p>
              <a href={whatsappSupportLink(`I want to pay the ₹${VERIFICATION_FEE} verification fee. My technician ID is ${profile?.id}.`)} target="_blank" rel="noreferrer">
                <Button className="w-full"><BadgeCheck className="mr-2 h-4 w-4" />Pay via WhatsApp</Button>
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Refund Progress Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ArrowRightCircle className="h-5 w-5 text-blue-600" />Refund Eligibility</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Refund Status</span>
            <Badge color={REFUND_STATUS_COLORS[wallet.refund_status]}>{REFUND_STATUS_LABELS[wallet.refund_status]}</Badge>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-gray-600">Progress to eligibility</span>
              <span className="font-medium text-gray-900">{wallet.completed_jobs} / {REFUND_ELIGIBLE_JOBS} jobs</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
              <div className={cn('h-full rounded-full transition-all', progressPct >= 100 ? 'bg-green-500' : 'bg-blue-600')} style={{ width: `${progressPct}%` }} />
            </div>
            {progressPct < 100 && (
              <p className="mt-1 text-xs text-gray-500">Complete {REFUND_ELIGIBLE_JOBS - wallet.completed_jobs} more job(s) to become eligible for refund.</p>
            )}
          </div>
          {wallet.refund_status !== 'not_eligible' && (
            <div className="space-y-2 rounded-lg bg-gray-50 p-4">
              <Row label="Refund Amount" value={formatCurrency(wallet.refund_amount)} />
              <Row label="Refund Method" value={wallet.refund_method || '—'} />
              {wallet.refund_processed_at && <Row label="Processed At" value={formatDate(wallet.refund_processed_at)} />}
              {wallet.refund_completed_at && <Row label="Completed At" value={formatDate(wallet.refund_completed_at)} />}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex justify-between gap-4"><span className="text-sm text-gray-500">{label}</span><span className="text-right text-sm font-medium text-gray-900">{value}</span></div>
}
