import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Calendar, ArrowRight, Newspaper } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingScreen } from '@/components/LoadingScreen'
import { supabase } from '@/lib/supabase'
import type { BlogPost } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'

export function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
      setPosts((data || []) as BlogPost[])
      setLoading(false)
    })()
  }, [])

  if (loading) return <LoadingScreen message="Loading blog posts..." />

  const filtered = posts.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-10 text-center">
          <h1 className="mb-3 text-4xl font-bold text-gray-900">VATTAMS Blog</h1>
          <p className="mx-auto max-w-2xl text-gray-600">
            Tips, guides, and insights on home maintenance, appliance care, and more.
          </p>
        </div>

        <div className="mx-auto mb-8 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Newspaper className="mx-auto mb-4 h-16 w-16 text-gray-300" />
            <h2 className="mb-2 text-xl font-semibold text-gray-700">
              {search ? 'No articles found' : 'No articles yet'}
            </h2>
            <p className="text-gray-500">
              {search ? `No articles matching "${search}".` : 'Check back soon for helpful tips and guides!'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((post) => (
              <Card key={post.id} className="flex flex-col overflow-hidden transition-shadow hover:shadow-md">
                {post.featured_image && (
                  <img src={post.featured_image} alt={post.title} className="h-48 w-full object-cover" />
                )}
                <CardContent className="flex flex-1 flex-col pt-5">
                  <div className="mb-2 flex items-center gap-2">
                    {post.category_id && <Badge color="bg-blue-50 text-blue-700">Article</Badge>}
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {post.published_at ? formatDate(post.published_at) : formatDate(post.created_at)}
                    </span>
                  </div>
                  <h3 className="mb-2 font-bold text-gray-900">{post.title}</h3>
                  <p className="mb-4 flex-1 text-sm text-gray-600 line-clamp-3">{post.excerpt}</p>
                  {post.author && <p className="mb-3 text-xs text-gray-500">By {post.author}</p>}
                  <Link to="/blog" className="mt-auto">
                    <Button variant="outline" className="w-full">
                      Read More <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
