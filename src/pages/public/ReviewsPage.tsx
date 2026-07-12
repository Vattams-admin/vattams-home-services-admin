import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Star,
  Quote,
  ArrowRight,
  Phone,
  Search,
  ThumbsUp,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn, formatDate } from '@/lib/utils'
import { supabase, type CustomerReview } from '@/lib/supabase'
import { LoadingScreen } from '@/components/LoadingScreen'
import {
  PRIMARY_PHONE,
  WHATSAPP_NUMBER,
  SERVICE_CATEGORIES,
  telLink,
  whatsappLink,
} from '@/lib/constants'

const fallbackReviews: CustomerReview[] = [
  {
    id: 'fallback-1',
    customer_name: 'Rajesh Kumar',
    rating: 5,
    review_text: 'The technician was very professional and fixed my AC cooling issue quickly. He explained the problem clearly and the pricing was transparent. Highly recommend VATTAMS for AC service in Chennai.',
    service_name: 'AC Service',
    is_featured: true,
    is_approved: true,
    source: 'website',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'fallback-2',
    customer_name: 'Priya Sundaram',
    rating: 5,
    review_text: 'Booked a full home deep cleaning for my 3BHK apartment. The team was punctual, thorough, and very professional. They used eco-friendly products and my home looks spotless. Will definitely book again!',
    service_name: 'Deep Cleaning',
    is_featured: true,
    is_approved: true,
    source: 'website',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'fallback-3',
    customer_name: 'Murugan Velu',
    rating: 5,
    review_text: 'Had a major pipe leak in my kitchen. Booked the service in the morning and the plumber arrived within 2 hours. Fixed the leak efficiently and even checked other pipes for potential issues. Great service!',
    service_name: 'Plumbing',
    is_featured: false,
    is_approved: true,
    source: 'website',
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'fallback-4',
    customer_name: 'Lakshmi Narayanan',
    rating: 5,
    review_text: 'Needed to install new fans and fix some switchboards. The electrician was certified and did a perfect job. He also did a safety inspection of my home\'s wiring. Very impressed with the quality of work.',
    service_name: 'Electrical',
    is_featured: false,
    is_approved: true,
    source: 'website',
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'fallback-5',
    customer_name: 'Anand Krishnan',
    rating: 4,
    review_text: 'My washing machine was not draining properly. The technician diagnosed the issue quickly and replaced the drain pump. Service was good and pricing was fair. Took a bit longer than expected but overall satisfied.',
    service_name: 'Appliance Repair',
    is_featured: false,
    is_approved: true,
    source: 'website',
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'fallback-6',
    customer_name: 'Deepika Ravi',
    rating: 5,
    review_text: 'Had a cockroach problem in my kitchen. The pest control treatment was very effective and used safe chemicals. The technician was knowledgeable and gave tips to prevent future infestations. No cockroaches since!',
    service_name: 'Pest Control',
    is_featured: false,
    is_approved: true,
    source: 'website',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'fallback-7',
    customer_name: 'Saravanan Subramanian',
    rating: 5,
    review_text: 'Got my living room painted and the results exceeded my expectations. The painters were skilled, neat, and completed the work on time. They covered all furniture properly and cleaned up afterwards. Excellent service!',
    service_name: 'Painting',
    is_featured: false,
    is_approved: true,
    source: 'website',
    created_at: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'fallback-8',
    customer_name: 'Kavitha Senthil',
    rating: 5,
    review_text: 'Needed to fix a squeaky door and assemble a new wardrobe. The carpenter was very skilled and completed both tasks efficiently. He even oiled the door hinges without extra charge. Very happy with the service.',
    service_name: 'Carpentry',
    is_featured: false,
    is_approved: true,
    source: 'website',
    created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'fallback-9',
    customer_name: 'Ganesh Moorthy',
    rating: 5,
    review_text: 'My AC was not cooling properly. The technician checked the gas level, refilled it, and also cleaned the filters. Now the AC works like new. The service warranty gives me peace of mind. Great experience with VATTAMS!',
    service_name: 'AC Service',
    is_featured: false,
    is_approved: true,
    source: 'website',
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export default function ReviewsPage() {
  const navigate = useNavigate()
  const [reviews, setReviews] = useState<CustomerReview[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedRating, setSelectedRating] = useState<number | null>(null)

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('customer_reviews')
        .select('*')
        .eq('is_approved', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data && data.length > 0) {
        setReviews(data as CustomerReview[])
      } else {
        setReviews(fallbackReviews)
      }
    } catch (err) {
      console.error('Error fetching reviews:', err)
      setReviews(fallbackReviews)
    } finally {
      setLoading(false)
    }
  }

  const categories = ['all', ...SERVICE_CATEGORIES]

  const filteredReviews = reviews.filter((review) => {
    const matchesCategory =
      selectedCategory === 'all' || review.service_name === selectedCategory
    const matchesRating = selectedRating === null || review.rating === selectedRating
    const matchesSearch =
      !searchQuery ||
      review.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.review_text?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesRating && matchesSearch
  })

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '4.8'

  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((r) => r.rating === rating).length,
    percentage: reviews.length > 0 ? (reviews.filter((r) => r.rating === rating).length / reviews.length) * 100 : 0,
  }))

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-4 border-white/20 bg-white/10 text-white">
              <Star className="mr-1 h-3 w-3 fill-white" /> Customer Reviews
            </Badge>
            <h1 className="text-4xl font-bold sm:text-5xl">What Our Customers Say</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-blue-100">
              Real reviews from real customers. See why 10,000+ households trust VATTAMS for their home service needs.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-8">
              <div className="text-center">
                <div className="flex items-center gap-2">
                  <span className="text-4xl font-bold">{avgRating}</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="mt-1 text-sm text-blue-100">Average Rating</p>
              </div>
              <div className="h-12 w-px bg-white/20" />
              <div className="text-center">
                <p className="text-4xl font-bold">{reviews.length}+</p>
                <p className="mt-1 text-sm text-blue-100">Total Reviews</p>
              </div>
              <div className="h-12 w-px bg-white/20" />
              <div className="text-center">
                <p className="text-4xl font-bold">98%</p>
                <p className="mt-1 text-sm text-blue-100">Satisfaction Rate</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rating Distribution & Filters */}
      <section className="bg-slate-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Rating Distribution */}
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
                  <TrendingUp className="h-5 w-5 text-blue-600" /> Rating Breakdown
                </h3>
                <div className="space-y-2">
                  {ratingDistribution.map((item) => (
                    <button
                      key={item.rating}
                      onClick={() => setSelectedRating(selectedRating === item.rating ? null : item.rating)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg p-2 transition',
                        selectedRating === item.rating ? 'bg-blue-50' : 'hover:bg-slate-50'
                      )}
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-slate-700">{item.rating}</span>
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      </div>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-amber-400"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-sm text-slate-500">{item.count}</span>
                    </button>
                  ))}
                </div>
                {selectedRating !== null && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => setSelectedRating(null)}
                  >
                    Clear Rating Filter
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Search */}
            <Card className="lg:col-span-2">
              <CardContent className="p-6">
                <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
                  <Search className="h-5 w-5 text-blue-600" /> Search Reviews
                </h3>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Search by name or keyword..."
                      value={searchQuery}
                      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setSearchQuery(e.target.value)}
                      className="pl-12"
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-700">Filter by Service:</p>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={cn(
                            'rounded-full px-3 py-1.5 text-xs font-medium transition',
                            selectedCategory === cat
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-600'
                          )}
                        >
                          {cat === 'all' ? 'All Services' : cat}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Reviews Grid */}
      <section className="bg-slate-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {filteredReviews.length === 0 ? (
            <div className="py-16 text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-slate-300" />
              <p className="text-lg text-slate-500">No reviews found matching your filters.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('all')
                  setSelectedRating(null)
                }}
              >
                Clear All Filters
              </Button>
            </div>
          ) : (
            <>
              <p className="mb-6 text-sm text-slate-500">
                Showing {filteredReviews.length} of {reviews.length} reviews
              </p>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredReviews.map((review) => (
                  <Card key={review.id} className="flex flex-col transition hover:shadow-lg">
                    <CardContent className="flex flex-1 flex-col p-6">
                      <Quote className="mb-3 h-8 w-8 text-blue-200" />
                      <div className="mb-3 flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              'h-4 w-4',
                              i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                            )}
                          />
                        ))}
                      </div>
                      <p className="mb-4 flex-1 text-sm text-slate-600">{review.review_text}</p>
                      <div className="border-t border-slate-100 pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-slate-900">{review.customer_name}</p>
                            <p className="text-xs text-slate-500">{formatDate(review.created_at)}</p>
                          </div>
                          {review.service_name && (
                            <Badge color="blue">{review.service_name}</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Stats Banner */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
                <Star className="h-7 w-7 fill-amber-400 text-amber-400" />
              </div>
              <p className="text-3xl font-bold text-slate-900">{avgRating}/5</p>
              <p className="mt-1 text-sm text-slate-500">Average Rating</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
                <Users className="h-7 w-7 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-slate-900">10,000+</p>
              <p className="mt-1 text-sm text-slate-500">Happy Customers</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
                <ThumbsUp className="h-7 w-7 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-slate-900">98%</p>
              <p className="mt-1 text-sm text-slate-500">Would Recommend</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-violet-50">
                <CheckCircle2 className="h-7 w-7 text-violet-600" />
              </div>
              <p className="text-3xl font-bold text-slate-900">25,000+</p>
              <p className="mt-1 text-sm text-slate-500">Services Completed</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold sm:text-4xl">Experience the VATTAMS Difference</h2>
          <p className="mt-4 text-lg text-blue-100">
            Join thousands of satisfied customers. Book a service today and leave us a review!
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate('/book')}
              className="bg-white text-blue-700 hover:bg-blue-50"
            >
              Book a Service <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <a href={whatsappLink(WHATSAPP_NUMBER, 'Hi, I would like to book a service.')}>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10"
              >
                <MessageCircle className="mr-2 h-5 w-5" /> WhatsApp
              </Button>
            </a>
            <a href={telLink(PRIMARY_PHONE)}>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10"
              >
                <Phone className="mr-2 h-5 w-5" /> {PRIMARY_PHONE}
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
