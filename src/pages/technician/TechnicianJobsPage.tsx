import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Booking, Profile, BookingStatus, TechnicianWallet } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { cn, formatDate, formatCurrency, BOOKING_STATUS_FLOW, BOOKING_STATUS_COLORS } from '@/lib/utils'
import { createNotification, createAuditLog, createRevenueTransaction } from '@/lib/notifications'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { LoadingScreen } from '@/components/LoadingScreen'
import { Eye, MapPin, ArrowRight } from 'lucide-react'

type FilterTab = 'all' | 'assigned' | 'active' | 'completed' | 'cancelled'

const ACTIVE_STATUSES: BookingStatus[] = ['accepted', 'on_the_way', 'arrived', 'work_started']

export function TechnicianJobsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [custMap, setCustMap] = useState<Record<string, Profile>>({})
  const [tab, setTab] = useState<FilterTab>('all')
  const [selected, setSelected] = useState<Booking | null>(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!profile) return
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('technician_id', profile.id)
        .order('created_at', { ascending: false })
      if (!mounted || !data) return
      setBookings(data as Booking[])
      const custIds = [...new Set(data.map((b) => b.customer_id).filter(Boolean))] as string[]
      if (custIds.length) {
        const { data: custs } = await supabase.from('profiles').select('*').in('id', custIds)
        if (mounted && custs) {
          const m: Record<string, Profile> = {}
          custs.forEach((c) => { m[c.id] = c as Profile })
          setCustMap(m)
        }
      }
      if (mounted) setLoading(false)
    })()
    return () => { mounted = false }
  }, [profile])

  const filtered = bookings.filter((b) => {
    if (tab === 'all') return true
    if (tab === 'assigned') return b.status === 'assigned'
    if (tab === 'active') return ACTIVE_STATUSES.includes(b.status)
    if (tab === 'completed') return b.status === 'completed'
    if (tab === 'cancelled') return b.status === 'cancelled'
    return true
  })

  const nextStatus = (current: BookingStatus): BookingStatus | null => {
    const idx = BOOKING_STATUS_FLOW.indexOf(current)
    if (idx === -1 || idx >= BOOKING_STATUS_FLOW.length - 1) return null
    return BOOKING_STATUS_FLOW[idx + 1]
  }

  const statusLabel = (s: BookingStatus) => s.replace(/_/g, ' ')

  const handleUpdateStatus = async (booking: Booking) => {
    if (!profile) return
    const next = nextStatus(booking.status)
    if (!next) return
    setUpdating(true)
    const { error } = await supabase.from('bookings').update({ status: next }).eq('id', booking.id)
    if (error) { toast('Failed to update status', 'error'); setUpdating(false); return }
    setBookings((bs) => bs.map((b) => b.id === booking.id ? { ...b, status: next } : b))
    await createNotification(booking.customer_id, 'Booking Status Updated', `Your booking #${booking.booking_number} is now: ${statusLabel(next)}.`)
    await createAuditLog(profile.id, 'booking_status_updated', 'booking', booking.id, `Status updated to ${next}`)
    if (next === 'completed') {
      const { data: w } = await supabase.from('technician_wallets').select('*').eq('technician_id', profile.id).maybeSingle()
      const wallet = w as TechnicianWallet | null
      if (wallet) {
        await supabase.from('technician_wallets').update({
          completed_jobs: (wallet.completed_jobs || 0) + 1,
          total_earnings: (wallet.total_earnings || 0) + booking.amount,
          total_jobs: (wallet.total_jobs || 0) + 1,
        }).eq('id', wallet.id)
      }
      await createRevenueTransaction('technician_earning', booking.amount, profile.id, booking.id, `Earning from booking #${booking.booking_number}`)
    }
    toast(`Status updated to ${statusLabel(next)}`, 'success')
    setSelected((s) => s && s.id === booking.id ? { ...s, status: next } : s)
    setUpdating(false)
  }

  if (loading) return <LoadingScreen message="Loading jobs..." />

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' }, { key: 'assigned', label: 'Assigned' },
    { key: 'active', label: 'Active' }, { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>

      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn('px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700')}>
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-gray-500">No jobs found in this category.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => {
            const next = nextStatus(b.status)
            const cust = custMap[b.customer_id]
            return (
              <Card key={b.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{b.service_name}</p>
                      <Badge color={BOOKING_STATUS_COLORS[b.status]}>{statusLabel(b.status)}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">#{b.booking_number} · {formatDate(b.scheduled_date)}{b.scheduled_time ? ` · ${b.scheduled_time}` : ''}</p>
                    {cust && <p className="text-sm text-gray-500">Customer: {cust.name}</p>}
                    <p className="text-sm text-gray-500"><MapPin className="mr-1 inline h-3 w-3" />{b.address}, {b.city}, {b.district}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="font-semibold text-gray-900">{formatCurrency(b.amount)}</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setSelected(b)}><Eye className="mr-1 h-4 w-4" />Details</Button>
                      {next && (
                        <Button size="sm" onClick={() => handleUpdateStatus(b)} disabled={updating}>
                          {statusLabel(next)} <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Job Details">
        {selected && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">{selected.service_name}</span>
              <Badge color={BOOKING_STATUS_COLORS[selected.status]}>{statusLabel(selected.status)}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p className="text-gray-500">Booking #</p><p className="text-gray-900">{selected.booking_number}</p>
              <p className="text-gray-500">Date</p><p className="text-gray-900">{formatDate(selected.scheduled_date)}</p>
              <p className="text-gray-500">Time</p><p className="text-gray-900">{selected.scheduled_time || 'Not set'}</p>
              <p className="text-gray-500">Address</p><p className="text-gray-900">{selected.address}</p>
              <p className="text-gray-500">City</p><p className="text-gray-900">{selected.city}, {selected.district} - {selected.pincode}</p>
              <p className="text-gray-500">Amount</p><p className="text-gray-900">{formatCurrency(selected.amount)}</p>
              {custMap[selected.customer_id] && (<><p className="text-gray-500">Customer</p><p className="text-gray-900">{custMap[selected.customer_id].name}</p></>)}
              {selected.customer_notes && (<><p className="text-gray-500">Notes</p><p className="text-gray-900">{selected.customer_notes}</p></>)}
            </div>
            {nextStatus(selected.status) && (
              <Button className="w-full" onClick={() => handleUpdateStatus(selected)} disabled={updating}>
                {updating ? 'Updating...' : `Mark as ${statusLabel(nextStatus(selected.status)!)}`}
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
