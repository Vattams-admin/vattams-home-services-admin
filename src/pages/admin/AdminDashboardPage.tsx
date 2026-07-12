import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile, Booking } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { createNotification, createAuditLog } from '@/lib/notifications'
import { cn, formatDate, formatCurrency, BOOKING_STATUS_COLORS } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { LoadingScreen } from '@/components/LoadingScreen'
import { Users, Wrench, Clock, Calendar, IndianRupee, Check, X, Eye } from 'lucide-react'

type Stats = { customers: number; technicians: number; pending: number; active: number; revenue: number }

export function AdminDashboardPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({ customers: 0, technicians: 0, pending: 0, active: 0, revenue: 0 })
  const [pendingTechs, setPendingTechs] = useState<Profile[]>([])
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
  const [viewTech, setViewTech] = useState<Profile | null>(null)
  const [rejectTech, setRejectTech] = useState<Profile | null>(null)
  const [reason, setReason] = useState('')

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [{ count: customers }, { count: technicians }, { count: pending }, { count: active }, { data: rev }] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'technician'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'technician').eq('verification_status', 'under_review'),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).in('status', ['assigned', 'accepted', 'on_the_way', 'arrived', 'work_started']),
        supabase.from('invoices').select('amount'),
      ])
      if (!mounted) return
      const revenue = (rev || []).reduce((s, r) => s + (r.amount || 0), 0)
      setStats({ customers: customers || 0, technicians: technicians || 0, pending: pending || 0, active: active || 0, revenue })

      const { data: pt } = await supabase.from('profiles').select('*').eq('role', 'technician').eq('verification_status', 'under_review').order('created_at', { ascending: false }).limit(10)
      if (mounted) setPendingTechs((pt || []) as Profile[])

      const { data: rb } = await supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(5)
      if (mounted) { setRecentBookings((rb || []) as Booking[]); setLoading(false) }
    })()
    return () => { mounted = false }
  }, [])

  const approve = async (t: Profile) => {
    await supabase.from('profiles').update({ verification_status: 'approved', status: 'active', rejection_reason: null }).eq('id', t.id)
    await createNotification(t.id, 'Verification Approved', 'Your account has been approved by admin.', 'success')
    await createAuditLog(profile?.id || '', 'approve_technician', 'profile', t.id, `Approved technician ${t.name}`)
    toast('Technician approved', 'success')
    setPendingTechs((p) => p.filter((x) => x.id !== t.id))
    setViewTech(null)
  }

  const reject = async () => {
    if (!rejectTech || !reason.trim()) return
    await supabase.from('profiles').update({ verification_status: 'rejected', status: 'rejected', rejection_reason: reason }).eq('id', rejectTech.id)
    await createNotification(rejectTech.id, 'Verification Rejected', `Your application was rejected: ${reason}`, 'error')
    await createAuditLog(profile?.id || '', 'reject_technician', 'profile', rejectTech.id, `Rejected technician ${rejectTech.name}: ${reason}`)
    toast('Technician rejected', 'info')
    setPendingTechs((p) => p.filter((x) => x.id !== rejectTech.id))
    setRejectTech(null); setReason('')
  }

  if (loading) return <LoadingScreen message="Loading dashboard..." />

  const cards = [
    { label: 'Total Customers', value: stats.customers, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Total Technicians', value: stats.technicians, icon: Wrench, color: 'text-green-600 bg-green-50' },
    { label: 'Pending Verification', value: stats.pending, icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: 'Active Bookings', value: stats.active, icon: Calendar, color: 'text-purple-600 bg-purple-50' },
    { label: 'Total Revenue', value: formatCurrency(stats.revenue), icon: IndianRupee, color: 'text-indigo-600 bg-indigo-50' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => { const Icon = c.icon; return (
          <Card key={c.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn('rounded-lg p-2.5', c.color)}><Icon className="h-5 w-5" /></div>
                <div><p className="text-sm text-gray-500">{c.label}</p><p className="text-xl font-bold text-gray-900">{c.value}</p></div>
              </div>
            </CardContent>
          </Card>
        )})}
      </div>

      <Card>
        <CardHeader><CardTitle>Pending Technician Requests</CardTitle></CardHeader>
        <CardContent>
          {pendingTechs.length === 0 ? <p className="text-gray-500 text-sm">No pending requests.</p> : (
            <div className="space-y-3">
              {pendingTechs.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div><p className="font-medium text-gray-900">{t.name}</p><p className="text-sm text-gray-500">{t.email} · {t.mobile}</p></div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setViewTech(t)}><Eye className="h-4 w-4" /></Button>
                    <Button size="sm" onClick={() => approve(t)}><Check className="h-4 w-4" /></Button>
                    <Button size="sm" variant="danger" onClick={() => setRejectTech(t)}><X className="h-4 w-4" /></Button>
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
          {recentBookings.length === 0 ? <p className="text-gray-500 text-sm">No bookings yet.</p> : (
            <div className="space-y-2">
              {recentBookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div><p className="font-medium text-gray-900">{b.booking_number} · {b.service_name}</p><p className="text-sm text-gray-500">{formatDate(b.scheduled_date)} · {formatCurrency(b.amount)}</p></div>
                  <Badge color={BOOKING_STATUS_COLORS[b.status]}>{b.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={!!viewTech} onClose={() => setViewTech(null)} title="Technician Profile">
        {viewTech && (
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Name:</span> {viewTech.name}</p>
            <p><span className="font-medium">Email:</span> {viewTech.email}</p>
            <p><span className="font-medium">Mobile:</span> {viewTech.mobile}</p>
            <p><span className="font-medium">City:</span> {viewTech.city || '-'}</p>
            <p><span className="font-medium">Experience:</span> {viewTech.experience || '-'}</p>
            <p><span className="font-medium">Skills:</span> {(viewTech.skills || []).join(', ') || '-'}</p>
            <p><span className="font-medium">Bio:</span> {viewTech.bio || '-'}</p>
            <div className="flex gap-2 pt-3">
              <Button size="sm" onClick={() => approve(viewTech)}><Check className="h-4 w-4 mr-1" />Approve</Button>
              <Button size="sm" variant="danger" onClick={() => { setRejectTech(viewTech); setViewTech(null) }}><X className="h-4 w-4 mr-1" />Reject</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!rejectTech} onClose={() => { setRejectTech(null); setReason('') }} title="Reject Technician">
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Provide a reason for rejecting {rejectTech?.name}.</p>
          <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Rejection reason..." />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => { setRejectTech(null); setReason('') }}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={reject} disabled={!reason.trim()}>Reject</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
