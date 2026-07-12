import { useEffect, useState } from 'react'
import { Eye, ArrowRightCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Booking, Profile, BookingStatus, TechnicianWallet } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { LoadingScreen } from '@/components/LoadingScreen'
import { cn, formatDate, formatCurrency, BOOKING_STATUS_FLOW, BOOKING_STATUS_COLORS, sanitizeInput } from '@/lib/utils'
import { createNotification, createAuditLog } from '@/lib/notifications'

type BookingWithCustomer = Booking & { customer: Profile | null }
type Tab = 'all' | 'assigned' | 'active' | 'completed' | 'cancelled'

const tabs: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All' }, { key: 'assigned', label: 'Assigned' },
  { key: 'active', label: 'Active' }, { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]
const activeStatuses: BookingStatus[] = ['accepted', 'on_the_way', 'arrived', 'work_started']

export function TechnicianJobsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<BookingWithCustomer[]>([])
  const [tab, setTab] = useState<Tab>('all')
  const [selected, setSelected] = useState<BookingWithCustomer | null>(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!profile) return
    let mounted = true;
    (async () => {
      const { data } = await supabase.from('bookings').select('*, customer:customer_id(*)').eq('technician_id', profile.id).order('created_at', { ascending: false })
      if (!mounted) return
      setBookings((data || []) as BookingWithCustomer[])
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [profile])

  const filtered = bookings.filter((b) => {
    if (tab === 'all') return true
    if (tab === 'assigned') return b.status === 'assigned'
    if (tab === 'active') return activeStatuses.includes(b.status)
    if (tab === 'completed') return b.status === 'completed'
    if (tab === 'cancelled') return b.status === 'cancelled'
    return true
  })

  const nextStatus = (status: BookingStatus): BookingStatus | null => {
    const idx = BOOKING_STATUS_FLOW.indexOf(status)
    if (idx === -1 || idx >= BOOKING_STATUS_FLOW.length - 1) return null
    return BOOKING_STATUS_FLOW[idx + 1]
  }

  const advanceStatus = async (booking: BookingWithCustomer) => {
    if (!profile) return
    const next = nextStatus(booking.status)
    if (!next) return
    setUpdating(true)
    const { error } = await supabase.from('bookings').update({ status: next, updated_at: new Date().toISOString() }).eq('id', booking.id)
    if (error) { setUpdating(false); toast('Failed to update status', 'error'); return }

    setBookings((prev) => prev.map((b) => b.id === booking.id ? { ...b, status: next } : b))
    setSelected((s) => s && s.id === booking.id ? { ...s, status: next } : s)
    toast(`Status updated to ${next.replace(/_/g, ' ')}`, 'success')

    await createNotification(booking.customer_id, 'Booking Status Updated', `Your booking ${booking.booking_number} status is now ${next.replace(/_/g, ' ')}.`, 'booking')
    await createAuditLog(profile.id, 'booking_status_updated', 'booking', booking.id, `Technician updated booking ${booking.booking_number} to ${next}`)

    if (next === 'completed') {
      const { data: wallet } = await supabase.from('technician_wallets').select('*').eq('technician_id', profile.id).maybeSingle()
      if (wallet) {
        const newCompleted = (wallet.completed_jobs || 0) + 1
        const newEarnings = (wallet.total_earnings || 0) + booking.amount
        await supabase.from('technician_wallets').update({ completed_jobs: newCompleted, total_earnings: newEarnings }).eq('technician_id', profile.id)
      }
    }
    setUpdating(false)
  }

  if (loading) return <LoadingScreen message="Loading jobs..." />
  if (!profile) return null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>

      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors', tab === t.key ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50')}>{t.label}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><p className="text-gray-500">No jobs found in this category.</p></CardContent></Card>
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
                    <span>{b.customer?.name || 'Unknown customer'}</span>
                    <span>{formatDate(b.scheduled_date)}{b.scheduled_time ? ` ${b.scheduled_time}` : ''}</span>
                    <span className="truncate">{sanitizeInput(b.address)}, {b.city}</span>
                    <span className="font-semibold text-gray-700">{formatCurrency(b.amount)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setSelected(b)}><Eye className="mr-1 h-4 w-4" />Details</Button>
                  {nextStatus(b.status) && b.status !== 'cancelled' && (
                    <Button size="sm" onClick={() => advanceStatus(b)} disabled={updating}>
                      <ArrowRightCircle className="mr-1 h-4 w-4" />Mark as {nextStatus(b.status)?.replace(/_/g, ' ')}
                    </Button>
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
              <div><p className="text-gray-500">Customer</p><p className="font-medium">{selected.customer?.name || 'Unknown'}</p></div>
              <div><p className="text-gray-500">Amount</p><p className="font-medium">{formatCurrency(selected.amount)}</p></div>
              <div><p className="text-gray-500">Scheduled Date</p><p className="font-medium">{formatDate(selected.scheduled_date)}</p></div>
              <div><p className="text-gray-500">Time</p><p className="font-medium">{selected.scheduled_time || 'Not specified'}</p></div>
              <div className="col-span-2"><p className="text-gray-500">Address</p><p className="font-medium">{sanitizeInput(selected.address)}, {selected.city}, {selected.district} - {selected.pincode}</p></div>
              {selected.customer_notes && <div className="col-span-2"><p className="text-gray-500">Notes</p><p className="font-medium">{sanitizeInput(selected.customer_notes)}</p></div>}
            </div>
            {nextStatus(selected.status) && selected.status !== 'cancelled' && (
              <div className="flex justify-end gap-2 border-t pt-4">
                <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
                <Button onClick={() => advanceStatus(selected)} disabled={updating}>
                  {updating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating...</> : <><ArrowRightCircle className="mr-2 h-4 w-4" />Mark as {nextStatus(selected.status)?.replace(/_/g, ' ')}</>}
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
