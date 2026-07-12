import { useEffect, useState } from 'react'
import { Eye, Circle as XCircle, UserPlus, Calendar, IndianRupee } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Profile, Booking } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { createNotification, createAuditLog } from '@/lib/notifications'
import { cn, formatDate, formatCurrency, BOOKING_STATUS_COLORS } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { LoadingScreen } from '@/components/LoadingScreen'

type BookingWithRelations = Booking & { customer: Profile | null; technician: Profile | null }
type FilterTab = 'all' | 'created' | 'assigned' | 'active' | 'completed' | 'cancelled'

export function AdminBookingsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<BookingWithRelations[]>([])
  const [techs, setTechs] = useState<Profile[]>([])
  const [filter, setFilter] = useState<FilterTab>('all')
  const [viewBooking, setViewBooking] = useState<BookingWithRelations | null>(null)
  const [assignBooking, setAssignBooking] = useState<BookingWithRelations | null>(null)
  const [selectedTech, setSelectedTech] = useState('')
  const [cancelBooking, setCancelBooking] = useState<BookingWithRelations | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [actioning, setActioning] = useState(false)

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: bkData } = await supabase.from('bookings').select('*, customer:customer_id(*), technician:technician_id(*)').order('created_at', { ascending: false })
      const { data: techData } = await supabase.from('profiles').select('*').eq('role', 'technician').eq('status', 'active').eq('verification_status', 'approved')
      if (!mounted) return
      setBookings((bkData || []) as BookingWithRelations[])
      setTechs((techData || []) as Profile[])
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  const activeStatuses = ['assigned', 'accepted', 'on_the_way', 'arrived', 'work_started']
  const filtered = filter === 'all' ? bookings : filter === 'active' ? bookings.filter((b) => activeStatuses.includes(b.status)) : bookings.filter((b) => b.status === filter)

  const handleAssign = async () => {
    if (!assignBooking || !selectedTech) return
    setActioning(true)
    const { error } = await supabase.from('bookings').update({ technician_id: selectedTech, status: 'assigned' }).eq('id', assignBooking.id)
    setActioning(false)
    if (error) { toast('Failed to assign technician', 'error'); return }
    await createNotification(selectedTech, 'New Job Assigned', `You have been assigned to booking #${assignBooking.booking_number}.`, 'info')
    await createNotification(assignBooking.customer_id, 'Technician Assigned', `A technician has been assigned to your booking #${assignBooking.booking_number}.`, 'info')
    if (profile) await createAuditLog(profile.id, 'assign_technician', 'booking', assignBooking.id, `Assigned technician to booking ${assignBooking.booking_number}`)
    toast('Technician assigned successfully', 'success')
    setBookings((prev) => prev.map((b) => b.id === assignBooking.id ? { ...b, technician_id: selectedTech, status: 'assigned', technician: techs.find((t) => t.id === selectedTech) || null } : b))
    setAssignBooking(null); setSelectedTech('')
  }

  const handleCancel = async () => {
    if (!cancelBooking || !cancelReason.trim()) return
    setActioning(true)
    const { error } = await supabase.from('bookings').update({ status: 'cancelled', cancel_reason: cancelReason.trim(), cancelled_by: profile?.id || null }).eq('id', cancelBooking.id)
    setActioning(false)
    if (error) { toast('Failed to cancel booking', 'error'); return }
    await createNotification(cancelBooking.customer_id, 'Booking Cancelled', `Your booking #${cancelBooking.booking_number} has been cancelled. Reason: ${cancelReason.trim()}`, 'error')
    if (cancelBooking.technician_id) await createNotification(cancelBooking.technician_id, 'Booking Cancelled', `Booking #${cancelBooking.booking_number} has been cancelled.`, 'error')
    if (profile) await createAuditLog(profile.id, 'cancel_booking', 'booking', cancelBooking.id, `Cancelled booking ${cancelBooking.booking_number}: ${cancelReason.trim()}`)
    toast('Booking cancelled', 'success')
    setBookings((prev) => prev.map((b) => b.id === cancelBooking.id ? { ...b, status: 'cancelled', cancel_reason: cancelReason.trim(), cancelled_by: profile?.id || null } : b))
    setCancelBooking(null); setCancelReason('')
  }

  if (loading) return <LoadingScreen message="Loading bookings..." />

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' }, { key: 'created', label: 'Created' }, { key: 'assigned', label: 'Assigned' },
    { key: 'active', label: 'Active' }, { key: 'completed', label: 'Completed' }, { key: 'cancelled', label: 'Cancelled' },
  ]

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">All Bookings</h1><p className="text-sm text-gray-500">Manage and monitor all platform bookings</p></div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setFilter(t.key)} className={cn('rounded-full px-3 py-1.5 text-sm font-medium', filter === t.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>{t.label}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><p className="text-gray-500">No bookings found.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <Card key={b.id}>
              <CardContent className="py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-gray-400">#{b.booking_number}</span>
                      <p className="font-medium text-gray-900">{b.service_name}</p>
                      <Badge color={BOOKING_STATUS_COLORS[b.status]}>{b.status.replace(/_/g, ' ')}</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                      <span>Customer: {b.customer?.name || 'Unknown'}</span>
                      <span>Tech: {b.technician?.name || 'Unassigned'}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(b.scheduled_date)}</span>
                      <span className="flex items-center gap-1 font-semibold text-gray-700"><IndianRupee className="h-3 w-3" />{formatCurrency(b.amount)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setViewBooking(b)}><Eye className="mr-1 h-4 w-4" />View</Button>
                    {!b.technician_id && b.status !== 'cancelled' && b.status !== 'completed' && <Button size="sm" onClick={() => setAssignBooking(b)}><UserPlus className="mr-1 h-4 w-4" />Assign</Button>}
                    {b.status !== 'cancelled' && b.status !== 'completed' && <Button size="sm" variant="danger" onClick={() => setCancelBooking(b)}><XCircle className="mr-1 h-4 w-4" />Cancel</Button>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Details */}
      <Modal open={!!viewBooking} onClose={() => setViewBooking(null)} title={`Booking #${viewBooking?.booking_number || ''}`}>
        {viewBooking && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-gray-500">Service</p><p className="font-medium">{viewBooking.service_name}</p></div>
            <div><p className="text-gray-500">Status</p><Badge color={BOOKING_STATUS_COLORS[viewBooking.status]}>{viewBooking.status.replace(/_/g, ' ')}</Badge></div>
            <div><p className="text-gray-500">Customer</p><p className="font-medium">{viewBooking.customer?.name || 'Unknown'}</p></div>
            <div><p className="text-gray-500">Customer Mobile</p><p className="font-medium">{viewBooking.customer?.mobile || '-'}</p></div>
            <div><p className="text-gray-500">Technician</p><p className="font-medium">{viewBooking.technician?.name || 'Unassigned'}</p></div>
            <div><p className="text-gray-500">Amount</p><p className="font-medium">{formatCurrency(viewBooking.amount)}</p></div>
            <div><p className="text-gray-500">Scheduled Date</p><p className="font-medium">{formatDate(viewBooking.scheduled_date)}</p></div>
            <div><p className="text-gray-500">Scheduled Time</p><p className="font-medium">{viewBooking.scheduled_time || '-'}</p></div>
            <div><p className="text-gray-500">Address</p><p className="font-medium">{viewBooking.address}, {viewBooking.city}, {viewBooking.district} - {viewBooking.pincode}</p></div>
            <div><p className="text-gray-500">Created</p><p className="font-medium">{formatDate(viewBooking.created_at)}</p></div>
            {viewBooking.customer_notes && <div className="col-span-2"><p className="text-gray-500">Customer Notes</p><p className="font-medium">{viewBooking.customer_notes}</p></div>}
            {viewBooking.cancel_reason && <div className="col-span-2"><p className="text-gray-500">Cancel Reason</p><p className="font-medium text-red-600">{viewBooking.cancel_reason}</p></div>}
          </div>
        )}
      </Modal>

      {/* Assign Technician */}
      <Modal open={!!assignBooking} onClose={() => { setAssignBooking(null); setSelectedTech('') }} title="Assign Technician">
        {assignBooking && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Assign a technician to booking <strong>#{assignBooking.booking_number}</strong> ({assignBooking.service_name})</p>
            <div>
              <Label htmlFor="tech">Select Technician</Label>
              <Select id="tech" value={selectedTech} onChange={(e) => setSelectedTech(e.target.value)}>
                <option value="">Choose a technician...</option>
                {techs.map((t) => <option key={t.id} value={t.id}>{t.name} - {t.city || 'Unknown'} {t.is_available ? '(Available)' : '(Busy)'}</option>)}
              </Select>
            </div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => { setAssignBooking(null); setSelectedTech('') }}>Cancel</Button><Button onClick={handleAssign} disabled={actioning || !selectedTech}>Assign</Button></div>
          </div>
        )}
      </Modal>

      {/* Cancel Booking */}
      <Modal open={!!cancelBooking} onClose={() => { setCancelBooking(null); setCancelReason('') }} title="Cancel Booking">
        {cancelBooking && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Provide a reason for cancelling booking <strong>#{cancelBooking.booking_number}</strong>:</p>
            <div><Label htmlFor="creason">Cancellation Reason</Label><Textarea id="creason" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows={3} /></div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => { setCancelBooking(null); setCancelReason('') }}>Cancel</Button><Button variant="danger" onClick={handleCancel} disabled={actioning || !cancelReason.trim()}>Cancel Booking</Button></div>
          </div>
        )}
      </Modal>
    </div>
  )
}
