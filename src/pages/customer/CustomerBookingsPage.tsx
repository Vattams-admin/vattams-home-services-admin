import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Booking, Profile } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { cn, formatDate, formatCurrency, BOOKING_STATUS_COLORS } from '@/lib/utils'
import { createNotification, createAuditLog } from '@/lib/notifications'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { LoadingScreen } from '@/components/LoadingScreen'
import { Eye, MapPin, XCircle } from 'lucide-react'

type FilterTab = 'all' | 'active' | 'completed' | 'cancelled'

export function CustomerBookingsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [techMap, setTechMap] = useState<Record<string, Profile>>({})
  const [tab, setTab] = useState<FilterTab>('all')
  const [selected, setSelected] = useState<Booking | null>(null)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!profile) return
      const { data } = await supabase.from('bookings').select('*').eq('customer_id', profile.id).order('created_at', { ascending: false })
      if (!mounted || !data) return
      setBookings(data as Booking[])
      const techIds = [...new Set(data.map((b) => b.technician_id).filter(Boolean))] as string[]
      if (techIds.length) {
        const { data: techs } = await supabase.from('profiles').select('*').in('id', techIds)
        if (mounted && techs) {
          const m: Record<string, Profile> = {}
          techs.forEach((t) => { m[t.id] = t as Profile })
          setTechMap(m)
        }
      }
      if (mounted) setLoading(false)
    })()
    return () => { mounted = false }
  }, [profile])

  const filtered = bookings.filter((b) => {
    if (tab === 'all') return true
    if (tab === 'active') return !['completed', 'cancelled'].includes(b.status)
    if (tab === 'completed') return b.status === 'completed'
    if (tab === 'cancelled') return b.status === 'cancelled'
    return true
  })

  const canCancel = (s: string) => ['created', 'confirmed', 'assigned'].includes(s)

  const handleCancel = async () => {
    if (!selected || !profile) return
    setCancelling(true)
    const { error } = await supabase.from('bookings').update({ status: 'cancelled', cancelled_by: profile.id }).eq('id', selected.id)
    if (error) { toast('Failed to cancel booking', 'error'); setCancelling(false); return }
    setBookings((bs) => bs.map((b) => b.id === selected.id ? { ...b, status: 'cancelled' } : b))
    if (selected.technician_id) await createNotification(selected.technician_id, 'Booking Cancelled', `Booking #${selected.booking_number} has been cancelled by customer.`)
    await createAuditLog(profile.id, 'booking_cancelled', 'booking', selected.id, `Cancelled booking #${selected.booking_number}`)
    toast('Booking cancelled successfully', 'success')
    setSelected(null)
    setCancelling(false)
  }

  if (loading) return <LoadingScreen message="Loading bookings..." />

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' }, { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' }, { key: 'cancelled', label: 'Cancelled' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <Link to="/customer/booking"><Button>Book New Service</Button></Link>
      </div>

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
              <CardContent className="flex items-center justify-between p-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{b.service_name}</p>
                    <Badge color={BOOKING_STATUS_COLORS[b.status]}>{b.status.replace(/_/g, ' ')}</Badge>
                  </div>
                  <p className="text-sm text-gray-500">#{b.booking_number} · {formatDate(b.scheduled_date)}{b.scheduled_time ? ` · ${b.scheduled_time}` : ''}</p>
                  <p className="text-sm text-gray-500"><MapPin className="mr-1 inline h-3 w-3" />{b.city}, {b.district}</p>
                  {b.technician_id && techMap[b.technician_id] && <p className="text-sm text-gray-500">Technician: {techMap[b.technician_id].name}</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="font-semibold text-gray-900">{formatCurrency(b.amount)}</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setSelected(b)}><Eye className="mr-1 h-4 w-4" />Details</Button>
                    {canCancel(b.status) && <Button size="sm" variant="danger" onClick={() => setSelected(b)}><XCircle className="mr-1 h-4 w-4" />Cancel</Button>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Booking Details">
        {selected && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">{selected.service_name}</span>
              <Badge color={BOOKING_STATUS_COLORS[selected.status]}>{selected.status.replace(/_/g, ' ')}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p className="text-gray-500">Booking #</p><p className="text-gray-900">{selected.booking_number}</p>
              <p className="text-gray-500">Date</p><p className="text-gray-900">{formatDate(selected.scheduled_date)}</p>
              <p className="text-gray-500">Time</p><p className="text-gray-900">{selected.scheduled_time || 'Not set'}</p>
              <p className="text-gray-500">Address</p><p className="text-gray-900">{selected.address}</p>
              <p className="text-gray-500">City</p><p className="text-gray-900">{selected.city}, {selected.district} - {selected.pincode}</p>
              <p className="text-gray-500">Amount</p><p className="text-gray-900">{formatCurrency(selected.amount)}</p>
              {selected.technician_id && techMap[selected.technician_id] && (<><p className="text-gray-500">Technician</p><p className="text-gray-900">{techMap[selected.technician_id].name}</p></>)}
              {selected.customer_notes && (<><p className="text-gray-500">Notes</p><p className="text-gray-900">{selected.customer_notes}</p></>)}
            </div>
            {canCancel(selected.status) && (
              <Button variant="danger" className="w-full" onClick={handleCancel} disabled={cancelling}>
                {cancelling ? 'Cancelling...' : 'Cancel Booking'}
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
