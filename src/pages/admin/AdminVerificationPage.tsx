import { useEffect, useState } from 'react'
import { ShieldCheck, Eye, CheckCircle, XCircle, Ban, Power, FileText, RotateCcw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Profile, TechnicianWallet, TechnicianDocument } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { createNotification, createAuditLog } from '@/lib/notifications'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { LoadingScreen } from '@/components/LoadingScreen'
import { VERIFICATION_FEE, REFUND_ELIGIBLE_JOBS } from '@/lib/constants'
import { formatCurrency, formatDate, VERIFICATION_STATUS_COLORS, VERIFICATION_STATUS_LABELS } from '@/lib/utils'

type FilterStatus = 'all' | 'pending_registration' | 'fee_pending' | 'under_review' | 'approved' | 'rejected' | 'suspended'

export function AdminVerificationPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [techs, setTechs] = useState<Profile[]>([])
  const [wallets, setWallets] = useState<Record<string, TechnicianWallet>>({})
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [viewTech, setViewTech] = useState<Profile | null>(null)
  const [viewDocs, setViewDocs] = useState<Profile | null>(null)
  const [docs, setDocs] = useState<TechnicianDocument[]>([])
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: t } = await supabase.from('profiles').select('*').eq('role', 'technician').order('created_at', { ascending: false })
      const { data: w } = await supabase.from('technician_wallets').select('*')
      const wMap: Record<string, TechnicianWallet> = {}
      ;(w as TechnicianWallet[] || []).forEach((x) => { wMap[x.technician_id] = x })
      if (mounted) { setTechs((t as Profile[]) || []); setWallets(wMap); setLoading(false) }
    })()
    return () => { mounted = false }
  }, [])

  const fetchDocs = async (techId: string) => {
    const { data } = await supabase.from('technician_documents').select('*').eq('technician_id', techId)
    setDocs((data as TechnicianDocument[]) || [])
  }

  const updateStatus = async (tech: Profile, status: string, notifTitle: string, notifMsg: string, auditAction: string) => {
    setActionLoading(true)
    const updates: Record<string, unknown> = { verification_status: status }
    if (status === 'approved') updates.status = 'active'
    if (status === 'rejected') updates.status = 'rejected'
    if (status === 'suspended') updates.status = 'suspended'
    const { error } = await supabase.from('profiles').update(updates).eq('id', tech.id)
    setActionLoading(false)
    if (error) { toast('Failed to update status', 'error'); return }
    await createNotification(tech.id, notifTitle, notifMsg, status === 'approved' ? 'success' : 'error')
    if (profile) await createAuditLog(profile.id, auditAction, 'profile', tech.id, `${status} for ${tech.name}`)
    setTechs((prev) => prev.map((t) => t.id === tech.id ? { ...t, verification_status: status as Profile['verification_status'] } : t))
    toast('Status updated successfully', 'success')
  }

  const processRefund = async (tech: Profile) => {
    const w = wallets[tech.id]
    if (!w) return
    setActionLoading(true)
    const { error } = await supabase.from('technician_wallets').update({ refund_status: 'completed', refund_completed_at: new Date().toISOString() }).eq('id', w.id)
    setActionLoading(false)
    if (error) { toast('Failed to process refund', 'error'); return }
    await createNotification(tech.id, 'Refund Processed', `Your verification fee refund of ${formatCurrency(w.refund_amount)} has been completed.`, 'success')
    if (profile) await createAuditLog(profile.id, 'refund_process', 'technician_wallet', w.id, `Refund processed for ${tech.name}`)
    toast('Refund processed successfully', 'success')
  }

  if (loading) return <LoadingScreen message="Loading verification data..." />

  const filtered = filter === 'all' ? techs : techs.filter((t) => t.verification_status === filter)
  const counts: Record<string, number> = { all: techs.length, pending_registration: 0, fee_pending: 0, under_review: 0, approved: 0, rejected: 0, suspended: 0 }
  techs.forEach((t) => { counts[t.verification_status || 'pending_registration'] = (counts[t.verification_status || 'pending_registration'] || 0) + 1 })
  const tabs: { key: FilterStatus; label: string }[] = [
    { key: 'all', label: 'All' }, { key: 'pending_registration', label: 'Pending Registration' },
    { key: 'fee_pending', label: 'Fee Pending' }, { key: 'under_review', label: 'Under Review' },
    { key: 'approved', label: 'Approved' }, { key: 'rejected', label: 'Rejected' }, { key: 'suspended', label: 'Suspended' },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Technician Verification</h1>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-sm text-gray-600">Total Technicians</p><p className="text-2xl font-bold text-gray-900">{techs.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-600">Pending Review</p><p className="text-2xl font-bold text-amber-600">{counts.under_review + counts.fee_pending}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-600">Approved</p><p className="text-2xl font-bold text-green-600">{counts.approved}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-600">Verification Fee</p><p className="text-2xl font-bold text-blue-600">{formatCurrency(VERIFICATION_FEE)}</p></CardContent></Card>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Button key={t.key} size="sm" variant={filter === t.key ? 'primary' : 'outline'} onClick={() => setFilter(t.key)}>
            {t.label} ({counts[t.key] || 0})
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((t) => {
          const w = wallets[t.id]
          return (
            <Card key={t.id}>
              <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{t.name}</p>
                    <Badge color={VERIFICATION_STATUS_COLORS[t.verification_status || 'pending_registration']}>{VERIFICATION_STATUS_LABELS[t.verification_status || 'pending_registration']}</Badge>
                  </div>
                  <p className="text-sm text-gray-500">{t.email} • {t.mobile}</p>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">
                    <span>Fee: {w?.verification_fee_paid ? <span className="text-green-600 font-medium">Paid</span> : <span className="text-amber-600 font-medium">Pending</span>}</span>
                    <span>Completed Jobs: {w?.completed_jobs || 0}</span>
                    <span>Refund Eligible: {REFUND_ELIGIBLE_JOBS} jobs</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => { fetchDocs(t.id); setViewDocs(t) }}><FileText className="mr-1 h-3.5 w-3.5" /> Documents</Button>
                  <Button size="sm" variant="outline" onClick={() => setViewTech(t)}><Eye className="mr-1 h-3.5 w-3.5" /> Profile</Button>
                  {t.verification_status === 'under_review' && <Button size="sm" onClick={() => updateStatus(t, 'approved', 'Verification Approved', 'Your account has been approved!', 'technician_approve')} disabled={actionLoading}><CheckCircle className="mr-1 h-3.5 w-3.5" /> Approve</Button>}
                  {(t.verification_status === 'under_review' || t.verification_status === 'fee_pending') && <Button size="sm" variant="danger" onClick={() => updateStatus(t, 'rejected', 'Verification Rejected', 'Your application was rejected.', 'technician_reject')} disabled={actionLoading}><XCircle className="mr-1 h-3.5 w-3.5" /> Reject</Button>}
                  {t.verification_status === 'approved' && <Button size="sm" variant="danger" onClick={() => updateStatus(t, 'suspended', 'Account Suspended', 'Your account has been suspended.', 'technician_suspend')} disabled={actionLoading}><Ban className="mr-1 h-3.5 w-3.5" /> Suspend</Button>}
                  {t.verification_status === 'suspended' && <Button size="sm" onClick={() => updateStatus(t, 'approved', 'Account Activated', 'Your account has been reactivated.', 'technician_activate')} disabled={actionLoading}><Power className="mr-1 h-3.5 w-3.5" /> Activate</Button>}
                  {w && w.refund_status === 'approved' && <Button size="sm" variant="secondary" onClick={() => processRefund(t)} disabled={actionLoading}><RotateCcw className="mr-1 h-3.5 w-3.5" /> Process Refund</Button>}
                </div>
              </CardContent>
            </Card>
          )
        })}
        {filtered.length === 0 && <p className="py-8 text-center text-gray-500">No technicians found.</p>}
      </div>

      <Modal open={!!viewTech} onClose={() => setViewTech(null)} title="Technician Profile">
        {viewTech && (
          <div className="space-y-2">
            <p><span className="font-medium">Name:</span> {viewTech.name}</p>
            <p><span className="font-medium">Email:</span> {viewTech.email}</p>
            <p><span className="font-medium">Mobile:</span> {viewTech.mobile}</p>
            <p><span className="font-medium">Experience:</span> {viewTech.experience || 'N/A'}</p>
            <p><span className="font-medium">Skills:</span> {(viewTech.skills || []).join(', ') || 'N/A'}</p>
            <p><span className="font-medium">City:</span> {viewTech.city || 'N/A'}</p>
            <p><span className="font-medium">Bio:</span> {viewTech.bio || 'N/A'}</p>
            <p><span className="font-medium">Rejection Reason:</span> {viewTech.rejection_reason || 'N/A'}</p>
          </div>
        )}
      </Modal>

      <Modal open={!!viewDocs} onClose={() => setViewDocs(null)} title="Technician Documents">
        <div className="space-y-3">
          {docs.length === 0 ? <p className="text-center text-gray-500">No documents uploaded.</p> : docs.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
              <div>
                <p className="font-medium text-gray-900">{d.document_type}</p>
                {d.document_number && <p className="text-sm text-gray-500">#{d.document_number}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Badge color={d.verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>{d.verified ? 'Verified' : 'Pending'}</Badge>
                <a href={d.document_url} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="outline"><Eye className="h-3.5 w-3.5" /></Button></a>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}
