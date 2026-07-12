import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Circle as XCircle, MapPin } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Booking, Profile } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { LoadingScreen } from '@/components/LoadingScreen'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Textarea, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate, formatCurrency, BOOKING_STATUS_COLORS, cn } from '@/lib/utils'
import { createNotification, createAuditLog } from '@/lib/notifications'

type Tab = 'all' | 'active' | 'completed' | 'cancelled'
type BookingWithTech = Booking & { technician?: Profile | null }

export function CustomerBookingsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<BookingWithTech[]>([])
  const [tab, setTab] = useState<Tab>('all')
  const [selected, setSelected] = useState<BookingWithTech | null>(null)
  const [cancelling, setCancelling] = useState<BookingWithTech | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!profile) return
    let mounted = true;
    (async () => {
      const { data: bk } = await supabase
        .from('bookings').select('*').eq('customer_id', profile.id).order('created_at', { ascending: false })
      if (!mounted || !bk) return
      const techIds = [...new Set((bk as Booking[]).map((b) => b.technician_id).filter(Boolean))] as string[]
      const techs: Record<string, Profile> = {}
      if (techIds.length) {
        const { data: td } = await supabase.from('profiles').select('*').in('id', techIds)
        ;(td || []).forEach((t) => { techs[t.id] = t as Profile })
      }
      const enriched = (bk as Booking[]).map((b) => ({ ...b, technician: b.technician_id ? techs[b.technician_id] : null }))
      if (mounted) { setBookings(enriched); setLoading(false) }
    })()
    return () => { mounted = false }
  }, [profile])

  if (loading) return <LoadingScreen />

  const filtered = bookings.filter((b) => {
    if (tab === 'active') return !['completed', 'cancelled'].includes(b.status)
    if (tab === 'completed') return b.status === 'completed'
    if (tab === 'cancelled') return b.status === 'cancelled'
    return true
  })

  const canCancel = (s: string) => ['created', 'confirmed', 'assigned'].includes(s)

  const handleCancel = async () => {
    if (!profile || !cancelling) return
    setSubmitting(true)
    const { error } = await supabase
      .from('bookings').update({ status: 'cancelled', cancelled_by: 'customer', cancel_reason: cancelReason || null })
      .eq('id', cancelling.id)
    if (error) { toast(error.message, 'error'); setSubmitting(false); return }
    if (cancelling.technician_id) {
      await createNotification(cancelling.technician_id, 'Booking Cancelled', `Booking ${cancelling.booking_number} has been cancelled by the customer.`, 'booking')
    }
    await createAuditLog(profile.id, 'booking_cancelled', 'booking', cancelling.id, `Customer cancelled booking ${cancelling.booking_number}`)
    setBookings((prev) => prev.map((b) => b.id === cancelling.id ? { ...b, status: 'cancelled' } : b))
    toast('Booking cancelled successfully', 'success')
    setCancelling(null); setCancelReason(''); setSubmitting(false)
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: 'All' }, { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' }, { key: 'cancelled', label: 'Cancelled' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>

      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn('px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700')}>
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-gray-500">No bookings found in this category.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <Card key={b.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{b.service_name}</p>
                    <Badge color={BOOKING_STATUS_COLORS[b.status]}>{b.status.replace(/_/g, ' ')}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{b.booking_number} · {formatDate(b.scheduled_date)}</p>
                  {b.technician && <p className="text-sm text-gray-600">Technician: {b.technician.name}</p>}
                  <p className="flex items-center gap-1 text-sm text-gray-500"><MapPin className="h-3 w-3" />{b.city}, {b.district}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{formatCurrency(b.amount)}</span>
                  <Button variant="outline" size="sm" onClick={() => setSelected(b)}><Eye className="mr-1 h-4 w-4" />Details</Button>
                  {canCancel(b.status) && (
                    <Button variant="danger" size="sm" onClick={() => setCancelling(b)}><XCircle className="mr-1 h-4 w-4" />Cancel</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Booking Details">
        {selected && (
          <div className="space-y-3 text-sm">
            <Row label="Booking No." value={selected.booking_number} />
            <Row label="Service" value={selected.service_name} />
            <Row label="Status" value={<Badge color={BOOKING_STATUS_COLORS[selected.status]}>{selected.status.replace(/_/g, ' ')}</Badge>} />
            <Row label="Scheduled Date" value={formatDate(selected.scheduled_date)} />
            <Row label="Address" value={`${selected.address}, ${selected.city}, ${selected.district} - ${selected.pincode}`} />
            <Row label="Amount" value={formatCurrency(selected.amount)} />
            {selected.technician && <Row label="Technician" value={selected.technician.name} />}
            {selected.customer_notes && <Row label="Notes" value={selected.customer_notes} />}
            {selected.cancel_reason && <Row label="Cancel Reason" value={selected.cancel_reason} />}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => navigate(`/customer/track/${selected.id}`)}>Track</Button>
              {selected.status === 'completed' && <Button variant="outline" size="sm" onClick={() => navigate(`/customer/review/${selected.id}`)}>Review</Button>}
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!cancelling} onClose={() => { setCancelling(null); setCancelReason('') }} title="Cancel Booking">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Are you sure you want to cancel booking <span className="font-semibold">{cancelling?.booking_number}</span>?</p>
          <div>
            <Label htmlFor="reason">Cancel Reason (optional)</Label>
            <Textarea id="reason" rows={3} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Reason for cancellation..." />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setCancelling(null); setCancelReason('') }}>No, Keep It</Button>
            <Button variant="danger" disabled={submitting} onClick={handleCancel}>{submitting ? 'Cancelling...' : 'Yes, Cancel'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex justify-between gap-4"><span className="text-gray-500">{label}</span><span className="text-right font-medium text-gray-900">{value}</span></div>
}
