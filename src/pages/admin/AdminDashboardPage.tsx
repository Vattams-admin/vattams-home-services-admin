import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile, Booking } from '@/lib/supabase'
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
import { Users, Wrench, Clock, Calendar, TrendingUp, CheckCircle, XCircle } from 'lucide-react'

export function AdminDashboardPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ customers: 0, technicians: 0, pending: 0, active: 0, revenue: 0 })
  const [pendingTechs, setPendingTechs] = useState<Profile[]>([])
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
  const [viewTech, setViewTech] = useState<Profile | null>(null)
  const [rejectTech, setRejectTech] = useState<Profile | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { count: customers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer')
      const { count: technicians } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'technician')
      const { count: pending } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'technician').eq('verification_status', 'under_review')
      const { count: active } = await supabase.from('bookings').select('*', { count: 'exact', head: true }).not('status', 'in', '("completed","cancelled")')
      const { data: invoices } = await supabase.from('invoices').select('amount').eq('status', 'paid')
      const { data: techs } = await supabase.from('profiles').select('*').eq('role', 'technician').eq('verification_status', 'under_review').order('created_at', { ascending: false })
      const { data: bks } = await supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(5)
      if (!mounted) return
      setStats({
        customers: customers || 0,
        technicians: technicians || 0,
        pending: pending || 0,
        active: active || 0,
        revenue: (invoices || []).reduce((s, i) => s + (i.amount || 0), 0),
      })
      setPendingTechs((techs || []) as Profile[])
      setRecentBookings((bks || []) as Booking[])
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  const approveTech = async (tech: Profile) => {
    setActionLoading(true)
    const { error } = await supabase.from('profiles').update({ verification_status: 'approved', status: 'active', rejection_reason: null }).eq('id', tech.id)
    if (error) { toast('Failed to approve technician', 'error'); setActionLoading(false); return }
    await createNotification(tech.id, 'Verification Approved', 'Your account has been approved. You can now start accepting jobs.', 'success')
    if (profile) await createAuditLog(profile.id, 'approve_technician', 'profile', tech.id, `Approved technician ${tech.name}`)
    toast('Technician approved successfully', 'success')
    setPendingTechs((t) => t.filter((x) => x.id !== tech.id))
    setViewTech(null)
    setActionLoading(false)
  }

  const handleRejectTech = async () => {
    if (!rejectTech || !rejectReason.trim()) return
    setActionLoading(true)
    const { error } = await supabase.from('profiles').update({ verification_status: 'rejected', status: 'rejected', rejection_reason: rejectReason.trim() }).eq('id', rejectTech.id)
    if (error) { toast('Failed to reject technician', 'error'); setActionLoading(false); return }
    await createNotification(rejectTech.id, 'Verification Rejected', `Your application was rejected. Reason: ${rejectReason.trim()}`, 'error')
    if (profile) await createAuditLog(profile.id, 'reject_technician', 'profile', rejectTech.id, `Rejected technician ${rejectTech.name}: ${rejectReason.trim()}`)
    toast('Technician rejected', 'info')
    setPendingTechs((t) => t.filter((x) => x.id !== rejectTech.id))
    setRejectTech(null)
    setRejectReason('')
    setActionLoading(false)
  }

  if (loading) return <LoadingScreen message="Loading dashboard..." />

  const statCards = [
    { label: 'Total Customers', value: stats.customers, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Total Technicians', value: stats.technicians, icon: Wrench, color: 'text-purple-600 bg-purple-50' },
    { label: 'Pending Verification', value: stats.pending, icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: 'Active Bookings', value: stats.active, icon: Calendar, color: 'text-cyan-600 bg-cyan-50' },
    { label: 'Total Revenue', value: formatCurrency(stats.revenue), icon: TrendingUp, color: 'text-green-600 bg-green-50' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome back, {profile?.name}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className={cn('rounded-lg p-3', s.color)}><Icon className="h-6 w-6" /></div>
                <div>
                  <p className="text-xs text-gray-600">{s.label}</p>
                  <p className="text-lg font-bold text-gray-900">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader><CardTitle>Pending Technician Requests</CardTitle></CardHeader>
        <CardContent>
          {pendingTechs.length === 0 ? (
            <p className="py-6 text-center text-gray-500">No pending verification requests.</p>
          ) : (
            <div className="space-y-3">
              {pendingTechs.map((t) => (
                <div key={t.id} className="flex flex-col gap-3 rounded-lg border border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="font-medium text-gray-900">{t.name}</p>
                    <p className="text-sm text-gray-500">{t.email} · {t.mobile}</p>
                    {t.verification_status && <Badge color={VERIFICATION_STATUS_COLORS[t.verification_status]}>{VERIFICATION_STATUS_LABELS[t.verification_status]}</Badge>}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setViewTech(t)}>View Profile</Button>
                    <Button size="sm" variant="primary" onClick={() => approveTech(t)} disabled={actionLoading}><CheckCircle className="mr-1 h-4 w-4" />Approve</Button>
                    <Button size="sm" variant="danger" onClick={() => setRejectTech(t)} disabled={actionLoading}><XCircle className="mr-1 h-4 w-4" />Reject</Button>
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
            <p className="py-6 text-center text-gray-500">No bookings yet.</p>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                  <div className="space-y-1">
                    <p className="font-medium text-gray-900">{b.service_name}</p>
                    <p className="text-sm text-gray-500">#{b.booking_number} · {formatDate(b.scheduled_date)}</p>
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
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-gray-500">Name</p><p className="font-medium">{viewTech.name}</p></div>
              <div><p className="text-gray-500">Email</p><p className="font-medium">{viewTech.email}</p></div>
              <div><p className="text-gray-500">Mobile</p><p className="font-medium">{viewTech.mobile}</p></div>
              <div><p className="text-gray-500">City</p><p className="font-medium">{viewTech.city || '-'}</p></div>
              <div><p className="text-gray-500">Experience</p><p className="font-medium">{viewTech.experience || '-'}</p></div>
              <div><p className="text-gray-500">Skills</p><p className="font-medium">{(viewTech.skills || []).join(', ') || '-'}</p></div>
            </div>
            {viewTech.bio && <div><p className="text-gray-500">Bio</p><p className="text-sm">{viewTech.bio}</p></div>}
            <div className="flex gap-2 pt-2">
              <Button variant="primary" onClick={() => approveTech(viewTech)} disabled={actionLoading}>Approve</Button>
              <Button variant="danger" onClick={() => { setRejectTech(viewTech); setViewTech(null) }} disabled={actionLoading}>Reject</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!rejectTech} onClose={() => { setRejectTech(null); setRejectReason('') }} title="Reject Technician">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Provide a reason for rejecting <span className="font-medium">{rejectTech?.name}</span></p>
          <div>
            <Label htmlFor="reason">Rejection Reason</Label>
            <Textarea id="reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={4} placeholder="Enter rejection reason..." />
          </div>
          <div className="flex gap-2">
            <Button variant="danger" onClick={handleRejectTech} disabled={actionLoading || !rejectReason.trim()}>Reject Technician</Button>
            <Button variant="outline" onClick={() => { setRejectTech(null); setRejectReason('') }}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
