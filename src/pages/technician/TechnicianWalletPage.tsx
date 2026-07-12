import { useEffect, useState } from 'react'
import { Wallet, TrendingUp, Clock, CheckCircle, DollarSign, Award } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { TechnicianWallet } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/LoadingScreen'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { VERIFICATION_FEE, REFUND_ELIGIBLE_JOBS } from '@/lib/constants'
import { createNotification, createAuditLog } from '@/lib/notifications'

export function TechnicianWalletPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [wallet, setWallet] = useState<TechnicianWallet | null>(null)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!profile) return
      const { data: w } = await supabase.from('technician_wallets').select('*').eq('technician_id', profile.id).maybeSingle()
      if (mounted) { setWallet(w as TechnicianWallet); setLoading(false) }
    })()
    return () => { mounted = false }
  }, [profile])

  const payVerificationFee = async () => {
    if (!profile || !wallet) return
    setPaying(true)
    const { error } = await supabase.from('technician_wallets').update({
      verification_fee_paid: true, verification_fee_paid_at: new Date().toISOString(),
    }).eq('id', wallet.id)
    if (error) { setPaying(false); toast('Payment failed', 'error'); return }
    await supabase.from('verification_payments').insert({ technician_id: profile.id, amount: VERIFICATION_FEE, payment_method: 'upi', payment_status: 'paid', payment_date: new Date().toISOString() })
    await supabase.from('profiles').update({ verification_status: 'under_review' }).eq('id', profile.id)
    await createNotification(profile.id, 'Verification Fee Paid', 'Your verification fee has been paid. Your account is now under review.', 'payment')
    await createAuditLog(profile.id, 'verification_fee_paid', 'wallet', wallet.id, `₹${VERIFICATION_FEE} paid`)
    setWallet({ ...wallet, verification_fee_paid: true, verification_fee_paid_at: new Date().toISOString() })
    toast('Verification fee paid successfully!', 'success')
    setPaying(false)
  }

  if (loading) return <LoadingScreen message="Loading wallet..." />

  const refundProgress = wallet ? Math.min((wallet.completed_jobs / REFUND_ELIGIBLE_JOBS) * 100, 100) : 0

  const statCards = [
    { label: 'Wallet Balance', value: formatCurrency(wallet?.balance || 0), icon: Wallet, color: 'text-blue-600 bg-blue-50' },
    { label: 'Total Earnings', value: formatCurrency(wallet?.total_earnings || 0), icon: TrendingUp, color: 'text-green-600 bg-green-50' },
    { label: 'Pending Earnings', value: formatCurrency(wallet?.pending_earnings || 0), icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: 'Total Jobs', value: wallet?.total_jobs || 0, icon: CheckCircle, color: 'text-purple-600 bg-purple-50' },
  ]

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">My Wallet</h1>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => { const Icon = s.icon; return (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`rounded-lg p-3 ${s.color}`}><Icon className="h-6 w-6" /></div>
              <div><p className="text-sm text-gray-600">{s.label}</p><p className="text-xl font-bold text-gray-900">{s.value}</p></div>
            </CardContent>
          </Card>
        )})}
      </div>

      {wallet && !wallet.verification_fee_paid && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-amber-600" />
              <div>
                <p className="font-medium text-gray-900">Verification Fee Pending</p>
                <p className="text-sm text-gray-600">Pay ₹{VERIFICATION_FEE} to activate your account</p>
              </div>
            </div>
            <Button onClick={payVerificationFee} disabled={paying}>{paying ? 'Processing...' : `Pay ₹${VERIFICATION_FEE}`}</Button>
          </CardContent>
        </Card>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Verification Fee</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Amount</span>
              <span className="font-medium">{formatCurrency(wallet?.verification_fee_amount || VERIFICATION_FEE)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-gray-600">Status</span>
              <Badge color={wallet?.verification_fee_paid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>{wallet?.verification_fee_paid ? 'Paid' : 'Pending'}</Badge>
            </div>
            {wallet?.verification_fee_paid_at && <p className="mt-2 text-xs text-gray-500">Paid on {formatDateTime(wallet.verification_fee_paid_at)}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Refund Status</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Status</span>
              <Badge color={wallet?.refund_status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>{wallet?.refund_status?.replace(/_/g, ' ') || 'N/A'}</Badge>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Refund Eligibility</span>
                <span className="font-medium">{wallet?.completed_jobs || 0} / {REFUND_ELIGIBLE_JOBS} jobs</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${refundProgress}%` }} />
              </div>
              {wallet && wallet.refund_amount && wallet.refund_amount > 0 && <p className="mt-2 text-sm text-gray-600">Refund Amount: {formatCurrency(wallet.refund_amount)}</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Completed Jobs</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Award className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{wallet?.completed_jobs || 0}</p>
              <p className="text-sm text-gray-600">Total completed jobs</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
