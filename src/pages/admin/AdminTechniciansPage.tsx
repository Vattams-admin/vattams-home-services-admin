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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { LoadingScreen } from '@/components/LoadingScreen'
import { Eye, Check, X, Pause, Play } from 'lucide-react'

type Tab = 'all' | 'pending' | 'active' | 'rejected' | 'suspended'

export function AdminTechniciansPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [techs, setTechs] = useState<Profile[]>([])
  const [tab, setTab] = useState<Tab>('all')
  const [viewTech, setViewTech] = useState<Profile | null>(null)
  const [rejectTech, setRejectTech] = useState<Profile | null>(null)
  const [reason, setReason] = useState('')

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.from('profiles').select('*').eq('role', 'technician').order('created_at', { ascending: false })
      if (mounted) { setTechs((data || []) as Profile[]); setLoading(false) }
    })()
    return () => { mounted = false }
  }, [])

  const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: 'All' }, { key: 'pending', label: 'Pending' }, { key: 'active', label: 'Active' },
    { key: 'rejected', label: 'Rejected' }, { key: 'suspended', label: 'Suspended' },
  ]

  const filtered = techs.filter((t) => {
    if (tab === 'all') return true
    if (tab === 'pending') return t.status === 'pending'
    return t.status === tab
  })

  const updateStatus = async (t: Profile, st: string, vs: string, title: string, msg: string, type: string) => {
    await supabase.from('profiles').update({ status: st, verification_status: vs }).eq('id', t.id)
    await createNotification(t.id, title, msg, type)
    await createAuditLog(profile?.id || '', `${st}_technician`, 'profile', t.id, `${title}: ${t.name}`)
    toast(title, type === 'error' ? 'error' : 'success')
    setTechs((ts) => ts.map((x) => x.id === t.id ? { ...x, status: st, verification_status: vs as Profile['verification_status'] } : x))
  }

  const approve = (t: Profile) => updateStatus(t, 'active', 'approved', 'Account Approved', 'Your account has been approved.', 'success')
  const suspend = (t: Profile) => updateStatus(t, 'suspended', 'suspended', 'Account Suspended', 'Your account has been suspended.', 'error')
  const activate = (t: Profile) => updateStatus(t, 'active', 'approved', 'Account Activated', 'Your account has been activated.', 'success')

  const doReject = async () => {
    if (!rejectTech || !reason.trim()) return
    await supabase.from('profiles').update({ status: 'rejected', verification_status: 'rejected', rejection_reason: reason }).eq('id', rejectTech.id)
    await createNotification(rejectTech.id, 'Account Rejected', `Rejected: ${reason}`, 'error')
    await createAuditLog(profile?.id || '', 'reject_technician', 'profile', rejectTech.id, `Rejected: ${reason}`)
    toast('Technician rejected', 'error')
    setTechs((ts) => ts.map((x) => x.id === rejectTech.id ? { ...x, status: 'rejected', verification_status: 'rejected', rejection_reason: reason } : x))
    setRejectTech(null); setReason('')
  }

  if (loading) return <LoadingScreen message="Loading technicians..." />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Technicians</h1>
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('rounded-full px-3 py-1.5 text-sm font-medium', tab === t.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>{t.label}</button>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Technicians ({filtered.length})</CardTitle></CardHeader>
        <CardContent>
          {filtered.length === 0 ? <p className="text-gray-500 text-sm">No technicians found.</p> : (
            <div className="space-y-2">
              {filtered.map((t) => (
                <div key={t.id} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{t.name}</p>
                    <p className="text-sm text-gray-500">{t.email} · {t.mobile}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(t.skills || []).slice(0, 3).map((s) => <Badge key={s} color="bg-blue-50 text-blue-700">{s}</Badge>)}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Exp: {t.experience || '-'} · City: {t.city || '-'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="flex gap-1">
                      <Badge color={t.status === 'active' ? 'bg-green-100 text-green-700' : t.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}>{t.status}</Badge>
                      <Badge color={VERIFICATION_STATUS_COLORS[t.verification_status || '']}>{VERIFICATION_STATUS_LABELS[t.verification_status || '']}</Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => setViewTech(t)}><Eye className="h-4 w-4" /></Button>
                      {(t.status === 'pending' || t.status === 'rejected') && <Button size="sm" onClick={() => approve(t)}><Check className="h-4 w-4" /></Button>}
                      {t.status === 'pending' && <Button size="sm" variant="danger" onClick={() => setRejectTech(t)}><X className="h-4 w-4" /></Button>}
                      {t.status === 'active' && <Button size="sm" variant="danger" onClick={() => suspend(t)}><Pause className="h-4 w-4" /></Button>}
                      {t.status === 'suspended' && <Button size="sm" onClick={() => activate(t)}><Play className="h-4 w-4" /></Button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={!!viewTech} onClose={() => setViewTech(null)} title="Technician Profile">
        {viewTech && (
          <div className="space-y-1.5 text-sm">
            <p><span className="font-medium">Name:</span> {viewTech.name}</p>
            <p><span className="font-medium">Email:</span> {viewTech.email}</p>
            <p><span className="font-medium">Mobile:</span> {viewTech.mobile}</p>
            <p><span className="font-medium">City:</span> {viewTech.city || '-'}</p>
            <p><span className="font-medium">District:</span> {viewTech.district || '-'}</p>
            <p><span className="font-medium">Experience:</span> {viewTech.experience || '-'}</p>
            <p><span className="font-medium">Skills:</span> {(viewTech.skills || []).join(', ') || '-'}</p>
            <p><span className="font-medium">Bio:</span> {viewTech.bio || '-'}</p>
            <p><span className="font-medium">Status:</span> <Badge color={viewTech.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>{viewTech.status}</Badge></p>
            <p><span className="font-medium">Verification:</span> <Badge color={VERIFICATION_STATUS_COLORS[viewTech.verification_status || '']}>{VERIFICATION_STATUS_LABELS[viewTech.verification_status || '']}</Badge></p>
            {viewTech.rejection_reason && <p><span className="font-medium">Rejection Reason:</span> {viewTech.rejection_reason}</p>}
          </div>
        )}
      </Modal>

      <Modal open={!!rejectTech} onClose={() => { setRejectTech(null); setReason('') }} title="Reject Technician">
        <div className="space-y-3">
          <Label>Rejection Reason</Label>
          <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Enter rejection reason..." />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => { setRejectTech(null); setReason('') }}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={doReject} disabled={!reason.trim()}>Reject</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
