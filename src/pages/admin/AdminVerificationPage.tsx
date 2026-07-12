import { useEffect, useState, useCallback } from 'react'
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Eye,
  Loader2,
  Search,
  FileText,
  Filter,
  AlertCircle,
  Phone,
  MapPin,
  Award,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/ui/modal'
import { useAuth } from '@/lib/auth'
import {
  supabase,
  type Profile,
  type TechnicianDocument,
  type TechnicianWallet,
  type VerificationPayment,
} from '@/lib/supabase'
import {
  cn,
  formatDate,
  formatCurrency,
  VERIFICATION_STATUS_COLORS,
  VERIFICATION_STATUS_LABELS,
} from '@/lib/utils'
import { VERIFICATION_FEE } from '@/lib/constants'
import { createNotification, createAuditLog } from '@/lib/notifications'
import { useToast } from '@/hooks/use-toast'

const STATUS_FILTERS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending_registration', label: 'Pending Registration' },
  { value: 'fee_pending', label: 'Fee Pending' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'suspended', label: 'Suspended' },
]

export default function AdminVerificationPage() {
  const { profile } = useAuth()
  const toast = useToast()

  const [technicians, setTechnicians] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [selectedTech, setSelectedTech] = useState<Profile | null>(null)
  const [documents, setDocuments] = useState<TechnicianDocument[]>([])
  const [wallet, setWallet] = useState<TechnicianWallet | null>(null)
  const [payments, setPayments] = useState<VerificationPayment[]>([])
  const [modalLoading, setModalLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectTech, setRejectTech] = useState<Profile | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const loadTechnicians = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('role', 'technician')
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('verification_status', statusFilter)
      }

      const { data, error } = await query
      if (error) throw error

      let result = (data as Profile[]) || []

      if (search.trim()) {
        const q = search.toLowerCase()
        result = result.filter(
          (t) =>
            t.name?.toLowerCase().includes(q) ||
            t.mobile?.includes(q) ||
            t.email?.toLowerCase().includes(q) ||
            t.city?.toLowerCase().includes(q),
        )
      }

      setTechnicians(result)
    } catch {
      toast.error('Failed to load technicians')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search, toast])

  useEffect(() => {
    loadTechnicians()
  }, [loadTechnicians])

  async function viewTechnician(tech: Profile) {
    setSelectedTech(tech)
    setModalLoading(true)
    try {
      const [docsRes, walletRes, paymentsRes] = await Promise.all([
        supabase
          .from('technician_documents')
          .select('*')
          .eq('technician_id', tech.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('technician_wallets')
          .select('*')
          .eq('technician_id', tech.id)
          .maybeSingle(),
        supabase
          .from('verification_payments')
          .select('*')
          .eq('technician_id', tech.id)
          .order('created_at', { ascending: false }),
      ])

      setDocuments((docsRes.data as TechnicianDocument[]) || [])
      setWallet((walletRes.data as TechnicianWallet) || null)
      setPayments((paymentsRes.data as VerificationPayment[]) || [])
    } catch {
      toast.error('Failed to load technician details')
    } finally {
      setModalLoading(false)
    }
  }

  async function approveTechnician(tech: Profile) {
    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          verification_status: 'approved',
          status: 'active',
          rejection_reason: null,
        })
        .eq('id', tech.id)

      if (error) throw error

      await createNotification(
        tech.id,
        'Verification Approved',
        'Congratulations! Your account has been approved. You can now start accepting jobs.',
        'verification',
      )
      await createAuditLog(
        profile?.id || '',
        'approve_technician',
        'profile',
        tech.id,
        `Approved technician: ${tech.name}`,
      )

      toast.success('Technician approved successfully')
      await loadTechnicians()
      setSelectedTech(null)
    } catch {
      toast.error('Failed to approve technician')
    } finally {
      setActionLoading(false)
    }
  }

  function openRejectModal(tech: Profile) {
    setRejectTech(tech)
    setRejectReason('')
    setRejectModalOpen(true)
  }

  async function rejectTechnician() {
    if (!rejectTech || !rejectReason.trim()) {
      toast.warning('Please provide a rejection reason')
      return
    }

    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          verification_status: 'rejected',
          status: 'inactive',
          rejection_reason: rejectReason.trim(),
        })
        .eq('id', rejectTech.id)

      if (error) throw error

      await createNotification(
        rejectTech.id,
        'Verification Rejected',
        `Your application was rejected. Reason: ${rejectReason.trim()}`,
        'verification',
      )
      await createAuditLog(
        profile?.id || '',
        'reject_technician',
        'profile',
        rejectTech.id,
        `Rejected technician: ${rejectTech.name}. Reason: ${rejectReason.trim()}`,
      )

      toast.success('Technician rejected')
      setRejectModalOpen(false)
      setRejectTech(null)
      setRejectReason('')
      await loadTechnicians()
      setSelectedTech(null)
    } catch {
      toast.error('Failed to reject technician')
    } finally {
      setActionLoading(false)
    }
  }

  async function moveToReview(tech: Profile) {
    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ verification_status: 'under_review' })
        .eq('id', tech.id)

      if (error) throw error

      await createAuditLog(
        profile?.id || '',
        'move_to_review',
        'profile',
        tech.id,
        `Moved technician to review: ${tech.name}`,
      )

      toast.success('Moved to under review')
      await loadTechnicians()
      if (selectedTech?.id === tech.id) {
        setSelectedTech({
          ...tech,
          verification_status: 'under_review',
        })
      }
    } catch {
      toast.error('Failed to update status')
    } finally {
      setActionLoading(false)
    }
  }

  async function suspendTechnician(tech: Profile) {
    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          verification_status: 'suspended',
          status: 'inactive',
          is_available: false,
        })
        .eq('id', tech.id)

      if (error) throw error

      await createNotification(
        tech.id,
        'Account Suspended',
        'Your account has been suspended. Please contact support for assistance.',
        'verification',
      )
      await createAuditLog(
        profile?.id || '',
        'suspend_technician',
        'profile',
        tech.id,
        `Suspended technician: ${tech.name}`,
      )

      toast.success('Technician suspended')
      await loadTechnicians()
      setSelectedTech(null)
    } catch {
      toast.error('Failed to suspend technician')
    } finally {
      setActionLoading(false)
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
          Technician Verification
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Review and approve technician applications
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label>Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by name, mobile, email, city..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-1.5 sm:w-56">
            <Label>
              <span className="flex items-center gap-1">
                <Filter className="h-3 w-3" /> Status Filter
              </span>
            </Label>
            <Select
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
            >
              {STATUS_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Technicians List */}
      {technicians.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ShieldCheck className="h-12 w-12 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-500">
              No technicians found
            </p>
            <p className="text-xs text-slate-400">
              Try adjusting your filters or search query.
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
                      Technician
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Skills
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Fee Status
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {technicians.map((tech) => (
                    <tr key={tech.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {tech.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {formatDate(tech.created_at)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-700">{tech.mobile}</div>
                        <div className="text-xs text-slate-500">
                          {tech.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {tech.city || 'N/A'}
                        {tech.district ? `, ${tech.district}` : ''}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {tech.skills?.slice(0, 2).map((skill, i) => (
                            <Badge key={i} color="gray">
                              {skill}
                            </Badge>
                          )) || (
                            <span className="text-xs text-slate-400">
                              No skills
                            </span>
                          )}
                          {tech.skills && tech.skills.length > 2 && (
                            <Badge color="gray">
                              +{tech.skills.length - 2}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={cn(
                            VERIFICATION_STATUS_COLORS[
                              tech.verification_status ||
                                'pending_registration'
                            ] || 'bg-gray-100 text-gray-700',
                          )}
                        >
                          {VERIFICATION_STATUS_LABELS[
                            tech.verification_status ||
                              'pending_registration'
                          ] || 'Pending'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {tech.verification_status === 'fee_pending' ? (
                          <Badge color="amber">
                            {formatCurrency(VERIFICATION_FEE)} due
                          </Badge>
                        ) : tech.verification_status === 'pending_registration' ? (
                          <Badge color="gray">Not paid</Badge>
                        ) : (
                          <Badge color="green">Paid</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewTechnician(tech)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {(tech.verification_status === 'under_review' ||
                            tech.verification_status === 'fee_pending') && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-green-600 hover:bg-green-50"
                                onClick={() => approveTechnician(tech)}
                                disabled={actionLoading}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => openRejectModal(tech)}
                                disabled={actionLoading}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {tech.verification_status === 'approved' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-amber-600 hover:bg-amber-50"
                              onClick={() => suspendTechnician(tech)}
                              disabled={actionLoading}
                            >
                              Suspend
                            </Button>
                          )}
                          {tech.verification_status ===
                            'pending_registration' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewTechnician(tech)}
                            >
                              Review
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Technician Detail Modal */}
      {selectedTech && (
        <Modal
          title="Technician Verification Details"
          onClose={() => setSelectedTech(null)}
          className="max-w-2xl"
        >
          {modalLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="space-y-5">
              {/* Profile Info */}
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                  <ShieldCheck className="h-8 w-8 text-slate-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {selectedTech.name}
                  </h3>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <Badge
                      className={cn(
                        VERIFICATION_STATUS_COLORS[
                          selectedTech.verification_status ||
                            'pending_registration'
                        ] || 'bg-gray-100 text-gray-700',
                      )}
                    >
                      {VERIFICATION_STATUS_LABELS[
                        selectedTech.verification_status ||
                          'pending_registration'
                      ] || 'Pending'}
                    </Badge>
                    <Badge color={selectedTech.is_available ? 'green' : 'gray'}>
                      {selectedTech.is_available ? 'Available' : 'Unavailable'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-700">{selectedTech.mobile}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-700">
                    {selectedTech.city || 'N/A'}
                    {selectedTech.district ? `, ${selectedTech.district}` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Award className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-700">
                    {selectedTech.experience || 'No experience listed'}
                  </span>
                </div>
                <div className="text-sm text-slate-700">
                  <span className="text-slate-500">Email: </span>
                  {selectedTech.email}
                </div>
              </div>

              {/* Bio */}
              {selectedTech.bio && (
                <div>
                  <p className="text-sm font-medium text-slate-700">Bio</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {selectedTech.bio}
                  </p>
                </div>
              )}

              {/* Skills */}
              {selectedTech.skills && selectedTech.skills.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-700">Skills</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedTech.skills.map((skill, i) => (
                      <Badge key={i} color="blue">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Verification Fee Status */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      Verification Fee
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatCurrency(VERIFICATION_FEE)} one-time fee
                    </p>
                  </div>
                  <Badge
                    color={
                      wallet?.verification_fee_paid ? 'green' : 'amber'
                    }
                  >
                    {wallet?.verification_fee_paid
                      ? 'Paid'
                      : 'Pending'}
                  </Badge>
                </div>
                {wallet?.verification_fee_paid_at && (
                  <p className="mt-2 text-xs text-slate-500">
                    Paid on {formatDate(wallet.verification_fee_paid_at)}
                  </p>
                )}
                {payments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {payments.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-slate-600">
                          Txn: {p.transaction_id || 'N/A'} ·{' '}
                          {p.payment_method}
                        </span>
                        <Badge
                          color={
                            p.payment_status === 'success'
                              ? 'green'
                              : 'amber'
                          }
                        >
                          {p.payment_status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Documents */}
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Documents Submitted
                </p>
                {documents.length === 0 ? (
                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                    <AlertCircle className="h-4 w-4" />
                    No documents submitted yet.
                  </div>
                ) : (
                  <div className="mt-2 space-y-2">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-slate-400" />
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {doc.document_type.replace(/_/g, ' ')}
                            </p>
                            {doc.document_number && (
                              <p className="text-xs text-slate-500">
                                {doc.document_number}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge color={doc.verified ? 'green' : 'gray'}>
                            {doc.verified ? 'Verified' : 'Pending'}
                          </Badge>
                          <a
                            href={doc.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="outline" size="sm">
                              <Eye className="mr-1 h-3 w-3" /> View
                            </Button>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Rejection Reason (if rejected) */}
              {selectedTech.verification_status === 'rejected' &&
                selectedTech.rejection_reason && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="text-sm font-medium text-red-800">
                      Rejection Reason
                    </p>
                    <p className="mt-1 text-sm text-red-700">
                      {selectedTech.rejection_reason}
                    </p>
                  </div>
                )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
                {selectedTech.verification_status === 'pending_registration' && (
                  <Button
                    onClick={() => moveToReview(selectedTech)}
                    disabled={actionLoading}
                  >
                    Move to Review
                  </Button>
                )}
                {(selectedTech.verification_status === 'under_review' ||
                  selectedTech.verification_status === 'fee_pending') && (
                  <>
                    <Button
                      onClick={() => approveTechnician(selectedTech)}
                      disabled={actionLoading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => openRejectModal(selectedTech)}
                      disabled={actionLoading}
                    >
                      <XCircle className="mr-1 h-4 w-4" /> Reject
                    </Button>
                  </>
                )}
                {selectedTech.verification_status === 'approved' && (
                  <Button
                    variant="danger"
                    onClick={() => suspendTechnician(selectedTech)}
                    disabled={actionLoading}
                  >
                    Suspend Technician
                  </Button>
                )}
                {selectedTech.verification_status === 'rejected' && (
                  <Button
                    onClick={() => moveToReview(selectedTech)}
                    disabled={actionLoading}
                  >
                    Re-review
                  </Button>
                )}
                {selectedTech.verification_status === 'suspended' && (
                  <Button
                    onClick={() => approveTechnician(selectedTech)}
                    disabled={actionLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Reinstate
                  </Button>
                )}
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && rejectTech && (
        <Modal
          title="Reject Technician"
          onClose={() => setRejectModalOpen(false)}
        >
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-600">
                You are about to reject{' '}
                <span className="font-semibold text-slate-900">
                  {rejectTech.name}
                </span>
                . Please provide a reason for the rejection.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Rejection Reason</Label>
              <Textarea
                placeholder="Enter the reason for rejection..."
                value={rejectReason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setRejectModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={rejectTechnician}
                loading={actionLoading}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
