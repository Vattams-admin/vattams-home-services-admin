import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Star, Loader as Loader2, Send, CircleCheck as CheckCircle2, Wrench } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth'
import { supabase, type Booking } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { cn, formatDate } from '@/lib/utils'

export default function CustomerReviewPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const { profile, session } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [existingReview, setExistingReview] = useState(false)

  const userId = profile?.id || session?.user?.id

  useEffect(() => {
    if (!bookingId || !userId) return
    let cancelled = false
    async function load() {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', bookingId)
          .eq('customer_id', userId)
          .maybeSingle()
        if (cancelled) return
        if (error) throw error
        setBooking((data as Booking) || null)

        // Check if review already exists
        if (data) {
          const { data: reviewData } = await supabase
            .from('reviews')
            .select('id')
            .eq('booking_id', bookingId)
            .eq('customer_id', userId)
            .maybeSingle()
          if (reviewData) setExistingReview(true)
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
  }, [bookingId, userId])

  const handleSubmit = async () => {
    if (!bookingId || !userId || !booking) return
    if (rating === 0) {
      toast.warning('Rating required', 'Please select a star rating.')
      return
    }
    if (!reviewText.trim()) {
      toast.warning('Review required', 'Please write a review.')
      return
    }
    if (existingReview) {
      toast.warning('Already reviewed', 'You have already reviewed this booking.')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.from('reviews').insert({
        booking_id: bookingId,
        customer_id: userId,
        technician_id: booking.technician_id,
        rating,
        review_text: reviewText.trim(),
      })

      if (error) throw error

      toast.success('Review submitted!', 'Thank you for your feedback.')
      navigate('/dashboard/bookings')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit review.'
      toast.error('Submission failed', message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Review Your Booking</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Wrench className="h-12 w-12 text-slate-300" />
            <p className="mt-3 text-lg font-medium text-slate-700">Booking not found</p>
            <p className="mt-1 text-sm text-slate-500">This booking may not exist or doesn't belong to you.</p>
            <Button onClick={() => navigate('/dashboard/bookings')} className="mt-4">
              Back to Bookings
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (booking.status !== 'completed') {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Review Your Booking</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle2 className="h-12 w-12 text-slate-300" />
            <p className="mt-3 text-lg font-medium text-slate-700">Booking not completed yet</p>
            <p className="mt-1 text-sm text-slate-500">
              You can leave a review once the service is completed.
            </p>
            <Button onClick={() => navigate('/dashboard/bookings')} className="mt-4">
              Back to Bookings
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (existingReview) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Review Your Booking</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="mt-3 text-lg font-medium text-slate-700">Review Already Submitted</p>
            <p className="mt-1 text-sm text-slate-500">You have already reviewed this booking.</p>
            <Button onClick={() => navigate('/dashboard/bookings')} className="mt-4">
              Back to Bookings
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Review Your Booking</h1>
        <p className="mt-1 text-sm text-slate-500">Share your experience to help others.</p>
      </div>

      {/* Booking Info */}
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
            <Wrench className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">{booking.service_name}</p>
            <p className="text-xs text-slate-500">#{booking.booking_number}</p>
            <p className="text-xs text-slate-500">{formatDate(booking.scheduled_date)}</p>
          </div>
          <Badge className="ml-auto bg-green-100 text-green-700">Completed</Badge>
        </CardContent>
      </Card>

      {/* Review Form */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Your Experience</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Star Rating */}
          <div className="space-y-2">
            <Label>Rating *</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="rounded p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      'h-8 w-8 transition-colors',
                      (hoverRating || rating) >= star
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300',
                    )}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-slate-500">
                {rating > 0 ? `${rating} star${rating > 1 ? 's' : ''}` : 'Select rating'}
              </span>
            </div>
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <Label htmlFor="review">Your Review *</Label>
            <Textarea
              id="review"
              value={reviewText}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setReviewText(e.target.value)}
              placeholder="Tell us about your experience with the service and technician..."
              rows={5}
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => navigate('/dashboard/bookings')}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-1 h-4 w-4" /> Submit Review
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
