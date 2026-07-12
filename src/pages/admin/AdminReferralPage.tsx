import { useEffect, useState } from 'react'
import { Users, CheckCircle, Clock, Gift, Download, Trophy } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Referral, ReferralCode, Profile } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { createNotification, createAuditLog } from '@/lib/notifications'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { LoadingScreen } from '@/components/LoadingScreen'
import { exportToCSV } from '@/lib/pdf'
import { formatCurrency, formatDate } from '@/lib/utils'

export function AdminReferralPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [codes, setCodes] = useState<ReferralCode[]>([])
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})
  const [rewardModal, setRewardModal] = useState<Referral | null>(null)
  const [newRewardStatus, setNewRewardStatus] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: refs } = await supabase.from('referrals').select('*').order('created_at', { ascending: false })
      const { data: cds } = await supabase.from('referral_codes').select('*')
      const { data: profs } = await supabase.from('profiles').select('*')
      const pMap: Record<string, Profile> = {}
      ;(profs as Profile[] || []).forEach((p) => { pMap[p.id] = p })
      if (mounted) { setReferrals((refs as Referral[]) || []); setCodes((cds as ReferralCode[]) || []); setProfiles(pMap); setLoading(false) }
    })()
    return () => { mounted = false }
  }, [])

  if (loading) return <LoadingScreen message="Loading referrals..." />

  const total = referrals.length
  const successful = referrals.filter((r) => r.status === 'completed').length
  const pending = referrals.filter((r) => r.status !== 'completed').length
  const totalRewards = referrals.filter((r) => r.reward_status === 'credited' || r.reward_status === 'paid').reduce((s, r) => s + r.reward_amount, 0)

  const stats = [
    { label: 'Total Referrals', value: total, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Successful', value: successful, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
    { label: 'Pending', value: pending, icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: 'Rewards Paid', value: formatCurrency(totalRewards), icon: Gift, color: 'text-purple-600 bg-purple-50' },
  ]

  const referrerCounts: Record<string, { name: string; count: number; rewards: number }> = {}
  referrals.forEach((r) => {
    const ref = profiles[r.referrer_id]
    if (ref) {
      if (!referrerCounts[r.referrer_id]) referrerCounts[r.referrer_id] = { name: ref.name, count: 0, rewards: 0 }
      referrerCounts[r.referrer_id].count++
      if (r.reward_status === 'credited' || r.reward_status === 'paid') referrerCounts[r.referrer_id].rewards += r.reward_amount
    }
  })
  const leaderboard = Object.entries(referrerCounts).sort((a, b) => b[1].count - a[1].count).slice(0, 5)

  const updateReward = async () => {
    if (!rewardModal || !newRewardStatus) return
    setActionLoading(true)
    const { error } = await supabase.from('referrals').update({ reward_status: newRewardStatus }).eq('id', rewardModal.id)
    setActionLoading(false)
    if (error) { toast('Failed to update reward status', 'error'); return }
    if (profile) await createAuditLog(profile.id, 'reward_update', 'referral', rewardModal.id, `Updated reward to ${newRewardStatus}`)
    await createNotification(rewardModal.referrer_id, 'Reward Status Updated', `Your referral reward has been ${newRewardStatus}.`, 'info')
    setReferrals((prev) => prev.map((r) => r.id === rewardModal.id ? { ...r, reward_status: newRewardStatus } : r))
    toast('Reward status updated', 'success')
    setRewardModal(null); setNewRewardStatus('')
  }

  const exportCSV = () => {
    const rows = referrals.map((r) => [profiles[r.referrer_id]?.name || 'Unknown', r.referred_name || r.referred_email || 'N/A', r.referral_code, r.referral_type, r.status, r.reward_status, r.reward_amount, formatDate(r.created_at)])
    exportToCSV('referrals-report', ['Referrer', 'Referred', 'Code', 'Type', 'Status', 'Reward Status', 'Reward Amount', 'Date'], rows)
    toast('CSV exported', 'success')
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="referral text-2xl font-bold text-gray-900">Referral Analytics</h1>
        <Button variant="outline" onClick={exportCSV}><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => { const Icon = s.icon; return (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`rounded-lg p-2.5 ${s.color}`}><Icon className="h-5 w-5" /></div>
              <div><p className="text-xs text-gray-600">{s.label}</p><p className="text-lg font-bold text-gray-900">{s.value}</p></div>
            </CardContent>
          </Card>
        )})}
      </div>

      {leaderboard.length > 0 && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-base"><Trophy className="mr-2 inline h-4 w-4 text-amber-500" /> Top Referrers</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {leaderboard.map(([id, data], i) => (
                <div key={id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-400">#{i + 1}</span>
                    <span className="font-medium text-gray-900">{data.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge color="bg-blue-100 text-blue-700">{data.count} referrals</Badge>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(data.rewards)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Referral List ({referrals.length})</CardTitle></CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <p className="py-8 text-center text-gray-500">No referrals yet.</p>
          ) : (
            <div className="space-y-2">
              {referrals.map((r) => (
                <div key={r.id} className="flex flex-col gap-2 rounded-lg border border-gray-100 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{profiles[r.referrer_id]?.name || 'Unknown'} → {r.referred_name || r.referred_email || 'Anonymous'}</p>
                    <p className="text-sm text-gray-500">Code: {r.referral_code} • Type: {r.referral_type} • {formatDate(r.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color={r.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>{r.status}</Badge>
                    <Badge color={r.reward_status === 'credited' || r.reward_status === 'paid' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}>{r.reward_status}</Badge>
                    <span className="text-sm font-medium">{formatCurrency(r.reward_amount)}</span>
                    <Button size="sm" variant="outline" onClick={() => { setRewardModal(r); setNewRewardStatus(r.reward_status) }}>Update</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={!!rewardModal} onClose={() => { setRewardModal(null); setNewRewardStatus('') }} title="Update Reward Status">
        <div className="space-y-4">
          <p>Update reward status for <span className="font-medium">{rewardModal?.referred_name || rewardModal?.referred_email || 'referral'}</span></p>
          <div>
            <Label htmlFor="rstatus">Reward Status</Label>
            <Select id="rstatus" value={newRewardStatus} onChange={(e) => setNewRewardStatus(e.target.value)}>
              <option value="pending">Pending</option>
              <option value="credited">Credited</option>
              <option value="rejected">Rejected</option>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setRewardModal(null); setNewRewardStatus('') }}>Cancel</Button>
            <Button onClick={updateReward} disabled={actionLoading || !newRewardStatus}>Update</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
