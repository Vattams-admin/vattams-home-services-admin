import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Booking, Profile, BookingStatus } from '@/lib/supabase'
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
import { Eye, UserPlus, Circle as XCircle } from 'lucide-react'

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
  const [viewBooking, setViewBooking] = useState<Booking | null>(null)
  const [assignBooking, setAssignBooking] = useState<Booking | null>(null)
  const [selectedTech, setSelectedTech] = useState('')
  const [cancelBooking, setCancelBooking] = useState<Booking | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: bks } = await supabase.from('bookings').select('*').order('created_at', { ascending: false })
      if (!mounted) return
      setBookings((bks || []) as Booking[])
      const cIds = [...new Set((bks || []).map((b) => b.customer_id))]
      const tIds = [...new Set((bks || []).map((b) => b.technician_id).filter(Boolean))] as string[]
      const [{ data: cs }, { data: ts }] = await Promise.all([
        cIds.length ? supabase.from('profiles').select('*').in('id', cIds) : Promise.resolve({ data: [] }),
        tIds.length ? supabase.from('profiles').select('*').in('id', tIds) : Promise.resolve({ data: [] }),
      ])
      if (!mounted) return
      setCustomers(Object.fromEntries(((cs || []) as Profile[]).map((c) => [c.id, c])))
      setTechs(Object.fromEntries(((ts || []) as Profile[]).map((t) => [t.id, t])))
      const { data: at } = await supabase.from('profiles').select('*').eq('role', 'technician').eq('status', 'active').eq('is_available', true)
      if (mounted) { setActiveTechs((at || []) as Profile[]); setLoading(false) }
    })()
    return () => { mounted = false }
  }, [])

  const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: 'All' }, { key: 'created', label: 'Created' }, { key: 'assigned', label: 'Assigned' },
    { key: 'active', label: 'Active' }, { key: 'completed', label: 'Completed' }, { key: 'cancelled', label: 'Cancelled' },
  ]

  const filtered = bookings.filter((b) => {
    if (tab === 'all') return true
    if (tab === 'active') return ['assigned', 'accepted', 'on_the_way', 'arrived', 'work_started'].includes(b.status)
    return b.status === tab
  })

  const doAssign = async () => {
    if (!assignBooking || !selectedTech) return
    await supabase.from('bookings').update({ technician_id: selectedTech, status: 'assigned' }).eq('id', assignBooking.id)
    await createNotification(selectedTech, 'New Booking Assigned', `Booking ${assignBooking.booking_number} assigned to you.`, 'info')
    await createNotification(assignBooking.customer_id, 'Technician Assigned', `A technician has been assigned to booking ${assignBooking.booking_number}.`, 'info')
    await createAuditLog(profile?.id || '', 'assign_technician', 'booking', assignBooking.id, `Assigned tech to ${assignBooking.booking_number}`)
    toast('Technician assigned', 'success')
    setAssignBooking(null); setSelectedTech('')
    const { data } = await supabase.from('bookings').select('*').order('created_at', { ascending: false })
    setBookings((data || []) as Booking[])
  }

  const doCancel = async () => {
    if (!cancelBooking || !cancelReason.trim()) return
    await supabase.from('bookings').update({ status: 'cancelled', cancel_reason: cancelReason, cancelled_by: profile?.id || null }).eq('id', cancelBooking.id)
    await createNotification(cancelBooking.customer_id, 'Booking Cancelled', `Booking ${cancelBooking.booking_number} cancelled: ${cancelReason}`, 'error')
    if (cancelBooking.technician_id) await createNotification(cancelBooking.technician_id, 'Booking Cancelled', `Booking ${cancelBooking.booking_number} cancelled.`, 'error')
    await createAuditLog(profile?.id || '', 'cancel_booking', 'booking', cancelBooking.id, `Cancelled: ${cancelReason}`)
    toast('Booking cancelled', 'info')
    setCancelBooking(null); setCancelReason('')
    const { data } = await supabase.from('bookings').select('*').order('created_at', { ascending: false })
    setBookings((data || []) as Booking[])
  }

  if (loading) return <LoadingScreen message="Loading bookings..." />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">All Bookings</h1>
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('rounded-full px-3 py-1.5 text-sm font-medium', tab === t.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>{t.label}</button>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Bookings ({filtered.length})</CardTitle></CardHeader>
        <CardContent>
          {filtered.length === 0 ? <p className="text-gray-500 text-sm">No bookings found.</p> : (
            <div className="space-y-2">
              {filtered.map((b) => (
                <div key={b.id} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{b.booking_number} · {b.service_name}</p>
                    <p className="text-sm text-gray-500">Customer: {customers[b.customer_id]?.name || '-'} · Tech: {b.technician_id ? (techs[b.technician_id]?.name || 'Unknown') : 'Unassigned'}</p>
                    <p className="text-xs text-gray-400">{formatDate(b.scheduled_date)} · {formatCurrency(b.amount)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color={BOOKING_STATUS_COLORS[b.status]}>{b.status}</Badge>
                    <Button size="sm" variant="outline" onClick={() => setViewBooking(b)}><Eye className="h-4 w-4" /></Button>
                    {b.status !== 'completed' && b.status !== 'cancelled' && <>
                      <Button size="sm" variant="outline" onClick={() => setAssignBooking(b)}><UserPlus className="h-4 w-4" /></Button>
                      <Button size="sm" variant="danger" onClick={() => setCancelBooking(b)}><XCircle className="h-4 w-4" /></Button>
                    </>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={!!viewBooking} onClose={() => setViewBooking(null)} title="Booking Details">
        {viewBooking && (
          <div className="space-y-1.5 text-sm">
            <p><span className="font-medium">Booking #:</span> {viewBooking.booking_number}</p>
            <p><span className="font-medium">Service:</span> {viewBooking.service_name}</p>
            <p><span className="font-medium">Customer:</span> {customers[viewBooking.customer_id]?.name || '-'}</p>
            <p><span className="font-medium">Technician:</span> {viewBooking.technician_id ? (techs[viewBooking.technician_id]?.name || 'Unknown') : 'Unassigned'}</p>
            <p><span className="font-medium">Status:</span> <Badge color={BOOKING_STATUS_COLORS[viewBooking.status]}>{viewBooking.status}</Badge></p>
            <p><span className="font-medium">Scheduled:</span> {formatDate(viewBooking.scheduled_date)}</p>
            <p><span className="font-medium">Address:</span> {viewBooking.address}, {viewBooking.city}, {viewBooking.district}</p>
            <p><span className="font-medium">Amount:</span> {formatCurrency(viewBooking.amount)}</p>
            <p><span className="font-medium">Notes:</span> {viewBooking.customer_notes || '-'}</p>
          </div>
        )}
      </Modal>

      <Modal open={!!assignBooking} onClose={() => { setAssignBooking(null); setSelectedTech('') }} title="Assign Technician">
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Assign a technician to {assignBooking?.booking_number}</p>
          <div><Label>Technician</Label><Select value={selectedTech} onChange={(e) => setSelectedTech(e.target.value)}>
            <option value="">Select technician...</option>
            {activeTechs.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.city || '-'})</option>)}
          </Select></div>
          <div className="flex gap-2 justify-end"><Button variant="outline" size="sm" onClick={() => { setAssignBooking(null); setSelectedTech('') }}>Cancel</Button><Button size="sm" onClick={doAssign} disabled={!selectedTech}>Assign</Button></div>
        </div>
      </Modal>

      <Modal open={!!cancelBooking} onClose={() => { setCancelBooking(null); setCancelReason('') }} title="Cancel Booking">
        <div className="space-y-3">
          <Textarea rows={3} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Cancel reason..." />
          <div className="flex gap-2 justify-end"><Button variant="outline" size="sm" onClick={() => { setCancelBooking(null); setCancelReason('') }}>Cancel</Button><Button variant="danger" size="sm" onClick={doCancel} disabled={!cancelReason.trim()}>Confirm Cancel</Button></div>
        </div>
      </Modal>
    </div>
  )
}
