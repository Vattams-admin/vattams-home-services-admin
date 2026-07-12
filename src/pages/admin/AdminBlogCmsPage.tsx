import { useEffect, useState, useCallback } from 'react'
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
  AlertCircle,
  Eye,
  Tag,
  Folder,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input, Textarea, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/ui/modal'
import { useAuth } from '@/lib/auth'
import {
  supabase,
  type BlogPost,
  type BlogCategory,
  type BlogTag,
} from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import { createAuditLog } from '@/lib/notifications'
import { useToast } from '@/hooks/use-toast'

type PostForm = {
  title: string
  excerpt: string
  content: string
  image_url: string
  category_id: string
  tags: string
  is_published: boolean
  is_featured: boolean
  meta_title: string
  meta_description: string
  author: string
}

const emptyPost: PostForm = {
  title: '',
  excerpt: '',
  content: '',
  image_url: '',
  category_id: '',
  tags: '',
  is_published: false,
  is_featured: false,
  meta_title: '',
  meta_description: '',
  author: '',
}

type CategoryForm = {
  name: string
  description: string
}

const emptyCategory: CategoryForm = { name: '', description: '' }

export default function AdminBlogCmsPage() {
  const { profile } = useAuth()
  const toast = useToast()

  const [activeTab, setActiveTab] = useState<'posts' | 'categories' | 'tags'>(
    'posts',
  )

  // Posts
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [tags, setTags] = useState<BlogTag[]>([])
  const [postSearch, setPostSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [postModal, setPostModal] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [postForm, setPostForm] = useState<PostForm>(emptyPost)
  const [savingPost, setSavingPost] = useState(false)
  const [deletePostId, setDeletePostId] = useState<string | null>(null)
  const [deletingPost, setDeletingPost] = useState(false)

  // Categories
  const [categoryModal, setCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] =
    useState<BlogCategory | null>(null)
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(emptyCategory)
  const [savingCategory, setSavingCategory] = useState(false)
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null)
  const [deletingCategory, setDeletingCategory] = useState(false)

  // Tags
  const [newTag, setNewTag] = useState('')
  const [addingTag, setAddingTag] = useState(false)
  const [deleteTagId, setDeleteTagId] = useState<string | null>(null)
  const [deletingTag, setDeletingTag] = useState(false)

  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [postsRes, catRes, tagRes] = await Promise.all([
        supabase
          .from('blog_posts')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('blog_categories')
          .select('*')
          .order('name', { ascending: true }),
        supabase
          .from('blog_tags')
          .select('*')
          .order('name', { ascending: true }),
      ])

      if (postsRes.error) throw postsRes.error
      if (catRes.error) throw catRes.error
      if (tagRes.error) throw tagRes.error

      setPosts((postsRes.data as BlogPost[]) || [])
      setCategories((catRes.data as BlogCategory[]) || [])
      setTags((tagRes.data as BlogTag[]) || [])
    } catch {
      toast.error('Failed to load blog data')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Post handlers
  function openAddPost() {
    setEditingPost(null)
    setPostForm(emptyPost)
    setPostModal(true)
  }

  function openEditPost(post: BlogPost) {
    setEditingPost(post)
    setPostForm({
      title: post.title || '',
      excerpt: post.excerpt || '',
      content: post.content || '',
      image_url: post.image_url || post.featured_image || '',
      category_id: post.category_id || '',
      tags: (post.related_post_ids || []).join(', '),
      is_published: post.is_published,
      is_featured: post.is_featured,
      meta_title: post.meta_title || '',
      meta_description: post.meta_description || '',
      author: post.author || '',
    })
    setPostModal(true)
  }

  async function savePost() {
    if (!postForm.title.trim()) {
      toast.warning('Post title is required')
      return
    }
    setSavingPost(true)
    try {
      const slug = postForm.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

      const payload = {
        title: postForm.title.trim(),
        excerpt: postForm.excerpt.trim(),
        content: postForm.content.trim(),
        image_url: postForm.image_url.trim() || null,
        featured_image: postForm.image_url.trim() || null,
        category_id: postForm.category_id || null,
        is_published: postForm.is_published,
        is_featured: postForm.is_featured,
        meta_title: postForm.meta_title.trim() || null,
        meta_description: postForm.meta_description.trim() || null,
        author: postForm.author.trim() || null,
        published_at: postForm.is_published
          ? new Date().toISOString()
          : null,
        updated_at: new Date().toISOString(),
      }

      if (editingPost) {
        const { error } = await supabase
          .from('blog_posts')
          .update(payload)
          .eq('id', editingPost.id)
        if (error) throw error
        await createAuditLog(
          profile?.id || '',
          'update_blog_post',
          'blog_post',
          editingPost.id,
          `Updated blog post: ${postForm.title}`,
        )
        toast.success('Post updated successfully')
      } else {
        const { error } = await supabase.from('blog_posts').insert({
          ...payload,
          related_post_ids: [],
          views_count: 0,
        })
        if (error) throw error
        await createAuditLog(
          profile?.id || '',
          'create_blog_post',
          'blog_post',
          null,
          `Created blog post: ${postForm.title}`,
        )
        toast.success('Post created successfully')
      }
      setPostModal(false)
      await loadData()
    } catch {
      toast.error('Failed to save post')
    } finally {
      setSavingPost(false)
    }
  }

  async function deletePost() {
    if (!deletePostId) return
    setDeletingPost(true)
    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', deletePostId)
      if (error) throw error
      await createAuditLog(
        profile?.id || '',
        'delete_blog_post',
        'blog_post',
        deletePostId,
        'Deleted blog post',
      )
      toast.success('Post deleted')
      setDeletePostId(null)
      await loadData()
    } catch {
      toast.error('Failed to delete post')
    } finally {
      setDeletingPost(false)
    }
  }

  async function togglePublish(post: BlogPost) {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({
          is_published: !post.is_published,
          published_at: !post.is_published
            ? new Date().toISOString()
            : post.published_at,
          updated_at: new Date().toISOString(),
        })
        .eq('id', post.id)
      if (error) throw error
      toast.success(`Post ${post.is_published ? 'unpublished' : 'published'}`)
      await loadData()
    } catch {
      toast.error('Failed to update post status')
    }
  }

  // Category handlers
  function openAddCategory() {
    setEditingCategory(null)
    setCategoryForm(emptyCategory)
    setCategoryModal(true)
  }

  function openEditCategory(cat: BlogCategory) {
    setEditingCategory(cat)
    setCategoryForm({
      name: cat.name || '',
      description: cat.description || '',
    })
    setCategoryModal(true)
  }

  async function saveCategory() {
    if (!categoryForm.name.trim()) {
      toast.warning('Category name is required')
      return
    }
    setSavingCategory(true)
    try {
      const slug = categoryForm.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      const payload = {
        name: categoryForm.name.trim(),
        slug,
        description: categoryForm.description.trim() || null,
      }

      if (editingCategory) {
        const { error } = await supabase
          .from('blog_categories')
          .update(payload)
          .eq('id', editingCategory.id)
        if (error) throw error
        toast.success('Category updated successfully')
      } else {
        const { error } = await supabase
          .from('blog_categories')
          .insert(payload)
        if (error) throw error
        toast.success('Category created successfully')
      }
      setCategoryModal(false)
      await loadData()
    } catch {
      toast.error('Failed to save category')
    } finally {
      setSavingCategory(false)
    }
  }

  async function deleteCategory() {
    if (!deleteCategoryId) return
    setDeletingCategory(true)
    try {
      const { error } = await supabase
        .from('blog_categories')
        .delete()
        .eq('id', deleteCategoryId)
      if (error) throw error
      toast.success('Category deleted')
      setDeleteCategoryId(null)
      await loadData()
    } catch {
      toast.error('Failed to delete category')
    } finally {
      setDeletingCategory(false)
    }
  }

  // Tag handlers
  async function addTag() {
    if (!newTag.trim()) return
    setAddingTag(true)
    try {
      const slug = newTag
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      const { error } = await supabase
        .from('blog_tags')
        .insert({ name: newTag.trim(), slug })
      if (error) throw error
      toast.success('Tag added')
      setNewTag('')
      await loadData()
    } catch {
      toast.error('Failed to add tag')
    } finally {
      setAddingTag(false)
    }
  }

  async function deleteTag() {
    if (!deleteTagId) return
    setDeletingTag(true)
    try {
      const { error } = await supabase
        .from('blog_tags')
        .delete()
        .eq('id', deleteTagId)
      if (error) throw error
      toast.success('Tag deleted')
      setDeleteTagId(null)
      await loadData()
    } catch {
      toast.error('Failed to delete tag')
    } finally {
      setDeletingTag(false)
    }
  }

  const filteredPosts = (() => {
    let result = posts
    if (statusFilter === 'published') {
      result = result.filter((p) => p.is_published)
    } else if (statusFilter === 'draft') {
      result = result.filter((p) => !p.is_published)
    }
    if (postSearch.trim()) {
      const q = postSearch.toLowerCase()
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.excerpt?.toLowerCase().includes(q),
      )
    }
    return result
  })()

  function getCategoryName(id: string | null): string {
    if (!id) return 'Uncategorized'
    const cat = categories.find((c) => c.id === id)
    return cat ? cat.name : 'Unknown'
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
        <h1 className="text-2xl font-bold text-slate-900">Blog CMS</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage blog posts, categories, and tags
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Posts</p>
              <p className="text-xl font-bold text-slate-900">{posts.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Published</p>
              <p className="text-xl font-bold text-slate-900">
                {posts.filter((p) => p.is_published).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <Folder className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Categories</p>
              <p className="text-xl font-bold text-slate-900">
                {categories.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
              <Tag className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Tags</p>
              <p className="text-xl font-bold text-slate-900">{tags.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'posts'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="h-4 w-4" /> Posts
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'categories'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Folder className="h-4 w-4" /> Categories
        </button>
        <button
          onClick={() => setActiveTab('tags')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'tags'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Tag className="h-4 w-4" /> Tags
        </button>
      </div>

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search posts..."
                  value={postSearch}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setPostSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="w-40">
                <Select
                  value={statusFilter}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </Select>
              </div>
            </div>
            <Button onClick={openAddPost}>
              <Plus className="mr-1 h-4 w-4" /> Add Post
            </Button>
          </div>

          {filteredPosts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="h-12 w-12 text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-500">
                  No blog posts found
                </p>
                <Button onClick={openAddPost} className="mt-3" size="sm">
                  <Plus className="mr-1 h-4 w-4" /> Add First Post
                </Button>
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
                          Title
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">
                          Category
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">
                          Author
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">
                          Views
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
                      {filteredPosts.map((post) => (
                        <tr key={post.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {post.image_url || post.featured_image ? (
                                <img
                                  src={post.image_url || post.featured_image || ''}
                                  alt={post.title}
                                  className="h-10 w-14 rounded object-cover"
                                />
                              ) : (
                                <div className="flex h-10 w-14 items-center justify-center rounded bg-slate-100">
                                  <FileText className="h-4 w-4 text-slate-400" />
                                </div>
                              )}
                              <div>
                                <div className="font-medium text-slate-900">
                                  {post.title}
                                </div>
                                {post.is_featured && (
                                  <Badge color="amber" className="mt-0.5">
                                    Featured
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {getCategoryName(post.category_id)}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {post.author || '-'}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            <div className="flex items-center gap-1">
                              <Eye className="h-3.5 w-3.5 text-slate-400" />
                              {post.views_count || 0}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => togglePublish(post)}>
                              <Badge
                                color={post.is_published ? 'green' : 'gray'}
                                className="cursor-pointer"
                              >
                                {post.is_published ? 'Published' : 'Draft'}
                              </Badge>
                            </button>
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {post.published_at
                              ? formatDate(post.published_at)
                              : formatDate(post.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditPost(post)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => setDeletePostId(post.id)}
                              >
                                <Trash2 className="h-4 w-4" />
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
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-end">
            <Button onClick={openAddCategory}>
              <Plus className="mr-1 h-4 w-4" /> Add Category
            </Button>
          </div>

          {categories.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Folder className="h-12 w-12 text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-500">
                  No categories found
                </p>
                <Button onClick={openAddCategory} className="mt-3" size="sm">
                  <Plus className="mr-1 h-4 w-4" /> Add First Category
                </Button>
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
                          Name
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">
                          Slug
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">
                          Description
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">
                          Posts
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-slate-700">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {categories.map((cat) => (
                        <tr key={cat.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {cat.name}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-500">
                            {cat.slug}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {cat.description || '-'}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {posts.filter((p) => p.category_id === cat.id).length}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditCategory(cat)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => setDeleteCategoryId(cat.id)}
                              >
                                <Trash2 className="h-4 w-4" />
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
        </div>
      )}

      {/* Tags Tab */}
      {activeTab === 'tags' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add New Tag</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter tag name..."
                  value={newTag}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addTag()
                  }}
                />
                <Button onClick={addTag} loading={addingTag}>
                  <Plus className="mr-1 h-4 w-4" /> Add
                </Button>
              </div>
            </CardContent>
          </Card>

          {tags.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Tag className="h-12 w-12 text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-500">
                  No tags found
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
                          Name
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">
                          Slug
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">
                          Created
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-slate-700">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tags.map((tag) => (
                        <tr key={tag.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <Badge color="blue">{tag.name}</Badge>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-500">
                            {tag.slug}
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {formatDate(tag.created_at)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => setDeleteTagId(tag.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Post Modal */}
      {postModal && (
        <Modal
          title={editingPost ? 'Edit Post' : 'Add Post'}
          onClose={() => setPostModal(false)}
          className="max-w-3xl"
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input
                placeholder="Post title..."
                value={postForm.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                  setPostForm({ ...postForm, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Excerpt</Label>
              <Textarea
                placeholder="Short summary..."
                value={postForm.excerpt}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                  setPostForm({ ...postForm, excerpt: e.target.value })
                }
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Content</Label>
              <Textarea
                placeholder="Write your blog post content..."
                value={postForm.content}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                  setPostForm({ ...postForm, content: e.target.value })
                }
                rows={10}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={postForm.category_id}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    setPostForm({ ...postForm, category_id: e.target.value })
                  }
                >
                  <option value="">Select category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Author</Label>
                <Input
                  placeholder="Author name"
                  value={postForm.author}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    setPostForm({ ...postForm, author: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Featured Image URL</Label>
              <Input
                placeholder="https://..."
                value={postForm.image_url}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                  setPostForm({ ...postForm, image_url: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Meta Title (SEO)</Label>
                <Input
                  placeholder="SEO title..."
                  value={postForm.meta_title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    setPostForm({ ...postForm, meta_title: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Meta Description (SEO)</Label>
                <Input
                  placeholder="SEO description..."
                  value={postForm.meta_description}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    setPostForm({
                      ...postForm,
                      meta_description: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="post_published"
                  checked={postForm.is_published}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    setPostForm({ ...postForm, is_published: (e.target as HTMLInputElement).checked })
                  }
                  className="h-4 w-4 rounded border-slate-300"
                />
                <Label htmlFor="post_published">Published</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="post_featured"
                  checked={postForm.is_featured}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    setPostForm({ ...postForm, is_featured: (e.target as HTMLInputElement).checked })
                  }
                  className="h-4 w-4 rounded border-slate-300"
                />
                <Label htmlFor="post_featured">Featured</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPostModal(false)}>
                Cancel
              </Button>
              <Button onClick={savePost} loading={savingPost}>
                {editingPost ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Category Modal */}
      {categoryModal && (
        <Modal
          title={editingCategory ? 'Edit Category' : 'Add Category'}
          onClose={() => setCategoryModal(false)}
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Category Name *</Label>
              <Input
                placeholder="e.g., AC Service Tips"
                value={categoryForm.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                  setCategoryForm({ ...categoryForm, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                placeholder="Category description..."
                value={categoryForm.description}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                  setCategoryForm({
                    ...categoryForm,
                    description: e.target.value,
                  })
                }
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCategoryModal(false)}>
                Cancel
              </Button>
              <Button onClick={saveCategory} loading={savingCategory}>
                {editingCategory ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Post Confirmation */}
      {deletePostId && (
        <Modal title="Delete Post" onClose={() => setDeletePostId(null)}>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-sm text-slate-600">
                Are you sure you want to delete this blog post? This action
                cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeletePostId(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={deletePost}
                loading={deletingPost}
              >
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Category Confirmation */}
      {deleteCategoryId && (
        <Modal
          title="Delete Category"
          onClose={() => setDeleteCategoryId(null)}
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-sm text-slate-600">
                Are you sure you want to delete this category? Posts in this
                category will become uncategorized.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteCategoryId(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={deleteCategory}
                loading={deletingCategory}
              >
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Tag Confirmation */}
      {deleteTagId && (
        <Modal title="Delete Tag" onClose={() => setDeleteTagId(null)}>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-sm text-slate-600">
                Are you sure you want to delete this tag?
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteTagId(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={deleteTag}
                loading={deletingTag}
              >
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
