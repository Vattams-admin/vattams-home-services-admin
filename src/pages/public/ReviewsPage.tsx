import { useEffect, useState } from 'react'
import { Star, ExternalLink, MessageSquare } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingScreen } from '@/components/LoadingScreen'
import { supabase } from '@/lib/supabase'
import type { CustomerReview } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={i < rating ? 'h-4 w-4 fill-yellow-400 text-yellow-400' : 'h-4 w-4 text-gray-300'} />
      ))}
    </div>
  )
}

export function ReviewsPage() {
  const [reviews, setReviews] = useState<CustomerReview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase
        .from('customer_reviews')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
      setReviews((data || []) as CustomerReview[])
      setLoading(false)
    })()
  }, [])

  if (loading) return <LoadingScreen message="Loading reviews..." />

  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0
  const featured = reviews.filter((r) => r.is_featured)
  const regular = reviews.filter((r) => !r.is_featured)

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }))
  const maxCount = Math.max(...distribution.map((d) => d.count), 1)

  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-10 text-center">
          <h1 className="mb-3 text-4xl font-bold text-gray-900">Customer Reviews</h1>
          <p className="mx-auto max-w-2xl text-gray-600">
            See what our customers have to say about VATTAMS Home Services.
          </p>
        </div>

        <div className="mb-10 grid gap-6 md:grid-cols-3">
          <Card className="text-center">
            <CardContent className="pt-6">
              <p className="text-5xl font-bold text-blue-600">{avgRating.toFixed(1)}</p>
              <div className="mt-2 flex justify-center"><StarRating rating={Math.round(avgRating)} /></div>
              <p className="mt-2 text-sm text-gray-500">Based on {reviews.length} reviews</p>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardContent className="pt-6">
              <h3 className="mb-4 font-semibold text-gray-900">Rating Distribution</h3>
              <div className="space-y-2">
                {distribution.map((d) => (
                  <div key={d.star} className="flex items-center gap-3">
                    <span className="flex w-12 items-center gap-1 text-sm text-gray-600">
                      {d.star} <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    </span>
                    <div className="h-4 flex-1 overflow-hidden rounded bg-gray-100">
                      <div
                        className="h-full rounded bg-yellow-400"
                        style={{ width: `${(d.count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-sm text-gray-500">{d.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 text-center">
          <a href="https://www.google.com/search?q=VATTAMS+Home+Services#reviews" target="_blank" rel="noreferrer">
            <Button variant="outline">
              <Star className="mr-2 h-4 w-4" /> Leave a Google Review <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </a>
        </div>

        {featured.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">⭐ Featured Reviews</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((r) => (
                <Card key={r.id} className="border-blue-200 bg-blue-50/30">
                  <CardContent className="pt-5">
                    <StarRating rating={r.rating} />
                    <p className="mt-3 text-sm text-gray-600">"{r.review_text}"</p>
                    <div className="mt-3 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{r.customer_name}</p>
                        {r.service_name && <p className="text-xs text-gray-500">{r.service_name}</p>}
                      </div>
                      <span className="text-xs text-gray-400">{formatDate(r.created_at)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="mb-4 text-2xl font-bold text-gray-900">All Reviews</h2>
          {regular.length === 0 && featured.length === 0 ? (
            <div className="py-12 text-center">
              <MessageSquare className="mx-auto mb-3 h-12 w-12 text-gray-300" />
              <p className="text-lg text-gray-500">No reviews yet. Be the first to review us!</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {regular.map((r) => (
                <Card key={r.id}>
                  <CardContent className="pt-5">
                    <StarRating rating={r.rating} />
                    <p className="mt-3 text-sm text-gray-600">"{r.review_text}"</p>
                    <div className="mt-3 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{r.customer_name}</p>
                        {r.service_name && <p className="text-xs text-gray-500">{r.service_name}</p>}
                      </div>
                      <span className="text-xs text-gray-400">{formatDate(r.created_at)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
