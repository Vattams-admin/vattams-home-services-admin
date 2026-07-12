import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Calendar, CircleCheck as CheckCircle, Clock, Loader as Loader2, MapPin, MessageCircle, Phone, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Booking, Profile } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { statusTimeline } from '@/lib/notifications'
import { telLink, whatsappLink } from '@/lib/constants'
import { BOOKING_STATUS_COLORS, BOOKING_STATUS_FLOW, formatCurrency, formatDate } from '@/lib/utils'

export function CustomerTrackingPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [tech, setTech] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!bookingId) return
    setLoading(true)
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .maybeSingle()
    const b = data as Booking | null
    setBooking(b)
    if (b?.technician_id) {
      const { data: td } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', b.technician_id)
        .maybeSingle()
      setTech(td as Profile | null)
    } else {
      setTech(null)
    }
    setLoading(false)
  }, [bookingId])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-500">Booking not found.</p>
        <Button className="mt-4" asChild><Link to="/customer/bookings">Back to Bookings</Link></Button>
      </div>
    )
  }

  const timeline = statusTimeline(booking.status)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Track Booking</h1>
          <p className="text-sm text-gray-500">{booking.booking_number}</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Status Timeline */}
      <Card>
        <CardHeader><CardTitle>Service Status</CardTitle></CardHeader>
        <CardContent>
          <div className="mb-4">
            <Badge className={BOOKING_STATUS_COLORS[booking.status]}>
              {BOOKING_STATUS_FLOW[booking.status] ?? booking.status}
            </Badge>
          </div>
          {timeline.length > 0 ? (
            <div className="space-y-0">
              {timeline.map((step, i) => (
                <div key={step.label} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    {step.done
                      ? <CheckCircle className="h-5 w-5 text-green-600" />
                      : <Clock className="h-5 w-5 text-gray-300" />}
                    {i < timeline.length - 1 && (
                      <div className={`w-0.5 flex-1 ${step.done ? 'bg-green-500' : 'bg-gray-200'} min-h-[2rem]`} />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className={`text-sm font-medium ${step.done ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">This booking has been {booking.status}.</p>
          )}
        </CardContent>
      </Card>

      {/* Technician Details */}
      {tech && (
        <Card>
          <CardHeader><CardTitle>Technician Details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-semibold text-gray-900">{tech.name}</p>
              <p className="text-sm text-gray-500">{tech.mobile}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" asChild>
                <a href={telLink(tech.mobile)}><Phone className="mr-2 h-4 w-4" /> Call</a>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href={whatsappLink(tech.mobile, `Hi ${tech.name}, regarding my booking ${booking.booking_number}`)}>
                  <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Booking Details */}
      <Card>
        <CardHeader><CardTitle>Booking Details</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Service</span><span className="font-medium">{booking.service_name}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-medium">{formatDate(booking.scheduled_date)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Time</span><span className="font-medium">{booking.scheduled_time ?? '-'}</span></div>
          <div className="flex items-start justify-between gap-4">
            <span className="text-gray-500">Address</span>
            <span className="text-right font-medium">
              {booking.address}{booking.city ? `, ${booking.city}` : ''}{booking.pincode ? ` - ${booking.pincode}` : ''}
            </span>
          </div>
          <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-semibold">{formatCurrency(booking.amount)}</span></div>
        </CardContent>
      </Card>
    </div>
  )
}
