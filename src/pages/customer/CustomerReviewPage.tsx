import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Loader as Loader2, Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Booking } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function CustomerReviewPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const { profile } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!bookingId) return
    let mounted = true
    ;(async () => {
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .maybeSingle()
      if (mounted) { setBooking(data as Booking | null); setLoading(false) }
    })()
    return () => { mounted = false }
  }, [bookingId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!booking || !profile?.id) return
    if (rating === 0) {
      toast({ title: 'Please select a rating', variant: 'warning' })
      return
    }
    setSubmitting(true)
    try {
      const { error } = await supabase.from('reviews').insert({
        booking_id: booking.id,
        customer_id: profile.id,
        technician_id: booking.technician_id,
        rating,
        review_text: reviewText,
      })
      if (error) throw error
      toast({ title: 'Review submitted!', description: 'Thank you for your feedback.', variant: 'success' })
      navigate('/customer/bookings')
    } catch (err) {
      toast({ title: 'Failed to submit review', description: (err as Error).message, variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

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
        <Button className="mt-4" onClick={() => navigate('/customer/bookings')}>Back to Bookings</Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Review Your Service</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{booking.service_name}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    className="p-1"
                    aria-label={`Rate ${star} stars`}
                  >
                    <Star
                      className={cn(
                        'h-8 w-8 transition-colors',
                        (hover || rating) >= star
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-300',
                      )}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm text-gray-500">
                  {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="review">Review (optional)</Label>
              <Textarea
                id="review"
                rows={4}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your experience..."
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
