import { useEffect, useState } from 'react'
import { Plus, Trash2, Power, Download, Ticket, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Coupon } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { createAuditLog } from '@/lib/notifications'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/LoadingScreen'
import { exportToCSV } from '@/lib/pdf'
import { TAMIL_NADU_DISTRICTS, SERVICE_CATEGORIES, COUPON_OFFER_TYPES } from '@/lib/constants'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { FormEvent } from 'react'

export function AdminCouponsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    code: '', description: '', discount_type: 'percentage' as 'percentage' | 'fixed', discount_value: '', min_amount: '0', max_uses: '100', valid_until: '',
    offer_type: 'flat', district: '', service_category: '', max_discount_amount: '',
  })

  const fetchCoupons = async () => {
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
    setCoupons((data as Coupon[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    let mounted = true;
    (async () => { if (mounted) { await fetchCoupons() } })()
    return () => { mounted = false }
  }, [])

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.code || !form.discount_value) return
    setSaving(true)
    const { error } = await supabase.from('coupons').insert({
      code: form.code.toUpperCase(), description: form.description || null, discount_type: form.discount_type, discount_value: parseFloat(form.discount_value),
      min_amount: parseFloat(form.min_amount) || 0, max_uses: parseInt(form.max_uses) || 100, valid_until: form.valid_until || null, is_active: true,
      offer_type: form.offer_type, district: form.district || null, service_category: form.service_category || null, max_discount_amount: form.max_discount_amount ? parseFloat(form.max_discount_amount) : null,
    })
    setSaving(false)
    if (error) { toast('Failed to create coupon', 'error'); return }
    if (profile) await createAuditLog(profile.id, 'coupon_create', 'coupon', null, `Created coupon ${form.code}`)
    toast('Coupon created successfully', 'success')
    setShowForm(false)
    setForm({ code: '', description: '', discount_type: 'percentage', discount_value: '', min_amount: '0', max_uses: '100', valid_until: '', offer_type: 'flat', district: '', service_category: '', max_discount_amount: '' })
    fetchCoupons()
  }

  const toggle = async (c: Coupon) => {
    const { error } = await supabase.from('coupons').update({ is_active: !c.is_active }).eq('id', c.id)
    if (error) { toast('Failed to update', 'error'); return }
    setCoupons((prev) => prev.map((x) => x.id === c.id ? { ...x, is_active: !x.is_active } : x))
    toast('Coupon updated', 'success')
  }

  const remove = async (c: Coupon) => {
    const { error } = await supabase.from('coupons').delete().eq('id', c.id)
    if (error) { toast('Failed to delete', 'error'); return }
    if (profile) await createAuditLog(profile.id, 'coupon_delete', 'coupon', c.id, `Deleted coupon ${c.code}`)
    setCoupons((prev) => prev.filter((x) => x.id !== c.id))
    toast('Coupon deleted', 'success')
  }

  if (loading) return <LoadingScreen message="Loading coupons..." />

  const activeCount = coupons.filter((c) => c.is_active).length
  const totalSavings = coupons.reduce((s, c) => s + (c.discount_type === 'fixed' ? c.discount_value * c.used_count : c.discount_value * c.used_count / 100), 0)

  const exportCSV = () => {
    const rows = coupons.map((c) => [c.code, c.discount_type, c.discount_value, c.used_count, c.max_uses, c.is_active ? 'Active' : 'Inactive', formatDate(c.created_at)])
    exportToCSV('coupons-report', ['Code', 'Type', 'Value', 'Used', 'Max Uses', 'Status', 'Created'], rows)
    toast('CSV exported', 'success')
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
          <Button onClick={() => setShowForm(!showForm)}><Plus className="mr-2 h-4 w-4" /> {showForm ? 'Cancel' : 'Add Coupon'}</Button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card><CardContent className="flex items-center gap-3 p-4"><div className="rounded-lg bg-blue-50 p-2.5"><Ticket className="h-5 w-5 text-blue-600" /></div><div><p className="text-xs text-gray-600">Total Coupons</p><p className="text-lg font-bold">{coupons.length}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4"><div className="rounded-lg bg-green-50 p-2.5"><Power className="h-5 w-5 text-green-600" /></div><div><p className="text-xs text-gray-600">Active Coupons</p><p className="text-lg font-bold">{activeCount}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4"><div className="rounded-lg bg-purple-50 p-2.5"><TrendingUp className="h-5 w-5 text-purple-600" /></div><div><p className="text-xs text-gray-600">Total Savings</p><p className="text-lg font-bold">{formatCurrency(totalSavings)}</p></div></CardContent></Card>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-base">New Coupon</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><Label>Code</Label><Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} placeholder="SUMMER20" required /></div>
              <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></div>
              <div><Label>Discount Type</Label><Select value={form.discount_type} onChange={(e) => setForm((p) => ({ ...p, discount_type: e.target.value as 'percentage' | 'fixed' }))}><option value="percentage">Percentage</option><option value="fixed">Fixed</option></Select></div>
              <div><Label>Discount Value</Label><Input type="number" value={form.discount_value} onChange={(e) => setForm((p) => ({ ...p, discount_value: e.target.value }))} placeholder="20" required /></div>
              <div><Label>Min Amount</Label><Input type="number" value={form.min_amount} onChange={(e) => setForm((p) => ({ ...p, min_amount: e.target.value }))} placeholder="0" /></div>
              <div><Label>Max Uses</Label><Input type="number" value={form.max_uses} onChange={(e) => setForm((p) => ({ ...p, max_uses: e.target.value }))} placeholder="100" /></div>
              <div><Label>Valid Until</Label><Input type="date" value={form.valid_until} onChange={(e) => setForm((p) => ({ ...p, valid_until: e.target.value }))} /></div>
              <div><Label>Offer Type</Label><Select value={form.offer_type} onChange={(e) => setForm((p) => ({ ...p, offer_type: e.target.value }))}>{COUPON_OFFER_TYPES.map((o) => <option key={o} value={o}>{o}</option>)}</Select></div>
              <div><Label>District (Optional)</Label><Select value={form.district} onChange={(e) => setForm((p) => ({ ...p, district: e.target.value }))}><option value="">All districts</option>{TAMIL_NADU_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}</Select></div>
              <div><Label>Service Category (Optional)</Label><Select value={form.service_category} onChange={(e) => setForm((p) => ({ ...p, service_category: e.target.value }))}><option value="">All categories</option>{SERVICE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</Select></div>
              <div><Label>Max Discount Amount (Optional)</Label><Input type="number" value={form.max_discount_amount} onChange={(e) => setForm((p) => ({ ...p, max_discount_amount: e.target.value }))} placeholder="500" /></div>
              <div className="sm:col-span-2 lg:col-span-3"><Button type="submit" disabled={saving}><Plus className="mr-2 h-4 w-4" /> {saving ? 'Creating...' : 'Create Coupon'}</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {coupons.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-mono font-bold text-gray-900">{c.code}</p>
                  <Badge color={c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>{c.is_active ? 'Active' : 'Inactive'}</Badge>
                  <Badge color="bg-blue-50 text-blue-700">{c.discount_type === 'percentage' ? `${c.discount_value}%` : formatCurrency(c.discount_value)}</Badge>
                  {c.offer_type && c.offer_type !== 'flat' && <Badge color="bg-purple-50 text-purple-700">{c.offer_type}</Badge>}
                </div>
                <p className="text-sm text-gray-500">{c.description || 'No description'}</p>
                <p className="text-xs text-gray-400">Used: {c.used_count}/{c.max_uses} {c.valid_until && `• Valid until: ${formatDate(c.valid_until)}`}</p>
                {c.district && <Badge color="bg-amber-50 text-amber-700">{c.district}</Badge>}
                {c.service_category && <Badge color="bg-cyan-50 text-cyan-700">{c.service_category}</Badge>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => toggle(c)}><Power className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="danger" onClick={() => remove(c)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {coupons.length === 0 && <p className="py-8 text-center text-gray-500">No coupons found.</p>}
      </div>
    </div>
  )
}
