import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle, Circle, User, Phone, MessageCircle, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Booking, Profile } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingScreen } from '@/components/LoadingScreen'
import { formatCurrency, formatDate, BOOKING_STATUS_COLORS } from '@/lib/utils'
import { statusTimeline } from '@/lib/notifications'
import { whatsappLink } from '@/lib/constants'

export function CustomerTrackingPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [technician, setTechnician] = useState<Profile | null>(null)

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!bookingId) return
      const { data: bk } = await supabase.from('bookings').select('*').eq('id', bookingId).maybeSingle()
      if (!mounted) return
      const b = bk as Booking
      setBooking(b)
      if (b?.technician_id) {
        const { data: tech } = await supabase.from('profiles').select('*').eq('id', b.technician_id).maybeSingle()
        if (mounted) setTechnician(tech as Profile)
      }
      if (mounted) setLoading(false)
    })()
    return () => { mounted = false }
  }, [bookingId])

  if (loading) return <LoadingScreen message="Loading tracking info..." />
  if (!booking) return <div className="py-12 text-center"><p className="text-gray-500">Booking not found.</p><Link to="/customer/bookings"><Button className="mt-4">Back to Bookings</Button></Link></div>

  const timeline = statusTimeline(booking.status)

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/customer/bookings" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600"><ArrowLeft className="h-4 w-4" /> Back to Bookings</Link>

      <Card className="mb-6">
        <CardHeader><CardTitle>Booking #{booking.booking_number}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-gray-500">Service</p><p className="font-medium">{booking.service_name}</p></div>
            <div><p className="text-gray-500">Status</p><Badge color={BOOKING_STATUS_COLORS[booking.status]}>{booking.status.replace(/_/g, ' ')}</Badge></div>
            <div><p className="text-gray-500">Scheduled Date</p><p className="font-medium">{formatDate(booking.scheduled_date)} {booking.scheduled_time && `at ${booking.scheduled_time}`}</p></div>
            <div><p className="text-gray-500">Amount</p><p className="font-medium">{formatCurrency(booking.amount)}</p></div>
            <div className="col-span-2"><p className="text-gray-500">Address</p><p className="font-medium">{booking.address}, {booking.city}, {booking.district} - {booking.pincode}</p></div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader><CardTitle>Order Tracking</CardTitle></CardHeader>
        <CardContent>
          {timeline.length > 0 ? (
            <div className="space-y-4">
              {timeline.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  {step.done ? <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" /> : <Circle className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-300" />}
                  <div>
                    <p className={`font-medium ${step.done ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                    {step.done && i === timeline.length - 1 && <p className="text-xs text-green-600">Current status</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-500">Tracking not available for cancelled bookings.</p>}
        </CardContent>
      </Card>

      {technician && (
        <Card>
          <CardHeader><CardTitle>Technician Details</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50"><User className="h-6 w-6 text-blue-600" /></div>
                <div>
                  <p className="font-medium text-gray-900">{technician.name}</p>
                  <p className="flex items-center gap-1 text-sm text-gray-600"><Phone className="h-3.5 w-3.5" /> {technician.mobile}</p>
                </div>
              </div>
              <a href={whatsappLink(technician.mobile, `Hi ${technician.name}, regarding my booking #${booking.booking_number}`)} target="_blank" rel="noopener noreferrer">
                <Button><MessageCircle className="mr-2 h-4 w-4" /> WhatsApp</Button>
              </a>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
