import { useEffect, useState } from 'react'
import { Plus, Trash2, Star, Download, MessageSquare, CheckCircle, Award, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { CustomerReview } from '@/lib/supabase'
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
import { exportToCSV } from '@/lib/pdf'
import { formatDate } from '@/lib/utils'
import type { FormEvent } from 'react'

type FilterType = 'all' | 'pending' | 'approved' | 'featured'

interface ReviewFormState {
  customer_name: string
  rating: string
  review_text: string
  service_name: string
  source: string
}

const emptyForm: ReviewFormState = { customer_name: '', rating: '5', review_text: '', service_name: '', source: 'google' }

export function AdminReviewsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<CustomerReview[]>([])
  const [filter, setFilter] = useState<FilterType>('all')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<ReviewFormState>(emptyForm)

  const fetchReviews = async () => {
    const { data } = await supabase.from('customer_reviews').select('*').order('created_at', { ascending: false })
    setReviews((data as CustomerReview[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    let mounted = true;
    (async () => { if (mounted) { await fetchReviews() } })()
    return () => { mounted = false }
  }, [])

  const addReview = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.customer_name || !form.review_text) return
    setSaving(true)
    const { error } = await supabase.from('customer_reviews').insert({
      customer_name: form.customer_name, rating: parseInt(form.rating), review_text: form.review_text,
      service_name: form.service_name || null, source: form.source, is_featured: false, is_approved: false,
    })
    setSaving(false)
    if (error) { toast('Failed to add review', 'error'); return }
    if (profile) await createAuditLog(profile.id, 'review_add', 'customer_review', null, `Added review from ${form.customer_name}`)
    toast('Review added successfully', 'success')
    setShowForm(false)
    setForm(emptyForm)
    fetchReviews()
  }

  const toggleFeatured = async (r: CustomerReview) => {
    const { error } = await supabase.from('customer_reviews').update({ is_featured: !r.is_featured }).eq('id', r.id)
    if (error) { toast('Failed to update', 'error'); return }
    setReviews((prev) => prev.map((x) => x.id === r.id ? { ...x, is_featured: !r.is_featured } : x))
    toast('Review updated', 'success')
  }

  const toggleApproved = async (r: CustomerReview) => {
    const { error } = await supabase.from('customer_reviews').update({ is_approved: !r.is_approved }).eq('id', r.id)
    if (error) { toast('Failed to update', 'error'); return }
    if (profile) await createAuditLog(profile.id, 'review_approve', 'customer_review', r.id, `${!r.is_approved ? 'Approved' : 'Unapproved'} review from ${r.customer_name}`)
    setReviews((prev) => prev.map((x) => x.id === r.id ? { ...x, is_approved: !r.is_approved } : x))
    toast('Review updated', 'success')
  }

  const deleteReview = async (r: CustomerReview) => {
    const { error } = await supabase.from('customer_reviews').delete().eq('id', r.id)
    if (error) { toast('Failed to delete', 'error'); return }
    if (profile) await createAuditLog(profile.id, 'review_delete', 'customer_review', r.id, `Deleted review from ${r.customer_name}`)
    setReviews((prev) => prev.filter((x) => x.id !== r.id))
    toast('Review deleted', 'success')
  }

  const handleExportCSV = () => {
    const rows = reviews.map((r) => [r.customer_name, r.rating, r.review_text, r.service_name || '', r.source, r.is_approved ? 'Approved' : 'Pending', r.is_featured ? 'Featured' : 'No', formatDate(r.created_at)])
    exportToCSV('customer-reviews', ['Customer', 'Rating', 'Review', 'Service', 'Source', 'Status', 'Featured', 'Created'], rows)
    toast('CSV exported', 'success')
  }

  if (loading) return <LoadingScreen message="Loading reviews..." />

  const approvedCount = reviews.filter((r) => r.is_approved).length
  const featuredCount = reviews.filter((r) => r.is_featured).length
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0.0'
  const dist = [5, 4, 3, 2, 1].map((star) => ({ star, count: reviews.filter((r) => r.rating === star).length }))
  const maxDist = Math.max(...dist.map((d) => d.count), 1)

  const filtered = reviews.filter((r) => {
    if (filter === 'pending') return !r.is_approved
    if (filter === 'approved') return r.is_approved
    if (filter === 'featured') return r.is_featured
    return true
  })

  const stats = [
    { label: 'Total Reviews', value: reviews.length, icon: MessageSquare, color: 'bg-blue-50 text-blue-600' },
    { label: 'Approved', value: approvedCount, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
    { label: 'Featured', value: featuredCount, icon: Award, color: 'bg-amber-50 text-amber-600' },
    { label: 'Average Rating', value: avgRating, icon: TrendingUp, color: 'bg-purple-50 text-purple-600' },
  ]

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Customer Reviews</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
          <Button onClick={() => setShowForm(true)}><Plus className="mr-2 h-4 w-4" /> Add Review</Button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => { const Icon = s.icon; return (
          <Card key={s.label}><CardContent className="p-4">
            <div className={`mb-2 inline-flex rounded-lg p-2 ${s.color}`}><Icon className="h-5 w-5" /></div>
            <p className="text-xs text-gray-600">{s.label}</p><p className="text-xl font-bold">{s.value}</p>
          </CardContent></Card>
        )})}
      </div>

      <Card className="mb-6"><CardHeader><CardTitle className="text-base">Rating Distribution</CardTitle></CardHeader><CardContent>
        <div className="space-y-2">
          {dist.map((d) => (
            <div key={d.star} className="flex items-center gap-3">
              <span className="flex w-16 items-center gap-1 text-sm font-medium text-gray-700">{d.star} <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" /></span>
              <div className="h-5 flex-1 rounded bg-gray-100"><div className="h-5 rounded bg-yellow-400" style={{ width: `${(d.count / maxDist) * 100}%` }} /></div>
              <span className="w-8 text-right text-sm font-bold text-gray-900">{d.count}</span>
            </div>
          ))}
        </div>
      </CardContent></Card>

      <div className="mb-4 flex flex-wrap gap-2">
        {(['all', 'pending', 'approved', 'featured'] as FilterType[]).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? 'primary' : 'outline'} onClick={() => setFilter(f)} className="capitalize">{f}</Button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((r) => (
          <Card key={r.id}><CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{r.customer_name}</p>
                  <div className="flex">{[1, 2, 3, 4, 5].map((s) => <Star key={s} className={`h-4 w-4 ${s <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />)}</div>
                  <Badge color="bg-gray-100 text-gray-700">{r.source}</Badge>
                  {r.is_approved ? <Badge color="bg-green-100 text-green-700">Approved</Badge> : <Badge color="bg-amber-100 text-amber-700">Pending</Badge>}
                  {r.is_featured && <Badge color="bg-amber-100 text-amber-700">Featured</Badge>}
                </div>
                <p className="mt-1 text-sm text-gray-600">{r.review_text}</p>
                <p className="mt-1 text-xs text-gray-400">{r.service_name || 'General'} - {formatDate(r.created_at)}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => toggleFeatured(r)} title="Toggle Featured"><Award className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="outline" onClick={() => toggleApproved(r)} title="Toggle Approved"><CheckCircle className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="danger" onClick={() => deleteReview(r)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          </CardContent></Card>
        ))}
        {filtered.length === 0 && <p className="py-8 text-center text-gray-500">No reviews found.</p>}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Review Manually">
        <form onSubmit={addReview} className="space-y-3">
          <div><Label>Customer Name</Label><Input value={form.customer_name} onChange={(e) => setForm((p) => ({ ...p, customer_name: e.target.value }))} required /></div>
          <div><Label>Rating</Label><Select value={form.rating} onChange={(e) => setForm((p) => ({ ...p, rating: e.target.value }))}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} Stars</option>)}</Select></div>
          <div><Label>Review Text</Label><Textarea rows={3} value={form.review_text} onChange={(e) => setForm((p) => ({ ...p, review_text: e.target.value }))} required /></div>
          <div><Label>Service Name</Label><Input value={form.service_name} onChange={(e) => setForm((p) => ({ ...p, service_name: e.target.value }))} placeholder="e.g. AC Service" /></div>
          <div><Label>Source</Label><Select value={form.source} onChange={(e) => setForm((p) => ({ ...p, source: e.target.value }))}><option value="google">Google</option><option value="facebook">Facebook</option><option value="website">Website</option><option value="manual">Manual</option></Select></div>
          <Button type="submit" disabled={saving}><Plus className="mr-2 h-4 w-4" /> {saving ? 'Adding...' : 'Add Review'}</Button>
        </form>
      </Modal>
    </div>
  )
}
