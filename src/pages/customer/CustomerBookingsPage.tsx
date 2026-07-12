import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Loader as Loader2, MapPin, Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Booking, Profile } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BOOKING_STATUS_COLORS, BOOKING_STATUS_FLOW, formatCurrency, formatDate } from '@/lib/utils'

const ACTIVE_STATUSES = ['created', 'confirmed', 'assigned', 'accepted', 'on_the_way', 'work_started']
type Tab = 'all' | 'active' | 'completed' | 'cancelled'
const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

export function CustomerBookingsPage() {
  const { profile } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [techs, setTechs] = useState<Record<string, Profile>>({})
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('all')

  useEffect(() => {
    if (!profile?.id) return
    let mounted = true
    ;(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('customer_id', profile.id)
        .order('created_at', { ascending: false })
      if (!mounted) return
      const all = (data ?? []) as Booking[]
      setBookings(all)
      const techIds = [...new Set(all.map((b) => b.technician_id).filter(Boolean))] as string[]
      if (techIds.length) {
        const { data: td } = await supabase.from('profiles').select('*').in('id', techIds)
        const map: Record<string, Profile> = {}
        ;(td ?? []).forEach((t) => { map[t.id] = t as Profile })
        if (mounted) setTechs(map)
      }
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [profile?.id])

  const filtered = bookings.filter((b) => {
    if (tab === 'active') return ACTIVE_STATUSES.includes(b.status)
    if (tab === 'completed') return b.status === 'completed'
    if (tab === 'cancelled') return b.status === 'cancelled'
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <Button
            key={t.key}
            variant={tab === t.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500">No bookings in this category.</p>
            <Button className="mt-4" asChild><Link to="/customer/booking">Book a Service</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => {
            const tech = b.technician_id ? techs[b.technician_id] : null
            const isActive = ACTIVE_STATUSES.includes(b.status)
            return (
              <Card key={b.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{b.service_name}</p>
                        <Badge className={BOOKING_STATUS_COLORS[b.status]}>
                          {BOOKING_STATUS_FLOW[b.status] ?? b.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">{b.booking_number}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" /> {formatDate(b.scheduled_date)} {b.scheduled_time ?? ''}
                        </span>
                        {b.city && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {b.city}</span>}
                        {tech && <span>Technician: {tech.name}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-start gap-2 sm:items-end">
                      <span className="text-lg font-bold text-gray-900">{formatCurrency(b.amount)}</span>
                      <div className="flex gap-2">
                        {isActive && (
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/customer/track/${b.id}`}>Track</Link>
                          </Button>
                        )}
                        {b.status === 'completed' && (
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/customer/review/${b.id}`}>
                              <Star className="mr-1 h-3.5 w-3.5" /> Review
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
