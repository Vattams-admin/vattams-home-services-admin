import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle, Circle, MapPin, User, Phone, MessageCircle, Calendar, IndianRupee } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Booking, Profile } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/LoadingScreen'
import { cn, formatDate, formatCurrency, BOOKING_STATUS_COLORS, sanitizeInput } from '@/lib/utils'
import { statusTimeline } from '@/lib/notifications'
import { whatsappLink } from '@/lib/constants'

type BookingWithTech = Booking & { technician: Profile | null }

export function CustomerTrackingPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState<BookingWithTech | null>(null)

  useEffect(() => {
    if (!bookingId) return
    let mounted = true;
    (async () => {
      const { data } = await supabase.from('bookings').select('*, technician:technician_id(*)').eq('id', bookingId).maybeSingle()
      if (!mounted) return
      setBooking(data as BookingWithTech | null)
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [bookingId])

  if (loading) return <LoadingScreen message="Loading booking details..." />

  const timeline = statusTimeline(booking?.status)
  const tech = booking?.technician

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Track Booking</h1>
        <Link to="/customer/bookings"><Button variant="outline">Back to Bookings</Button></Link>
      </div>

      {!booking ? (
        <Card><CardContent className="py-12 text-center"><p className="text-gray-500">Booking not found.</p></CardContent></Card>
      ) : (
        <>
          <Card>
            <CardHeader><CardTitle className="flex items-center justify-between"><span className="font-mono text-base">#{booking.booking_number}</span><Badge color={BOOKING_STATUS_COLORS[booking.status]}>{booking.status.replace(/_/g, ' ')}</Badge></CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-gray-400" /><span>{formatDate(booking.scheduled_date)}{booking.scheduled_time ? ` at ${booking.scheduled_time}` : ''}</span></div>
              <div className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-gray-400" /><span>{sanitizeInput(booking.address)}, {booking.city}, {booking.district} - {booking.pincode}</span></div>
              <div className="flex items-center gap-2"><IndianRupee className="h-4 w-4 text-gray-400" /><span className="font-semibold">{formatCurrency(booking.amount)}</span></div>
              <div><p className="text-gray-500">Service</p><p className="font-medium">{booking.service_name}</p></div>
              {booking.customer_notes && <div><p className="text-gray-500">Notes</p><p className="font-medium">{sanitizeInput(booking.customer_notes)}</p></div>}
            </CardContent>
          </Card>

          {booking.status !== 'cancelled' && timeline.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Status Timeline</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timeline.map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      {step.done ? <CheckCircle className="h-5 w-5 text-green-600" /> : <Circle className="h-5 w-5 text-gray-300" />}
                      <span className={cn('text-sm', step.done ? 'font-medium text-gray-900' : 'text-gray-400')}>{step.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {booking.status === 'cancelled' && (
            <Card><CardContent className="py-6 text-center"><p className="text-red-600 font-medium">This booking has been cancelled.</p>{booking.cancel_reason && <p className="mt-1 text-sm text-gray-500">Reason: {sanitizeInput(booking.cancel_reason)}</p>}</CardContent></Card>
          )}

          {tech && (
            <Card>
              <CardHeader><CardTitle>Technician Details</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-600"><User className="h-6 w-6" /></div>
                  <div><p className="font-medium text-gray-900">{tech.name}</p><p className="text-sm text-gray-500">{tech.mobile}</p></div>
                </div>
                <div className="flex gap-2">
                  <a href={whatsappLink(tech.mobile.startsWith('91') ? tech.mobile : `91${tech.mobile}`, `Hello ${tech.name}, regarding my booking #${booking.booking_number}`)} target="_blank" rel="noreferrer"><Button variant="outline" size="sm"><MessageCircle className="mr-1 h-4 w-4" />WhatsApp</Button></a>
                  <a href={`tel:+91${tech.mobile}`}><Button variant="outline" size="sm"><Phone className="mr-1 h-4 w-4" />Call</Button></a>
                </div>
              </CardContent>
            </Card>
          )}

          {booking.status === 'completed' && (
            <div className="flex justify-end">
              <Link to={`/customer/review/${booking.id}`}><Button>Leave a Review</Button></Link>
            </div>
          )}
        </>
      )}
    </div>
  )
}
