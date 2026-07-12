import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile, TechnicianWallet, TechnicianDocument, VerificationPayment, Refund } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { createNotification, createAuditLog, createRevenueTransaction } from '@/lib/notifications'
import { cn, formatCurrency, formatDateTime, VERIFICATION_STATUS_COLORS, VERIFICATION_STATUS_LABELS } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { LoadingScreen } from '@/components/LoadingScreen'
import { REFUND_ELIGIBLE_JOBS } from '@/lib/constants'
import { Eye, FileText, Wallet, Check, X, Pause, Play, DollarSign } from 'lucide-react'

type TechData = Profile & { wallets: TechnicianWallet | null; documents: TechnicianDocument[]; payments: VerificationPayment[] }
type Tab = 'all' | 'pending_registration' | 'fee_pending' | 'under_review' | 'approved' | 'rejected' | 'suspended'

export function AdminVerificationPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [techs, setTechs] = useState<TechData[]>([])
  const [tab, setTab] = useState<Tab>('all')
  const [viewTech, setViewTech] = useState<TechData | null>(null)
  const [viewDocs, setViewDocs] = useState<TechData | null>(null)
  const [rejectTech, setRejectTech] = useState<TechData | null>(null)
  const [reason, setReason] = useState('')
  const [refundTech, setRefundTech] = useState<TechData | null>(null)
  const [refundNotes, setRefundNotes] = useState('')
  const [refundMethod, setRefundMethod] = useState('upi')

  const fetchTechs = async () => {
    const { data: profiles } = await supabase.from('profiles').select('*').eq('role', 'technician').order('created_at', { ascending: false })
    const ids = (profiles || []).map((p) => p.id)
    if (ids.length === 0) { setTechs([]); setLoading(false); return }
    const [{ data: wallets }, { data: docs }, { data: payments }] = await Promise.all([
      supabase.from('technician_wallets').select('*').in('technician_id', ids),
      supabase.from('technician_documents').select('*').in('technician_id', ids),
      supabase.from('verification_payments').select('*').in('technician_id', ids),
    ])
    const map: TechData[] = (profiles || []).map((p) => ({
      ...p, wallets: (wallets || []).find((w) => w.technician_id === p.id) || null,
      documents: (docs || []).filter((d) => d.technician_id === p.id) as TechnicianDocument[],
      payments: (payments || []).filter((py) => py.technician_id === p.id) as VerificationPayment[],
    }))
    setTechs(map); setLoading(false)
  }

  useEffect(() => {
    let mounted = true;
    (async () => { await fetchTechs(); if (!mounted) return })()
    return () => { mounted = false }
  }, [])

  const counters = {
    pending_registration: techs.filter((t) => t.verification_status === 'pending_registration').length,
    fee_paid: techs.filter((t) => t.wallets?.verification_fee_paid).length,
    under_review: techs.filter((t) => t.verification_status === 'under_review').length,
    approved: techs.filter((t) => t.verification_status === 'approved').length,
    rejected: techs.filter((t) => t.verification_status === 'rejected').length,
    refund_eligible: techs.filter((t) => t.verification_status === 'approved' && (t.wallets?.completed_jobs || 0) >= REFUND_ELIGIBLE_JOBS && t.wallets?.refund_status === 'eligible').length,
    refund_completed: techs.filter((t) => t.wallets?.refund_status === 'completed').length,
  }

  const filtered = techs.filter((t) => tab === 'all' || t.verification_status === tab)
  const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: 'All' }, { key: 'pending_registration', label: 'Pending Registration' },
    { key: 'fee_pending', label: 'Fee Pending' }, { key: 'under_review', label: 'Under Review' },
    { key: 'approved', label: 'Approved' }, { key: 'rejected', label: 'Rejected' }, { key: 'suspended', label: 'Suspended' },
  ]

  const updateStatus = async (t: TechData, vs: string, st: string, title: string, msg: string, type: string) => {
    await supabase.from('profiles').update({ verification_status: vs, status: st }).eq('id', t.id)
    await createNotification(t.id, title, msg, type)
    await createAuditLog(profile?.id || '', `${vs}_technician`, 'profile', t.id, `${title}: ${t.name}`)
    toast(title, type === 'error' ? 'error' : 'success')
    await fetchTechs()
  }

  const approve = (t: TechData) => updateStatus(t, 'approved', 'active', 'Verification Approved', 'Your account has been approved.', 'success')
  const suspend = (t: TechData) => updateStatus(t, 'suspended', 'suspended', 'Account Suspended', 'Your account has been suspended.', 'error')
  const activate = (t: TechData) => updateStatus(t, 'approved', 'active', 'Account Activated', 'Your account has been activated.', 'success')

  const doReject = async () => {
    if (!rejectTech || !reason.trim()) return
    await supabase.from('profiles').update({ verification_status: 'rejected', status: 'rejected', rejection_reason: reason }).eq('id', rejectTech.id)
    await createNotification(rejectTech.id, 'Verification Rejected', `Rejected: ${reason}`, 'error')
    await createAuditLog(profile?.id || '', 'reject_technician', 'profile', rejectTech.id, `Rejected: ${reason}`)
    toast('Technician rejected', 'error')
    setRejectTech(null); setReason(''); await fetchTechs()
  }

  const refundAction = async (t: TechData, action: 'approve' | 'reject' | 'process' | 'complete') => {
    const w = t.wallets; if (!w) return
    if (action === 'approve') {
      await supabase.from('technician_wallets').update({ refund_status: 'approved' }).eq('id', w.id)
      await supabase.from('refunds').insert({ technician_id: t.id, amount: w.refund_amount, refund_type: 'verification_fee', status: 'approved', admin_id: profile?.id })
      await createNotification(t.id, 'Refund Approved', 'Your refund has been approved.', 'success')
    } else if (action === 'reject') {
      await supabase.from('technician_wallets').update({ refund_status: 'rejected' }).eq('id', w.id)
      await supabase.from('refunds').insert({ technician_id: t.id, amount: w.refund_amount, refund_type: 'verification_fee', status: 'rejected', admin_id: profile?.id, admin_notes: refundNotes })
      await createNotification(t.id, 'Refund Rejected', `Refund rejected: ${refundNotes}`, 'error')
    } else if (action === 'process') {
      await supabase.from('technician_wallets').update({ refund_status: 'processed', refund_processed_at: new Date().toISOString(), refund_method: refundMethod }).eq('id', w.id)
      const { data: r } = await supabase.from('refunds').select('*').eq('technician_id', t.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
      if (r) await supabase.from('refunds').update({ status: 'processed', refund_method: refundMethod, processed_at: new Date().toISOString() }).eq('id', (r as Refund).id)
      await createNotification(t.id, 'Refund Processed', 'Your refund has been processed.', 'info')
    } else if (action === 'complete') {
      await supabase.from('technician_wallets').update({ refund_status: 'completed', refund_completed_at: new Date().toISOString(), balance: w.balance + w.refund_amount }).eq('id', w.id)
      const { data: r } = await supabase.from('refunds').select('*').eq('technician_id', t.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
      if (r) await supabase.from('refunds').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', (r as Refund).id)
      await createRevenueTransaction('refund', w.refund_amount, t.id, null, `Refund completed for ${t.name}`)
      await createNotification(t.id, 'Refund Completed', `${formatCurrency(w.refund_amount)} refunded to your wallet.`, 'success')
    }
    await createAuditLog(profile?.id || '', `refund_${action}`, 'technician_wallet', w.id, `Refund ${action} for ${t.name}`)
    toast(`Refund ${action}`, 'success')
    setRefundTech(null); setRefundNotes(''); await fetchTechs()
  }

  if (loading) return <LoadingScreen message="Loading verification..." />

  const counterCards = [
    { label: 'Pending Registration', value: counters.pending_registration, color: 'bg-gray-50 text-gray-700' },
    { label: 'Fee Paid', value: counters.fee_paid, color: 'bg-amber-50 text-amber-700' },
    { label: 'Under Review', value: counters.under_review, color: 'bg-blue-50 text-blue-700' },
    { label: 'Approved', value: counters.approved, color: 'bg-green-50 text-green-700' },
    { label: 'Rejected', value: counters.rejected, color: 'bg-red-50 text-red-700' },
    { label: 'Refund Eligible', value: counters.refund_eligible, color: 'bg-purple-50 text-purple-700' },
    { label: 'Refund Completed', value: counters.refund_completed, color: 'bg-indigo-50 text-indigo-700' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Technician Verification</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {counterCards.map((c) => (
          <div key={c.label} className={cn('rounded-lg p-3', c.color)}><p className="text-xs font-medium">{c.label}</p><p className="text-xl font-bold">{c.value}</p></div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('rounded-full px-3 py-1.5 text-sm font-medium', tab === t.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>{t.label}</button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => { const w = t.wallets; const refundEligible = t.verification_status === 'approved' && (w?.completed_jobs || 0) >= REFUND_ELIGIBLE_JOBS && w?.refund_status === 'eligible'; return (
          <Card key={t.id}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div><p className="font-medium text-gray-900">{t.name}</p><p className="text-xs text-gray-500">{t.email}</p></div>
                <Badge color={VERIFICATION_STATUS_COLORS[t.verification_status || '']}>{VERIFICATION_STATUS_LABELS[t.verification_status || '']}</Badge>
              </div>
              <p className="text-xs text-gray-500">Mobile: {t.mobile}</p>
              <div className="flex items-center gap-2 text-xs">
                <Badge color={w?.verification_fee_paid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>{w?.verification_fee_paid ? 'Fee Paid' : 'Fee Pending'}</Badge>
                <span className="text-gray-500">Jobs: {w?.completed_jobs || 0}</span>
                {refundEligible && <Badge color="bg-purple-100 text-purple-700">Refund Eligible</Badge>}
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(t.verification_status === 'pending_registration' || t.verification_status === 'fee_pending' || t.verification_status === 'under_review') && (
                  <Button size="sm" variant="outline" onClick={() => setViewDocs(t)}><FileText className="h-3.5 w-3.5" />Docs</Button>
                )}
                <Button size="sm" variant="outline" onClick={() => setViewTech(t)}><Eye className="h-3.5 w-3.5" />Profile</Button>
                {t.verification_status === 'under_review' && <>
                  <Button size="sm" onClick={() => approve(t)}><Check className="h-3.5 w-3.5" />Approve</Button>
                  <Button size="sm" variant="danger" onClick={() => setRejectTech(t)}><X className="h-3.5 w-3.5" />Reject</Button>
                </>}
                {t.verification_status === 'approved' && <>
                  <Button size="sm" variant="outline" onClick={() => setViewTech(t)}><Wallet className="h-3.5 w-3.5" />Wallet</Button>
                  <Button size="sm" variant="danger" onClick={() => suspend(t)}><Pause className="h-3.5 w-3.5" />Suspend</Button>
                </>}
                {t.verification_status === 'suspended' && <Button size="sm" onClick={() => activate(t)}><Play className="h-3.5 w-3.5" />Activate</Button>}
                {t.verification_status === 'rejected' && <Button size="sm" onClick={() => approve(t)}><Check className="h-3.5 w-3.5" />Approve</Button>}
                {refundEligible && <Button size="sm" variant="outline" onClick={() => setRefundTech(t)}><DollarSign className="h-3.5 w-3.5" />Refund</Button>}
              </div>
            </CardContent>
          </Card>
        )})}
      </div>

      <Modal open={!!viewTech} onClose={() => setViewTech(null)} title="Technician Details">
        {viewTech && (
          <div className="space-y-1.5 text-sm">
            <p><span className="font-medium">Name:</span> {viewTech.name}</p><p><span className="font-medium">Email:</span> {viewTech.email}</p>
            <p><span className="font-medium">Mobile:</span> {viewTech.mobile}</p><p><span className="font-medium">City:</span> {viewTech.city || '-'}</p>
            <p><span className="font-medium">Experience:</span> {viewTech.experience || '-'}</p>
            <p><span className="font-medium">Skills:</span> {(viewTech.skills || []).join(', ') || '-'}</p>
            {viewTech.wallets && <>
              <p className="pt-2 font-medium">Wallet</p>
              <p>Balance: {formatCurrency(viewTech.wallets.balance)}</p>
              <p>Total Earnings: {formatCurrency(viewTech.wallets.total_earnings)}</p>
              <p>Completed Jobs: {viewTech.wallets.completed_jobs}</p>
              <p>Refund Status: {viewTech.wallets.refund_status}</p>
            </>}
          </div>
        )}
      </Modal>

      <Modal open={!!viewDocs} onClose={() => setViewDocs(null)} title="Technician Documents">
        {viewDocs && (viewDocs.documents.length === 0 ? <p className="text-sm text-gray-500">No documents uploaded.</p> : (
          <div className="space-y-2">
            {viewDocs.documents.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                <div><p className="font-medium">{d.document_type}</p><p className="text-xs text-gray-500">{d.document_number || '-'} · {formatDateTime(d.created_at)}</p></div>
                <a href={d.document_url} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="outline">View</Button></a>
              </div>
            ))}
          </div>
        ))}
      </Modal>

      <Modal open={!!rejectTech} onClose={() => { setRejectTech(null); setReason('') }} title="Reject Technician">
        <div className="space-y-3">
          <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Rejection reason..." />
          <div className="flex gap-2 justify-end"><Button variant="outline" size="sm" onClick={() => { setRejectTech(null); setReason('') }}>Cancel</Button><Button variant="danger" size="sm" onClick={doReject} disabled={!reason.trim()}>Reject</Button></div>
        </div>
      </Modal>

      <Modal open={!!refundTech} onClose={() => { setRefundTech(null); setRefundNotes('') }} title="Process Refund">
        {refundTech && refundTech.wallets && (
          <div className="space-y-3">
            <p className="text-sm">Refund Amount: <span className="font-bold">{formatCurrency(refundTech.wallets.refund_amount)}</span></p>
            <p className="text-sm">Current Status: <Badge color="bg-purple-100 text-purple-700">{refundTech.wallets.refund_status}</Badge></p>
            <div><Label>Refund Method</Label><Select value={refundMethod} onChange={(e) => setRefundMethod(e.target.value)}><option value="upi">UPI</option><option value="bank">Bank Transfer</option><option value="wallet">Wallet</option></Select></div>
            <div><Label>Admin Notes</Label><Textarea rows={2} value={refundNotes} onChange={(e) => setRefundNotes(e.target.value)} placeholder="Notes..." /></div>
            <div className="flex flex-wrap gap-2 justify-end">
              {refundTech.wallets.refund_status === 'eligible' && <Button size="sm" onClick={() => refundAction(refundTech, 'approve')}>Approve Refund</Button>}
              {refundTech.wallets.refund_status === 'eligible' && <Button size="sm" variant="danger" onClick={() => refundAction(refundTech, 'reject')}>Reject Refund</Button>}
              {refundTech.wallets.refund_status === 'approved' && <Button size="sm" onClick={() => refundAction(refundTech, 'process')}>Process Refund</Button>}
              {refundTech.wallets.refund_status === 'processed' && <Button size="sm" onClick={() => refundAction(refundTech, 'complete')}>Mark Completed</Button>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
