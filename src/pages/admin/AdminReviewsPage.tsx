import { useEffect, useState, useCallback } from 'react'
import {
  Star,
  Loader2,
  Search,
  CheckCircle2,
  XCircle,
  Sparkles,
  Eye,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/ui/modal'
import { useAuth } from '@/lib/auth'
import { supabase, type CustomerReview } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import { createAuditLog } from '@/lib/notifications'
import { useToast } from '@/hooks/use-toast'

const SOURCE_COLORS: Record<string, string> = {
  website: 'blue',
  google: 'green',
  facebook: 'indigo',
  whatsapp: 'green',
  manual: 'gray',
}

export default function AdminReviewsPage() {
  const { profile } = useAuth()
  const toast = useToast()

  const [reviews, setReviews] = useState<CustomerReview[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [ratingFilter, setRatingFilter] = useState('all')

  const [viewReview, setViewReview] = useState<CustomerReview | null>(null)

  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    featured: 0,
    avgRating: 0,
  })

  const loadReviews = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('customer_reviews')
        .select('*')
        .order('created_at', { ascending: false })

      if (statusFilter === 'approved') {
        query = query.eq('is_approved', true)
      } else if (statusFilter === 'pending') {
        query = query.eq('is_approved', false)
      } else if (statusFilter === 'featured') {
        query = query.eq('is_featured', true)
      }

      if (ratingFilter !== 'all') {
        query = query.eq('rating', parseInt(ratingFilter))
      }

      const { data, error } = await query
      if (error) throw error

      let result = (data as CustomerReview[]) || []

      if (search.trim()) {
        const q = search.toLowerCase()
        result = result.filter(
          (r) =>
            r.customer_name?.toLowerCase().includes(q) ||
            r.review_text?.toLowerCase().includes(q) ||
            r.service_name?.toLowerCase().includes(q),
        )
      }

      setReviews(result)

      // Calculate stats from all reviews
      const { data: allData } = await supabase
        .from('customer_reviews')
        .select('rating, is_approved, is_featured')

      const allReviews = (allData as CustomerReview[]) || []
      const totalRating = allReviews.reduce(
        (sum, r) => sum + (r.rating || 0),
        0,
      )
      setStats({
        total: allReviews.length,
        approved: allReviews.filter((r) => r.is_approved).length,
        pending: allReviews.filter((r) => !r.is_approved).length,
        featured: allReviews.filter((r) => r.is_featured).length,
        avgRating:
          allReviews.length > 0
            ? Math.round((totalRating / allReviews.length) * 10) / 10
            : 0,
      })
    } catch {
      toast.error('Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, ratingFilter, search, toast])

  useEffect(() => {
    loadReviews()
  }, [loadReviews])

  async function approveReview(review: CustomerReview) {
    try {
      const { error } = await supabase
        .from('customer_reviews')
        .update({ is_approved: true })
        .eq('id', review.id)
      if (error) throw error

      await createAuditLog(
        profile?.id || '',
        'approve_review',
        'customer_review',
        review.id,
        `Approved review from ${review.customer_name}`,
      )
      toast.success('Review approved')
      await loadReviews()
    } catch {
      toast.error('Failed to approve review')
    }
  }

  async function rejectReview(review: CustomerReview) {
    try {
      const { error } = await supabase
        .from('customer_reviews')
        .update({ is_approved: false })
        .eq('id', review.id)
      if (error) throw error

      await createAuditLog(
        profile?.id || '',
        'reject_review',
        'customer_review',
        review.id,
        `Rejected review from ${review.customer_name}`,
      )
      toast.success('Review rejected')
      await loadReviews()
    } catch {
      toast.error('Failed to reject review')
    }
  }

  async function toggleFeature(review: CustomerReview) {
    try {
      const { error } = await supabase
        .from('customer_reviews')
        .update({ is_featured: !review.is_featured })
        .eq('id', review.id)
      if (error) throw error

      await createAuditLog(
        profile?.id || '',
        'toggle_feature_review',
        'customer_review',
        review.id,
        `${review.is_featured ? 'Unfeatured' : 'Featured'} review from ${review.customer_name}`,
      )
      toast.success(
        `Review ${review.is_featured ? 'unfeatured' : 'featured'}`,
      )
      await loadReviews()
    } catch {
      toast.error('Failed to update review feature status')
    }
  }

  function renderStars(rating: number) {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-amber-400 text-amber-400'
                : 'fill-slate-200 text-slate-200'
            }`}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Customer Reviews
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage and moderate customer reviews
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Star className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total</p>
              <p className="text-xl font-bold text-slate-900">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Approved</p>
              <p className="text-xl font-bold text-slate-900">
                {stats.approved}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
              <XCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Pending</p>
              <p className="text-xl font-bold text-slate-900">
                {stats.pending}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <Sparkles className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Featured</p>
              <p className="text-xl font-bold text-slate-900">
                {stats.featured}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
              <Star className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Avg Rating</p>
              <p className="text-xl font-bold text-slate-900">
                {stats.avgRating} / 5
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-end">
          <div className="flex-1 space-y-1.5">
            <Label>Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by name, text, or service..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-1.5 lg:w-44">
            <Label>Status</Label>
            <Select
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Reviews</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="featured">Featured</option>
            </Select>
          </div>
          <div className="space-y-1.5 lg:w-40">
            <Label>Rating</Label>
            <Select
              value={ratingFilter}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setRatingFilter(e.target.value)}
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Table */}
      {reviews.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Star className="h-12 w-12 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-500">
              No reviews found
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Rating
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Review
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Service
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Source
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Date
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reviews.map((review) => (
                    <tr key={review.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {review.customer_name}
                        </div>
                      </td>
                      <td className="px-4 py-3">{renderStars(review.rating)}</td>
                      <td className="px-4 py-3">
                        <div className="max-w-xs truncate text-slate-600">
                          {review.review_text}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {review.service_name || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          color={
                            (SOURCE_COLORS[review.source] as any) || 'gray'
                          }
                        >
                          {review.source || 'unknown'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <Badge
                            color={review.is_approved ? 'green' : 'amber'}
                          >
                            {review.is_approved ? 'Approved' : 'Pending'}
                          </Badge>
                          {review.is_featured && (
                            <Badge color="purple">Featured</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatDate(review.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewReview(review)}
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {!review.is_approved ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:bg-green-50"
                              onClick={() => approveReview(review)}
                              title="Approve"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-amber-600 hover:bg-amber-50"
                              onClick={() => rejectReview(review)}
                              title="Reject"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className={
                              review.is_featured
                                ? 'text-purple-600 hover:bg-purple-50'
                                : 'text-slate-400 hover:bg-slate-100'
                            }
                            onClick={() => toggleFeature(review)}
                            title={
                              review.is_featured
                                ? 'Unfeature'
                                : 'Feature'
                            }
                          >
                            <Sparkles className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Review Modal */}
      {viewReview && (
        <Modal
          title="Review Details"
          onClose={() => setViewReview(null)}
          className="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {viewReview.customer_name}
                </h3>
                <p className="text-sm text-slate-500">
                  {formatDate(viewReview.created_at)}
                </p>
              </div>
              {renderStars(viewReview.rating)}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-500">Service</p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {viewReview.service_name || 'N/A'}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-500">Source</p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  <Badge
                    color={
                      (SOURCE_COLORS[viewReview.source] as any) || 'gray'
                    }
                  >
                    {viewReview.source || 'unknown'}
                  </Badge>
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-500">Review</p>
              <p className="mt-2 text-sm text-slate-700">
                {viewReview.review_text}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                color={viewReview.is_approved ? 'green' : 'amber'}
              >
                {viewReview.is_approved ? 'Approved' : 'Pending'}
              </Badge>
              {viewReview.is_featured && (
                <Badge color="purple">Featured</Badge>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
              {!viewReview.is_approved ? (
                <Button
                  onClick={() => {
                    approveReview(viewReview)
                    setViewReview(null)
                  }}
                >
                  <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    rejectReview(viewReview)
                    setViewReview(null)
                  }}
                >
                  <XCircle className="mr-1 h-4 w-4" /> Reject
                </Button>
              )}
              <Button
                variant={viewReview.is_featured ? 'outline' : 'primary'}
                onClick={() => {
                  toggleFeature(viewReview)
                  setViewReview(null)
                }}
              >
                <Sparkles className="mr-1 h-4 w-4" />
                {viewReview.is_featured ? 'Unfeature' : 'Feature'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
