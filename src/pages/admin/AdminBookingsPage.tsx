import { useEffect, useState, useMemo } from 'react'
import { Loader as Loader2, Eye, Circle as XCircle, UserPlus, Wrench } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Profile, Booking, BookingPhoto, BookingStatus } from '@/lib/supabase'
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

const FILTERS: { key: string; label: string; statuses?: BookingStatus[] }[] = [
  { key: 'all', label: 'All' },
  { key: 'created', label: 'Created', statuses: ['created'] },
  { key: 'assigned', label: 'Assigned', statuses: ['assigned'] },
  { key: 'active', label: 'Active', statuses: ['accepted', 'on_the_way', 'work_started'] },
  { key: 'completed', label: 'Completed', statuses: ['completed'] },
  { key: 'cancelled', label: 'Cancelled', statuses: ['cancelled'] },
]

export function AdminBookingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})
  const [techs, setTechs] = useState<Profile[]>([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [assignBooking, setAssignBooking] = useState<Booking | null>(null)
  const [selectedTech, setSelectedTech] = useState('')
  const [cancelBooking, setCancelBooking] = useState<Booking | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [viewBooking, setViewBooking] = useState<Booking | null>(null)
  const [photos, setPhotos] = useState<BookingPhoto[]>([])
  const [actioning, setActioning] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      const [{ data: bookingData }, { data: profileData }, { data: techData }] = await Promise.all([
        supabase.from('bookings').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*'),
        supabase.from('profiles').select('*').eq('role', 'technician').eq('status', 'active'),
      ])
      if (!mounted) return
      setBookings((bookingData ?? []) as Booking[])
      const map: Record<string, Profile> = {}
      for (const p of (profileData ?? []) as Profile[]) map[p.id] = p
      setProfiles(map)
      setTechs((techData ?? []) as Profile[])
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  const filtered = useMemo(() => {
    const f = FILTERS.find((x) => x.key === activeFilter)
    if (!f?.statuses) return bookings
    return bookings.filter((b) => f.statuses!.includes(b.status))
  }, [bookings, activeFilter])

  const openView = async (b: Booking) => {
    setViewBooking(b)
    const { data } = await supabase.from('booking_photos').select('*').eq('booking_id', b.id)
    setPhotos((data ?? []) as BookingPhoto[])
  }

  const confirmAssign = async () => {
    if (!assignBooking || !selectedTech) return
    setActioning(true)
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ technician_id: selectedTech, status: 'assigned' })
        .eq('id', assignBooking.id)
      if (error) throw error
      await createNotification(selectedTech, 'New Job Assigned', `Booking ${assignBooking.booking_number} (${assignBooking.service_name}) has been assigned to you.`, 'booking_assigned', assignBooking.id)
      setBookings((prev) => prev.map((b) => b.id === assignBooking.id ? { ...b, technician_id: selectedTech, status: 'assigned' } : b))
      toast({ title: 'Technician assigned', variant: 'success' })
      setAssignBooking(null)
      setSelectedTech('')
    } catch (err) {
      toast({ title: 'Assignment failed', description: (err as Error).message, variant: 'error' })
    } finally {
      setActioning(false)
    }
  }

  const confirmCancel = async () => {
    if (!cancelBooking || !cancelReason.trim()) return
    setActioning(true)
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled', cancelled_by: 'admin', cancel_reason: cancelReason })
        .eq('id', cancelBooking.id)
      if (error) throw error
      setBookings((prev) => prev.map((b) => b.id === cancelBooking.id ? { ...b, status: 'cancelled', cancelled_by: 'admin', cancel_reason: cancelReason } : b))
      if (cancelBooking.technician_id) {
        await createNotification(cancelBooking.technician_id, 'Booking Cancelled', `Booking ${cancelBooking.booking_number} has been cancelled by admin. Reason: ${cancelReason}`, 'booking_cancelled', cancelBooking.id)
      }
      await createNotification(cancelBooking.customer_id, 'Booking Cancelled', `Your booking ${cancelBooking.booking_number} has been cancelled. Reason: ${cancelReason}`, 'booking_cancelled', cancelBooking.id)
      toast({ title: 'Booking cancelled', variant: 'success' })
      setCancelBooking(null)
      setCancelReason('')
    } catch (err) {
      toast({ title: 'Cancel failed', description: (err as Error).message, variant: 'error' })
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">All Bookings</h1>
        <p className="text-sm text-gray-500">Manage and assign bookings across the platform.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              activeFilter === f.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">No bookings found.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map((b) => (
                <div key={b.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{b.service_name}</p>
                      <Badge className={BOOKING_STATUS_COLORS[b.status]}>
                        {BOOKING_STATUS_FLOW[b.status] ?? b.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      {b.booking_number} · {profiles[b.customer_id]?.name ?? 'Customer'}
                      {' · '}
                      {b.technician_id ? (profiles[b.technician_id]?.name ?? 'Technician') : 'Unassigned'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDate(b.scheduled_date)} {b.scheduled_time ?? ''} · {formatCurrency(b.amount)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => openView(b)}>
                      <Eye className="mr-1 h-4 w-4" /> View
                    </Button>
                    <Button variant="default" size="sm" onClick={() => { setAssignBooking(b); setSelectedTech(b.technician_id ?? '') }}>
                      <UserPlus className="mr-1 h-4 w-4" /> {b.technician_id ? 'Reassign' : 'Assign'}
                    </Button>
                    {b.status !== 'cancelled' && b.status !== 'completed' && (
                      <Button variant="destructive" size="sm" onClick={() => setCancelBooking(b)}>
                        <XCircle className="mr-1 h-4 w-4" /> Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={!!assignBooking} onClose={() => { setAssignBooking(null); setSelectedTech('') }} title={assignBooking?.technician_id ? 'Reassign Technician' : 'Assign Technician'}>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Booking: {assignBooking?.booking_number} · {assignBooking?.service_name}</p>
          <div>
            <Label>Select Technician</Label>
            <select
              className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedTech}
              onChange={(e) => setSelectedTech(e.target.value)}
            >
              <option value="">Choose a technician...</option>
              {techs.map((t) => (
                <option key={t.id} value={t.id}>{t.name} — {t.city ?? 'Unknown'}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setAssignBooking(null); setSelectedTech('') }}>Cancel</Button>
            <Button onClick={confirmAssign} disabled={actioning || !selectedTech}>
              {actioning ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              Confirm
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!cancelBooking} onClose={() => { setCancelBooking(null); setCancelReason('') }} title="Cancel Booking">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Booking: {cancelBooking?.booking_number}</p>
          <div>
            <Label>Cancellation Reason</Label>
            <Textarea className="mt-1" rows={4} placeholder="Reason for cancellation..." value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setCancelBooking(null); setCancelReason('') }}>Go Back</Button>
            <Button variant="destructive" onClick={confirmCancel} disabled={actioning || !cancelReason.trim()}>
              {actioning ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              Confirm Cancel
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!viewBooking} onClose={() => { setViewBooking(null); setPhotos([]) }} title="Booking Details" className="max-w-2xl">
        {viewBooking && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="font-medium text-gray-500">Booking #:</span> {viewBooking.booking_number}</div>
              <div><span className="font-medium text-gray-500">Status:</span> <Badge className={BOOKING_STATUS_COLORS[viewBooking.status]}>{BOOKING_STATUS_FLOW[viewBooking.status] ?? viewBooking.status}</Badge></div>
              <div><span className="font-medium text-gray-500">Service:</span> {viewBooking.service_name}</div>
              <div><span className="font-medium text-gray-500">Amount:</span> {formatCurrency(viewBooking.amount)}</div>
              <div><span className="font-medium text-gray-500">Customer:</span> {profiles[viewBooking.customer_id]?.name ?? '-'}</div>
              <div><span className="font-medium text-gray-500">Technician:</span> {viewBooking.technician_id ? (profiles[viewBooking.technician_id]?.name ?? '-') : 'Unassigned'}</div>
              <div><span className="font-medium text-gray-500">Scheduled:</span> {formatDate(viewBooking.scheduled_date)} {viewBooking.scheduled_time ?? ''}</div>
              <div><span className="font-medium text-gray-500">Created:</span> {formatDateTime(viewBooking.created_at)}</div>
              <div className="col-span-2"><span className="font-medium text-gray-500">Address:</span> {viewBooking.address ?? '-'}, {viewBooking.city ?? '-'}, {viewBooking.district ?? '-'} {viewBooking.pincode ?? ''}</div>
              <div className="col-span-2"><span className="font-medium text-gray-500">Notes:</span> {viewBooking.customer_notes ?? '-'}</div>
              {viewBooking.cancel_reason && <div className="col-span-2"><span className="font-medium text-gray-500">Cancel Reason:</span> {viewBooking.cancel_reason}</div>}
            </div>
            <div>
              <span className="font-medium text-gray-500">Photos ({photos.length})</span>
              {photos.length === 0 ? (
                <p className="mt-1 text-gray-400">No photos uploaded.</p>
              ) : (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {photos.map((p) => (
                    <div key={p.id}>
                      <img src={p.photo_url} alt={p.photo_type} className="h-24 w-full rounded-lg object-cover" />
                      <p className="mt-1 text-center text-xs capitalize text-gray-500">{p.photo_type}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
