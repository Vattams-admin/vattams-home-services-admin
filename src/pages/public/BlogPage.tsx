import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, ArrowRight, Newspaper } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

type BlogPost = {
  id: string
  title: string
  excerpt: string
  content: string | null
  author: string | null
  published_at: string | null
  image_url: string | null
}

const placeholderPosts: BlogPost[] = [
  { id: '1', title: '5 Signs Your AC Needs Immediate Servicing', excerpt: 'From weak cooling to strange noises, here are the warning signs every homeowner should watch for.', content: null, author: 'VATTAMS Team', published_at: new Date(Date.now() - 3 * 86400000).toISOString(), image_url: null },
  { id: '2', title: 'How to Maintain Your Washing Machine Year-Round', excerpt: 'Simple maintenance tips that can extend the life of your washing machine and prevent costly repairs.', content: null, author: 'VATTAMS Team', published_at: new Date(Date.now() - 7 * 86400000).toISOString(), image_url: null },
  { id: '3', title: 'Plumbing Basics Every Homeowner Should Know', excerpt: 'A quick guide to common plumbing issues and when to call a professional.', content: null, author: 'VATTAMS Team', published_at: new Date(Date.now() - 14 * 86400000).toISOString(), image_url: null },
  { id: '4', title: 'Electrical Safety Tips for Tamil Nadu Homes', excerpt: 'Keep your family safe with these essential electrical safety practices.', content: null, author: 'VATTAMS Team', published_at: new Date(Date.now() - 21 * 86400000).toISOString(), image_url: null },
  { id: '5', title: 'Why Pest Control Matters Before Monsoon', excerpt: 'Prepare your home for the rainy season with proactive pest management.', content: null, author: 'VATTAMS Team', published_at: new Date(Date.now() - 30 * 86400000).toISOString(), image_url: null },
  { id: '6', title: 'Choosing the Right CCTV Setup for Your Home', excerpt: 'A breakdown of camera types, placement, and monitoring options for home security.', content: null, author: 'VATTAMS Team', published_at: new Date(Date.now() - 45 * 86400000).toISOString(), image_url: null },
]

export function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>(placeholderPosts)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.from('blog_posts').select('*').order('published_at', { ascending: false }).limit(12)
        if (!error && data && data.length > 0) setPosts(data as BlogPost[])
      } catch { /* fall back to placeholders */ }
      setLoading(false)
    })()
  }, [])

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">VATTAMS Blog</h1>
        <p className="mt-3 text-lg text-gray-600">
          Tips, guides, and insights for maintaining your home.
        </p>
      </div>

      {loading ? (
        <div className="mt-12 text-center text-gray-500">Loading posts...</div>
      ) : (
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Card key={post.id} className="flex flex-col transition-shadow hover:shadow-md">
              <CardContent className="flex flex-1 flex-col pt-6">
                <div className="mb-3 flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  {post.published_at ? formatDate(post.published_at) : 'Recent'}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{post.title}</h3>
                <p className="mt-2 flex-1 text-sm text-gray-600">{post.excerpt}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">{post.author || 'VATTAMS Team'}</span>
                  <Link to="/contact" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                    Read more <ArrowRight className="inline h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {posts.length === 0 && !loading && (
        <div className="mt-12 text-center">
          <Newspaper className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-600">No blog posts yet. Check back soon!</p>
        </div>
      )}

      <div className="mt-12 rounded-lg bg-blue-50 p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Need a Professional?</h2>
        <p className="mt-2 text-gray-600">Skip the DIY and book a verified technician today.</p>
        <Link to="/register/customer" className="mt-4 inline-block"><Button>Book Now</Button></Link>
      </div>
    </div>
  )
}
