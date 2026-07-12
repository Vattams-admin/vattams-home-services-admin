import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile, TechnicianWallet, TechnicianDocument, VerificationPayment, Refund } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { createNotification, createAuditLog, createRevenueTransaction } from '@/lib/notifications'
import { cn, formatDateTime, formatCurrency, VERIFICATION_STATUS_COLORS, VERIFICATION_STATUS_LABELS } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { LoadingScreen } from '@/components/LoadingScreen'
import { REFUND_ELIGIBLE_JOBS } from '@/lib/constants'
import { CheckCircle, XCircle, FileText, Wallet, Ban, Power } from 'lucide-react'

type TechData = { profile: Profile; wallet: TechnicianWallet | null; documents: TechnicianDocument[]; payment: VerificationPayment | null }
type Tab = 'all' | 'pending_registration' | 'fee_pending' | 'under_review' | 'approved' | 'rejected' | 'suspended'

export function AdminVerificationPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [techs, setTechs] = useState<TechData[]>([])
  const [tab, setTab] = useState<Tab>('all')
  const [viewTech, setViewTech] = useState<TechData | null>(null)
  const [viewDocs, setViewDocs] = useState<TechData | null>(null)
  const [viewWallet, setViewWallet] = useState<TechData | null>(null)
  const [rejectTech, setRejectTech] = useState<TechData | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [refundTech, setRefundTech] = useState<TechData | null>(null)
  const [refundNotes, setRefundNotes] = useState('')
  const [refundMethod, setRefundMethod] = useState('upi')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: profiles } = await supabase.from('profiles').select('*').eq('role', 'technician').order('created_at', { ascending: false })
      if (!mounted || !profiles) return
      const items: TechData[] = []
      for (const p of profiles as Profile[]) {
        const { data: w } = await supabase.from('technician_wallets').select('*').eq('technician_id', p.id).maybeSingle()
        const { data: docs } = await supabase.from('technician_documents').select('*').eq('technician_id', p.id)
        const { data: pay } = await supabase.from('verification_payments').select('*').eq('technician_id', p.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
        items.push({ profile: p, wallet: w as TechnicianWallet | null, documents: (docs || []) as TechnicianDocument[], payment: pay as VerificationPayment | null })
      }
      if (mounted) { setTechs(items); setLoading(false) }
    })()
    return () => { mounted = false }
  }, [])

  const counters = {
    pending_registration: techs.filter((t) => t.profile.verification_status === 'pending_registration').length,
    fee_paid: techs.filter((t) => t.profile.verification_status === 'fee_pending').length,
    under_review: techs.filter((t) => t.profile.verification_status === 'under_review').length,
    approved: techs.filter((t) => t.profile.verification_status === 'approved').length,
    rejected: techs.filter((t) => t.profile.verification_status === 'rejected').length,
    refund_eligible: techs.filter((t) => t.wallet && t.profile.verification_status === 'approved' && (t.wallet.completed_jobs || 0) >= REFUND_ELIGIBLE_JOBS && t.wallet.refund_status === 'eligible').length,
    refund_completed: techs.filter((t) => t.wallet?.refund_status === 'completed').length,
  }

  const filtered = tab === 'all' ? techs : techs.filter((t) => t.profile.verification_status === tab)

  const updateStatus = async (tech: TechData, vs: string, status: string, reason: string | null = null) => {
    setActionLoading(true)
    const upd: Record<string, unknown> = { verification_status: vs, status }
    if (reason) upd.rejection_reason = reason
    const { error } = await supabase.from('profiles').update(upd).eq('id', tech.profile.id)
    if (error) { toast('Action failed', 'error'); setActionLoading(false); return false }
    setTechs((ts) => ts.map((t) => t.profile.id === tech.profile.id ? { ...t, profile: { ...t.profile, verification_status: vs as Profile['verification_status'], status } } : t))
    setActionLoading(false)
    return true
  }

  const approve = async (tech: TechData) => {
    if (!await updateStatus(tech, 'approved', 'active')) return
    await createNotification(tech.profile.id, 'Verification Approved', 'Your account has been approved.', 'success')
    if (profile) await createAuditLog(profile.id, 'approve_technician', 'profile', tech.profile.id, `Approved ${tech.profile.name}`)
    toast('Technician approved', 'success'); setViewTech(null)
  }
  const reject = async () => {
    if (!rejectTech || !rejectReason.trim()) return
    if (!await updateStatus(rejectTech, 'rejected', 'rejected', rejectReason.trim())) return
    await createNotification(rejectTech.profile.id, 'Verification Rejected', `Rejected: ${rejectReason.trim()}`, 'error')
    if (profile) await createAuditLog(profile.id, 'reject_technician', 'profile', rejectTech.profile.id, `Rejected: ${rejectReason.trim()}`)
    toast('Technician rejected', 'info'); setRejectTech(null); setRejectReason('')
  }
  const suspend = async (tech: TechData) => {
    if (!await updateStatus(tech, 'suspended', 'suspended')) return
    await createNotification(tech.profile.id, 'Account Suspended', 'Your account has been suspended.', 'warning')
    if (profile) await createAuditLog(profile.id, 'suspend_technician', 'profile', tech.profile.id, `Suspended ${tech.profile.name}`)
    toast('Technician suspended', 'info')
  }
  const activate = async (tech: TechData) => {
    if (!await updateStatus(tech, 'approved', 'active')) return
    await createNotification(tech.profile.id, 'Account Activated', 'Your account has been reactivated.', 'success')
    if (profile) await createAuditLog(profile.id, 'activate_technician', 'profile', tech.profile.id, `Activated ${tech.profile.name}`)
    toast('Technician activated', 'success')
  }

  const approveRefund = async (tech: TechData) => {
    setActionLoading(true)
    if (!tech.wallet) { toast('No wallet found', 'error'); setActionLoading(false); return }
    await supabase.from('technician_wallets').update({ refund_status: 'approved' }).eq('id', tech.wallet.id)
    await supabase.from('refunds').insert({ technician_id: tech.profile.id, amount: tech.wallet.refund_amount, refund_type: 'verification_fee', status: 'approved', admin_id: profile?.id || null })
    await createNotification(tech.profile.id, 'Refund Approved', 'Your refund request has been approved.', 'success')
    if (profile) await createAuditLog(profile.id, 'approve_refund', 'wallet', tech.profile.id, `Approved refund for ${tech.profile.name}`)
    toast('Refund approved', 'success'); setRefundTech(null); setActionLoading(false)
    setTechs((ts) => ts.map((t) => t.profile.id === tech.profile.id && t.wallet ? { ...t, wallet: { ...t.wallet, refund_status: 'approved' } } : t))
  }
  const rejectRefund = async () => {
    if (!refundTech) return
    setActionLoading(true)
    if (refundTech.wallet) {
      await supabase.from('technician_wallets').update({ refund_status: 'rejected' }).eq('id', refundTech.wallet.id)
      await supabase.from('refunds').update({ status: 'rejected', admin_notes: refundNotes }).eq('technician_id', refundTech.profile.id).eq('refund_type', 'verification_fee')
    }
    await createNotification(refundTech.profile.id, 'Refund Rejected', `Refund rejected: ${refundNotes}`, 'error')
    if (profile) await createAuditLog(profile.id, 'reject_refund', 'wallet', refundTech.profile.id, `Rejected refund for ${refundTech.profile.name}`)
    toast('Refund rejected', 'info'); setRefundTech(null); setRefundNotes(''); setActionLoading(false)
    setTechs((ts) => ts.map((t) => t.profile.id === refundTech.profile.id && t.wallet ? { ...t, wallet: { ...t.wallet, refund_status: 'rejected' } } : t))
  }
  const processRefund = async (tech: TechData) => {
    setActionLoading(true)
    if (!tech.wallet) { toast('No wallet found', 'error'); setActionLoading(false); return }
    await supabase.from('technician_wallets').update({ refund_status: 'processed', refund_processed_at: new Date().toISOString(), refund_method: refundMethod }).eq('id', tech.wallet.id)
    await supabase.from('refunds').update({ status: 'processed', refund_method: refundMethod, processed_at: new Date().toISOString() }).eq('technician_id', tech.profile.id).eq('refund_type', 'verification_fee')
    await createNotification(tech.profile.id, 'Refund Processed', 'Your refund has been processed.', 'info')
    if (profile) await createAuditLog(profile.id, 'process_refund', 'wallet', tech.profile.id, `Processed refund for ${tech.profile.name}`)
    toast('Refund processed', 'success'); setActionLoading(false)
    setTechs((ts) => ts.map((t) => t.profile.id === tech.profile.id && t.wallet ? { ...t, wallet: { ...t.wallet, refund_status: 'processed', refund_method: refundMethod, refund_processed_at: new Date().toISOString() } } : t))
  }
  const completeRefund = async (tech: TechData) => {
    setActionLoading(true)
    if (!tech.wallet) { toast('No wallet found', 'error'); setActionLoading(false); return }
    const newBalance = (tech.wallet.balance || 0) + (tech.wallet.refund_amount || 0)
    await supabase.from('technician_wallets').update({ refund_status: 'completed', refund_completed_at: new Date().toISOString(), balance: newBalance }).eq('id', tech.wallet.id)
    await supabase.from('refunds').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('technician_id', tech.profile.id).eq('refund_type', 'verification_fee')
    await createRevenueTransaction('refund', tech.wallet.refund_amount, tech.profile.id, null, `Refund completed for ${tech.profile.name}`)
    await createNotification(tech.profile.id, 'Refund Completed', 'Your refund has been completed.', 'success')
    if (profile) await createAuditLog(profile.id, 'complete_refund', 'wallet', tech.profile.id, `Completed refund for ${tech.profile.name}`)
    toast('Refund completed', 'success'); setActionLoading(false)
    setTechs((ts) => ts.map((t) => t.profile.id === tech.profile.id && t.wallet ? { ...t, wallet: { ...t.wallet, refund_status: 'completed', refund_completed_at: new Date().toISOString(), balance: newBalance } } : t))
  }

  if (loading) return <LoadingScreen message="Loading verification data..." />

  const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: 'All' }, { key: 'pending_registration', label: 'Pending Registration' },
    { key: 'fee_pending', label: 'Fee Pending' }, { key: 'under_review', label: 'Under Review' },
    { key: 'approved', label: 'Approved' }, { key: 'rejected', label: 'Rejected' }, { key: 'suspended', label: 'Suspended' },
  ]

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Technician Verification</h1><p className="text-gray-600">Manage technician verification and refunds</p></div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {[
          { label: 'Pending Reg.', value: counters.pending_registration, color: 'text-gray-600 bg-gray-50' },
          { label: 'Fee Paid', value: counters.fee_paid, color: 'text-amber-600 bg-amber-50' },
          { label: 'Under Review', value: counters.under_review, color: 'text-blue-600 bg-blue-50' },
          { label: 'Approved', value: counters.approved, color: 'text-green-600 bg-green-50' },
          { label: 'Rejected', value: counters.rejected, color: 'text-red-600 bg-red-50' },
          { label: 'Refund Eligible', value: counters.refund_eligible, color: 'text-purple-600 bg-purple-50' },
          { label: 'Refund Done', value: counters.refund_completed, color: 'text-emerald-600 bg-emerald-50' },
        ].map((c) => (
          <Card key={c.label}><CardContent className="p-3 text-center">
            <p className={cn('inline-flex rounded-lg p-2', c.color)}><span className="text-lg font-bold">{c.value}</span></p>
            <p className="mt-1 text-xs text-gray-600">{c.label}</p>
          </CardContent></Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Button key={t.key} size="sm" variant={tab === t.key ? 'primary' : 'outline'} onClick={() => setTab(t.key)}>{t.label}</Button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? <p className="py-8 text-center text-gray-500">No technicians found.</p> : filtered.map((t) => {
          const vs = t.profile.verification_status
          const isRefundEligible = t.wallet && vs === 'approved' && (t.wallet.completed_jobs || 0) >= REFUND_ELIGIBLE_JOBS
          return (
            <Card key={t.profile.id}><CardContent className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{t.profile.name}</p>
                    {vs && <Badge color={VERIFICATION_STATUS_COLORS[vs]}>{VERIFICATION_STATUS_LABELS[vs]}</Badge>}
                    {isRefundEligible && <Badge color="bg-purple-100 text-purple-700">Refund Eligible</Badge>}
                  </div>
                  <p className="text-sm text-gray-500">{t.profile.email} · {t.profile.mobile} · Completed Jobs: {t.wallet?.completed_jobs || 0}</p>
                  {t.wallet?.verification_fee_paid && <p className="text-xs text-green-600">Fee Paid: {formatCurrency(t.wallet.verification_fee_amount || 0)}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(vs === 'pending_registration' || vs === 'fee_pending' || vs === 'under_review') && <Button size="sm" variant="outline" onClick={() => setViewDocs(t)}><FileText className="mr-1 h-4 w-4" />Docs</Button>}
                  <Button size="sm" variant="outline" onClick={() => setViewTech(t)}>Profile</Button>
                  {vs === 'under_review' && <Button size="sm" variant="primary" onClick={() => approve(t)} disabled={actionLoading}><CheckCircle className="mr-1 h-4 w-4" />Approve</Button>}
                  {vs === 'under_review' && <Button size="sm" variant="danger" onClick={() => setRejectTech(t)} disabled={actionLoading}><XCircle className="mr-1 h-4 w-4" />Reject</Button>}
                  {vs === 'approved' && <Button size="sm" variant="outline" onClick={() => setViewWallet(t)}><Wallet className="mr-1 h-4 w-4" />Wallet</Button>}
                  {vs === 'approved' && <Button size="sm" variant="danger" onClick={() => suspend(t)} disabled={actionLoading}><Ban className="mr-1 h-4 w-4" />Suspend</Button>}
                  {vs === 'suspended' && <Button size="sm" variant="primary" onClick={() => activate(t)} disabled={actionLoading}><Power className="mr-1 h-4 w-4" />Activate</Button>}
                  {vs === 'rejected' && <Button size="sm" variant="primary" onClick={() => approve(t)} disabled={actionLoading}><CheckCircle className="mr-1 h-4 w-4" />Approve</Button>}
                </div>
              </div>
              {isRefundEligible && t.wallet && (
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
                  <span className="text-sm font-medium text-gray-700">Refund ({formatCurrency(t.wallet.refund_amount || 0)}):</span>
                  {t.wallet.refund_status === 'eligible' && <Button size="sm" variant="primary" onClick={() => approveRefund(t)} disabled={actionLoading}>Approve Refund</Button>}
                  {t.wallet.refund_status === 'eligible' && <Button size="sm" variant="danger" onClick={() => setRefundTech(t)} disabled={actionLoading}>Reject Refund</Button>}
                  {t.wallet.refund_status === 'approved' && <Button size="sm" variant="primary" onClick={() => processRefund(t)} disabled={actionLoading}>Process Refund</Button>}
                  {t.wallet.refund_status === 'processed' && <Button size="sm" variant="primary" onClick={() => completeRefund(t)} disabled={actionLoading}>Mark Completed</Button>}
                  {t.wallet.refund_status === 'completed' && <Badge color="bg-emerald-100 text-emerald-700">Refund Completed</Badge>}
                  {t.wallet.refund_status === 'rejected' && <Badge color="bg-red-100 text-red-700">Refund Rejected</Badge>}
                </div>
              )}
            </CardContent></Card>
          )
        })}
      </div>

      <Modal open={!!viewTech} onClose={() => setViewTech(null)} title="Technician Profile">
        {viewTech && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-gray-500">Name</p><p className="font-medium">{viewTech.profile.name}</p></div>
            <div><p className="text-gray-500">Email</p><p className="font-medium">{viewTech.profile.email}</p></div>
            <div><p className="text-gray-500">Mobile</p><p className="font-medium">{viewTech.profile.mobile}</p></div>
            <div><p className="text-gray-500">City</p><p className="font-medium">{viewTech.profile.city || '-'}</p></div>
            <div><p className="text-gray-500">Experience</p><p className="font-medium">{viewTech.profile.experience || '-'}</p></div>
            <div><p className="text-gray-500">Skills</p><p className="font-medium">{(viewTech.profile.skills || []).join(', ') || '-'}</p></div>
            {viewTech.profile.bio && <div className="col-span-2"><p className="text-gray-500">Bio</p><p>{viewTech.profile.bio}</p></div>}
          </div>
        )}
      </Modal>

      <Modal open={!!viewDocs} onClose={() => setViewDocs(null)} title="Technician Documents">
        {viewDocs && (viewDocs.documents.length === 0 ? <p className="text-center text-gray-500">No documents uploaded.</p> : (
          <div className="space-y-3">
            {viewDocs.documents.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                <div><p className="font-medium text-gray-900">{d.document_type}</p>{d.document_number && <p className="text-sm text-gray-500">{d.document_number}</p>}</div>
                <div className="flex items-center gap-2">
                  <Badge color={d.verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>{d.verified ? 'Verified' : 'Pending'}</Badge>
                  <a href={d.document_url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">View</a>
                </div>
              </div>
            ))}
          </div>
        ))}
      </Modal>

      <Modal open={!!viewWallet} onClose={() => setViewWallet(null)} title="Technician Wallet">
        {viewWallet && viewWallet.wallet && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-gray-500">Balance</p><p className="font-medium">{formatCurrency(viewWallet.wallet.balance || 0)}</p></div>
            <div><p className="text-gray-500">Total Earnings</p><p className="font-medium">{formatCurrency(viewWallet.wallet.total_earnings || 0)}</p></div>
            <div><p className="text-gray-500">Pending Earnings</p><p className="font-medium">{formatCurrency(viewWallet.wallet.pending_earnings || 0)}</p></div>
            <div><p className="text-gray-500">Total Jobs</p><p className="font-medium">{viewWallet.wallet.total_jobs || 0}</p></div>
            <div><p className="text-gray-500">Completed Jobs</p><p className="font-medium">{viewWallet.wallet.completed_jobs || 0}</p></div>
            <div><p className="text-gray-500">Refund Status</p><p className="font-medium">{viewWallet.wallet.refund_status}</p></div>
          </div>
        )}
      </Modal>

      <Modal open={!!rejectTech} onClose={() => { setRejectTech(null); setRejectReason('') }} title="Reject Technician">
        <div className="space-y-4">
          <div><Label htmlFor="rreason">Rejection Reason</Label><Textarea id="rreason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={4} /></div>
          <div className="flex gap-2"><Button variant="danger" onClick={reject} disabled={actionLoading || !rejectReason.trim()}>Reject</Button><Button variant="outline" onClick={() => { setRejectTech(null); setRejectReason('') }}>Cancel</Button></div>
        </div>
      </Modal>

      <Modal open={!!refundTech} onClose={() => { setRefundTech(null); setRefundNotes('') }} title="Reject Refund">
        {refundTech && (
          <div className="space-y-4">
            <div><Label htmlFor="rnotes">Rejection Notes</Label><Textarea id="rnotes" value={refundNotes} onChange={(e) => setRefundNotes(e.target.value)} rows={4} /></div>
            <div className="flex gap-2"><Button variant="danger" onClick={rejectRefund} disabled={actionLoading || !refundNotes.trim()}>Reject Refund</Button><Button variant="outline" onClick={() => { setRefundTech(null); setRefundNotes('') }}>Cancel</Button></div>
          </div>
        )}
      </Modal>
    </div>
  )
}
