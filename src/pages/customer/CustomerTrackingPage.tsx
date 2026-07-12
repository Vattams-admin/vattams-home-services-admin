import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Booking, Profile } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { cn, formatDate, formatDateTime, formatCurrency, BOOKING_STATUS_COLORS } from '@/lib/utils'
import { statusTimeline } from '@/lib/notifications'
import { whatsappLink } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/LoadingScreen'
import { CheckCircle, Circle, MapPin, User, Phone, MessageCircle, ArrowLeft } from 'lucide-react'

export function CustomerTrackingPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [technician, setTechnician] = useState<Profile | null>(null)

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!bookingId) return
      const { data } = await supabase.from('bookings').select('*').eq('id', bookingId).single()
      if (!mounted || !data) { setLoading(false); return }
      setBooking(data as Booking)
      if (data.technician_id) {
        const { data: tech } = await supabase.from('profiles').select('*').eq('id', data.technician_id).maybeSingle()
        if (mounted && tech) setTechnician(tech as Profile)
      }
      if (mounted) setLoading(false)
    })()
    return () => { mounted = false }
  }, [bookingId])

  if (loading) return <LoadingScreen message="Loading tracking..." />
  if (!booking) return (
    <div className="flex flex-col items-center gap-4 py-12">
      <p className="text-gray-500">Booking not found.</p>
      <Link to="/customer/bookings"><Button variant="outline">Back to Bookings</Button></Link>
    </div>
  )

  const timeline = statusTimeline(booking.status)
  const isCancelled = booking.status === 'cancelled'

  return (
    <div className="space-y-6">
      <Link to="/customer/bookings" className="inline-flex items-center text-sm text-blue-600 hover:underline">
        <ArrowLeft className="mr-1 h-4 w-4" />Back to Bookings
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{booking.service_name}</h1>
          <p className="text-gray-500">Booking #{booking.booking_number}</p>
        </div>
        <Badge color={BOOKING_STATUS_COLORS[booking.status]}>{booking.status.replace(/_/g, ' ')}</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle>Status Timeline</CardTitle></CardHeader>
        <CardContent>
          {isCancelled ? (
            <div className="py-6 text-center text-red-600"><p className="font-medium">This booking has been cancelled.</p></div>
          ) : (
            <div className="space-y-4">
              {timeline.map((step, i) => {
                const Icon = step.done ? CheckCircle : Circle
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className={cn('flex h-8 w-8 items-center justify-center rounded-full', step.done ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400')}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className={cn('text-sm font-medium', step.done ? 'text-gray-900' : 'text-gray-400')}>{step.label}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {technician && (
        <Card>
          <CardHeader><CardTitle>Technician Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600"><User className="h-6 w-6" /></div>
              <div>
                <p className="font-medium text-gray-900">{technician.name}</p>
                <p className="text-sm text-gray-500">{technician.mobile}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <a href={`tel:+91${technician.mobile}`}>
                <Button variant="outline" size="sm"><Phone className="mr-2 h-4 w-4" />Call</Button>
              </a>
              <a href={whatsappLink(`91${technician.mobile}`, `Hello ${technician.name}, regarding my booking #${booking.booking_number} for ${booking.service_name}.`)} target="_blank" rel="noreferrer">
                <Button size="sm" className="bg-green-600 hover:bg-green-700"><MessageCircle className="mr-2 h-4 w-4" />WhatsApp</Button>
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Booking Details</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div><p className="text-sm text-gray-500">Scheduled Date</p><p className="font-medium text-gray-900">{formatDate(booking.scheduled_date)}{booking.scheduled_time ? ` at ${booking.scheduled_time}` : ''}</p></div>
            <div><p className="text-sm text-gray-500">Amount</p><p className="font-medium text-gray-900">{formatCurrency(booking.amount)}</p></div>
            <div className="sm:col-span-2"><p className="text-sm text-gray-500"><MapPin className="mr-1 inline h-3 w-3" />Address</p><p className="font-medium text-gray-900">{booking.address}, {booking.city}, {booking.district} - {booking.pincode}</p></div>
            <div><p className="text-sm text-gray-500">Created</p><p className="font-medium text-gray-900">{formatDateTime(booking.created_at)}</p></div>
            {booking.customer_notes && <div className="sm:col-span-2"><p className="text-sm text-gray-500">Notes</p><p className="font-medium text-gray-900">{booking.customer_notes}</p></div>}
          </div>
        </CardContent>
      </Card>

      {booking.status === 'completed' && (
        <Link to={`/customer/review/${booking.id}`}>
          <Button className="w-full">Leave a Review</Button>
        </Link>
      )}
    </div>
  )
}
