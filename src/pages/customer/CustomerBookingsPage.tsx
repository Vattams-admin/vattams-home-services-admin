import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Circle as XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Booking, Profile, BookingStatus } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { LoadingScreen } from '@/components/LoadingScreen'
import { cn, formatDate, formatCurrency, BOOKING_STATUS_COLORS, sanitizeInput } from '@/lib/utils'
import { createNotification, createAuditLog } from '@/lib/notifications'

type BookingWithTech = Booking & { technician: Profile | null }
type Tab = 'all' | 'active' | 'completed' | 'cancelled'

const tabs: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All' }, { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' }, { key: 'cancelled', label: 'Cancelled' },
]
const activeStatuses: BookingStatus[] = ['created', 'confirmed', 'assigned', 'accepted', 'on_the_way', 'arrived', 'work_started']
const cancellableStatuses = ['created', 'confirmed', 'assigned']

export function CustomerBookingsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<BookingWithTech[]>([])
  const [tab, setTab] = useState<Tab>('all')
  const [selected, setSelected] = useState<BookingWithTech | null>(null)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (!profile) return
    let mounted = true;
    (async () => {
      const { data } = await supabase.from('bookings').select('*, technician:technician_id(*)').eq('customer_id', profile.id).order('created_at', { ascending: false })
      if (!mounted) return
      setBookings((data || []) as BookingWithTech[])
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [profile])

  const filtered = bookings.filter((b) => {
    if (tab === 'all') return true
    if (tab === 'active') return activeStatuses.includes(b.status)
    if (tab === 'completed') return b.status === 'completed'
    if (tab === 'cancelled') return b.status === 'cancelled'
    return true
  })

  const handleCancel = async () => {
    if (!selected || !profile) return
    setCancelling(true)
    const { error } = await supabase.from('bookings').update({ status: 'cancelled', cancelled_by: 'customer', updated_at: new Date().toISOString() }).eq('id', selected.id)
    setCancelling(false)
    if (error) { toast('Failed to cancel booking', 'error'); return }
    setBookings((prev) => prev.map((b) => b.id === selected.id ? { ...b, status: 'cancelled' } : b))
    setSelected(null)
    toast('Booking cancelled successfully', 'success')
    if (selected.technician_id) await createNotification(selected.technician_id, 'Booking Cancelled', `Booking ${selected.booking_number} has been cancelled by the customer.`, 'booking')
    await createAuditLog(profile.id, 'booking_cancelled', 'booking', selected.id, `Customer cancelled booking ${selected.booking_number}`)
  }

  if (loading) return <LoadingScreen message="Loading bookings..." />
  if (!profile) return null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>

      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('rounded-md px-4 py-2 text-sm font-medium transition-colors', tab === t.key ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50')}>{t.label}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><p className="text-gray-500">No bookings found in this category.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <Card key={b.id}>
              <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-gray-400">#{b.booking_number}</span>
                    <p className="font-medium text-gray-900">{b.service_name}</p>
                    <Badge color={BOOKING_STATUS_COLORS[b.status]}>{b.status.replace(/_/g, ' ')}</Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                    <span>{formatDate(b.scheduled_date)}</span>
                    <span className="font-semibold text-gray-700">{formatCurrency(b.amount)}</span>
                    {b.technician && <span>Technician: {b.technician.name}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setSelected(b)}><Eye className="mr-1 h-4 w-4" />Details</Button>
                  {cancellableStatuses.includes(b.status) && (
                    <Button size="sm" variant="danger" onClick={() => setSelected(b)}><XCircle className="mr-1 h-4 w-4" />Cancel</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Booking #${selected?.booking_number || ''}`}>
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-gray-500">Service</p><p className="font-medium">{selected.service_name}</p></div>
              <div><p className="text-gray-500">Status</p><Badge color={BOOKING_STATUS_COLORS[selected.status]}>{selected.status.replace(/_/g, ' ')}</Badge></div>
              <div><p className="text-gray-500">Scheduled Date</p><p className="font-medium">{formatDate(selected.scheduled_date)}</p></div>
              <div><p className="text-gray-500">Time</p><p className="font-medium">{selected.scheduled_time || 'Not specified'}</p></div>
              <div><p className="text-gray-500">Amount</p><p className="font-medium">{formatCurrency(selected.amount)}</p></div>
              <div><p className="text-gray-500">Technician</p><p className="font-medium">{selected.technician?.name || 'Not assigned'}</p></div>
              <div className="col-span-2"><p className="text-gray-500">Address</p><p className="font-medium">{sanitizeInput(selected.address)}, {selected.city}, {selected.district} - {selected.pincode}</p></div>
              {selected.customer_notes && <div className="col-span-2"><p className="text-gray-500">Notes</p><p className="font-medium">{sanitizeInput(selected.customer_notes)}</p></div>}
            </div>
            {cancellableStatuses.includes(selected.status) && (
              <div className="flex justify-end gap-2 border-t pt-4">
                <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
                <Button variant="danger" onClick={handleCancel} disabled={cancelling}>{cancelling ? 'Cancelling...' : 'Cancel Booking'}</Button>
              </div>
            )}
            <div className="flex justify-end border-t pt-4">
              <Link to={`/customer/track/${selected.id}`}><Button variant="outline">Track Booking</Button></Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
