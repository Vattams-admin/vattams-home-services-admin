import { useEffect, useState } from 'react'
import { Copy, Share2, Users, CheckCircle, Gift } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { ReferralCode, Referral } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/LoadingScreen'
import { formatCurrency, formatDate } from '@/lib/utils'
import { whatsappTechnicianLink } from '@/lib/constants'

export function TechnicianReferralPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!profile) return
      let { data: code } = await supabase.from('referral_codes').select('*').eq('user_id', profile.id).maybeSingle()
      if (!code) {
        const newCode = `TECH${profile.id.slice(0, 6).toUpperCase()}`
        const { data: created } = await supabase.from('referral_codes').insert({ user_id: profile.id, code: newCode, is_active: true }).select().single()
        code = created
      }
      const { data: refs } = await supabase.from('referrals').select('*').eq('referrer_id', profile.id).order('created_at', { ascending: false })
      if (mounted) { setReferralCode(code as ReferralCode); setReferrals((refs as Referral[]) || []); setLoading(false) }
    })()
    return () => { mounted = false }
  }, [profile])

  const copyCode = () => {
    if (!referralCode) return
    navigator.clipboard.writeText(referralCode.code)
    setCopied(true)
    toast('Referral code copied!', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  const shareLink = `${window.location.origin}/register/technician?ref=${referralCode?.code || ''}`

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink)
    toast('Share link copied!', 'success')
  }

  if (loading) return <LoadingScreen message="Loading referrals..." />

  const totalReferrals = referrals.length
  const successful = referrals.filter((r) => r.status === 'completed').length
  const totalRewards = referrals.filter((r) => r.reward_status === 'paid').reduce((s, r) => s + r.reward_amount, 0)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Refer & Earn</h1>

      <Card className="mb-6 bg-gradient-to-br from-blue-50 to-purple-50">
        <CardContent className="p-6 text-center">
          <Gift className="mx-auto mb-3 h-12 w-12 text-purple-600" />
          <p className="mb-2 text-sm text-gray-600">Your Referral Code</p>
          <div className="mb-4 flex items-center justify-center gap-3">
            <span className="rounded-lg bg-white px-6 py-3 text-2xl font-bold tracking-wider text-blue-600 shadow-md">{referralCode?.code}</span>
            <Button size="sm" variant="outline" onClick={copyCode}>{copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}</Button>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <a href={whatsappTechnicianLink(`Join VATTAMS as a technician using my referral code ${referralCode?.code}! ${shareLink}`)} target="_blank" rel="noopener noreferrer">
              <Button><Share2 className="mr-2 h-4 w-4" /> Share on WhatsApp</Button>
            </a>
            <Button variant="outline" onClick={copyLink}><Copy className="mr-2 h-4 w-4" /> Copy Link</Button>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="rounded-lg bg-blue-50 p-3"><Users className="h-6 w-6 text-blue-600" /></div><div><p className="text-sm text-gray-600">Total Referrals</p><p className="text-xl font-bold text-gray-900">{totalReferrals}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="rounded-lg bg-green-50 p-3"><CheckCircle className="h-6 w-6 text-green-600" /></div><div><p className="text-sm text-gray-600">Successful</p><p className="text-xl font-bold text-gray-900">{successful}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="rounded-lg bg-purple-50 p-3"><Gift className="h-6 w-6 text-purple-600" /></div><div><p className="text-sm text-gray-600">Total Rewards</p><p className="text-xl font-bold text-gray-900">{formatCurrency(totalRewards)}</p></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Referral History</CardTitle></CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <p className="py-8 text-center text-gray-500">No referrals yet. Share your code to start earning!</p>
          ) : (
            <div className="space-y-3">
              {referrals.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                  <div>
                    <p className="font-medium text-gray-900">{r.referred_name || r.referred_email || 'Anonymous'}</p>
                    <p className="text-sm text-gray-500">{formatDate(r.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(r.reward_amount)}</span>
                    <Badge color={r.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>{r.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
