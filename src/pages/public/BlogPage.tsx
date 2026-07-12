import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader as Loader2, ArrowRight, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type BlogPost = {
  id: string
  title: string
  excerpt: string | null
  content: string | null
  created_at: string
  image_url: string | null
}

export function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setPosts(data as BlogPost[])
        setLoading(false)
      })
  }, [])

  return (
    <div>
      <section className="bg-gradient-to-br from-blue-700 to-blue-800 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h1 className="text-4xl font-bold">Blog</h1>
          <p className="mt-2 text-blue-100">Tips, guides and stories from the world of home services</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : posts.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-gray-500">No blog posts yet. Check back soon for helpful tips and guides!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Card key={post.id} className="flex flex-col transition-shadow hover:shadow-md">
                <CardContent className="flex flex-1 flex-col p-6">
                  {post.image_url && (
                    <div className="mb-4 h-40 overflow-hidden rounded-lg bg-gray-100">
                      <img src={post.image_url} alt={post.title} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className="mb-2 flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    {new Date(post.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{post.title}</h3>
                  {post.excerpt && <p className="mt-2 flex-1 text-sm text-gray-600">{post.excerpt}</p>}
                  <Button asChild variant="link" className="mt-4 justify-start p-0">
                    <Link to={`/blog/${post.id}`}>Read More <ArrowRight className="ml-1 h-3 w-3" /></Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
