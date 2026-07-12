import { useEffect, useState, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Star, ArrowLeft, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Booking, Review } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { LoadingScreen } from '@/components/LoadingScreen'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { createNotification, createAuditLog } from '@/lib/notifications'

export function CustomerReviewPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const { profile } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [existingReview, setExistingReview] = useState<Review | null>(null)
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!bookingId) return
    let mounted = true;
    (async () => {
      const { data: bk } = await supabase.from('bookings').select('*').eq('id', bookingId).maybeSingle()
      if (!mounted) return
      const b = bk as Booking | null
      setBooking(b)
      if (b) {
        const { data: rev } = await supabase.from('reviews').select('*').eq('booking_id', b.id).maybeSingle()
        if (mounted && rev) {
          const r = rev as Review
          setExistingReview(r)
          setRating(r.rating)
          setComment(r.review_text || '')
        }
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

  if (booking.status !== 'completed') return (
    <div className="py-12 text-center">
      <p className="text-gray-500">You can only review completed bookings.</p>
      <Button className="mt-4" onClick={() => navigate('/customer/bookings')}>Back to Bookings</Button>
    </div>
  )

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!profile || !booking) return
    if (rating === 0) { toast('Please select a rating', 'warning'); return }
    setSubmitting(true)
    const payload = {
      booking_id: booking.id,
      customer_id: profile.id,
      technician_id: booking.technician_id,
      rating,
      review_text: comment.trim() || null,
    }
    if (existingReview) {
      const { error } = await supabase.from('reviews').update({ rating, review_text: payload.review_text }).eq('id', existingReview.id)
      if (error) { toast(error.message, 'error'); setSubmitting(false); return }
      await createAuditLog(profile.id, 'review_updated', 'review', existingReview.id, `Updated review for booking ${booking.booking_number}`)
      toast('Review updated successfully!', 'success')
    } else {
      const { data, error } = await supabase.from('reviews').insert(payload).select().single()
      if (error) { toast(error.message, 'error'); setSubmitting(false); return }
      const r = data as Review
      if (booking.technician_id) {
        await createNotification(booking.technician_id, 'New Review', `You received a ${rating}-star review for booking ${booking.booking_number}.`, 'review')
      }
      await createAuditLog(profile.id, 'review_created', 'review', r.id, `Created review for booking ${booking.booking_number}`)
      toast('Review submitted successfully!', 'success')
    }
    setSubmitting(false)
    navigate('/customer/bookings')
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/customer/bookings')}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-2xl font-bold text-gray-900">{existingReview ? 'Edit Review' : 'Rate Your Service'}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{booking.service_name}</CardTitle>
          <p className="text-sm text-gray-500">Booking #{booking.booking_number}</p>
        </CardHeader>
        <CardContent>
          {existingReview && (
            <div className="mb-4 flex items-center gap-2 rounded-md bg-blue-50 p-3 text-sm text-blue-800">
              <CheckCircle className="h-4 w-4" /> You've already reviewed this booking. You can update it below.
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label>Rating</Label>
              <div className="mt-2 flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setRating(star)} onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)} className="focus:outline-none">
                    <Star className={cn('h-8 w-8 transition-colors', (hover || rating) >= star ? 'fill-amber-400 text-amber-400' : 'text-gray-300')} />
                  </button>
                ))}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {rating === 1 && 'Poor'} {rating === 2 && 'Fair'} {rating === 3 && 'Good'} {rating === 4 && 'Very Good'} {rating === 5 && 'Excellent'}
              </p>
            </div>

            <div>
              <Label htmlFor="comment">Comment (optional)</Label>
              <Textarea id="comment" rows={4} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience with the service..." />
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Submitting...' : existingReview ? 'Update Review' : 'Submit Review'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
