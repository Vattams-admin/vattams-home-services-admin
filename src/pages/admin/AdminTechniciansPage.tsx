import { useEffect, useState } from 'react'
import { Eye, CircleCheck as CheckCircle, Circle as XCircle, Ban, RotateCcw } from 'lucide-react'
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

type FilterTab = 'all' | 'pending' | 'active' | 'rejected' | 'suspended'

export function AdminTechniciansPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [techs, setTechs] = useState<Profile[]>([])
  const [filter, setFilter] = useState<FilterTab>('all')
  const [viewTech, setViewTech] = useState<Profile | null>(null)
  const [rejectTech, setRejectTech] = useState<Profile | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actioning, setActioning] = useState(false)

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.from('profiles').select('*').eq('role', 'technician').order('created_at', { ascending: false })
      if (!mounted) return
      setTechs((data || []) as Profile[])
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  const filtered = filter === 'all' ? techs : techs.filter((t) => t.status === filter)

  const updateTech = async (tech: Profile, updates: Record<string, unknown>, notifTitle: string, notifMsg: string, auditAction: string, auditDetails: string, successMsg: string) => {
    setActioning(true)
    const { error } = await supabase.from('profiles').update(updates).eq('id', tech.id)
    setActioning(false)
    if (error) { toast('Action failed', 'error'); return }
    await createNotification(tech.id, notifTitle, notifMsg, notifTitle.includes('Approv') || notifTitle.includes('Activ') ? 'success' : 'warning')
    if (profile) await createAuditLog(profile.id, auditAction, 'profile', tech.id, auditDetails)
    toast(successMsg, 'success')
    setTechs((prev) => prev.map((t) => t.id === tech.id ? { ...t, ...updates } as Profile : t))
    setViewTech(null)
  }

  const handleApprove = (t: Profile) => updateTech(t, { verification_status: 'approved', status: 'active', rejection_reason: null }, 'Verification Approved', 'Your account has been approved.', 'approve_technician', `Approved ${t.name}`, 'Technician approved')
  const handleSuspend = (t: Profile) => updateTech(t, { verification_status: 'suspended', status: 'suspended' }, 'Account Suspended', 'Your account has been suspended.', 'suspend_technician', `Suspended ${t.name}`, 'Technician suspended')
  const handleActivate = (t: Profile) => updateTech(t, { verification_status: 'approved', status: 'active' }, 'Account Activated', 'Your account has been reactivated.', 'activate_technician', `Activated ${t.name}`, 'Technician activated')

  const handleReject = async () => {
    if (!rejectTech || !rejectReason.trim()) return
    setActioning(true)
    const { error } = await supabase.from('profiles').update({ verification_status: 'rejected', status: 'rejected', rejection_reason: rejectReason.trim() }).eq('id', rejectTech.id)
    setActioning(false)
    if (error) { toast('Failed to reject technician', 'error'); return }
    await createNotification(rejectTech.id, 'Verification Rejected', `Rejected: ${rejectReason.trim()}`, 'error')
    if (profile) await createAuditLog(profile.id, 'reject_technician', 'profile', rejectTech.id, `Rejected ${rejectTech.name}: ${rejectReason.trim()}`)
    toast('Technician rejected', 'success')
    setTechs((prev) => prev.map((t) => t.id === rejectTech.id ? { ...t, verification_status: 'rejected', status: 'rejected', rejection_reason: rejectReason.trim() } : t))
    setRejectTech(null); setRejectReason('')
  }

  if (loading) return <LoadingScreen message="Loading technicians..." />

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' }, { key: 'pending', label: 'Pending' }, { key: 'active', label: 'Active' }, { key: 'rejected', label: 'Rejected' }, { key: 'suspended', label: 'Suspended' },
  ]

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Technicians</h1><p className="text-sm text-gray-500">Manage all technician accounts</p></div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setFilter(t.key)} className={cn('rounded-full px-3 py-1.5 text-sm font-medium', filter === t.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>{t.label}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><p className="text-gray-500">No technicians found.</p></CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <Card key={t.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-gray-900">{t.name}</p>
                      <Badge color={t.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>{t.status || 'pending'}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{t.email} • {t.mobile}</p>
                    <p className="text-xs text-gray-400">{t.experience || 'No experience'} • {t.city || '-'}</p>
                    <Badge color={VERIFICATION_STATUS_COLORS[t.verification_status || ''] || 'bg-gray-100'} className="mt-1">{VERIFICATION_STATUS_LABELS[t.verification_status || ''] || t.verification_status}</Badge>
                    {t.skills && t.skills.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">{t.skills.map((s) => <Badge key={s} color="bg-blue-50 text-blue-700">{s}</Badge>)}</div>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setViewTech(t)}><Eye className="mr-1 h-4 w-4" />View</Button>
                  {(t.status === 'pending' || t.verification_status === 'under_review') && <>
                    <Button size="sm" onClick={() => handleApprove(t)} disabled={actioning}><CheckCircle className="mr-1 h-4 w-4" />Approve</Button>
                    <Button size="sm" variant="danger" onClick={() => setRejectTech(t)}><XCircle className="mr-1 h-4 w-4" />Reject</Button>
                  </>}
                  {t.status === 'active' && <Button size="sm" variant="danger" onClick={() => handleSuspend(t)} disabled={actioning}><Ban className="mr-1 h-4 w-4" />Suspend</Button>}
                  {t.status === 'suspended' && <Button size="sm" onClick={() => handleActivate(t)} disabled={actioning}><RotateCcw className="mr-1 h-4 w-4" />Activate</Button>}
                  {t.status === 'rejected' && <Button size="sm" onClick={() => handleApprove(t)} disabled={actioning}><CheckCircle className="mr-1 h-4 w-4" />Approve</Button>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!viewTech} onClose={() => setViewTech(null)} title="Technician Profile">
        {viewTech && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-gray-500">Name</p><p className="font-medium">{viewTech.name}</p></div>
            <div><p className="text-gray-500">Email</p><p className="font-medium">{viewTech.email}</p></div>
            <div><p className="text-gray-500">Mobile</p><p className="font-medium">{viewTech.mobile}</p></div>
            <div><p className="text-gray-500">City</p><p className="font-medium">{viewTech.city || '-'}</p></div>
            <div><p className="text-gray-500">District</p><p className="font-medium">{viewTech.district || '-'}</p></div>
            <div><p className="text-gray-500">Experience</p><p className="font-medium">{viewTech.experience || '-'}</p></div>
            <div><p className="text-gray-500">Status</p><Badge color={viewTech.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>{viewTech.status || 'pending'}</Badge></div>
            <div><p className="text-gray-500">Verification</p><Badge color={VERIFICATION_STATUS_COLORS[viewTech.verification_status || '']}>{VERIFICATION_STATUS_LABELS[viewTech.verification_status || '']}</Badge></div>
            <div className="col-span-2"><p className="text-gray-500">Skills</p><div className="flex flex-wrap gap-1 mt-1">{(viewTech.skills || []).map((s) => <Badge key={s} color="bg-blue-50 text-blue-700">{s}</Badge>)}</div></div>
            {viewTech.bio && <div className="col-span-2"><p className="text-gray-500">Bio</p><p className="font-medium">{viewTech.bio}</p></div>}
            {viewTech.rejection_reason && <div className="col-span-2"><p className="text-gray-500">Rejection Reason</p><p className="font-medium text-red-600">{viewTech.rejection_reason}</p></div>}
          </div>
        )}
      </Modal>

      <Modal open={!!rejectTech} onClose={() => { setRejectTech(null); setRejectReason('') }} title="Reject Technician">
        {rejectTech && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Provide a reason for rejecting <strong>{rejectTech.name}</strong>:</p>
            <div><Label htmlFor="reason">Rejection Reason</Label><Textarea id="reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} /></div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => { setRejectTech(null); setRejectReason('') }}>Cancel</Button><Button variant="danger" onClick={handleReject} disabled={actioning || !rejectReason.trim()}>Reject</Button></div>
          </div>
        )}
      </Modal>
    </div>
  )
}
