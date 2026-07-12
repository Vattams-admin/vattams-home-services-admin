import { useEffect, useState } from 'react'
import { Eye, CheckCircle, XCircle, Ban, Power } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { createNotification, createAuditLog } from '@/lib/notifications'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { LoadingScreen } from '@/components/LoadingScreen'
import { VERIFICATION_STATUS_COLORS, VERIFICATION_STATUS_LABELS } from '@/lib/utils'

type FilterTab = 'all' | 'pending' | 'active' | 'rejected' | 'suspended'

export function AdminTechniciansPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [techs, setTechs] = useState<Profile[]>([])
  const [filter, setFilter] = useState<FilterTab>('all')
  const [viewTech, setViewTech] = useState<Profile | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.from('profiles').select('*').eq('role', 'technician').order('created_at', { ascending: false })
      if (mounted) { setTechs((data as Profile[]) || []); setLoading(false) }
    })()
    return () => { mounted = false }
  }, [])

  const filtered = filter === 'all' ? techs : filter === 'pending' ? techs.filter((t) => t.verification_status === 'under_review' || t.verification_status === 'fee_pending' || t.verification_status === 'pending_registration') : filter === 'active' ? techs.filter((t) => t.verification_status === 'approved') : techs.filter((t) => t.verification_status === filter)

  const updateStatus = async (tech: Profile, verStatus: string, status: string, notifTitle: string, notifMsg: string, auditAction: string) => {
    setActionLoading(true)
    const { error } = await supabase.from('profiles').update({ verification_status: verStatus, status }).eq('id', tech.id)
    setActionLoading(false)
    if (error) { toast('Failed to update status', 'error'); return }
    await createNotification(tech.id, notifTitle, notifMsg, verStatus === 'approved' ? 'success' : 'error')
    if (profile) await createAuditLog(profile.id, auditAction, 'profile', tech.id, `${verStatus} for ${tech.name}`)
    setTechs((prev) => prev.map((t) => t.id === tech.id ? { ...t, verification_status: verStatus as Profile['verification_status'], status } : t))
    toast('Status updated successfully', 'success')
  }

  if (loading) return <LoadingScreen message="Loading technicians..." />

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' }, { key: 'pending', label: 'Pending' }, { key: 'active', label: 'Active' }, { key: 'rejected', label: 'Rejected' }, { key: 'suspended', label: 'Suspended' },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Technicians</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Button key={t.key} size="sm" variant={filter === t.key ? 'primary' : 'outline'} onClick={() => setFilter(t.key)}>{t.label}</Button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((t) => (
          <Card key={t.id}>
            <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{t.name}</p>
                  <Badge color={VERIFICATION_STATUS_COLORS[t.verification_status || 'pending_registration']}>{VERIFICATION_STATUS_LABELS[t.verification_status || 'pending_registration']}</Badge>
                  <Badge color={t.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>{t.status || 'pending'}</Badge>
                </div>
                <p className="text-sm text-gray-500">{t.email} • {t.mobile}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {(t.skills || []).map((s, i) => <Badge key={i} color="bg-blue-50 text-blue-700">{s}</Badge>)}
                </div>
                <p className="mt-1 text-sm text-gray-500">Exp: {t.experience || 'N/A'} • {t.city || 'N/A'}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setViewTech(t)}><Eye className="mr-1 h-3.5 w-3.5" /> View Profile</Button>
                {(t.verification_status === 'under_review' || t.verification_status === 'fee_pending') && <Button size="sm" onClick={() => updateStatus(t, 'approved', 'active', 'Verification Approved', 'Your account has been approved!', 'technician_approve')} disabled={actionLoading}><CheckCircle className="mr-1 h-3.5 w-3.5" /> Approve</Button>}
                {(t.verification_status === 'under_review' || t.verification_status === 'fee_pending') && <Button size="sm" variant="danger" onClick={() => updateStatus(t, 'rejected', 'rejected', 'Verification Rejected', 'Your application was rejected.', 'technician_reject')} disabled={actionLoading}><XCircle className="mr-1 h-3.5 w-3.5" /> Reject</Button>}
                {t.verification_status === 'approved' && <Button size="sm" variant="danger" onClick={() => updateStatus(t, 'suspended', 'suspended', 'Account Suspended', 'Your account has been suspended.', 'technician_suspend')} disabled={actionLoading}><Ban className="mr-1 h-3.5 w-3.5" /> Suspend</Button>}
                {t.verification_status === 'suspended' && <Button size="sm" onClick={() => updateStatus(t, 'approved', 'active', 'Account Activated', 'Your account has been reactivated.', 'technician_activate')} disabled={actionLoading}><Power className="mr-1 h-3.5 w-3.5" /> Activate</Button>}
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="py-8 text-center text-gray-500">No technicians found.</p>}
      </div>

      <Modal open={!!viewTech} onClose={() => setViewTech(null)} title="Technician Profile" className="max-w-2xl">
        {viewTech && (
          <div className="space-y-2">
            <p><span className="font-medium">Name:</span> {viewTech.name}</p>
            <p><span className="font-medium">Email:</span> {viewTech.email}</p>
            <p><span className="font-medium">Mobile:</span> {viewTech.mobile}</p>
            <p><span className="font-medium">Experience:</span> {viewTech.experience || 'N/A'}</p>
            <p><span className="font-medium">Skills:</span> {(viewTech.skills || []).join(', ') || 'N/A'}</p>
            <p><span className="font-medium">City:</span> {viewTech.city || 'N/A'}</p>
            <p><span className="font-medium">District:</span> {viewTech.district || 'N/A'}</p>
            <p><span className="font-medium">Address:</span> {viewTech.address || 'N/A'}</p>
            <p><span className="font-medium">Bio:</span> {viewTech.bio || 'N/A'}</p>
            <p><span className="font-medium">Status:</span> {viewTech.status || 'N/A'}</p>
            <p><span className="font-medium">Verification:</span> {VERIFICATION_STATUS_LABELS[viewTech.verification_status || 'pending_registration']}</p>
            {viewTech.rejection_reason && <p><span className="font-medium">Rejection Reason:</span> {viewTech.rejection_reason}</p>}
          </div>
        )}
      </Modal>
    </div>
  )
}
