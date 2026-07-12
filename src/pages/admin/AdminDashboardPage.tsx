import { useEffect, useState } from 'react'
import { Users, Wrench, Clock, Calendar, TrendingUp, CheckCircle, XCircle, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Profile, Booking } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { createNotification, createAuditLog } from '@/lib/notifications'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { LoadingScreen } from '@/components/LoadingScreen'
import { Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency, formatDate, BOOKING_STATUS_COLORS, VERIFICATION_STATUS_COLORS, VERIFICATION_STATUS_LABELS } from '@/lib/utils'

export function AdminDashboardPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState<Profile[]>([])
  const [technicians, setTechnicians] = useState<Profile[]>([])
  const [pendingTechs, setPendingTechs] = useState<Profile[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [revenue, setRevenue] = useState(0)
  const [viewTech, setViewTech] = useState<Profile | null>(null)
  const [rejectTech, setRejectTech] = useState<Profile | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: custs } = await supabase.from('profiles').select('*').eq('role', 'customer')
      const { data: techs } = await supabase.from('profiles').select('*').eq('role', 'technician')
      const { data: bks } = await supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(5)
      const { data: invoices } = await supabase.from('invoices').select('amount').eq('status', 'paid')
      const totalRev = (invoices || []).reduce((s, i: { amount: number }) => s + i.amount, 0)
      if (mounted) {
        setCustomers((custs as Profile[]) || [])
        setTechnicians((techs as Profile[]) || [])
        setPendingTechs(((techs as Profile[]) || []).filter((t) => t.verification_status === 'under_review' || t.verification_status === 'fee_pending'))
        setBookings((bks as Booking[]) || [])
        setRevenue(totalRev)
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const approveTech = async (tech: Profile) => {
    setActionLoading(true)
    const { error } = await supabase.from('profiles').update({ verification_status: 'approved', status: 'active' }).eq('id', tech.id)
    setActionLoading(false)
    if (error) { toast('Failed to approve technician', 'error'); return }
    await createNotification(tech.id, 'Verification Approved', 'Your account has been approved. You can now start receiving jobs.', 'success')
    if (profile) await createAuditLog(profile.id, 'technician_approve', 'profile', tech.id, `Approved ${tech.name}`)
    setPendingTechs((prev) => prev.filter((t) => t.id !== tech.id))
    toast('Technician approved successfully', 'success')
  }

  const confirmReject = async () => {
    if (!rejectTech || !rejectReason.trim()) return
    setActionLoading(true)
    const { error } = await supabase.from('profiles').update({ verification_status: 'rejected', status: 'rejected', rejection_reason: rejectReason }).eq('id', rejectTech.id)
    setActionLoading(false)
    if (error) { toast('Failed to reject technician', 'error'); return }
    await createNotification(rejectTech.id, 'Verification Rejected', `Your application was rejected. Reason: ${rejectReason}`, 'error')
    if (profile) await createAuditLog(profile.id, 'technician_reject', 'profile', rejectTech.id, `Rejected ${rejectTech.name}: ${rejectReason}`)
    setPendingTechs((prev) => prev.filter((t) => t.id !== rejectTech.id))
    setRejectTech(null); setRejectReason('')
    toast('Technician rejected', 'success')
  }

  if (loading) return <LoadingScreen message="Loading dashboard..." />

  const activeBookings = bookings.filter((b) => !['completed', 'cancelled'].includes(b.status)).length
  const stats = [
    { label: 'Total Customers', value: customers.length, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Total Technicians', value: technicians.length, icon: Wrench, color: 'text-purple-600 bg-purple-50' },
    { label: 'Pending Verification', value: pendingTechs.length, icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: 'Active Bookings', value: activeBookings, icon: Calendar, color: 'text-cyan-600 bg-cyan-50' },
    { label: 'Total Revenue', value: formatCurrency(revenue), icon: TrendingUp, color: 'text-green-600 bg-green-50' },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => { const Icon = s.icon; return (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`rounded-lg p-2.5 ${s.color}`}><Icon className="h-5 w-5" /></div>
              <div><p className="text-xs text-gray-600">{s.label}</p><p className="text-lg font-bold text-gray-900">{s.value}</p></div>
            </CardContent>
          </Card>
        )})}
      </div>

      {pendingTechs.length > 0 && (
        <Card className="mb-6">
          <CardHeader><CardTitle>Pending Technician Requests ({pendingTechs.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingTechs.map((t) => (
                <div key={t.id} className="flex flex-col gap-3 rounded-lg border border-gray-100 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{t.name}</p>
                    <p className="text-sm text-gray-500">{t.email} • {t.mobile}</p>
                    <Badge color={VERIFICATION_STATUS_COLORS[t.verification_status || 'pending_registration']}>{VERIFICATION_STATUS_LABELS[t.verification_status || 'pending_registration']}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setViewTech(t)}><Eye className="mr-1 h-3.5 w-3.5" /> View</Button>
                    <Button size="sm" onClick={() => approveTech(t)} disabled={actionLoading}><CheckCircle className="mr-1 h-3.5 w-3.5" /> Approve</Button>
                    <Button size="sm" variant="danger" onClick={() => setRejectTech(t)}><XCircle className="mr-1 h-3.5 w-3.5" /> Reject</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Recent Bookings</CardTitle></CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <p className="py-8 text-center text-gray-500">No bookings yet.</p>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                  <div>
                    <p className="font-medium text-gray-900">{b.service_name}</p>
                    <p className="text-sm text-gray-500">#{b.booking_number} • {formatDate(b.scheduled_date)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(b.amount)}</span>
                    <Badge color={BOOKING_STATUS_COLORS[b.status]}>{b.status.replace(/_/g, ' ')}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={!!viewTech} onClose={() => setViewTech(null)} title="Technician Profile">
        {viewTech && (
          <div className="space-y-2">
            <p><span className="font-medium">Name:</span> {viewTech.name}</p>
            <p><span className="font-medium">Email:</span> {viewTech.email}</p>
            <p><span className="font-medium">Mobile:</span> {viewTech.mobile}</p>
            <p><span className="font-medium">Experience:</span> {viewTech.experience || 'N/A'}</p>
            <p><span className="font-medium">Skills:</span> {(viewTech.skills || []).join(', ') || 'N/A'}</p>
            <p><span className="font-medium">City:</span> {viewTech.city || 'N/A'}</p>
            <p><span className="font-medium">District:</span> {viewTech.district || 'N/A'}</p>
            <p><span className="font-medium">Bio:</span> {viewTech.bio || 'N/A'}</p>
          </div>
        )}
      </Modal>

      <Modal open={!!rejectTech} onClose={() => { setRejectTech(null); setRejectReason('') }} title="Reject Technician">
        <div className="space-y-4">
          <p>Provide a reason for rejecting <span className="font-medium">{rejectTech?.name}</span></p>
          <div>
            <Label htmlFor="reason">Rejection Reason</Label>
            <Textarea id="reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} placeholder="Enter reason..." />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setRejectTech(null); setRejectReason('') }}>Cancel</Button>
            <Button variant="danger" onClick={confirmReject} disabled={actionLoading || !rejectReason.trim()}>Reject</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
