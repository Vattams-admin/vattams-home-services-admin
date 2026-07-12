import { useEffect, useState } from 'react'
import {
  Loader2, Users, Wrench, CreditCard, BarChart3, CheckCircle, XCircle, Eye, Ban,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Profile, Booking } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { createNotification } from '@/lib/notifications'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  cn, formatCurrency, formatDate, formatDateTime, BOOKING_STATUS_COLORS, BOOKING_STATUS_FLOW,
} from '@/lib/utils'

export function AdminDashboardPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ customers: 0, technicians: 0, pending: 0, activeBookings: 0, revenue: 0 })
  const [pendingTechs, setPendingTechs] = useState<Profile[]>([])
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})
  const [viewProfile, setViewProfile] = useState<Profile | null>(null)
  const [rejectTech, setRejectTech] = useState<Profile | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actioning, setActioning] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      const [
        { count: customers },
        { count: technicians },
        { count: pending },
        { count: activeBookings },
        { data: invoices },
        { data: pendingTechData },
        { data: bookingData },
        { data: profileData },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'technician'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'technician').eq('status', 'pending'),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).in('status', ['assigned', 'accepted', 'on_the_way', 'work_started']),
        supabase.from('invoices').select('amount').eq('status', 'paid'),
        supabase.from('profiles').select('*').eq('role', 'technician').eq('status', 'pending').order('created_at', { ascending: false }),
        supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('profiles').select('*'),
      ])
      if (!mounted) return
      const revenue = (invoices ?? []).reduce((s, i: any) => s + Number(i.amount), 0)
      setStats({ customers: customers ?? 0, technicians: technicians ?? 0, pending: pending ?? 0, activeBookings: activeBookings ?? 0, revenue })
      setPendingTechs((pendingTechData ?? []) as Profile[])
      setRecentBookings((bookingData ?? []) as Booking[])
      const map: Record<string, Profile> = {}
      for (const p of (profileData ?? []) as Profile[]) map[p.id] = p
      setProfiles(map)
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  const approveTech = async (tech: Profile) => {
    setActioning(true)
    try {
      const { error } = await supabase.from('profiles').update({ status: 'active' }).eq('id', tech.id)
      if (error) throw error
      await createNotification(tech.id, 'Account Approved', 'Your technician account has been approved. You can now accept jobs.', 'technician_approved', tech.id)
      setPendingTechs((prev) => prev.filter((t) => t.id !== tech.id))
      setStats((s) => ({ ...s, pending: s.pending - 1, technicians: s.technicians + 1 }))
      toast({ title: 'Technician approved', variant: 'success' })
    } catch (err) {
      toast({ title: 'Approval failed', description: (err as Error).message, variant: 'error' })
    } finally {
      setActioning(false)
    }
  }

  const confirmReject = async () => {
    if (!rejectTech || !rejectReason.trim()) return
    setActioning(true)
    try {
      const { error } = await supabase.from('profiles').update({ status: 'rejected', bio: rejectReason }).eq('id', rejectTech.id)
      if (error) throw error
      await createNotification(rejectTech.id, 'Account Rejected', `Your technician application was rejected. Reason: ${rejectReason}`, 'technician_rejected', rejectTech.id)
      setPendingTechs((prev) => prev.filter((t) => t.id !== rejectTech.id))
      setStats((s) => ({ ...s, pending: s.pending - 1 }))
      toast({ title: 'Technician rejected', variant: 'success' })
      setRejectTech(null)
      setRejectReason('')
    } catch (err) {
      toast({ title: 'Rejection failed', description: (err as Error).message, variant: 'error' })
    } finally {
      setActioning(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const cards = [
    { label: 'Total Customers', value: stats.customers, icon: Users, color: 'text-blue-600 bg-blue-100' },
    { label: 'Total Technicians', value: stats.technicians, icon: Wrench, color: 'text-purple-600 bg-purple-100' },
    { label: 'Pending Requests', value: stats.pending, icon: Ban, color: 'text-amber-600 bg-amber-100' },
    { label: 'Active Bookings', value: stats.activeBookings, icon: BarChart3, color: 'text-cyan-600 bg-cyan-100' },
    { label: 'Total Revenue', value: formatCurrency(stats.revenue), icon: CreditCard, color: 'text-green-600 bg-green-100' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500">Overview of platform activity and pending actions.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={cn('rounded-lg p-3', c.color)}>
                <c.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{c.label}</p>
                <p className="text-xl font-bold text-gray-900">{c.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Technician Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingTechs.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No pending technician requests.</p>
          ) : (
            <div className="space-y-3">
              {pendingTechs.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
                  <div>
                    <p className="font-medium text-gray-900">{t.name}</p>
                    <p className="text-sm text-gray-500">{t.email} · {t.mobile}</p>
                    {t.skills && t.skills.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {t.skills.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setViewProfile(t)}>
                      <Eye className="mr-1 h-4 w-4" /> View
                    </Button>
                    <Button variant="success" size="sm" onClick={() => approveTech(t)} disabled={actioning}>
                      <CheckCircle className="mr-1 h-4 w-4" /> Approve
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setRejectTech(t)}>
                      <XCircle className="mr-1 h-4 w-4" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {recentBookings.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No bookings yet.</p>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
                  <div>
                    <p className="font-medium text-gray-900">{b.service_name}</p>
                    <p className="text-sm text-gray-500">
                      {b.booking_number} · {profiles[b.customer_id]?.name ?? 'Customer'}
                      {b.technician_id ? ` · ${profiles[b.technician_id]?.name ?? 'Technician'}` : ' · Unassigned'}
                    </p>
                    <p className="text-xs text-gray-400">{formatDateTime(b.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(b.amount)}</span>
                    <Badge className={BOOKING_STATUS_COLORS[b.status]}>
                      {BOOKING_STATUS_FLOW[b.status] ?? b.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={!!viewProfile} onClose={() => setViewProfile(null)} title="Technician Profile">
        {viewProfile && (
          <div className="space-y-3 text-sm">
            <div><span className="font-medium text-gray-500">Name:</span> {viewProfile.name}</div>
            <div><span className="font-medium text-gray-500">Email:</span> {viewProfile.email}</div>
            <div><span className="font-medium text-gray-500">Mobile:</span> {viewProfile.mobile}</div>
            <div><span className="font-medium text-gray-500">City:</span> {viewProfile.city ?? '-'}</div>
            <div><span className="font-medium text-gray-500">District:</span> {viewProfile.district ?? '-'}</div>
            <div><span className="font-medium text-gray-500">Experience:</span> {viewProfile.experience ?? '-'}</div>
            <div><span className="font-medium text-gray-500">Bio:</span> {viewProfile.bio ?? '-'}</div>
            <div>
              <span className="font-medium text-gray-500">Skills:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {viewProfile.skills?.length ? viewProfile.skills.map((s) => <Badge key={s} variant="secondary">{s}</Badge>) : <span className="text-gray-400">None</span>}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!rejectTech} onClose={() => { setRejectTech(null); setRejectReason('') }} title="Reject Technician">
        <div className="space-y-4">
          <div>
            <Label>Rejection Reason</Label>
            <Textarea
              className="mt-1"
              rows={4}
              placeholder="Provide a reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setRejectTech(null); setRejectReason('') }}>Cancel</Button>
            <Button variant="destructive" onClick={confirmReject} disabled={actioning || !rejectReason.trim()}>
              {actioning ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              Confirm Reject
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
