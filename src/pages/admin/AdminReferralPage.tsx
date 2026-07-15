import { useEffect, useState, useCallback } from 'react'
import { Gift, Users, CircleCheck as CheckCircle2, Clock, Loader as Loader2, Search, IndianRupee } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/ui/modal'
import { type Referral, type Profile } from '@/lib/supabase'
import { adminApi } from '@/lib/admin-api'
import { formatDate, formatCurrency } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

const REWARD_STATUS_COLORS: Record<string, string> = {
  pending: 'amber',
  paid: 'green',
  cancelled: 'red',
  processing: 'blue',
}

export default function AdminReferralPage() {
  const toast = useToast()

  const [referrals, setReferrals] = useState<Referral[]>([])
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [updateModal, setUpdateModal] = useState<Referral | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [saving, setSaving] = useState(false)

  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    totalPaid: 0,
  })

  const loadReferrals = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await adminApi.getReferrals(statusFilter !== 'all' ? { status: statusFilter } : {})

      let result = (data as Referral[]) || []

      if (search.trim()) {
        const q = search.toLowerCase()
        result = result.filter(
          (r) =>
            r.referred_email?.toLowerCase().includes(q) ||
            r.referred_name?.toLowerCase().includes(q) ||
            r.referral_code?.toLowerCase().includes(q) ||
            r.referral_type?.toLowerCase().includes(q),
        )
      }

      setReferrals(result)

      // Calculate stats from all referrals
      const { data: allData } = await adminApi.getReferralStats()

      const allReferrals = (allData as Referral[]) || []
      setStats({
        total: allReferrals.length,
        paid: allReferrals.filter((r) => r.reward_status === 'paid').length,
        pending: allReferrals.filter((r) => r.reward_status === 'pending')
          .length,
        totalPaid: allReferrals
          .filter((r) => r.reward_status === 'paid')
          .reduce((sum, r) => sum + (r.reward_amount || 0), 0),
      })
    } catch {
      toast.error('Failed to load referrals')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search, toast])

  useEffect(() => {
    async function loadUsers() {
      try {
        const { data } = await adminApi.getProfiles()
        if (data) setUsers(data as Profile[])
      } catch {}
    }
    loadUsers()
  }, [])

  useEffect(() => {
    loadReferrals()
  }, [loadReferrals])

  function getUserName(userId: string | null): string {
    if (!userId) return 'Unknown'
    const user = users.find((u) => u.id === userId)
    return user ? user.name : 'Unknown User'
  }

  function openUpdateModal(referral: Referral) {
    setUpdateModal(referral)
    setNewStatus(referral.reward_status || 'pending')
  }

  async function updateRewardStatus() {
    if (!updateModal) return
    setSaving(true)
    try {
      await adminApi.updateReferralStatus(updateModal.id, newStatus)

      await adminApi.createAuditLog(
        'Admin',
        'update_referral_reward',
        'referral',
        updateModal.id,
        `Updated reward status to ${newStatus} for referral ${updateModal.referral_code}`,
      )

      toast.success('Reward status updated successfully')
      setUpdateModal(null)
      await loadReferrals()
    } catch {
      toast.error('Failed to update reward status')
    } finally {
      setSaving(false)
    }
  }

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
        <h1 className="text-2xl font-bold text-slate-900">
          Referral Program
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage referrals and track reward payouts
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Referrals</p>
              <p className="text-xl font-bold text-slate-900">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Rewards Paid</p>
              <p className="text-xl font-bold text-slate-900">{stats.paid}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Pending Rewards</p>
              <p className="text-xl font-bold text-slate-900">
                {stats.pending}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <IndianRupee className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Paid Amount</p>
              <p className="text-xl font-bold text-slate-900">
                {formatCurrency(stats.totalPaid)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label>Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by name, email, or code..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-1.5 sm:w-48">
            <Label>Reward Status</Label>
            <Select
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Referrals Table */}
      {referrals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Gift className="h-12 w-12 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-500">
              No referrals found
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Referred Person
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Referrer
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Code
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Reward
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Date
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {referrals.map((ref) => (
                    <tr key={ref.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {ref.referred_name || 'N/A'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {ref.referred_email || ''}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {getUserName(ref.referrer_id)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-slate-900">
                          {ref.referral_code}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {ref.referral_type || '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {ref.reward_amount
                          ? formatCurrency(ref.reward_amount)
                          : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          color={
                            (REWARD_STATUS_COLORS[ref.reward_status] as any) ||
                            'gray'
                          }
                        >
                          {ref.reward_status || 'pending'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatDate(ref.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openUpdateModal(ref)}
                        >
                          Update Status
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Update Status Modal */}
      {updateModal && (
        <Modal
          title="Update Reward Status"
          onClose={() => setUpdateModal(null)}
        >
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Referral Code:</span>
                <span className="font-mono font-medium text-slate-900">
                  {updateModal.referral_code}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-slate-500">Referred:</span>
                <span className="font-medium text-slate-900">
                  {updateModal.referred_name || updateModal.referred_email}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-slate-500">Reward Amount:</span>
                <span className="font-medium text-slate-900">
                  {updateModal.reward_amount
                    ? formatCurrency(updateModal.reward_amount)
                    : 'N/A'}
                </span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>New Status</Label>
              <Select
                value={newStatus}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setNewStatus(e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setUpdateModal(null)}
              >
                Cancel
              </Button>
              <Button onClick={updateRewardStatus} loading={saving}>
                Update Status
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
