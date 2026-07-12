import { useEffect, useState } from 'react'
import { Plus, Trash2, Pencil, FileText, FolderTree, Tag, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { BlogPost, BlogCategory, BlogTag } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { createAuditLog } from '@/lib/notifications'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Textarea, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { LoadingScreen } from '@/components/LoadingScreen'
import { formatDate } from '@/lib/utils'
import type { FormEvent } from 'react'

type Tab = 'posts' | 'categories' | 'tags'

interface PostForm {
  title: string; title_ta: string; excerpt: string; content: string; image_url: string
  author: string; category_id: string; is_published: boolean; is_featured: boolean
  meta_title: string; meta_description: string; canonical_url: string
}
const emptyPost: PostForm = {
  title: '', title_ta: '', excerpt: '', content: '', image_url: '', author: '',
  category_id: '', is_published: false, is_featured: false, meta_title: '', meta_description: '', canonical_url: '',
}
interface CategoryForm { name: string; description: string }
interface TagForm { name: string }

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

export function AdminBlogCmsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('posts')
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [tags, setTags] = useState<BlogTag[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [postForm, setPostForm] = useState<PostForm>(emptyPost)
  const [catForm, setCatForm] = useState<CategoryForm>({ name: '', description: '' })
  const [tagForm, setTagForm] = useState<TagForm>({ name: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [p, c, t] = await Promise.all([
        supabase.from('blog_posts').select('*').order('created_at', { ascending: false }),
        supabase.from('blog_categories').select('*').order('created_at', { ascending: false }),
        supabase.from('blog_tags').select('*').order('created_at', { ascending: false }),
      ])
      if (mounted) {
        setPosts((p.data as BlogPost[]) || [])
        setCategories((c.data as BlogCategory[]) || [])
        setTags((t.data as BlogTag[]) || [])
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const savePost = async (e: FormEvent) => {
    e.preventDefault()
    if (!postForm.title || !postForm.content) return
    setSaving(true)
    const payload = {
      title: postForm.title, title_ta: postForm.title_ta || null, excerpt: postForm.excerpt, content: postForm.content,
      image_url: postForm.image_url || null, author: postForm.author || null, category_id: postForm.category_id || null,
      is_published: postForm.is_published, is_featured: postForm.is_featured, meta_title: postForm.meta_title || null,
      meta_description: postForm.meta_description || null, canonical_url: postForm.canonical_url || null,
      published_at: postForm.is_published ? new Date().toISOString() : null,
    }
    let error: unknown
    if (editingPost) {
      const r = await supabase.from('blog_posts').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editingPost.id)
      error = r.error
    } else {
      const r = await supabase.from('blog_posts').insert({ ...payload, views_count: 0, related_post_ids: [] })
      error = r.error
    }
    setSaving(false)
    if (error) { toast('Failed to save post', 'error'); return }
    if (profile) await createAuditLog(profile.id, editingPost ? 'blog_post_update' : 'blog_post_create', 'blog_post', editingPost?.id || null, `${editingPost ? 'Updated' : 'Created'} post: ${postForm.title}`)
    toast(editingPost ? 'Post updated successfully' : 'Post created successfully', 'success')
    setShowForm(false); setEditingPost(null); setPostForm(emptyPost)
    const { data } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false })
    setPosts((data as BlogPost[]) || [])
  }

  const editPost = (p: BlogPost) => {
    setEditingPost(p)
    setPostForm({
      title: p.title, title_ta: p.title_ta || '', excerpt: p.excerpt || '', content: p.content, image_url: p.image_url || '',
      author: p.author || '', category_id: p.category_id || '', is_published: p.is_published, is_featured: p.is_featured,
      meta_title: p.meta_title || '', meta_description: p.meta_description || '', canonical_url: p.canonical_url || '',
    })
    setShowForm(true)
  }

  const deletePost = async (p: BlogPost) => {
    const { error } = await supabase.from('blog_posts').delete().eq('id', p.id)
    if (error) { toast('Failed to delete post', 'error'); return }
    if (profile) await createAuditLog(profile.id, 'blog_post_delete', 'blog_post', p.id, `Deleted post: ${p.title}`)
    setPosts((prev) => prev.filter((x) => x.id !== p.id))
    toast('Post deleted', 'success')
  }

  const addCategory = async (e: FormEvent) => {
    e.preventDefault()
    if (!catForm.name) return
    setSaving(true)
    const { error } = await supabase.from('blog_categories').insert({ name: catForm.name, slug: slugify(catForm.name), description: catForm.description || null })
    setSaving(false)
    if (error) { toast('Failed to add category', 'error'); return }
    toast('Category added', 'success')
    setCatForm({ name: '', description: '' })
    const { data } = await supabase.from('blog_categories').select('*').order('created_at', { ascending: false })
    setCategories((data as BlogCategory[]) || [])
  }

  const deleteCategory = async (c: BlogCategory) => {
    const { error } = await supabase.from('blog_categories').delete().eq('id', c.id)
    if (error) { toast('Failed to delete category', 'error'); return }
    setCategories((prev) => prev.filter((x) => x.id !== c.id))
    toast('Category deleted', 'success')
  }

  const addTag = async (e: FormEvent) => {
    e.preventDefault()
    if (!tagForm.name) return
    setSaving(true)
    const { error } = await supabase.from('blog_tags').insert({ name: tagForm.name, slug: slugify(tagForm.name) })
    setSaving(false)
    if (error) { toast('Failed to add tag', 'error'); return }
    toast('Tag added', 'success')
    setTagForm({ name: '' })
    const { data } = await supabase.from('blog_tags').select('*').order('created_at', { ascending: false })
    setTags((data as BlogTag[]) || [])
  }

  const deleteTag = async (t: BlogTag) => {
    const { error } = await supabase.from('blog_tags').delete().eq('id', t.id)
    if (error) { toast('Failed to delete tag', 'error'); return }
    setTags((prev) => prev.filter((x) => x.id !== t.id))
    toast('Tag deleted', 'success')
  }

  if (loading) return <LoadingScreen message="Loading blog CMS..." />

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Blog CMS</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        <Button size="sm" variant={tab === 'posts' ? 'primary' : 'outline'} onClick={() => setTab('posts')}><FileText className="mr-1 h-4 w-4" /> Posts</Button>
        <Button size="sm" variant={tab === 'categories' ? 'primary' : 'outline'} onClick={() => setTab('categories')}><FolderTree className="mr-1 h-4 w-4" /> Categories</Button>
        <Button size="sm" variant={tab === 'tags' ? 'primary' : 'outline'} onClick={() => setTab('tags')}><Tag className="mr-1 h-4 w-4" /> Tags</Button>
        {tab === 'posts' && <Button size="sm" variant={showForm ? 'outline' : 'primary'} onClick={() => { setShowForm(!showForm); setEditingPost(null); setPostForm(emptyPost) }}><Plus className="mr-1 h-4 w-4" /> {showForm ? 'Cancel' : 'Add Post'}</Button>}
      </div>

      {tab === 'posts' && showForm && (
        <Modal open={showForm} onClose={() => { setShowForm(false); setEditingPost(null) }} title={editingPost ? 'Edit Post' : 'New Post'} className="max-w-2xl">
          <form onSubmit={savePost} className="space-y-3">
            <div><Label>Title</Label><Input value={postForm.title} onChange={(e) => setPostForm((p) => ({ ...p, title: e.target.value }))} required /></div>
            <div><Label>Title (Tamil)</Label><Input value={postForm.title_ta} onChange={(e) => setPostForm((p) => ({ ...p, title_ta: e.target.value }))} /></div>
            <div><Label>Excerpt</Label><Textarea rows={2} value={postForm.excerpt} onChange={(e) => setPostForm((p) => ({ ...p, excerpt: e.target.value }))} /></div>
            <div><Label>Content</Label><Textarea rows={5} value={postForm.content} onChange={(e) => setPostForm((p) => ({ ...p, content: e.target.value }))} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Image URL</Label><Input value={postForm.image_url} onChange={(e) => setPostForm((p) => ({ ...p, image_url: e.target.value }))} /></div>
              <div><Label>Author</Label><Input value={postForm.author} onChange={(e) => setPostForm((p) => ({ ...p, author: e.target.value }))} /></div>
            </div>
            <div><Label>Category</Label><Select value={postForm.category_id} onChange={(e) => setPostForm((p) => ({ ...p, category_id: e.target.value }))}><option value="">No category</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></div>
            <div><Label>Meta Title</Label><Input value={postForm.meta_title} onChange={(e) => setPostForm((p) => ({ ...p, meta_title: e.target.value }))} /></div>
            <div><Label>Meta Description</Label><Textarea rows={2} value={postForm.meta_description} onChange={(e) => setPostForm((p) => ({ ...p, meta_description: e.target.value }))} /></div>
            <div><Label>Canonical URL</Label><Input value={postForm.canonical_url} onChange={(e) => setPostForm((p) => ({ ...p, canonical_url: e.target.value }))} /></div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={postForm.is_published} onChange={(e) => setPostForm((p) => ({ ...p, is_published: e.target.checked }))} /> Published</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={postForm.is_featured} onChange={(e) => setPostForm((p) => ({ ...p, is_featured: e.target.checked }))} /> Featured</label>
            </div>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Post'}</Button>
          </form>
        </Modal>
      )}

      {tab === 'posts' && (
        <div className="space-y-3">
          {posts.map((p) => (
            <Card key={p.id}><CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2"><p className="font-medium text-gray-900">{p.title}</p>{p.is_published && <Badge color="bg-green-100 text-green-700">Published</Badge>}{p.is_featured && <Badge color="bg-amber-100 text-amber-700">Featured</Badge>}</div>
                <p className="text-sm text-gray-500">{p.excerpt?.slice(0, 80) || 'No excerpt'}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1"><Eye className="h-3 w-3" /> {p.views_count} views • {p.author || 'Unknown'} • {formatDate(p.created_at)}</p>
              </div>
              <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => editPost(p)}><Pencil className="h-3.5 w-3.5" /></Button><Button size="sm" variant="danger" onClick={() => deletePost(p)}><Trash2 className="h-3.5 w-3.5" /></Button></div>
            </CardContent></Card>
          ))}
          {posts.length === 0 && <p className="py-8 text-center text-gray-500">No posts found.</p>}
        </div>
      )}

      {tab === 'categories' && (
        <div className="space-y-4">
          <Card><CardContent className="p-4"><form onSubmit={addCategory} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1"><Label>Name</Label><Input value={catForm.name} onChange={(e) => setCatForm((p) => ({ ...p, name: e.target.value }))} placeholder="Category name" required /></div>
            <div className="flex-1"><Label>Description</Label><Input value={catForm.description} onChange={(e) => setCatForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description" /></div>
            <Button type="submit" disabled={saving}><Plus className="mr-1 h-4 w-4" /> Add</Button>
          </form></CardContent></Card>
          <div className="space-y-2">
            {categories.map((c) => (
              <Card key={c.id}><CardContent className="flex items-center justify-between p-3">
                <div><p className="font-medium text-gray-900">{c.name}</p><p className="text-xs text-gray-400">/{c.slug}</p>{c.description && <p className="text-sm text-gray-500">{c.description}</p>}</div>
                <Button size="sm" variant="danger" onClick={() => deleteCategory(c)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </CardContent></Card>
            ))}
            {categories.length === 0 && <p className="py-8 text-center text-gray-500">No categories found.</p>}
          </div>
        </div>
      )}

      {tab === 'tags' && (
        <div className="space-y-4">
          <Card><CardContent className="p-4"><form onSubmit={addTag} className="flex gap-3">
            <div className="flex-1"><Label>Name</Label><Input value={tagForm.name} onChange={(e) => setTagForm({ name: e.target.value })} placeholder="Tag name" required /></div>
            <Button type="submit" disabled={saving} className="mt-5"><Plus className="mr-1 h-4 w-4" /> Add</Button>
          </form></CardContent></Card>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <div key={t.id} className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5">
                <span className="text-sm font-medium text-gray-700">{t.name}</span>
                <button onClick={() => deleteTag(t)} className="text-gray-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
            {tags.length === 0 && <p className="py-8 text-center text-gray-500 w-full">No tags found.</p>}
          </div>
        </div>
      )}
    </div>
  )
}
