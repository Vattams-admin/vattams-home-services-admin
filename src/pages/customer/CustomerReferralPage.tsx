import { useEffect, useState } from 'react'
import {
  Users,
  Gift,
  Copy,
  Share2,
  Check,
  Loader2,
  Award,
  TrendingUp,
  Mail,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth'
import { supabase, type ReferralCode, type Referral } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { cn, formatDate, formatCurrency } from '@/lib/utils'

const REFERRAL_REWARD = 100 // ₹100 reward per successful referral

export default function CustomerReferralPage() {
  const { profile, session } = useAuth()
  const toast = useToast()

  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const userId = profile?.id || session?.user?.id

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    async function load() {
      try {
        const [codeRes, refRes] = await Promise.all([
          supabase.from('referral_codes').select('*').eq('user_id', userId).maybeSingle(),
          supabase.from('referrals').select('*').eq('referrer_id', userId).order('created_at', { ascending: false }),
        ])
        if (cancelled) return
        setReferralCode((codeRes.data as ReferralCode) || null)
        setReferrals((refRes.data as Referral[]) || [])
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

  const handleCopy = () => {
    if (!referralCode) return
    navigator.clipboard.writeText(referralCode.code).then(() => {
      setCopied(true)
      toast.success('Copied!', 'Referral code copied to clipboard.')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleShare = async () => {
    if (!referralCode) return
    const shareUrl = `${window.location.origin}/register?ref=${referralCode.code}`
    const shareText = `Use my referral code ${referralCode.code} to get started with VATTAMS Home Services! ${shareUrl}`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'VATTAMS Home Services', text: shareText, url: shareUrl })
      } catch {
        // user cancelled
      }
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        toast.success('Share link copied!', 'Share it with your friends.')
      })
    }
  }

  const handleGenerateCode = async () => {
    if (!userId) return
    try {
      const code = `VATTAM${profile?.name?.slice(0, 3).toUpperCase() || 'USR'}${Math.random().toString(36).slice(2, 6).toUpperCase()}`
      const { data, error } = await supabase
        .from('referral_codes')
        .insert({ user_id: userId, code, is_active: true })
        .select()
        .single()
      if (error) throw error
      setReferralCode(data as ReferralCode)
      toast.success('Referral code generated!', `Your code is ${code}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate code.'
      toast.error('Failed', message)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  const completedReferrals = referrals.filter((r) => r.status === 'completed').length
  const pendingReferrals = referrals.filter((r) => r.status !== 'completed').length
  const totalRewards = referrals
    .filter((r) => r.reward_status === 'credited' || r.reward_status === 'completed')
    .reduce((sum, r) => sum + Number(r.reward_amount), 0)

  const shareUrl = referralCode
    ? `${window.location.origin}/register?ref=${referralCode.code}`
    : ''

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Refer & Earn</h1>
        <p className="mt-1 text-sm text-slate-500">
          Invite friends to VATTAMS and earn {formatCurrency(REFERRAL_REWARD)} for each successful referral.
        </p>
      </div>

      {/* Referral Code Card */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-amber-600" /> Your Referral Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {referralCode ? (
            <>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-lg border-2 border-dashed border-amber-300 bg-white px-4 py-3 text-center">
                  <p className="text-2xl font-bold tracking-widest text-amber-700">{referralCode.code}</p>
                </div>
                <Button variant="outline" onClick={handleCopy} className="border-amber-300 hover:bg-amber-100">
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleShare} className="flex-1 bg-amber-600 hover:bg-amber-700">
                  <Share2 className="mr-1 h-4 w-4" /> Share Link
                </Button>
              </div>
              <div className="rounded-lg bg-white/60 p-3 text-center">
                <p className="text-xs text-slate-500">Share this link:</p>
                <p className="mt-1 truncate text-sm font-medium text-amber-700">{shareUrl}</p>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center py-4 text-center">
              <Users className="h-10 w-10 text-amber-400" />
              <p className="mt-2 text-sm text-slate-600">You don't have a referral code yet.</p>
              <Button onClick={handleGenerateCode} className="mt-3 bg-amber-600 hover:bg-amber-700">
                Generate Referral Code
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-50">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Completed</p>
              <p className="text-2xl font-bold text-slate-900">{completedReferrals}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50">
              <TrendingUp className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Pending</p>
              <p className="text-2xl font-bold text-slate-900">{pendingReferrals}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50">
              <Award className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Rewards Earned</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalRewards)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referrals List */}
      <Card>
        <CardHeader>
          <CardTitle>Referral History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {referrals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Mail className="h-10 w-10 text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">No referrals yet</p>
              <p className="text-xs text-slate-400">Share your code with friends to start earning.</p>
            </div>
          ) : (
            referrals.map((ref) => (
              <div
                key={ref.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                    <Users className="h-5 w-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {ref.referred_name || ref.referred_email || 'Anonymous'}
                    </p>
                    <p className="text-xs text-slate-500">{formatDate(ref.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">
                      {formatCurrency(Number(ref.reward_amount))}
                    </p>
                    <Badge
                      className={cn(
                        'capitalize',
                        ref.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700',
                      )}
                    >
                      {ref.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
