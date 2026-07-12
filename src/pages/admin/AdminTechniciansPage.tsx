import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { createNotification, createAuditLog } from '@/lib/notifications'
import { cn, VERIFICATION_STATUS_COLORS, VERIFICATION_STATUS_LABELS } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { LoadingScreen } from '@/components/LoadingScreen'
import { CheckCircle, XCircle, Ban, Power, Eye } from 'lucide-react'

type Tab = 'all' | 'pending' | 'active' | 'rejected' | 'suspended'

export function AdminTechniciansPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [techs, setTechs] = useState<Profile[]>([])
  const [tab, setTab] = useState<Tab>('all')
  const [viewTech, setViewTech] = useState<Profile | null>(null)
  const [rejectTech, setRejectTech] = useState<Profile | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.from('profiles').select('*').eq('role', 'technician').order('created_at', { ascending: false })
      if (mounted) { setTechs((data || []) as Profile[]); setLoading(false) }
    })()
    return () => { mounted = false }
  }, [])

  const filtered = tab === 'all' ? techs : tab === 'pending' ? techs.filter((t) => t.status === 'pending' || t.verification_status === 'pending_registration' || t.verification_status === 'fee_pending' || t.verification_status === 'under_review') : techs.filter((t) => t.status === tab)

  const updateTech = async (t: Profile, vs: string, status: string, reason: string | null = null) => {
    setActionLoading(true)
    const upd: Record<string, unknown> = { verification_status: vs, status }
    if (reason) upd.rejection_reason = reason
    const { error } = await supabase.from('profiles').update(upd).eq('id', t.id)
    if (error) { toast('Action failed', 'error'); setActionLoading(false); return }
    setTechs((ts) => ts.map((x) => x.id === t.id ? { ...x, verification_status: vs as Profile['verification_status'], status } : x))
    setActionLoading(false)
    return true
  }

  const approve = async (t: Profile) => {
    if (!await updateTech(t, 'approved', 'active')) return
    await createNotification(t.id, 'Account Approved', 'Your account has been approved. You can now accept jobs.', 'success')
    if (profile) await createAuditLog(profile.id, 'approve_technician', 'profile', t.id, `Approved ${t.name}`)
    toast('Technician approved', 'success'); setViewTech(null)
  }
  const reject = async () => {
    if (!rejectTech || !rejectReason.trim()) return
    if (!await updateTech(rejectTech, 'rejected', 'rejected', rejectReason.trim())) return
    await createNotification(rejectTech.id, 'Account Rejected', `Rejected: ${rejectReason.trim()}`, 'error')
    if (profile) await createAuditLog(profile.id, 'reject_technician', 'profile', rejectTech.id, `Rejected: ${rejectReason.trim()}`)
    toast('Technician rejected', 'info'); setRejectTech(null); setRejectReason('')
  }
  const suspend = async (t: Profile) => {
    if (!await updateTech(t, 'suspended', 'suspended')) return
    await createNotification(t.id, 'Account Suspended', 'Your account has been suspended.', 'warning')
    if (profile) await createAuditLog(profile.id, 'suspend_technician', 'profile', t.id, `Suspended ${t.name}`)
    toast('Technician suspended', 'info')
  }
  const activate = async (t: Profile) => {
    if (!await updateTech(t, 'approved', 'active')) return
    await createNotification(t.id, 'Account Activated', 'Your account has been reactivated.', 'success')
    if (profile) await createAuditLog(profile.id, 'activate_technician', 'profile', t.id, `Activated ${t.name}`)
    toast('Technician activated', 'success')
  }

  if (loading) return <LoadingScreen message="Loading technicians..." />

  const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: 'All' }, { key: 'pending', label: 'Pending' }, { key: 'active', label: 'Active' }, { key: 'rejected', label: 'Rejected' }, { key: 'suspended', label: 'Suspended' },
  ]

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Technicians</h1><p className="text-gray-600">Manage technician accounts</p></div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => <Button key={t.key} size="sm" variant={tab === t.key ? 'primary' : 'outline'} onClick={() => setTab(t.key)}>{t.label}</Button>)}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? <p className="py-8 text-center text-gray-500 sm:col-span-3">No technicians found.</p> : filtered.map((t) => (
          <Card key={t.id}><CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-900">{t.name}</p>
                <div className="flex gap-1">
                  {t.verification_status && <Badge color={VERIFICATION_STATUS_COLORS[t.verification_status]}>{VERIFICATION_STATUS_LABELS[t.verification_status]}</Badge>}
                  <Badge color={t.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>{t.status || 'pending'}</Badge>
                </div>
              </div>
              <p className="text-sm text-gray-500">{t.email} · {t.mobile}</p>
              <p className="text-sm text-gray-500">Exp: {t.experience || 'N/A'} · {t.city || 'N/A'}</p>
              {t.skills && t.skills.length > 0 && <div className="flex flex-wrap gap-1">{t.skills.map((s) => <Badge key={s} color="bg-blue-50 text-blue-700">{s}</Badge>)}</div>}
              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={() => setViewTech(t)}><Eye className="mr-1 h-4 w-4" />Profile</Button>
                {(t.status === 'pending' || t.verification_status === 'under_review') && <Button size="sm" variant="primary" onClick={() => approve(t)} disabled={actionLoading}><CheckCircle className="mr-1 h-4 w-4" />Approve</Button>}
                {(t.status === 'pending' || t.verification_status === 'under_review') && <Button size="sm" variant="danger" onClick={() => setRejectTech(t)} disabled={actionLoading}><XCircle className="mr-1 h-4 w-4" />Reject</Button>}
                {t.status === 'active' && <Button size="sm" variant="danger" onClick={() => suspend(t)} disabled={actionLoading}><Ban className="mr-1 h-4 w-4" />Suspend</Button>}
                {(t.status === 'suspended' || t.status === 'rejected') && <Button size="sm" variant="primary" onClick={() => activate(t)} disabled={actionLoading}><Power className="mr-1 h-4 w-4" />Activate</Button>}
              </div>
            </div>
          </CardContent></Card>
        ))}
      </div>

      <Modal open={!!viewTech} onClose={() => setViewTech(null)} title="Technician Profile">
        {viewTech && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><Label>Name</Label><p className="font-medium">{viewTech.name}</p></div>
              <div><Label>Email</Label><p className="font-medium">{viewTech.email}</p></div>
              <div><Label>Mobile</Label><p className="font-medium">{viewTech.mobile}</p></div>
              <div><Label>City</Label><p className="font-medium">{viewTech.city || '-'}</p></div>
              <div><Label>Experience</Label><p className="font-medium">{viewTech.experience || '-'}</p></div>
              <div><Label>Status</Label><p className="font-medium">{viewTech.status || '-'}</p></div>
              <div><Label>Verification</Label><Badge color={VERIFICATION_STATUS_COLORS[viewTech.verification_status || '']}>{VERIFICATION_STATUS_LABELS[viewTech.verification_status || '']}</Badge></div>
            </div>
            {viewTech.skills && viewTech.skills.length > 0 && <div><Label>Skills</Label><div className="flex flex-wrap gap-1">{viewTech.skills.map((s) => <Badge key={s} color="bg-blue-50 text-blue-700">{s}</Badge>)}</div></div>}
            {viewTech.bio && <div><Label>Bio</Label><p className="text-sm">{viewTech.bio}</p></div>}
            {viewTech.rejection_reason && <div><Label>Rejection Reason</Label><p className="text-sm text-red-600">{viewTech.rejection_reason}</p></div>}
          </div>
        )}
      </Modal>

      <Modal open={!!rejectTech} onClose={() => { setRejectTech(null); setRejectReason('') }} title="Reject Technician">
        <div className="space-y-4">
          <div><Label htmlFor="treason">Rejection Reason</Label><Textarea id="treason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={4} /></div>
          <div className="flex gap-2"><Button variant="danger" onClick={reject} disabled={actionLoading || !rejectReason.trim()}>Reject</Button><Button variant="outline" onClick={() => { setRejectTech(null); setRejectReason('') }}>Cancel</Button></div>
        </div>
      </Modal>
    </div>
  )
}
