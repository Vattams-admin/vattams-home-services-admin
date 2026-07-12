import { useEffect, useState } from 'react'
import { Users, Wrench, Clock, Activity, TrendingUp, CheckCircle, XCircle, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Profile, Booking, BookingStatus } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { createNotification, createAuditLog } from '@/lib/notifications'
import { cn, formatDate, formatCurrency, BOOKING_STATUS_COLORS, VERIFICATION_STATUS_COLORS, VERIFICATION_STATUS_LABELS } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { LoadingScreen } from '@/components/LoadingScreen'

type Stats = { customers: number; technicians: number; pending: number; active: number; revenue: number }
type BookingWithNames = Booking & { customer: Profile | null; technician: Profile | null }

export function AdminDashboardPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({ customers: 0, technicians: 0, pending: 0, active: 0, revenue: 0 })
  const [pendingTechs, setPendingTechs] = useState<Profile[]>([])
  const [recentBookings, setRecentBookings] = useState<BookingWithNames[]>([])
  const [viewTech, setViewTech] = useState<Profile | null>(null)
  const [rejectTech, setRejectTech] = useState<Profile | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actioning, setActioning] = useState(false)

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { count: customers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer')
      const { count: technicians } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'technician')
      const { count: pending } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'technician').in('verification_status', ['pending_registration', 'fee_pending', 'under_review'])
      const { count: active } = await supabase.from('bookings').select('*', { count: 'exact', head: true }).not('status', 'eq', 'completed').not('status', 'eq', 'cancelled')
      const { data: revData } = await supabase.from('invoices').select('amount').eq('status', 'paid')
      const { data: pendingData } = await supabase.from('profiles').select('*').eq('role', 'technician').in('verification_status', ['pending_registration', 'fee_pending', 'under_review']).order('created_at', { ascending: false })
      const { data: bookingsData } = await supabase.from('bookings').select('*, customer:customer_id(*), technician:technician_id(*)').order('created_at', { ascending: false }).limit(5)
      if (!mounted) return
      setStats({ customers: customers || 0, technicians: technicians || 0, pending: pending || 0, active: active || 0, revenue: (revData || []).reduce((s, r) => s + r.amount, 0) })
      setPendingTechs((pendingData || []) as Profile[])
      setRecentBookings((bookingsData || []) as BookingWithNames[])
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  const handleApproveTech = async (tech: Profile) => {
    setActioning(true)
    const { error } = await supabase.from('profiles').update({ verification_status: 'approved', status: 'active', rejection_reason: null }).eq('id', tech.id)
    setActioning(false)
    if (error) { toast('Failed to approve technician', 'error'); return }
    await createNotification(tech.id, 'Verification Approved', 'Your account has been approved. You can now start accepting jobs.', 'success')
    if (profile) await createAuditLog(profile.id, 'approve_technician', 'profile', tech.id, `Approved technician ${tech.name}`)
    toast('Technician approved successfully', 'success')
    setPendingTechs((prev) => prev.filter((t) => t.id !== tech.id))
    setViewTech(null)
  }

  const handleRejectTech = async () => {
    if (!rejectTech || !rejectReason.trim()) return
    setActioning(true)
    const { error } = await supabase.from('profiles').update({ verification_status: 'rejected', status: 'rejected', rejection_reason: rejectReason.trim() }).eq('id', rejectTech.id)
    setActioning(false)
    if (error) { toast('Failed to reject technician', 'error'); return }
    await createNotification(rejectTech.id, 'Verification Rejected', `Your application was rejected. Reason: ${rejectReason.trim()}`, 'error')
    if (profile) await createAuditLog(profile.id, 'reject_technician', 'profile', rejectTech.id, `Rejected technician ${rejectTech.name}: ${rejectReason.trim()}`)
    toast('Technician rejected', 'success')
    setPendingTechs((prev) => prev.filter((t) => t.id !== rejectTech.id))
    setRejectTech(null)
    setRejectReason('')
  }

  if (loading) return <LoadingScreen message="Loading admin dashboard..." />

  const statCards = [
    { label: 'Total Customers', value: stats.customers, icon: Users, color: 'text-blue-600 bg-blue-100' },
    { label: 'Total Technicians', value: stats.technicians, icon: Wrench, color: 'text-purple-600 bg-purple-100' },
    { label: 'Pending Verification', value: stats.pending, icon: Clock, color: 'text-amber-600 bg-amber-100' },
    { label: 'Active Bookings', value: stats.active, icon: Activity, color: 'text-green-600 bg-green-100' },
    { label: 'Total Revenue', value: formatCurrency(stats.revenue), icon: TrendingUp, color: 'text-indigo-600 bg-indigo-100' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500">Platform overview and pending approvals</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 py-4">
              <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg', s.color)}><s.icon className="h-6 w-6" /></div>
              <div><p className="text-2xl font-bold text-gray-900">{s.value}</p><p className="text-sm text-gray-500">{s.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Pending Technician Requests ({pendingTechs.length})</CardTitle></CardHeader>
        <CardContent>
          {pendingTechs.length === 0 ? (
            <p className="py-8 text-center text-gray-500">No pending technician requests.</p>
          ) : (
            <div className="space-y-3">
              {pendingTechs.map((tech) => (
                <div key={tech.id} className="flex flex-col gap-3 rounded-lg border border-gray-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-gray-900">{tech.name}</p>
                      <Badge color={VERIFICATION_STATUS_COLORS[tech.verification_status || ''] || 'bg-gray-100 text-gray-700'}>
                        {VERIFICATION_STATUS_LABELS[tech.verification_status || ''] || tech.verification_status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{tech.email} • {tech.mobile}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setViewTech(tech)}><Eye className="mr-1 h-4 w-4" />View</Button>
                    <Button size="sm" onClick={() => handleApproveTech(tech)} disabled={actioning}><CheckCircle className="mr-1 h-4 w-4" />Approve</Button>
                    <Button size="sm" variant="danger" onClick={() => setRejectTech(tech)}><XCircle className="mr-1 h-4 w-4" />Reject</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent Bookings</CardTitle></CardHeader>
        <CardContent>
          {recentBookings.length === 0 ? (
            <p className="py-8 text-center text-gray-500">No bookings yet.</p>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-gray-400">#{b.booking_number}</span>
                      <p className="font-medium text-gray-900">{b.service_name}</p>
                      <Badge color={BOOKING_STATUS_COLORS[b.status]}>{b.status.replace(/_/g, ' ')}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{b.customer?.name || 'Unknown'} • {b.technician?.name || 'Unassigned'} • {formatDate(b.scheduled_date)}</p>
                  </div>
                  <p className="ml-4 font-semibold text-gray-900">{formatCurrency(b.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
            <div className="col-span-2 flex justify-end gap-2 border-t pt-4">
              <Button variant="danger" onClick={() => { setRejectTech(viewTech); setViewTech(null) }}><XCircle className="mr-1 h-4 w-4" />Reject</Button>
              <Button onClick={() => handleApproveTech(viewTech)} disabled={actioning}><CheckCircle className="mr-1 h-4 w-4" />Approve</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!rejectTech} onClose={() => { setRejectTech(null); setRejectReason('') }} title="Reject Technician">
        {rejectTech && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Provide a reason for rejecting <strong>{rejectTech.name}</strong>:</p>
            <div>
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea id="reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} placeholder="Enter rejection reason..." />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setRejectTech(null); setRejectReason('') }}>Cancel</Button>
              <Button variant="danger" onClick={handleRejectTech} disabled={actioning || !rejectReason.trim()}>Reject Technician</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
