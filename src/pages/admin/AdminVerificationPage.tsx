import { useEffect, useState } from 'react'
import { CircleCheck as CheckCircle, Circle as XCircle, Eye, FileText, Wallet, Ban, RotateCcw, Banknote, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Profile, TechnicianWallet, TechnicianDocument, VerificationPayment, Refund } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { createNotification, createAuditLog, createRevenueTransaction } from '@/lib/notifications'
import { cn, formatDateTime, formatCurrency, VERIFICATION_STATUS_COLORS, VERIFICATION_STATUS_LABELS } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { LoadingScreen } from '@/components/LoadingScreen'
import { REFUND_ELIGIBLE_JOBS } from '@/lib/constants'

type TechWithRelations = Profile & { wallet: TechnicianWallet | null; documents: TechnicianDocument[]; payments: VerificationPayment[] }
type FilterTab = 'all' | 'pending_registration' | 'fee_pending' | 'under_review' | 'approved' | 'rejected' | 'suspended'
type Counter = { pendingReg: number; feePaid: number; underReview: number; approved: number; rejected: number; refundEligible: number; refundCompleted: number }

export function AdminVerificationPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [techs, setTechs] = useState<TechWithRelations[]>([])
  const [filter, setFilter] = useState<FilterTab>('all')
  const [counters, setCounters] = useState<Counter>({ pendingReg: 0, feePaid: 0, underReview: 0, approved: 0, rejected: 0, refundEligible: 0, refundCompleted: 0 })
  const [viewTech, setViewTech] = useState<TechWithRelations | null>(null)
  const [viewDocs, setViewDocs] = useState<TechWithRelations | null>(null)
  const [viewWallet, setViewWallet] = useState<TechWithRelations | null>(null)
  const [rejectTech, setRejectTech] = useState<TechWithRelations | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [refundNotes, setRefundNotes] = useState('')
  const [refundTech, setRefundTech] = useState<TechWithRelations | null>(null)
  const [processTech, setProcessTech] = useState<TechWithRelations | null>(null)
  const [refundMethod, setRefundMethod] = useState('upi')
  const [actioning, setActioning] = useState(false)

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.from('profiles').select('*, wallet:technician_wallets(*), documents:technician_documents(*), payments:verification_payments(*)').eq('role', 'technician').order('created_at', { ascending: false })
      if (!mounted) return
      const list = (data || []) as unknown as TechWithRelations[]
      setTechs(list)
      setCounters({
        pendingReg: list.filter((t) => t.verification_status === 'pending_registration').length,
        feePaid: list.filter((t) => t.verification_status === 'fee_pending').length,
        underReview: list.filter((t) => t.verification_status === 'under_review').length,
        approved: list.filter((t) => t.verification_status === 'approved').length,
        rejected: list.filter((t) => t.verification_status === 'rejected').length,
        refundEligible: list.filter((t) => (t.wallet?.completed_jobs || 0) >= REFUND_ELIGIBLE_JOBS && t.wallet?.refund_status === 'eligible').length,
        refundCompleted: list.filter((t) => t.wallet?.refund_status === 'completed').length,
      })
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  const filtered = filter === 'all' ? techs : techs.filter((t) => t.verification_status === filter)

  const updateTech = async (tech: Profile, updates: Record<string, unknown>, notifTitle: string, notifMsg: string, auditAction: string, auditDetails: string) => {
    setActioning(true)
    const { error } = await supabase.from('profiles').update(updates).eq('id', tech.id)
    setActioning(false)
    if (error) { toast('Action failed', 'error'); return false }
    await createNotification(tech.id, notifTitle, notifMsg, notifTitle.includes('Approv') ? 'success' : 'warning')
    if (profile) await createAuditLog(profile.id, auditAction, 'profile', tech.id, auditDetails)
    setTechs((prev) => prev.map((t) => t.id === tech.id ? { ...t, ...updates } as TechWithRelations : t))
    return true
  }

  const handleApprove = (t: TechWithRelations) => updateTech(t, { verification_status: 'approved', status: 'active', rejection_reason: null }, 'Verification Approved', 'Your account has been approved.', 'approve_technician', `Approved ${t.name}`).then((ok) => { if (ok) { toast('Technician approved', 'success'); setViewTech(null) } })
  const handleReject = async () => {
    if (!rejectTech || !rejectReason.trim()) return
    const ok = await updateTech(rejectTech, { verification_status: 'rejected', status: 'rejected', rejection_reason: rejectReason.trim() }, 'Verification Rejected', `Rejected: ${rejectReason.trim()}`, 'reject_technician', `Rejected ${rejectTech.name}: ${rejectReason.trim()}`)
    if (ok) { toast('Technician rejected', 'success'); setRejectTech(null); setRejectReason('') }
  }
  const handleSuspend = (t: TechWithRelations) => updateTech(t, { verification_status: 'suspended', status: 'suspended' }, 'Account Suspended', 'Your account has been suspended.', 'suspend_technician', `Suspended ${t.name}`).then((ok) => { if (ok) toast('Technician suspended', 'success') })
  const handleActivate = (t: TechWithRelations) => updateTech(t, { verification_status: 'approved', status: 'active' }, 'Account Activated', 'Your account has been reactivated.', 'activate_technician', `Activated ${t.name}`).then((ok) => { if (ok) toast('Technician activated', 'success') })

  const handleApproveRefund = async (t: TechWithRelations) => {
    if (!t.wallet) return
    setActioning(true)
    await supabase.from('technician_wallets').update({ refund_status: 'approved' }).eq('id', t.wallet.id)
    await supabase.from('refunds').insert({ technician_id: t.id, amount: t.wallet.refund_amount, refund_type: 'verification_fee', status: 'approved', admin_id: profile?.id || null })
    setActioning(false)
    await createNotification(t.id, 'Refund Approved', 'Your refund has been approved and will be processed soon.', 'success')
    toast('Refund approved', 'success')
    setTechs((prev) => prev.map((x) => x.id === t.id ? { ...x, wallet: x.wallet ? { ...x.wallet, refund_status: 'approved' } : null } : x))
  }


  const handleRejectRefund = async () => {
    if (!refundTech || !refundTech.wallet) return
    setActioning(true)
    await supabase.from('technician_wallets').update({ refund_status: 'rejected' }).eq('id', refundTech.wallet.id)
    await supabase.from('refunds').update({ status: 'rejected', admin_notes: refundNotes.trim() }).eq('technician_id', refundTech.id).eq('refund_type', 'verification_fee')
    setActioning(false)
    await createNotification(refundTech.id, 'Refund Rejected', `Your refund request was rejected. Notes: ${refundNotes.trim()}`, 'error')
    toast('Refund rejected', 'success'); setRefundTech(null); setRefundNotes('')
    setTechs((prev) => prev.map((x) => x.id === refundTech.id ? { ...x, wallet: x.wallet ? { ...x.wallet, refund_status: 'rejected' } : null } : x))
  }


  const handleProcessRefund = async () => {
    if (!processTech || !processTech.wallet) return
    setActioning(true)
    await supabase.from('technician_wallets').update({ refund_status: 'processed', refund_processed_at: new Date().toISOString(), refund_method: refundMethod }).eq('id', processTech.wallet.id)
    await supabase.from('refunds').update({ status: 'processed', refund_method: refundMethod, processed_at: new Date().toISOString() }).eq('technician_id', processTech.id).eq('refund_type', 'verification_fee')
    setActioning(false)
    await createNotification(processTech.id, 'Refund Processed', `Your refund is being processed via ${refundMethod}.`, 'info')
    toast('Refund processed', 'success'); setProcessTech(null)
    setTechs((prev) => prev.map((x) => x.id === processTech.id ? { ...x, wallet: x.wallet ? { ...x.wallet, refund_status: 'processed', refund_method: refundMethod, refund_processed_at: new Date().toISOString() } : null } : x))
  }


  const handleCompleteRefund = async (t: TechWithRelations) => {
    if (!t.wallet) return
    setActioning(true)
    await supabase.from('technician_wallets').update({ refund_status: 'completed', refund_completed_at: new Date().toISOString(), balance: t.wallet.balance + t.wallet.refund_amount }).eq('id', t.wallet.id)
    const { data: refund } = await supabase.from('refunds').select('*').eq('technician_id', t.id).eq('refund_type', 'verification_fee').order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (refund) await supabase.from('refunds').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', (refund as Refund).id)
    await createRevenueTransaction('refund', t.wallet.refund_amount, t.id, null, `Refund completed for ${t.name}`)
    setActioning(false)
    await createNotification(t.id, 'Refund Completed', `Your refund of ${formatCurrency(t.wallet.refund_amount)} has been completed.`, 'success')
    toast('Refund completed', 'success')
    setTechs((prev) => prev.map((x) => x.id === t.id ? { ...x, wallet: x.wallet ? { ...x.wallet, refund_status: 'completed', refund_completed_at: new Date().toISOString(), balance: x.wallet.balance + x.wallet.refund_amount } : null } : x))
  }

  if (loading) return <LoadingScreen message="Loading verification data..." />

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' }, { key: 'pending_registration', label: 'Pending Reg.' }, { key: 'fee_pending', label: 'Fee Pending' },
    { key: 'under_review', label: 'Under Review' }, { key: 'approved', label: 'Approved' }, { key: 'rejected', label: 'Rejected' }, { key: 'suspended', label: 'Suspended' },
  ]
  const counterCards = [
    { label: 'Pending Reg.', value: counters.pendingReg, color: 'text-gray-600 bg-gray-100' }, { label: 'Fee Paid', value: counters.feePaid, color: 'text-amber-600 bg-amber-100' },
    { label: 'Under Review', value: counters.underReview, color: 'text-blue-600 bg-blue-100' }, { label: 'Approved', value: counters.approved, color: 'text-green-600 bg-green-100' },
    { label: 'Rejected', value: counters.rejected, color: 'text-red-600 bg-red-100' }, { label: 'Refund Eligible', value: counters.refundEligible, color: 'text-indigo-600 bg-indigo-100' },
    { label: 'Refund Done', value: counters.refundCompleted, color: 'text-purple-600 bg-purple-100' },
  ]

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Technician Verification</h1><p className="text-sm text-gray-500">Manage technician verification and refunds</p></div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-7">
        {counterCards.map((c) => (
          <Card key={c.label}><CardContent className="py-3 text-center">
            <div className={cn('mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full', c.color)}><span className="text-sm font-bold">{c.value}</span></div>
            <p className="text-xs text-gray-500">{c.label}</p>
          </CardContent></Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setFilter(t.key)} className={cn('rounded-full px-3 py-1.5 text-sm font-medium', filter === t.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>{t.label}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><p className="text-gray-500">No technicians found.</p></CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((t) => (
            <Card key={t.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-gray-900">{t.name}</p>
                      <Badge color={VERIFICATION_STATUS_COLORS[t.verification_status || ''] || 'bg-gray-100'}>{VERIFICATION_STATUS_LABELS[t.verification_status || ''] || t.verification_status}</Badge>
                      {t.wallet?.verification_fee_paid && <Badge color="bg-green-100 text-green-700">Fee Paid</Badge>}
                      {(t.wallet?.completed_jobs || 0) >= REFUND_ELIGIBLE_JOBS && t.wallet?.refund_status === 'eligible' && <Badge color="bg-indigo-100 text-indigo-700">Refund Eligible</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{t.email} • {t.mobile}</p>
                    <p className="text-xs text-gray-400">Completed Jobs: {t.wallet?.completed_jobs || 0}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(t.verification_status === 'pending_registration' || t.verification_status === 'fee_pending' || t.verification_status === 'under_review') && (
                    <Button size="sm" variant="outline" onClick={() => setViewDocs(t)}><FileText className="mr-1 h-4 w-4" />Docs</Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setViewTech(t)}><Eye className="mr-1 h-4 w-4" />Profile</Button>
                  {t.verification_status === 'under_review' && (
                    <>
                      <Button size="sm" onClick={() => handleApprove(t)} disabled={actioning}><CheckCircle className="mr-1 h-4 w-4" />Approve</Button>
                      <Button size="sm" variant="danger" onClick={() => setRejectTech(t)}><XCircle className="mr-1 h-4 w-4" />Reject</Button>
                    </>
                  )}
                  {t.verification_status === 'approved' && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setViewWallet(t)}><Wallet className="mr-1 h-4 w-4" />Wallet</Button>
                      <Button size="sm" variant="danger" onClick={() => handleSuspend(t)} disabled={actioning}><Ban className="mr-1 h-4 w-4" />Suspend</Button>
                    </>
                  )}
                  {t.verification_status === 'suspended' && <Button size="sm" onClick={() => handleActivate(t)} disabled={actioning}><RotateCcw className="mr-1 h-4 w-4" />Activate</Button>}
                  {t.verification_status === 'rejected' && <Button size="sm" onClick={() => handleApprove(t)} disabled={actioning}><CheckCircle className="mr-1 h-4 w-4" />Approve</Button>}
                  {t.wallet?.refund_status === 'eligible' && <Button size="sm" variant="outline" onClick={() => handleApproveRefund(t)} disabled={actioning}><Check className="mr-1 h-4 w-4" />Approve Refund</Button>}
                  {t.wallet?.refund_status === 'approved' && <Button size="sm" variant="outline" onClick={() => setRefundTech(t)} disabled={actioning}><XCircle className="mr-1 h-4 w-4" />Reject Refund</Button>}
                  {t.wallet?.refund_status === 'approved' && <Button size="sm" onClick={() => setProcessTech(t)} disabled={actioning}><Banknote className="mr-1 h-4 w-4" />Process Refund</Button>}
                  {t.wallet?.refund_status === 'processed' && <Button size="sm" onClick={() => handleCompleteRefund(t)} disabled={actioning}><CheckCircle className="mr-1 h-4 w-4" />Complete Refund</Button>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Profile */}
      <Modal open={!!viewTech} onClose={() => setViewTech(null)} title="Technician Profile">
        {viewTech && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-gray-500">Name</p><p className="font-medium">{viewTech.name}</p></div>
            <div><p className="text-gray-500">Email</p><p className="font-medium">{viewTech.email}</p></div>
            <div><p className="text-gray-500">Mobile</p><p className="font-medium">{viewTech.mobile}</p></div>
            <div><p className="text-gray-500">City</p><p className="font-medium">{viewTech.city || '-'}</p></div>
            <div><p className="text-gray-500">Experience</p><p className="font-medium">{viewTech.experience || '-'}</p></div>
            <div><p className="text-gray-500">Status</p><Badge color={VERIFICATION_STATUS_COLORS[viewTech.verification_status || '']}>{VERIFICATION_STATUS_LABELS[viewTech.verification_status || '']}</Badge></div>
            <div className="col-span-2"><p className="text-gray-500">Skills</p><div className="flex flex-wrap gap-1 mt-1">{(viewTech.skills || []).map((s) => <Badge key={s}>{s}</Badge>)}</div></div>
            {viewTech.bio && <div className="col-span-2"><p className="text-gray-500">Bio</p><p className="font-medium">{viewTech.bio}</p></div>}
            {viewTech.rejection_reason && <div className="col-span-2"><p className="text-gray-500">Rejection Reason</p><p className="font-medium text-red-600">{viewTech.rejection_reason}</p></div>}
          </div>
        )}
      </Modal>

      {/* View Documents */}
      <Modal open={!!viewDocs} onClose={() => setViewDocs(null)} title="Technician Documents">
        {viewDocs && (
          <div className="space-y-3">
            {(!viewDocs.documents || viewDocs.documents.length === 0) ? (
              <p className="text-center text-gray-500 py-4">No documents uploaded.</p>
            ) : viewDocs.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                <div><p className="font-medium text-gray-900">{doc.document_type}</p>{doc.document_number && <p className="text-sm text-gray-500">{doc.document_number}</p>}<p className="text-xs text-gray-400">{formatDateTime(doc.created_at)}</p></div>
                <div className="flex items-center gap-2">
                  <Badge color={doc.verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>{doc.verified ? 'Verified' : 'Pending'}</Badge>
                  <a href={doc.document_url} target="_blank" rel="noreferrer"><Button size="sm" variant="outline">View</Button></a>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* View Wallet */}
      <Modal open={!!viewWallet} onClose={() => setViewWallet(null)} title="Technician Wallet">
        {viewWallet && viewWallet.wallet && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-gray-500">Balance</p><p className="font-medium">{formatCurrency(viewWallet.wallet.balance)}</p></div>
            <div><p className="text-gray-500">Total Earnings</p><p className="font-medium">{formatCurrency(viewWallet.wallet.total_earnings)}</p></div>
            <div><p className="text-gray-500">Pending Earnings</p><p className="font-medium">{formatCurrency(viewWallet.wallet.pending_earnings)}</p></div>
            <div><p className="text-gray-500">Verification Fee</p><p className="font-medium">{formatCurrency(viewWallet.wallet.verification_fee_amount)}</p></div>
            <div><p className="text-gray-500">Fee Paid</p><Badge color={viewWallet.wallet.verification_fee_paid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>{viewWallet.wallet.verification_fee_paid ? 'Yes' : 'No'}</Badge></div>
            <div><p className="text-gray-500">Total Jobs</p><p className="font-medium">{viewWallet.wallet.total_jobs}</p></div>
            <div><p className="text-gray-500">Completed Jobs</p><p className="font-medium">{viewWallet.wallet.completed_jobs}</p></div>
            <div><p className="text-gray-500">Refund Status</p><Badge color="bg-gray-100 text-gray-700">{viewWallet.wallet.refund_status}</Badge></div>
            {viewWallet.wallet.refund_amount > 0 && <div><p className="text-gray-500">Refund Amount</p><p className="font-medium">{formatCurrency(viewWallet.wallet.refund_amount)}</p></div>}
          </div>
        )}
      </Modal>

      {/* Reject Technician */}
      <Modal open={!!rejectTech} onClose={() => { setRejectTech(null); setRejectReason('') }} title="Reject Technician">
        {rejectTech && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Provide a reason for rejecting <strong>{rejectTech.name}</strong>:</p>
            <div><Label htmlFor="reason">Rejection Reason</Label><Textarea id="reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} /></div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => { setRejectTech(null); setRejectReason('') }}>Cancel</Button><Button variant="danger" onClick={handleReject} disabled={actioning || !rejectReason.trim()}>Reject</Button></div>
          </div>
        )}
      </Modal>

      {/* Reject Refund */}
      <Modal open={!!refundTech} onClose={() => { setRefundTech(null); setRefundNotes('') }} title="Reject Refund">
        {refundTech && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Provide notes for rejecting <strong>{refundTech.name}</strong>'s refund:</p>
            <div><Label htmlFor="rnotes">Notes</Label><Textarea id="rnotes" value={refundNotes} onChange={(e) => setRefundNotes(e.target.value)} rows={3} /></div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => { setRefundTech(null); setRefundNotes('') }}>Cancel</Button><Button variant="danger" onClick={handleRejectRefund} disabled={actioning || !refundNotes.trim()}>Reject Refund</Button></div>
          </div>
        )}
      </Modal>

      {/* Process Refund */}
      <Modal open={!!processTech} onClose={() => setProcessTech(null)} title="Process Refund">
        {processTech && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Process refund of <strong>{formatCurrency(processTech.wallet?.refund_amount || 0)}</strong> for <strong>{processTech.name}</strong>:</p>
            <div><Label htmlFor="method">Refund Method</Label><Select id="method" value={refundMethod} onChange={(e) => setRefundMethod(e.target.value)}><option value="upi">UPI</option><option value="bank_transfer">Bank Transfer</option><option value="cash">Cash</option></Select></div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setProcessTech(null)}>Cancel</Button><Button onClick={handleProcessRefund} disabled={actioning}>Process Refund</Button></div>
          </div>
        )}
      </Modal>
    </div>
  )
}
