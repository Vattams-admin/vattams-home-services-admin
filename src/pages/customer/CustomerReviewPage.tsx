import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Booking, Review } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { sanitizeInput } from '@/lib/utils'
import { createNotification, createAuditLog } from '@/lib/notifications'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingScreen } from '@/components/LoadingScreen'
import { Star, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FormEvent } from 'react'

export function CustomerReviewPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const { profile } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [existing, setExisting] = useState<Review | null>(null)
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [reviewText, setReviewText] = useState('')

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!bookingId) return
      const { data } = await supabase.from('bookings').select('*').eq('id', bookingId).single()
      if (!mounted || !data) { setLoading(false); return }
      setBooking(data as Booking)
      const { data: rev } = await supabase.from('reviews').select('*').eq('booking_id', bookingId).maybeSingle()
      if (mounted && rev) { setExisting(rev as Review); setRating(rev.rating); setReviewText(rev.review_text) }
      if (mounted) setLoading(false)
    })()
    return () => { mounted = false }
  }, [bookingId])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!profile || !booking) return
    if (rating === 0) { toast('Please select a rating', 'warning'); return }
    if (!reviewText.trim()) { toast('Please write a review', 'warning'); return }
    if (!booking.technician_id) { toast('No technician assigned', 'error'); return }
    setSubmitting(true)
    if (existing) {
      const { error } = await supabase.from('reviews').update({
        rating, review_text: sanitizeInput(reviewText),
      }).eq('id', existing.id)
      if (error) { toast('Failed to update review', 'error'); setSubmitting(false); return }
      await createAuditLog(profile.id, 'review_updated', 'review', existing.id, `Updated review for booking #${booking.booking_number}`)
      toast('Review updated successfully', 'success')
    } else {
      const { data, error } = await supabase.from('reviews').insert({
        booking_id: booking.id, customer_id: profile.id, technician_id: booking.technician_id,
        rating, review_text: sanitizeInput(reviewText),
      }).select().single()
      if (error) { toast('Failed to submit review', 'error'); setSubmitting(false); return }
      if (booking.technician_id) await createNotification(booking.technician_id, 'New Review', `You received a ${rating}-star review for ${booking.service_name}.`)
      await createAuditLog(profile.id, 'review_created', 'review', data.id, `Created review for booking #${booking.booking_number}`)
      toast('Review submitted successfully', 'success')
    }
    setSubmitting(false)
    navigate('/customer/bookings')
  }

  if (loading) return <LoadingScreen message="Loading..." />
  if (!booking) return (
    <div className="flex flex-col items-center gap-4 py-12">
      <p className="text-gray-500">Booking not found.</p>
      <Link to="/customer/bookings"><Button variant="outline">Back to Bookings</Button></Link>
    </div>
  )
  if (booking.status !== 'completed') return (
    <div className="flex flex-col items-center gap-4 py-12">
      <p className="text-gray-500">You can only review completed bookings.</p>
      <Link to="/customer/bookings"><Button variant="outline">Back to Bookings</Button></Link>
    </div>
  )

  return (
    <div className="space-y-6">
      <Link to="/customer/bookings" className="inline-flex items-center text-sm text-blue-600 hover:underline">
        <ArrowLeft className="mr-1 h-4 w-4" />Back to Bookings
      </Link>

      <h1 className="text-2xl font-bold text-gray-900">{existing ? 'Edit Your Review' : 'Leave a Review'}</h1>
      <p className="text-gray-600">Service: <span className="font-medium">{booking.service_name}</span> · Booking #{booking.booking_number}</p>

      <Card className="max-w-lg">
        <CardHeader><CardTitle>Rate Your Experience</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setRating(star)} onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)} className="p-1">
                    <Star className={cn('h-8 w-8 transition-colors', (hover || rating) >= star ? 'fill-amber-400 text-amber-400' : 'text-gray-300')} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Your Review</Label>
              <Textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} rows={5} placeholder="Share your experience..." required />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Submitting...' : existing ? 'Update Review' : 'Submit Review'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
