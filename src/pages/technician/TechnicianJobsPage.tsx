import { useEffect, useState } from 'react'
import { Eye, MapPin, ArrowRight, CircleCheck as CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Booking, Profile, BookingStatus } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { LoadingScreen } from '@/components/LoadingScreen'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { formatDate, formatCurrency, BOOKING_STATUS_FLOW, BOOKING_STATUS_COLORS, cn } from '@/lib/utils'
import { createNotification, createAuditLog, createRevenueTransaction } from '@/lib/notifications'

type Tab = 'all' | 'assigned' | 'active' | 'completed' | 'cancelled'
type BookingWithCust = Booking & { customer?: Profile | null }

const ACTIVE_STATUSES: BookingStatus[] = ['accepted', 'on_the_way', 'arrived', 'work_started']

export function TechnicianJobsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<BookingWithCust[]>([])
  const [tab, setTab] = useState<Tab>('all')
  const [selected, setSelected] = useState<BookingWithCust | null>(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!profile) return
    let mounted = true;
    (async () => {
      const { data: bk } = await supabase
        .from('bookings').select('*').eq('technician_id', profile.id).order('created_at', { ascending: false })
      if (!mounted || !bk) return
      const custIds = [...new Set((bk as Booking[]).map((b) => b.customer_id).filter(Boolean))] as string[]
      const custs: Record<string, Profile> = {}
      if (custIds.length) {
        const { data: cd } = await supabase.from('profiles').select('*').in('id', custIds)
        ;(cd || []).forEach((c) => { custs[c.id] = c as Profile })
      }
      const enriched = (bk as Booking[]).map((b) => ({ ...b, customer: b.customer_id ? custs[b.customer_id] : null }))
      if (mounted) { setBookings(enriched); setLoading(false) }
    })()
    return () => { mounted = false }
  }, [profile])

  if (loading) return <LoadingScreen />

  const filtered = bookings.filter((b) => {
    if (tab === 'assigned') return b.status === 'assigned'
    if (tab === 'active') return ACTIVE_STATUSES.includes(b.status)
    if (tab === 'completed') return b.status === 'completed'
    if (tab === 'cancelled') return b.status === 'cancelled'
    return true
  })

  const nextStatus = (s: BookingStatus): BookingStatus | null => {
    const idx = BOOKING_STATUS_FLOW.indexOf(s)
    if (idx === -1 || idx >= BOOKING_STATUS_FLOW.length - 1) return null
    return BOOKING_STATUS_FLOW[idx + 1]
  }

  const advanceStatus = async (b: BookingWithCust) => {
    if (!profile) return
    const nxt = nextStatus(b.status)
    if (!nxt) return
    setUpdating(true)
    const { error } = await supabase.from('bookings').update({ status: nxt }).eq('id', b.id)
    if (error) { toast(error.message, 'error'); setUpdating(false); return }
    await createAuditLog(profile.id, 'booking_status_updated', 'booking', b.id, `Status changed to ${nxt}`)
    if (b.customer_id) {
      await createNotification(b.customer_id, 'Booking Updated', `Your booking ${b.booking_number} is now "${nxt.replace(/_/g, ' ')}".`, 'booking')
    }
    if (nxt === 'completed') {
      const { data: w } = await supabase.from('technician_wallets').select('*').eq('technician_id', profile.id).maybeSingle()
      if (w) {
        await supabase.from('technician_wallets').update({
          completed_jobs: (w as { completed_jobs: number }).completed_jobs + 1,
          total_earnings: Number((w as { total_earnings: number }).total_earnings) + Number(b.amount),
        }).eq('technician_id', profile.id)
      }
      await createRevenueTransaction('technician_earning', Number(b.amount), profile.id, b.id, `Earning from booking ${b.booking_number}`)
    }
    setBookings((prev) => prev.map((x) => x.id === b.id ? { ...x, status: nxt } : x))
    setSelected((prev) => prev && prev.id === b.id ? { ...prev, status: nxt } : prev)
    toast(`Status updated to "${nxt.replace(/_/g, ' ')}"`, 'success')
    setUpdating(false)
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: 'All' }, { key: 'assigned', label: 'Assigned' },
    { key: 'active', label: 'Active' }, { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>

      <div className="flex gap-2 overflow-x-auto border-b border-gray-200">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn('px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors',
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
            const nxt = nextStatus(b.status)
            return (
              <Card key={b.id}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{b.service_name}</p>
                      <Badge color={BOOKING_STATUS_COLORS[b.status]}>{b.status.replace(/_/g, ' ')}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{b.booking_number} · {formatDate(b.scheduled_date)}</p>
                    {b.customer && <p className="text-sm text-gray-600">Customer: {b.customer.name}</p>}
                    <p className="flex items-center gap-1 text-sm text-gray-500"><MapPin className="h-3 w-3" />{b.address}, {b.city}, {b.district}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{formatCurrency(b.amount)}</span>
                    <Button variant="outline" size="sm" onClick={() => setSelected(b)}><Eye className="mr-1 h-4 w-4" />Details</Button>
                    {nxt && b.status !== 'completed' && (
                      <Button size="sm" disabled={updating} onClick={() => advanceStatus(b)}>
                        {nxt === 'completed' ? <CheckCircle className="mr-1 h-4 w-4" /> : <ArrowRight className="mr-1 h-4 w-4" />}
                        {nxt === 'completed' ? 'Complete' : 'Advance'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Job Details">
        {selected && (
          <div className="space-y-3 text-sm">
            <Row label="Booking No." value={selected.booking_number} />
            <Row label="Service" value={selected.service_name} />
            <Row label="Status" value={<Badge color={BOOKING_STATUS_COLORS[selected.status]}>{selected.status.replace(/_/g, ' ')}</Badge>} />
            <Row label="Scheduled" value={formatDate(selected.scheduled_date)} />
            <Row label="Customer" value={selected.customer?.name || '—'} />
            {selected.customer?.mobile && <Row label="Customer Phone" value={selected.customer.mobile} />}
            <Row label="Address" value={`${selected.address}, ${selected.city}, ${selected.district} - ${selected.pincode}`} />
            <Row label="Amount" value={formatCurrency(selected.amount)} />
            {selected.customer_notes && <Row label="Notes" value={selected.customer_notes} />}
            {nextStatus(selected.status) && selected.status !== 'completed' && (
              <Button className="w-full" disabled={updating} onClick={() => advanceStatus(selected)}>
                {nextStatus(selected.status) === 'completed' ? <CheckCircle className="mr-2 h-4 w-4" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                {updating ? 'Updating...' : `Mark as "${nextStatus(selected.status)!.replace(/_/g, ' ')}"`}
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex justify-between gap-4"><span className="text-gray-500">{label}</span><span className="text-right font-medium text-gray-900">{value}</span></div>
}
