import { useEffect, useState } from 'react'
import { Calendar, MapPin, User, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Booking, Profile } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { LoadingScreen } from '@/components/LoadingScreen'
import { formatCurrency, formatDate, BOOKING_STATUS_FLOW, BOOKING_STATUS_COLORS } from '@/lib/utils'
import { createNotification, createAuditLog, createRevenueTransaction } from '@/lib/notifications'

type Tab = 'all' | 'assigned' | 'active' | 'completed' | 'cancelled'

export function TechnicianJobsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [tab, setTab] = useState<Tab>('all')
  const [selected, setSelected] = useState<Booking | null>(null)
  const [customer, setCustomer] = useState<Profile | null>(null)
  const [advancing, setAdvancing] = useState(false)

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!profile) return
      const { data } = await supabase.from('bookings').select('*').eq('technician_id', profile.id).order('created_at', { ascending: false })
      if (mounted) { setBookings((data as Booking[]) || []); setLoading(false) }
    })()
    return () => { mounted = false }
  }, [profile])

  const openDetails = async (b: Booking) => {
    setSelected(b); setCustomer(null)
    const { data: cust } = await supabase.from('profiles').select('*').eq('id', b.customer_id).maybeSingle()
    setCustomer(cust as Profile)
  }

  const advanceStatus = async (b: Booking) => {
    if (!profile) return
    setAdvancing(true)
    const currentIdx = BOOKING_STATUS_FLOW.indexOf(b.status)
    if (currentIdx === -1 || currentIdx >= BOOKING_STATUS_FLOW.length - 1) { setAdvancing(false); return }
    const nextStatus = BOOKING_STATUS_FLOW[currentIdx + 1]
    const { error } = await supabase.from('bookings').update({ status: nextStatus }).eq('id', b.id)
    if (error) { setAdvancing(false); toast('Failed to update status', 'error'); return }

    setBookings((prev) => prev.map((x) => x.id === b.id ? { ...x, status: nextStatus } : x))
    setSelected((prev) => prev?.id === b.id ? { ...prev, status: nextStatus } : prev)

    await createNotification(b.customer_id, 'Booking Update', `Your booking #${b.booking_number} status changed to ${nextStatus.replace(/_/g, ' ')}`, 'booking')
    await createAuditLog(profile.id, 'booking_status_update', 'booking', b.id, `${b.status} -> ${nextStatus}`)

    if (nextStatus === 'completed') {
      await supabase.rpc('update_technician_wallet_on_completion', { p_technician_id: profile.id, p_booking_id: b.id, p_amount: b.amount })
      await createRevenueTransaction('technician_earning', b.amount, profile.id, b.id, `Earning from booking #${b.booking_number}`)
      toast('Job completed! Earnings updated.', 'success')
    } else {
      toast(`Status updated to ${nextStatus.replace(/_/g, ' ')}`, 'success')
    }
    setAdvancing(false)
  }

  const filtered = bookings.filter((b) => {
    if (tab === 'assigned') return b.status === 'assigned' || b.status === 'accepted'
    if (tab === 'active') return !['completed', 'cancelled', 'created', 'confirmed', 'assigned', 'accepted'].includes(b.status)
    if (tab === 'completed') return b.status === 'completed'
    if (tab === 'cancelled') return b.status === 'cancelled'
    return true
  })

  if (loading) return <LoadingScreen message="Loading jobs..." />

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">My Jobs</h1>

      <div className="mb-4 flex gap-2 overflow-x-auto">
        {(['all', 'assigned', 'active', 'completed', 'cancelled'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-md px-4 py-2 text-sm font-medium capitalize ${tab === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{t}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-gray-500">No jobs found.</CardContent></Card>
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
                    <p className="flex items-center gap-1 text-sm text-gray-600"><MapPin className="h-3.5 w-3.5" /> {b.address}, {b.city}, {b.district}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(b.amount)}</p>
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openDetails(b)}>View Details</Button>
                      {b.status !== 'completed' && b.status !== 'cancelled' && BOOKING_STATUS_FLOW.indexOf(b.status) < BOOKING_STATUS_FLOW.length - 1 && (
                        <Button size="sm" onClick={() => advanceStatus(b)} disabled={advancing}><ArrowRight className="mr-1 h-3.5 w-3.5" /> Advance</Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Job Details">
        {selected && (
          <div className="space-y-3">
            <div><p className="text-sm text-gray-500">Booking Number</p><p className="font-medium">{selected.booking_number}</p></div>
            <div><p className="text-sm text-gray-500">Service</p><p className="font-medium">{selected.service_name}</p></div>
            <div><p className="text-sm text-gray-500">Status</p><Badge color={BOOKING_STATUS_COLORS[selected.status]}>{selected.status.replace(/_/g, ' ')}</Badge></div>
            <div><p className="text-sm text-gray-500">Scheduled</p><p className="font-medium">{formatDate(selected.scheduled_date)} {selected.scheduled_time && `at ${selected.scheduled_time}`}</p></div>
            <div><p className="text-sm text-gray-500">Address</p><p className="font-medium">{selected.address}, {selected.city}, {selected.district} - {selected.pincode}</p></div>
            <div><p className="text-sm text-gray-500">Amount</p><p className="font-medium">{formatCurrency(selected.amount)}</p></div>
            {selected.customer_notes && <div><p className="text-sm text-gray-500">Customer Notes</p><p className="font-medium">{selected.customer_notes}</p></div>}
            {customer && <div><p className="text-sm text-gray-500">Customer</p><p className="flex items-center gap-1 font-medium"><User className="h-3.5 w-3.5" /> {customer.name} • {customer.mobile}</p></div>}
            {selected.status !== 'completed' && selected.status !== 'cancelled' && BOOKING_STATUS_FLOW.indexOf(selected.status) < BOOKING_STATUS_FLOW.length - 1 && (
              <Button className="w-full" onClick={() => advanceStatus(selected)} disabled={advancing}><ArrowRight className="mr-2 h-4 w-4" /> {advancing ? 'Updating...' : 'Advance Status'}</Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
