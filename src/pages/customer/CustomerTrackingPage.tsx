import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CircleCheck as CheckCircle, Circle, MapPin, User, Phone, MessageCircle, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Booking, Profile } from '@/lib/supabase'
import { LoadingScreen } from '@/components/LoadingScreen'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency, BOOKING_STATUS_COLORS, cn } from '@/lib/utils'
import { statusTimeline } from '@/lib/notifications'
import { whatsappLink } from '@/lib/constants'

export function CustomerTrackingPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [technician, setTechnician] = useState<Profile | null>(null)

  useEffect(() => {
    if (!bookingId) return
    let mounted = true;
    (async () => {
      const { data: bk } = await supabase.from('bookings').select('*').eq('id', bookingId).maybeSingle()
      if (!mounted) return
      const b = bk as Booking | null
      setBooking(b)
      if (b?.technician_id) {
        const { data: tech } = await supabase.from('profiles').select('*').eq('id', b.technician_id).maybeSingle()
        if (mounted) setTechnician(tech as Profile | null)
      }
      if (mounted) setLoading(false)
    })()
    return () => { mounted = false }
  }, [bookingId])

  if (loading) return <LoadingScreen />
  if (!booking) return (
    <div className="py-12 text-center">
      <p className="text-gray-500">Booking not found.</p>
      <Button className="mt-4" onClick={() => navigate('/customer/bookings')}>Back to Bookings</Button>
    </div>
  )

  const timeline = statusTimeline(booking.status)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/customer/bookings')}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Track Booking</h1>
          <p className="text-sm text-gray-600">{booking.booking_number}</p>
        </div>
      </div>

      {/* Status Timeline */}
      <Card>
        <CardHeader><CardTitle>Service Status</CardTitle></CardHeader>
        <CardContent>
          <div className="mb-4">
            <Badge color={BOOKING_STATUS_COLORS[booking.status]}>{booking.status.replace(/_/g, ' ')}</Badge>
          </div>
          {timeline.length > 0 ? (
            <div className="space-y-4">
              {timeline.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    {step.done ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <Circle className="h-6 w-6 text-gray-300" />
                    )}
                    {i < timeline.length - 1 && <div className={cn('mt-1 h-8 w-0.5', step.done ? 'bg-green-500' : 'bg-gray-200')} />}
                  </div>
                  <div className="pt-0.5">
                    <p className={cn('text-sm font-medium', step.done ? 'text-gray-900' : 'text-gray-400')}>{step.label}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">This booking has been cancelled.</p>
          )}
        </CardContent>
      </Card>

      {/* Technician Info */}
      {booking.technician_id && technician && (
        <Card>
          <CardHeader><CardTitle>Technician Details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-600">
                {technician.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{technician.name}</p>
                <p className="text-sm text-gray-500">Your assigned technician</p>
              </div>
            </div>
            <div className="flex gap-2">
              <a href={`tel:+91${technician.mobile}`}>
                <Button variant="outline" size="sm"><Phone className="mr-1 h-4 w-4" />Call</Button>
              </a>
              <a href={whatsappLink(`91${technician.mobile}`, `Hello ${technician.name}, I have a query about my booking ${booking.booking_number}.`)} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm"><MessageCircle className="mr-1 h-4 w-4" />WhatsApp</Button>
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Booking Details */}
      <Card>
        <CardHeader><CardTitle>Booking Details</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Service" value={booking.service_name} />
          <Row label="Scheduled Date" value={formatDate(booking.scheduled_date)} />
          {booking.scheduled_time && <Row label="Preferred Time" value={booking.scheduled_time} />}
          <Row label="Address" value={`${booking.address}, ${booking.city}, ${booking.district} - ${booking.pincode}`} />
          <Row label="Amount" value={formatCurrency(booking.amount)} />
          {booking.customer_notes && <Row label="Notes" value={booking.customer_notes} />}
        </CardContent>
      </Card>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex justify-between gap-4"><span className="text-gray-500">{label}</span><span className="text-right font-medium text-gray-900">{value}</span></div>
}
