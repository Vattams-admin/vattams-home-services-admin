import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Loader as Loader2, Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Booking, Review } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingScreen } from '@/components/LoadingScreen'
import { cn, formatDate, sanitizeInput } from '@/lib/utils'
import { createNotification, createAuditLog } from '@/lib/notifications'

export function CustomerReviewPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [existingReview, setExistingReview] = useState<Review | null>(null)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!bookingId) return
    let mounted = true;
    (async () => {
      const { data: bk } = await supabase.from('bookings').select('*').eq('id', bookingId).maybeSingle()
      if (!mounted) return
      setBooking(bk as Booking | null)
      if (bk) {
        const { data: rev } = await supabase.from('reviews').select('*').eq('booking_id', bookingId).maybeSingle()
        if (mounted && rev) { setExistingReview(rev as Review); setRating((rev as Review).rating); setReviewText((rev as Review).review_text || '') }
      }
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [bookingId])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!profile || !booking) return
    if (rating < 1 || rating > 5) { toast('Please select a rating', 'error'); return }
    if (!reviewText.trim()) { toast('Please write a review', 'error'); return }
    setSubmitting(true)
    if (existingReview) {
      const { error } = await supabase.from('reviews').update({ rating, review_text: sanitizeInput(reviewText) }).eq('id', existingReview.id)
      setSubmitting(false)
      if (error) { toast(error.message, 'error'); return }
      toast('Review updated successfully!', 'success')
    } else {
      const { data, error } = await supabase.from('reviews').insert({
        booking_id: booking.id, customer_id: profile.id, technician_id: booking.technician_id,
        rating, review_text: sanitizeInput(reviewText),
      }).select().single()
      setSubmitting(false)
      if (error) { toast(error.message, 'error'); return }
      setExistingReview(data as Review)
      toast('Review submitted successfully!', 'success')
      if (booking.technician_id) await createNotification(booking.technician_id, 'New Review', `You received a ${rating}-star review for ${booking.service_name}.`, 'review')
      await createAuditLog(profile.id, 'review_submitted', 'booking', booking.id, `Submitted ${rating}-star review for booking ${booking.booking_number}`)
    }
  }

  if (loading) return <LoadingScreen message="Loading..." />

  if (!booking) return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Review</h1>
      <Card><CardContent className="py-12 text-center"><p className="text-gray-500">Booking not found.</p><Link to="/customer/bookings" className="mt-4 inline-block text-blue-600 hover:text-blue-700">Back to Bookings</Link></CardContent></Card>
    </div>
  )

  if (booking.status !== 'completed') return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Review</h1>
      <Card><CardContent className="py-12 text-center"><p className="text-gray-500">You can only review completed bookings.</p><Link to="/customer/bookings" className="mt-4 inline-block text-blue-600 hover:text-blue-700">Back to Bookings</Link></CardContent></Card>
    </div>
  )

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{existingReview ? 'Edit Review' : 'Leave a Review'}</h1>
        <Link to="/customer/bookings"><Button variant="outline">Back</Button></Link>
      </div>

      <Card>
        <CardHeader><CardTitle>{booking.service_name}</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Booking #{booking.booking_number} • Completed on {formatDate(booking.scheduled_date)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div>
              <Label>Rating *</Label>
              <div className="mt-2 flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setRating(n)} onMouseEnter={() => setHoverRating(n)} onMouseLeave={() => setHoverRating(0)} className="focus:outline-none">
                    <Star className={cn('h-8 w-8 transition-colors', (hoverRating || rating) >= n ? 'fill-amber-400 text-amber-400' : 'text-gray-300')} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="review_text">Your Review *</Label>
              <Textarea id="review_text" required value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Share your experience with the service..." rows={4} />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>{submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : existingReview ? 'Update Review' : 'Submit Review'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
