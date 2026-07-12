import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, ArrowRight, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingScreen } from '@/components/LoadingScreen'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'

type BlogPost = {
  id: string
  title: string
  excerpt: string
  content: string | null
  author: string | null
  published_at: string
  image_url: string | null
}

const placeholderPosts: BlogPost[] = [
  { id: '1', title: '5 Tips to Maintain Your AC During Summer', excerpt: 'Keep your air conditioner running efficiently with these simple maintenance tips from our expert technicians.', content: null, author: 'VATTAMS Team', published_at: '2024-03-15', image_url: null },
  { id: '2', title: 'Common Washing Machine Problems and Solutions', excerpt: 'From drainage issues to spin cycle problems, learn how to identify and fix common washing machine faults.', content: null, author: 'VATTAMS Team', published_at: '2024-03-10', image_url: null },
  { id: '3', title: 'How to Choose the Right Water Purifier for Your Home', excerpt: 'A comprehensive guide to selecting the best water purifier based on water quality and household needs.', content: null, author: 'VATTAMS Team', published_at: '2024-03-05', image_url: null },
  { id: '4', title: 'Electrical Safety Tips Every Homeowner Should Know', excerpt: 'Protect your family and home with these essential electrical safety guidelines from our certified electricians.', content: null, author: 'VATTAMS Team', published_at: '2024-02-28', image_url: null },
  { id: '5', title: 'Why Regular Plumbing Maintenance Saves You Money', excerpt: 'Discover how preventive plumbing maintenance can prevent costly repairs and extend the life of your fixtures.', content: null, author: 'VATTAMS Team', published_at: '2024-02-20', image_url: null },
  { id: '6', title: 'Signs Your Refrigerator Needs Professional Repair', excerpt: 'Unusual noises, cooling issues, or leaks? Here are the signs that indicate your fridge needs expert attention.', content: null, author: 'VATTAMS Team', published_at: '2024-02-15', image_url: null },
]

export function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('id, title, excerpt, content, author, published_at, image_url')
          .order('published_at', { ascending: false })
        if (!error && data && data.length > 0) {
          setPosts(data as BlogPost[])
        } else {
          setPosts(placeholderPosts)
        }
      } catch {
        setPosts(placeholderPosts)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return <LoadingScreen message="Loading blog posts..." />

  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">VATTAMS Blog</h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-gray-600">
            Tips, guides, and insights on home maintenance from our expert technicians.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Card key={post.id} className="flex flex-col overflow-hidden transition-shadow hover:shadow-md">
              <div className="h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                {post.image_url ? (
                  <img src={post.image_url} alt={post.title} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-4xl">📝</span>
                )}
              </div>
              <CardContent className="flex flex-1 flex-col p-6">
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(post.published_at)}
                  </span>
                  {post.author && (
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {post.author}
                    </span>
                  )}
                </div>
                <h3 className="mt-3 text-lg font-semibold text-gray-900">{post.title}</h3>
                <p className="mt-2 flex-1 text-sm text-gray-600">{post.excerpt}</p>
                <Link to="/register/customer" className="mt-4">
                  <Button variant="outline" size="sm">
                    Read More <ArrowRight className="ml-2 h-4 w-4" />
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
