import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  Clock,
  ArrowRight,
  Search,
  User,
  TrendingUp,
  BookOpen,
  AlertCircle,
  Phone,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { supabase, type BlogPost } from '@/lib/supabase'
import { LoadingScreen } from '@/components/LoadingScreen'
import { PRIMARY_PHONE, telLink } from '@/lib/constants'

const fallbackPosts: BlogPost[] = [
  {
    id: 'fallback-1',
    title: '5 Tips to Maintain Your AC During Summer in Tamil Nadu',
    title_ta: null,
    excerpt: 'Keep your air conditioner running efficiently during the hot Tamil Nadu summer with these essential maintenance tips from our expert technicians.',
    excerpt_ta: null,
    content: '',
    content_ta: null,
    image_url: null,
    author: 'VATTAMS Team',
    is_published: true,
    published_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    category_id: null,
    featured_image: null,
    meta_title: null,
    meta_description: null,
    canonical_url: null,
    is_featured: true,
    views_count: 1250,
    related_post_ids: [],
  },
  {
    id: 'fallback-2',
    title: 'How to Choose the Right Water Purifier for Your Home',
    title_ta: null,
    excerpt: 'A comprehensive guide to selecting the best water purifier for your household, considering water quality, capacity, and budget.',
    excerpt_ta: null,
    content: '',
    content_ta: null,
    image_url: null,
    author: 'VATTAMS Team',
    is_published: true,
    published_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    category_id: null,
    featured_image: null,
    meta_title: null,
    meta_description: null,
    canonical_url: null,
    is_featured: true,
    views_count: 890,
    related_post_ids: [],
  },
  {
    id: 'fallback-3',
    title: 'Common Plumbing Issues and How to Prevent Them',
    title_ta: null,
    excerpt: 'Learn about the most common plumbing problems in Indian homes and simple steps to prevent them before they become major repairs.',
    excerpt_ta: null,
    content: '',
    content_ta: null,
    image_url: null,
    author: 'VATTAMS Team',
    is_published: true,
    published_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    category_id: null,
    featured_image: null,
    meta_title: null,
    meta_description: null,
    canonical_url: null,
    is_featured: false,
    views_count: 670,
    related_post_ids: [],
  },
  {
    id: 'fallback-4',
    title: 'Electrical Safety Tips Every Homeowner Should Know',
    title_ta: null,
    excerpt: 'Essential electrical safety tips to protect your family and home from electrical hazards. Learn what to check and when to call a professional.',
    excerpt_ta: null,
    content: '',
    content_ta: null,
    image_url: null,
    author: 'VATTAMS Team',
    is_published: true,
    published_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    category_id: null,
    featured_image: null,
    meta_title: null,
    meta_description: null,
    canonical_url: null,
    is_featured: false,
    views_count: 1100,
    related_post_ids: [],
  },
  {
    id: 'fallback-5',
    title: 'Deep Cleaning vs. Regular Cleaning: What\'s the Difference?',
    title_ta: null,
    excerpt: 'Understanding the difference between deep cleaning and regular cleaning, and when you need each for your home.',
    excerpt_ta: null,
    content: '',
    content_ta: null,
    image_url: null,
    author: 'VATTAMS Team',
    is_published: true,
    published_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    category_id: null,
    featured_image: null,
    meta_title: null,
    meta_description: null,
    canonical_url: null,
    is_featured: false,
    views_count: 540,
    related_post_ids: [],
  },
  {
    id: 'fallback-6',
    title: 'Why Pest Control is Essential Before Monsoon',
    title_ta: null,
    excerpt: 'The monsoon season brings increased pest activity. Here\'s why you should schedule pest control before the rains arrive.',
    excerpt_ta: null,
    content: '',
    content_ta: null,
    image_url: null,
    author: 'VATTAMS Team',
    is_published: true,
    published_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    category_id: null,
    featured_image: null,
    meta_title: null,
    meta_description: null,
    canonical_url: null,
    is_featured: false,
    views_count: 430,
    related_post_ids: [],
  },
]

export default function BlogPage() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .order('is_featured', { ascending: false })
        .order('published_at', { ascending: false })

      if (error) throw error

      if (data && data.length > 0) {
        setPosts(data as BlogPost[])
      } else {
        setPosts(fallbackPosts)
      }
    } catch (err) {
      console.error('Error fetching blog posts:', err)
      setPosts(fallbackPosts)
    } finally {
      setLoading(false)
    }
  }

  const featuredPosts = posts.filter((p) => p.is_featured).slice(0, 2)
  const regularPosts = posts.filter((p) => !p.is_featured || posts.indexOf(p) >= 2)

  const filteredPosts = regularPosts.filter(
    (p) =>
      !searchQuery ||
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
              <BookOpen className="mr-1 h-3 w-3" /> VATTAMS Blog
            </Badge>
            <h1 className="text-4xl font-bold sm:text-5xl">Tips, Guides & Insights</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-blue-100">
              Expert advice on home maintenance, service tips, and guides to keep your home running smoothly.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="bg-slate-50 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <h2 className="text-2xl font-bold text-slate-900">Featured Posts</h2>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              {featuredPosts.map((post) => (
                <Card key={post.id} className="group cursor-pointer overflow-hidden transition hover:shadow-lg">
                  <div
                    className="h-48 bg-gradient-to-br from-blue-400 to-indigo-500"
                    style={
                      post.image_url || post.featured_image
                        ? {
                            backgroundImage: `url(${post.image_url || post.featured_image})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }
                        : undefined
                    }
                  >
                    {!post.image_url && !post.featured_image && (
                      <div className="flex h-full items-center justify-center">
                        <BookOpen className="h-12 w-12 text-white/50" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-6">
                    <div className="mb-3 flex items-center gap-3">
                      <Badge color="amber">
                        <TrendingUp className="mr-1 h-3 w-3" /> Featured
                      </Badge>
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-slate-900 group-hover:text-blue-600">
                      {post.title}
                    </h3>
                    <p className="mb-4 text-sm text-slate-600 line-clamp-2">{post.excerpt}</p>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" /> {post.author || 'VATTAMS Team'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {formatDate(post.published_at || post.created_at)}
                        </span>
                      </div>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> 5 min read
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Search */}
      <section className="bg-slate-50 pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setSearchQuery(e.target.value)}
              className="pl-12"
            />
          </div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="bg-slate-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {filteredPosts.length === 0 ? (
            <div className="py-16 text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-slate-300" />
              <p className="text-lg text-slate-500">No articles found. Try a different search.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPosts.map((post) => (
                <Card key={post.id} className="group cursor-pointer overflow-hidden transition hover:shadow-lg">
                  <div
                    className="h-40 bg-gradient-to-br from-slate-300 to-slate-400"
                    style={
                      post.image_url || post.featured_image
                        ? {
                            backgroundImage: `url(${post.image_url || post.featured_image})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }
                        : undefined
                    }
                  >
                    {!post.image_url && !post.featured_image && (
                      <div className="flex h-full items-center justify-center">
                        <BookOpen className="h-10 w-10 text-white/50" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-5">
                    <h3 className="mb-2 text-lg font-bold text-slate-900 group-hover:text-blue-600 line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="mb-4 text-sm text-slate-600 line-clamp-3">{post.excerpt}</p>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {formatDate(post.published_at || post.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" /> {post.author || 'VATTAMS Team'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Card className="overflow-hidden border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-8 text-center">
              <BookOpen className="mx-auto mb-4 h-10 w-10 text-blue-600" />
              <h2 className="text-2xl font-bold text-slate-900">Stay Updated</h2>
              <p className="mx-auto mt-2 max-w-xl text-slate-600">
                Get the latest home maintenance tips and service updates delivered to your inbox.
              </p>
              <div className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row">
                <Input type="email" placeholder="Enter your email" className="flex-1" />
                <Button>
                  Subscribe <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold sm:text-4xl">Need Professional Help?</h2>
          <p className="mt-4 text-lg text-blue-100">
            Our verified technicians are ready to help with all your home service needs.
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
            <a href={telLink(PRIMARY_PHONE)}>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10"
              >
                <Phone className="mr-2 h-5 w-5" /> Call Us
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
