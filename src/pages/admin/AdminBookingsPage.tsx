import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Booking, Profile, BookingStatus } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { createNotification, createAuditLog } from '@/lib/notifications'
import { cn, formatDate, formatCurrency, BOOKING_STATUS_COLORS } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { LoadingScreen } from '@/components/LoadingScreen'
import { Calendar, UserCog, Ban, Eye } from 'lucide-react'

type Tab = 'all' | 'created' | 'assigned' | 'active' | 'completed' | 'cancelled'

export function AdminBookingsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [customers, setCustomers] = useState<Record<string, Profile>>({})
  const [techs, setTechs] = useState<Record<string, Profile>>({})
  const [activeTechs, setActiveTechs] = useState<Profile[]>([])
  const [tab, setTab] = useState<Tab>('all')
  const [assignBooking, setAssignBooking] = useState<Booking | null>(null)
  const [selectedTech, setSelectedTech] = useState('')
  const [cancelBooking, setCancelBooking] = useState<Booking | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [viewBooking, setViewBooking] = useState<Booking | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: bks } = await supabase.from('bookings').select('*').order('created_at', { ascending: false })
      const { data: custs } = await supabase.from('profiles').select('*').eq('role', 'customer')
      const { data: tList } = await supabase.from('profiles').select('*').eq('role', 'technician')
      if (!mounted) return
      setBookings((bks || []) as Booking[])
      const cMap: Record<string, Profile> = {}; (custs || []).forEach((c) => { cMap[(c as Profile).id] = c as Profile }); setCustomers(cMap)
      const tMap: Record<string, Profile> = {}; (tList || []).forEach((t) => { tMap[(t as Profile).id] = t as Profile }); setTechs(tMap)
      setActiveTechs((tList || []).filter((t) => (t as Profile).status === 'active' && (t as Profile).verification_status === 'approved') as Profile[])
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  const filtered = tab === 'all' ? bookings : tab === 'active' ? bookings.filter((b) => !['completed', 'cancelled', 'created'].includes(b.status)) : bookings.filter((b) => b.status === tab)

  const assignTech = async () => {
    if (!assignBooking || !selectedTech) return
    setActionLoading(true)
    const { error } = await supabase.from('bookings').update({ technician_id: selectedTech, status: 'assigned' as BookingStatus }).eq('id', assignBooking.id)
    if (error) { toast('Failed to assign technician', 'error'); setActionLoading(false); return }
    await createNotification(selectedTech, 'New Job Assigned', `Booking #${assignBooking.booking_number} has been assigned to you.`, 'info')
    await createNotification(assignBooking.customer_id, 'Technician Assigned', `A technician has been assigned to your booking #${assignBooking.booking_number}.`, 'info')
    if (profile) await createAuditLog(profile.id, 'assign_technician', 'booking', assignBooking.id, `Assigned tech to booking ${assignBooking.booking_number}`)
    toast('Technician assigned successfully', 'success')
    setBookings((bs) => bs.map((b) => b.id === assignBooking.id ? { ...b, technician_id: selectedTech, status: 'assigned' } : b))
    setAssignBooking(null); setSelectedTech(''); setActionLoading(false)
  }

  const cancelBk = async () => {
    if (!cancelBooking || !cancelReason.trim()) return
    setActionLoading(true)
    const { error } = await supabase.from('bookings').update({ status: 'cancelled' as BookingStatus, cancelled_by: profile?.id || 'admin', cancel_reason: cancelReason.trim() }).eq('id', cancelBooking.id)
    if (error) { toast('Failed to cancel booking', 'error'); setActionLoading(false); return }
    await createNotification(cancelBooking.customer_id, 'Booking Cancelled', `Your booking #${cancelBooking.booking_number} has been cancelled. Reason: ${cancelReason.trim()}`, 'error')
    if (cancelBooking.technician_id) await createNotification(cancelBooking.technician_id, 'Booking Cancelled', `Booking #${cancelBooking.booking_number} has been cancelled.`, 'error')
    if (profile) await createAuditLog(profile.id, 'cancel_booking', 'booking', cancelBooking.id, `Cancelled booking ${cancelBooking.booking_number}: ${cancelReason.trim()}`)
    toast('Booking cancelled', 'info')
    setBookings((bs) => bs.map((b) => b.id === cancelBooking.id ? { ...b, status: 'cancelled', cancel_reason: cancelReason.trim() } : b))
    setCancelBooking(null); setCancelReason(''); setActionLoading(false)
  }

  if (loading) return <LoadingScreen message="Loading bookings..." />

  const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: 'All' }, { key: 'created', label: 'Created' }, { key: 'assigned', label: 'Assigned' },
    { key: 'active', label: 'Active' }, { key: 'completed', label: 'Completed' }, { key: 'cancelled', label: 'Cancelled' },
  ]

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">All Bookings</h1><p className="text-gray-600">Manage and track all bookings</p></div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => <Button key={t.key} size="sm" variant={tab === t.key ? 'primary' : 'outline'} onClick={() => setTab(t.key)}>{t.label}</Button>)}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? <p className="py-8 text-center text-gray-500">No bookings found.</p> : filtered.map((b) => {
          const cust = customers[b.customer_id]
          const tech = b.technician_id ? techs[b.technician_id] : null
          return (
            <Card key={b.id}><CardContent className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{b.service_name}</p>
                    <Badge color={BOOKING_STATUS_COLORS[b.status]}>{b.status.replace(/_/g, ' ')}</Badge>
                  </div>
                  <p className="text-sm text-gray-500">#{b.booking_number} · {cust?.name || 'Unknown'} · {tech?.name || 'Unassigned'}</p>
                  <p className="text-sm text-gray-500"><Calendar className="mr-1 inline h-3 w-3" />{formatDate(b.scheduled_date)} · {formatCurrency(b.amount)}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setViewBooking(b)}><Eye className="mr-1 h-4 w-4" />Details</Button>
                  {!['completed', 'cancelled'].includes(b.status) && <Button size="sm" variant="primary" onClick={() => setAssignBooking(b)}><UserCog className="mr-1 h-4 w-4" />Assign</Button>}
                  {!['completed', 'cancelled'].includes(b.status) && <Button size="sm" variant="danger" onClick={() => setCancelBooking(b)}><Ban className="mr-1 h-4 w-4" />Cancel</Button>}
                </div>
              </div>
            </CardContent></Card>
          )
        })}
      </div>

      <Modal open={!!assignBooking} onClose={() => { setAssignBooking(null); setSelectedTech('') }} title="Assign Technician">
        {assignBooking && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Assign a technician to booking <span className="font-medium">#{assignBooking.booking_number}</span></p>
            <div>
              <Label htmlFor="tech">Select Technician</Label>
              <Select id="tech" value={selectedTech} onChange={(e) => setSelectedTech(e.target.value)}>
                <option value="">Choose a technician...</option>
                {activeTechs.map((t) => <option key={t.id} value={t.id}>{t.name} - {t.city || 'N/A'}</option>)}
              </Select>
            </div>
            <div className="flex gap-2"><Button variant="primary" onClick={assignTech} disabled={actionLoading || !selectedTech}>Assign</Button><Button variant="outline" onClick={() => { setAssignBooking(null); setSelectedTech('') }}>Cancel</Button></div>
          </div>
        )}
      </Modal>

      <Modal open={!!cancelBooking} onClose={() => { setCancelBooking(null); setCancelReason('') }} title="Cancel Booking">
        {cancelBooking && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Cancel booking <span className="font-medium">#{cancelBooking.booking_number}</span></p>
            <div><Label htmlFor="creason">Cancellation Reason</Label><Textarea id="creason" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows={4} /></div>
            <div className="flex gap-2"><Button variant="danger" onClick={cancelBk} disabled={actionLoading || !cancelReason.trim()}>Cancel Booking</Button><Button variant="outline" onClick={() => { setCancelBooking(null); setCancelReason('') }}>Close</Button></div>
          </div>
        )}
      </Modal>

      <Modal open={!!viewBooking} onClose={() => setViewBooking(null)} title="Booking Details" className="max-w-2xl">
        {viewBooking && (() => {
          const cust = customers[viewBooking.customer_id]
          const tech = viewBooking.technician_id ? techs[viewBooking.technician_id] : null
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-gray-500">Booking #</p><p className="font-medium">{viewBooking.booking_number}</p></div>
                <div><p className="text-gray-500">Status</p><Badge color={BOOKING_STATUS_COLORS[viewBooking.status]}>{viewBooking.status.replace(/_/g, ' ')}</Badge></div>
                <div><p className="text-gray-500">Service</p><p className="font-medium">{viewBooking.service_name}</p></div>
                <div><p className="text-gray-500">Amount</p><p className="font-medium">{formatCurrency(viewBooking.amount)}</p></div>
                <div><p className="text-gray-500">Scheduled Date</p><p className="font-medium">{formatDate(viewBooking.scheduled_date)}</p></div>
                <div><p className="text-gray-500">Time</p><p className="font-medium">{viewBooking.scheduled_time || 'Flexible'}</p></div>
                <div><p className="text-gray-500">Customer</p><p className="font-medium">{cust?.name || 'Unknown'}</p></div>
                <div><p className="text-gray-500">Technician</p><p className="font-medium">{tech?.name || 'Unassigned'}</p></div>
                <div><p className="text-gray-500">Address</p><p className="font-medium">{viewBooking.address}, {viewBooking.city}, {viewBooking.district} - {viewBooking.pincode}</p></div>
              </div>
              {viewBooking.customer_notes && <div><p className="text-gray-500">Customer Notes</p><p className="text-sm">{viewBooking.customer_notes}</p></div>}
              {viewBooking.cancel_reason && <div><p className="text-gray-500">Cancel Reason</p><p className="text-sm text-red-600">{viewBooking.cancel_reason}</p></div>}
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}
