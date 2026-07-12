import { useEffect, useState } from 'react'
import { Eye, UserPlus, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Profile, Booking, BookingStatus } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { createNotification, createAuditLog } from '@/lib/notifications'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/input'
import { LoadingScreen } from '@/components/LoadingScreen'
import { formatCurrency, formatDate, BOOKING_STATUS_COLORS } from '@/lib/utils'

type FilterTab = 'all' | 'created' | 'assigned' | 'active' | 'completed' | 'cancelled'

export function AdminBookingsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [customers, setCustomers] = useState<Record<string, Profile>>({})
  const [technicians, setTechnicians] = useState<Record<string, Profile>>({})
  const [techList, setTechList] = useState<Profile[]>([])
  const [filter, setFilter] = useState<FilterTab>('all')
  const [viewBooking, setViewBooking] = useState<Booking | null>(null)
  const [assignBooking, setAssignBooking] = useState<Booking | null>(null)
  const [cancelBooking, setCancelBooking] = useState<Booking | null>(null)
  const [selectedTech, setSelectedTech] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: bks } = await supabase.from('bookings').select('*').order('created_at', { ascending: false })
      const { data: profs } = await supabase.from('profiles').select('*')
      const cMap: Record<string, Profile> = {}; const tMap: Record<string, Profile> = {}; const tArr: Profile[] = []
      ;(profs as Profile[] || []).forEach((p) => {
        if (p.role === 'customer') cMap[p.id] = p
        if (p.role === 'technician') { tMap[p.id] = p; tArr.push(p) }
      })
      if (mounted) { setBookings((bks as Booking[]) || []); setCustomers(cMap); setTechnicians(tMap); setTechList(tArr); setLoading(false) }
    })()
    return () => { mounted = false }
  }, [])

  const confirmAssign = async () => {
    if (!assignBooking || !selectedTech) return
    setActionLoading(true)
    const { error } = await supabase.from('bookings').update({ status: 'assigned', technician_id: selectedTech }).eq('id', assignBooking.id)
    setActionLoading(false)
    if (error) { toast('Failed to assign technician', 'error'); return }
    await createNotification(selectedTech, 'New Job Assigned', `Booking #${assignBooking.booking_number} has been assigned to you.`, 'info')
    await createNotification(assignBooking.customer_id, 'Technician Assigned', `A technician has been assigned to your booking #${assignBooking.booking_number}.`, 'info')
    if (profile) await createAuditLog(profile.id, 'booking_assign', 'booking', assignBooking.id, `Assigned tech to ${assignBooking.booking_number}`)
    setBookings((prev) => prev.map((b) => b.id === assignBooking.id ? { ...b, technician_id: selectedTech, status: 'assigned' } : b))
    setAssignBooking(null); setSelectedTech('')
    toast('Technician assigned successfully', 'success')
  }

  const confirmCancel = async () => {
    if (!cancelBooking || !cancelReason.trim()) return
    setActionLoading(true)
    const { error } = await supabase.from('bookings').update({ status: 'cancelled', cancel_reason: cancelReason, cancelled_by: profile?.id || 'admin' }).eq('id', cancelBooking.id)
    setActionLoading(false)
    if (error) { toast('Failed to cancel booking', 'error'); return }
    await createNotification(cancelBooking.customer_id, 'Booking Cancelled', `Your booking #${cancelBooking.booking_number} has been cancelled. Reason: ${cancelReason}`, 'error')
    if (cancelBooking.technician_id) await createNotification(cancelBooking.technician_id, 'Booking Cancelled', `Booking #${cancelBooking.booking_number} has been cancelled.`, 'error')
    if (profile) await createAuditLog(profile.id, 'booking_cancel', 'booking', cancelBooking.id, `Cancelled ${cancelBooking.booking_number}`)
    setBookings((prev) => prev.map((b) => b.id === cancelBooking.id ? { ...b, status: 'cancelled', cancel_reason: cancelReason } : b))
    setCancelBooking(null); setCancelReason('')
    toast('Booking cancelled', 'success')
  }

  if (loading) return <LoadingScreen message="Loading bookings..." />

  const activeStatuses: BookingStatus[] = ['confirmed', 'assigned', 'accepted', 'on_the_way', 'arrived', 'work_started']
  const filtered = filter === 'all' ? bookings : filter === 'active' ? bookings.filter((b) => activeStatuses.includes(b.status)) : bookings.filter((b) => b.status === filter)
  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' }, { key: 'created', label: 'Created' }, { key: 'assigned', label: 'Assigned' },
    { key: 'active', label: 'Active' }, { key: 'completed', label: 'Completed' }, { key: 'cancelled', label: 'Cancelled' },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">All Bookings</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Button key={t.key} size="sm" variant={filter === t.key ? 'primary' : 'outline'} onClick={() => setFilter(t.key)}>{t.label}</Button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((b) => {
          const cust = customers[b.customer_id]; const tech = b.technician_id ? technicians[b.technician_id] : null
          return (
            <Card key={b.id}>
              <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{b.service_name}</p>
                    <Badge color={BOOKING_STATUS_COLORS[b.status]}>{b.status.replace(/_/g, ' ')}</Badge>
                  </div>
                  <p className="text-sm text-gray-500">#{b.booking_number} • {formatDate(b.scheduled_date)}{b.scheduled_time ? ` at ${b.scheduled_time}` : ''}</p>
                  <p className="text-sm text-gray-500">Customer: {cust?.name || 'N/A'} • Technician: {tech?.name || 'Unassigned'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(b.amount)}</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setViewBooking(b)}><Eye className="mr-1 h-3.5 w-3.5" /> View</Button>
                    {!b.technician_id && b.status === 'created' && <Button size="sm" onClick={() => setAssignBooking(b)}><UserPlus className="mr-1 h-3.5 w-3.5" /> Assign</Button>}
                    {!['completed', 'cancelled'].includes(b.status) && <Button size="sm" variant="danger" onClick={() => setCancelBooking(b)}><XCircle className="mr-1 h-3.5 w-3.5" /> Cancel</Button>}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {filtered.length === 0 && <p className="py-8 text-center text-gray-500">No bookings found.</p>}
      </div>

      <Modal open={!!viewBooking} onClose={() => setViewBooking(null)} title="Booking Details">
        {viewBooking && (
          <div className="space-y-2">
            <p><span className="font-medium">Booking #:</span> {viewBooking.booking_number}</p>
            <p><span className="font-medium">Service:</span> {viewBooking.service_name}</p>
            <p><span className="font-medium">Customer:</span> {customers[viewBooking.customer_id]?.name || 'N/A'}</p>
            <p><span className="font-medium">Technician:</span> {viewBooking.technician_id ? technicians[viewBooking.technician_id]?.name || 'N/A' : 'Unassigned'}</p>
            <p><span className="font-medium">Date:</span> {formatDate(viewBooking.scheduled_date)}{viewBooking.scheduled_time ? ` at ${viewBooking.scheduled_time}` : ''}</p>
            <p><span className="font-medium">Address:</span> {viewBooking.address}, {viewBooking.city}, {viewBooking.district}</p>
            <p><span className="font-medium">Amount:</span> {formatCurrency(viewBooking.amount)}</p>
            <p><span className="font-medium">Customer Notes:</span> {viewBooking.customer_notes || 'N/A'}</p>
            {viewBooking.cancel_reason && <p><span className="font-medium">Cancel Reason:</span> {viewBooking.cancel_reason}</p>}
          </div>
        )}
      </Modal>

      <Modal open={!!assignBooking} onClose={() => { setAssignBooking(null); setSelectedTech('') }} title="Assign Technician">
        <div className="space-y-4">
          <p>Assign a technician to booking <span className="font-medium">#{assignBooking?.booking_number}</span></p>
          <div>
            <Label htmlFor="tech">Select Technician</Label>
            <Select id="tech" value={selectedTech} onChange={(e) => setSelectedTech(e.target.value)} required>
              <option value="">Select a technician</option>
              {techList.filter((t) => t.verification_status === 'approved' && t.is_available).map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.city || 'N/A'})</option>
              ))}
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setAssignBooking(null); setSelectedTech('') }}>Cancel</Button>
            <Button onClick={confirmAssign} disabled={actionLoading || !selectedTech}>Assign</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!cancelBooking} onClose={() => { setCancelBooking(null); setCancelReason('') }} title="Cancel Booking">
        <div className="space-y-4">
          <p>Provide a reason for cancelling booking <span className="font-medium">#{cancelBooking?.booking_number}</span></p>
          <div>
            <Label htmlFor="creason">Cancel Reason</Label>
            <Textarea id="creason" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows={3} placeholder="Enter reason..." />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setCancelBooking(null); setCancelReason('') }}>Close</Button>
            <Button variant="danger" onClick={confirmCancel} disabled={actionLoading || !cancelReason.trim()}>Cancel Booking</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
