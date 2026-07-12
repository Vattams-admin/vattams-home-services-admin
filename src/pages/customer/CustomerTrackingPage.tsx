import { useEffect, useState } from 'react'
import { MapPin, Clock, User, Phone, Loader as Loader2, CircleCheck as CheckCircle2, Circle, Navigation, Calendar, Wrench } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/input'
import { useAuth } from '@/lib/auth'
import { supabase, type Booking, type Profile } from '@/lib/supabase'
import { cn, formatDate, BOOKING_STATUS_COLORS } from '@/lib/utils'
import { statusTimeline } from '@/lib/notifications'
import { whatsappLink } from '@/lib/constants'

const ACTIVE_STATUSES = ['created', 'confirmed', 'assigned', 'accepted', 'on_the_way', 'arrived', 'work_started']

export default function CustomerTrackingPage() {
  const { profile, session } = useAuth()

  const [bookings, setBookings] = useState<Booking[]>([])
  const [technicians, setTechnicians] = useState<Record<string, Profile>>({})
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState('')

  const userId = profile?.id || session?.user?.id

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    async function load() {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('customer_id', userId)
          .in('status', ACTIVE_STATUSES)
          .order('scheduled_date', { ascending: true })
        if (cancelled) return
        if (error) throw error
        const activeBookings = (data as Booking[]) || []
        setBookings(activeBookings)
        if (activeBookings.length > 0) setSelectedId(activeBookings[0].id)

        const techIds = Array.from(
          new Set(activeBookings.map((b) => b.technician_id).filter(Boolean) as string[]),
        )
        if (techIds.length > 0) {
          const { data: techData } = await supabase.from('profiles').select('*').in('id', techIds)
          if (techData) {
            const map: Record<string, Profile> = {}
            ;(techData as Profile[]).forEach((t) => {
              map[t.id] = t
            })
            setTechnicians(map)
          }
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [userId])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (bookings.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Track Your Booking</h1>
          <p className="mt-1 text-sm text-slate-500">Real-time tracking for your active bookings.</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Navigation className="h-12 w-12 text-slate-300" />
            <p className="mt-3 text-lg font-medium text-slate-700">No active bookings to track</p>
            <p className="mt-1 text-sm text-slate-500">
              Book a service to see real-time tracking here.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const selectedBooking = bookings.find((b) => b.id === selectedId) || bookings[0]
  const technician = selectedBooking.technician_id ? technicians[selectedBooking.technician_id] : null
  const timeline = statusTimeline(selectedBooking.status)

  // Simulated ETA based on status
  const getETA = (status: string): string => {
    switch (status) {
      case 'on_the_way':
        return '15-30 minutes'
      case 'arrived':
        return 'Technician has arrived'
      case 'work_started':
        return 'Work in progress'
      case 'accepted':
      case 'assigned':
        return 'Within 1-2 hours'
      case 'confirmed':
        return 'On scheduled time'
      default:
        return 'Awaiting confirmation'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Track Your Booking</h1>
        <p className="mt-1 text-sm text-slate-500">Real-time tracking for your active bookings.</p>
      </div>

      {/* Booking Selector */}
      {bookings.length > 1 && (
        <Card>
          <CardContent className="p-4">
            <Select value={selectedId} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setSelectedId(e.target.value)}>
              {bookings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.service_name} - #{b.booking_number} ({formatDate(b.scheduled_date)})
                </option>
              ))}
            </Select>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Status Timeline */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Booking Status</CardTitle>
              <Badge
                className={cn(
                  'capitalize',
                  BOOKING_STATUS_COLORS[selectedBooking.status] || 'bg-gray-100 text-gray-700',
                )}
              >
                {selectedBooking.status.replace(/_/g, ' ')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Booking Info */}
            <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Wrench className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{selectedBooking.service_name}</p>
                <p className="text-xs text-slate-500">#{selectedBooking.booking_number}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {formatDate(selectedBooking.scheduled_date)}
                  </span>
                  {selectedBooking.scheduled_time && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {selectedBooking.scheduled_time}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {selectedBooking.city}
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-1">
              {timeline.map((item, idx) => {
                const isLast = idx === timeline.length - 1
                return (
                  <div key={item.status} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      {item.completed ? (
                        <CheckCircle2 className="h-6 w-6 text-blue-600" />
                      ) : (
                        <Circle className="h-6 w-6 text-slate-300" />
                      )}
                      {!isLast && (
                        <div
                          className={cn(
                            'w-0.5 flex-1',
                            item.completed ? 'bg-blue-600' : 'bg-slate-200',
                          )}
                          style={{ minHeight: '2rem' }}
                        />
                      )}
                    </div>
                    <div className="pb-4">
                      <p
                        className={cn(
                          'text-sm font-medium',
                          item.completed ? 'text-slate-900' : 'text-slate-400',
                        )}
                      >
                        {item.label}
                      </p>
                      {item.completed && idx === timeline.length - 1 && (
                        <p className="text-xs text-blue-600">Current status</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Technician & ETA */}
        <div className="space-y-4">
          {/* ETA Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Estimated Arrival</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50">
                  <Clock className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-900">{getETA(selectedBooking.status)}</p>
                  <p className="text-xs text-slate-500">Estimated time</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technician Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Technician Details</CardTitle>
            </CardHeader>
            <CardContent>
              {technician ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                      <User className="h-6 w-6 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{technician.name}</p>
                      <p className="text-xs text-slate-500">Assigned Technician</p>
                    </div>
                  </div>
                  {technician.mobile && (
                    <div className="flex gap-2">
                      <a href={`tel:+91${technician.mobile}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Phone className="mr-1 h-3 w-3" /> Call
                        </Button>
                      </a>
                      <a
                        href={whatsappLink(`91${technician.mobile}`, `Hello ${technician.name}, regarding my booking ${selectedBooking.booking_number}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1"
                      >
                        <Button variant="outline" size="sm" className="w-full">
                          WhatsApp
                        </Button>
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center py-4 text-center">
                  <User className="h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-sm text-slate-500">Technician not yet assigned</p>
                  <p className="text-xs text-slate-400">You'll be notified once assigned.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Map Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Live Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-48 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-200">
                <div className="flex flex-col items-center text-center">
                  <MapPin className="h-8 w-8 text-slate-400" />
                  <p className="mt-2 text-xs text-slate-500">Live tracking map</p>
                  <p className="text-xs text-slate-400">Available when technician is on the way</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
