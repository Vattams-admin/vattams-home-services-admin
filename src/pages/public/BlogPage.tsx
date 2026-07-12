import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, ArrowRight, Loader as Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'

type BlogPost = {
  id: string; title: string; excerpt: string; content: string | null
  author: string | null; image_url: string | null; published_at: string
}

const placeholderPosts: BlogPost[] = [
  {
    id: '1', title: '5 Signs Your AC Needs Immediate Servicing',
    excerpt: 'Is your AC not cooling properly or making strange noises? Here are the top signs that indicate your air conditioner needs professional attention right away.',
    content: null, author: 'VATTAMS Team', image_url: null,
    published_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: '2', title: 'How to Maintain Your Washing Machine for Long Life',
    excerpt: 'Regular maintenance can extend the life of your washing machine and prevent costly repairs. Learn simple tips to keep your appliance running smoothly.',
    content: null, author: 'VATTAMS Team', image_url: null,
    published_at: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    id: '3', title: 'Common Electrical Issues Every Homeowner Should Know',
    excerpt: 'From flickering lights to tripping breakers, understanding common electrical problems can help you know when to call a professional.',
    content: null, author: 'VATTAMS Team', image_url: null,
    published_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: '4', title: 'Why Regular Plumbing Inspection Saves You Money',
    excerpt: 'Preventive plumbing maintenance helps catch small leaks before they become big problems. Discover why an annual inspection is worth it.',
    content: null, author: 'VATTAMS Team', image_url: null,
    published_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: '5', title: 'Choosing the Right CCTV System for Your Home',
    excerpt: 'A complete guide to selecting CCTV cameras for home security — covering camera types, resolution, storage, and installation considerations.',
    content: null, author: 'VATTAMS Team', image_url: null,
    published_at: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
  {
    id: '6', title: 'Pest Control: Prevention Tips for Every Season',
    excerpt: 'Different seasons bring different pests. Learn how to protect your home year-round with these seasonal pest prevention strategies.',
    content: null, author: 'VATTAMS Team', image_url: null,
    published_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
]

export function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('id, title, excerpt, content, author, image_url, published_at')
          .order('published_at', { ascending: false })
        if (!error && data && data.length > 0) {
          setPosts(data as BlogPost[])
        } else {
          setPosts(placeholderPosts)
        }
      } catch {
        setPosts(placeholderPosts)
      }
      setLoading(false)
    })()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">VATTAMS Blog</h1>
          <p className="mx-auto mt-3 max-w-2xl text-gray-600">
            Tips, guides, and insights on home maintenance, appliance care, and professional services.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Card key={post.id} className="flex flex-col transition-shadow hover:shadow-md">
              <CardContent className="flex flex-1 flex-col">
                {post.image_url ? (
                  <img src={post.image_url} alt={post.title} className="mb-4 h-40 w-full rounded-md object-cover" />
                ) : (
                  <div className="mb-4 flex h-40 w-full items-center justify-center rounded-md bg-gradient-to-br from-blue-100 to-blue-50">
                    <span className="text-3xl font-bold text-blue-300">V</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatDate(post.published_at)}</span>
                  {post.author && <><span>•</span><span>{post.author}</span></>}
                </div>
                <h3 className="mt-2 font-semibold text-gray-900">{post.title}</h3>
                <p className="mt-2 flex-1 text-sm text-gray-600">{post.excerpt}</p>
                <Link to="/register/customer" className="mt-4">
                  <Button variant="outline" className="w-full">
                    Read More <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
