import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Star, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Booking, Review } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingScreen } from '@/components/LoadingScreen'
import { formatDate, cn } from '@/lib/utils'
import { createNotification, createAuditLog, trackEvent } from '@/lib/notifications'
import type { FormEvent } from 'react'

export function CustomerReviewPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const { profile } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [existing, setExisting] = useState<Review | null>(null)
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!bookingId) return
      const { data: bk } = await supabase.from('bookings').select('*').eq('id', bookingId).maybeSingle()
      if (!mounted) return
      const b = bk as Booking
      setBooking(b)
      if (b) {
        const { data: rev } = await supabase.from('reviews').select('*').eq('booking_id', bookingId).maybeSingle()
        if (mounted) {
          const r = rev as Review
          setExisting(r)
          if (r) { setRating(r.rating); setReviewText(r.review_text) }
        }
      }
      if (mounted) setLoading(false)
    })()
    return () => { mounted = false }
  }, [bookingId])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!profile || !booking || !booking.technician_id) return
    if (rating === 0) { toast('Please select a rating', 'warning'); return }
    setSubmitting(true)
    if (existing) {
      const { error } = await supabase.from('reviews').update({ rating, review_text: reviewText }).eq('id', existing.id)
      setSubmitting(false)
      if (error) { toast('Failed to update review', 'error'); return }
      toast('Review updated successfully', 'success')
    } else {
      const { error } = await supabase.from('reviews').insert({
        booking_id: booking.id, customer_id: profile.id, technician_id: booking.technician_id,
        rating, review_text: reviewText,
      })
      setSubmitting(false)
      if (error) { toast('Failed to submit review', 'error'); return }
      await createNotification(booking.technician_id, 'New Review', `You received a ${rating}-star review for booking #${booking.booking_number}`, 'review')
      await createAuditLog(profile.id, 'review_create', 'review', booking.id, `${rating} stars`)
      await trackEvent('review_submit', 'engagement', { rating })
      toast('Review submitted successfully', 'success')
    }
    navigate('/customer/bookings')
  }

  if (loading) return <LoadingScreen message="Loading..." />
  if (!booking) return <div className="py-12 text-center"><p className="text-gray-500">Booking not found.</p><Link to="/customer/bookings"><Button className="mt-4">Back to Bookings</Button></Link></div>
  if (booking.status !== 'completed') return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="rounded-lg bg-amber-50 p-6 text-center">
        <p className="text-amber-800">You can only review completed bookings.</p>
        <p className="mt-2 text-sm text-amber-600">Current status: {booking.status.replace(/_/g, ' ')}</p>
        <Link to="/customer/bookings"><Button className="mt-4" variant="outline">Back to Bookings</Button></Link>
      </div>
    </div>
  )

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link to="/customer/bookings" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600"><ArrowLeft className="h-4 w-4" /> Back to Bookings</Link>
      <Card>
        <CardHeader><CardTitle>{existing ? 'Edit Review' : 'Write a Review'}</CardTitle></CardHeader>
        <CardContent>
          <div className="mb-4 rounded-lg bg-gray-50 p-3">
            <p className="font-medium text-gray-900">{booking.service_name}</p>
            <p className="text-sm text-gray-500">#{booking.booking_number} • {formatDate(booking.scheduled_date)}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setRating(n)} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}>
                    <Star className={cn('h-8 w-8', (hover || rating) >= n ? 'fill-amber-400 text-amber-400' : 'text-gray-300')} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="review_text">Your Review</Label>
              <Textarea id="review_text" rows={4} required value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Share your experience..." />
            </div>
            <Button type="submit" disabled={submitting} className="w-full">{submitting ? 'Submitting...' : existing ? 'Update Review' : 'Submit Review'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
