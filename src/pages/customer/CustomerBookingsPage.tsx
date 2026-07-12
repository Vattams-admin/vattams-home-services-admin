import { useEffect, useState } from 'react'
import { Calendar, MapPin, User, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Booking, Profile } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Textarea, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingScreen } from '@/components/LoadingScreen'
import { formatCurrency, formatDate, BOOKING_STATUS_COLORS } from '@/lib/utils'
import { createNotification, createAuditLog } from '@/lib/notifications'

type Tab = 'all' | 'active' | 'completed' | 'cancelled'

export function CustomerBookingsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [tab, setTab] = useState<Tab>('all')
  const [selected, setSelected] = useState<Booking | null>(null)
  const [technician, setTechnician] = useState<Profile | null>(null)
  const [cancelModal, setCancelModal] = useState<Booking | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!profile) return
      const { data } = await supabase.from('bookings').select('*').eq('customer_id', profile.id).order('created_at', { ascending: false })
      if (mounted) { setBookings((data as Booking[]) || []); setLoading(false) }
    })()
    return () => { mounted = false }
  }, [profile])

  const openDetails = async (b: Booking) => {
    setSelected(b)
    setTechnician(null)
    if (b.technician_id) {
      const { data: tech } = await supabase.from('profiles').select('*').eq('id', b.technician_id).maybeSingle()
      setTechnician(tech as Profile)
    }
  }

  const confirmCancel = async () => {
    if (!cancelModal || !profile) return
    setCancelling(true)
    const { error } = await supabase.from('bookings').update({ status: 'cancelled', cancelled_by: profile.id, cancel_reason: cancelReason }).eq('id', cancelModal.id)
    setCancelling(false)
    if (error) { toast('Failed to cancel booking', 'error'); return }
    setBookings((prev) => prev.map((b) => b.id === cancelModal.id ? { ...b, status: 'cancelled' } : b))
    if (cancelModal.technician_id) await createNotification(cancelModal.technician_id, 'Booking Cancelled', `Booking #${cancelModal.booking_number} has been cancelled by customer`, 'booking')
    await createAuditLog(profile.id, 'booking_cancel', 'booking', cancelModal.id, cancelReason)
    toast('Booking cancelled successfully', 'success')
    setCancelModal(null); setCancelReason('')
  }

  const filtered = bookings.filter((b) => {
    if (tab === 'active') return !['completed', 'cancelled'].includes(b.status)
    if (tab === 'completed') return b.status === 'completed'
    if (tab === 'cancelled') return b.status === 'cancelled'
    return true
  })

  if (loading) return <LoadingScreen message="Loading bookings..." />

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">My Bookings</h1>

      <div className="mb-4 flex gap-2 overflow-x-auto">
        {(['all', 'active', 'completed', 'cancelled'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-md px-4 py-2 text-sm font-medium capitalize ${tab === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{t}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-gray-500">No bookings found.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <Card key={b.id}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{b.service_name}</p>
                      <Badge color={BOOKING_STATUS_COLORS[b.status]}>{b.status.replace(/_/g, ' ')}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">#{b.booking_number}</p>
                    <p className="flex items-center gap-1 text-sm text-gray-600"><Calendar className="h-3.5 w-3.5" /> {formatDate(b.scheduled_date)} {b.scheduled_time && `at ${b.scheduled_time}`}</p>
                    <p className="flex items-center gap-1 text-sm text-gray-600"><MapPin className="h-3.5 w-3.5" /> {b.city}, {b.district}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(b.amount)}</p>
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openDetails(b)}>View Details</Button>
                      {!['completed', 'cancelled'].includes(b.status) && <Button size="sm" variant="danger" onClick={() => setCancelModal(b)}><X className="mr-1 h-3.5 w-3.5" /> Cancel</Button>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Booking Details">
        {selected && (
          <div className="space-y-3">
            <div><p className="text-sm text-gray-500">Booking Number</p><p className="font-medium">{selected.booking_number}</p></div>
            <div><p className="text-sm text-gray-500">Service</p><p className="font-medium">{selected.service_name}</p></div>
            <div><p className="text-sm text-gray-500">Status</p><Badge color={BOOKING_STATUS_COLORS[selected.status]}>{selected.status.replace(/_/g, ' ')}</Badge></div>
            <div><p className="text-sm text-gray-500">Scheduled Date</p><p className="font-medium">{formatDate(selected.scheduled_date)} {selected.scheduled_time && `at ${selected.scheduled_time}`}</p></div>
            <div><p className="text-sm text-gray-500">Address</p><p className="font-medium">{selected.address}, {selected.city}, {selected.district} - {selected.pincode}</p></div>
            <div><p className="text-sm text-gray-500">Amount</p><p className="font-medium">{formatCurrency(selected.amount)}</p></div>
            {selected.customer_notes && <div><p className="text-sm text-gray-500">Notes</p><p className="font-medium">{selected.customer_notes}</p></div>}
            {technician && <div><p className="text-sm text-gray-500">Technician</p><p className="flex items-center gap-1 font-medium"><User className="h-3.5 w-3.5" /> {technician.name} • {technician.mobile}</p></div>}
          </div>
        )}
      </Modal>

      <Modal open={!!cancelModal} onClose={() => setCancelModal(null)} title="Cancel Booking">
        <div className="space-y-4">
          <p className="text-gray-600">Are you sure you want to cancel booking #{cancelModal?.booking_number}?</p>
          <div>
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea id="reason" rows={3} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Why are you cancelling?" />
          </div>
          <div className="flex gap-2">
            <Button variant="danger" onClick={confirmCancel} disabled={cancelling}>{cancelling ? 'Cancelling...' : 'Yes, Cancel Booking'}</Button>
            <Button variant="outline" onClick={() => setCancelModal(null)}>Keep Booking</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
