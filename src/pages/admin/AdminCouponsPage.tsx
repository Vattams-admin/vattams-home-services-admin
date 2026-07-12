import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Coupon } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { createAuditLog } from '@/lib/notifications'
import { cn, formatDate, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/LoadingScreen'
import { Plus, Trash2, Power, Ticket } from 'lucide-react'

export function AdminCouponsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ code: '', description: '', discount_type: 'percentage' as 'percentage' | 'fixed', discount_value: '', min_amount: '', max_uses: '', valid_until: '' })
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
      if (mounted) { setCoupons((data || []) as Coupon[]); setLoading(false) }
    })()
    return () => { mounted = false }
  }, [])

  const addCoupon = async () => {
    if (!form.code.trim() || !form.discount_value) { toast('Code and discount value are required', 'error'); return }
    setSaving(true)
    const { data, error } = await supabase.from('coupons').insert({
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || null,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      min_amount: Number(form.min_amount) || 0,
      max_uses: Number(form.max_uses) || 0,
      valid_until: form.valid_until || null,
      valid_from: new Date().toISOString(),
      used_count: 0,
      is_active: true,
    }).select().single()
    if (error) { toast('Failed to create coupon', 'error'); setSaving(false); return }
    if (profile) await createAuditLog(profile.id, 'create_coupon', 'coupon', data.id, `Created coupon ${form.code}`)
    toast('Coupon created successfully', 'success')
    setCoupons((c) => [data as Coupon, ...c])
    setForm({ code: '', description: '', discount_type: 'percentage', discount_value: '', min_amount: '', max_uses: '', valid_until: '' })
    setShowForm(false); setSaving(false)
  }

  const toggleActive = async (c: Coupon) => {
    setActionLoading(c.id)
    const { error } = await supabase.from('coupons').update({ is_active: !c.is_active }).eq('id', c.id)
    if (error) { toast('Failed to update', 'error'); setActionLoading(null); return }
    if (profile) await createAuditLog(profile.id, 'toggle_coupon', 'coupon', c.id, `${c.is_active ? 'Deactivated' : 'Activated'} ${c.code}`)
    toast(`Coupon ${c.is_active ? 'deactivated' : 'activated'}`, 'success')
    setCoupons((cs) => cs.map((x) => x.id === c.id ? { ...x, is_active: !x.is_active } : x))
    setActionLoading(null)
  }

  const deleteCoupon = async (c: Coupon) => {
    if (!confirm(`Delete coupon ${c.code}?`)) return
    const { error } = await supabase.from('coupons').delete().eq('id', c.id)
    if (error) { toast('Failed to delete', 'error'); return }
    if (profile) await createAuditLog(profile.id, 'delete_coupon', 'coupon', c.id, `Deleted ${c.code}`)
    toast('Coupon deleted', 'info')
    setCoupons((cs) => cs.filter((x) => x.id !== c.id))
  }

  if (loading) return <LoadingScreen message="Loading coupons..." />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Coupons</h1><p className="text-gray-600">Manage discount coupons</p></div>
        <Button onClick={() => setShowForm(!showForm)}><Plus className="mr-2 h-4 w-4" />{showForm ? 'Cancel' : 'Add Coupon'}</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>New Coupon</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div><Label htmlFor="code">Code</Label><Input id="code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="SAVE10" /></div>
              <div><Label htmlFor="dtype">Discount Type</Label><Select id="dtype" value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value as 'percentage' | 'fixed' })}><option value="percentage">Percentage</option><option value="fixed">Fixed Amount</option></Select></div>
              <div><Label htmlFor="dvalue">Discount Value</Label><Input id="dvalue" type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} placeholder="10" /></div>
              <div><Label htmlFor="minamt">Min Amount</Label><Input id="minamt" type="number" value={form.min_amount} onChange={(e) => setForm({ ...form, min_amount: e.target.value })} placeholder="0" /></div>
              <div><Label htmlFor="maxuses">Max Uses</Label><Input id="maxuses" type="number" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} placeholder="100" /></div>
              <div><Label htmlFor="validuntil">Valid Until</Label><Input id="validuntil" type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} /></div>
              <div className="sm:col-span-2 lg:col-span-3"><Label htmlFor="desc">Description</Label><Input id="desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="10% off on all services" /></div>
            </div>
            <Button className="mt-3" onClick={addCoupon} disabled={saving}><Plus className="mr-2 h-4 w-4" />{saving ? 'Creating...' : 'Create Coupon'}</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {coupons.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center sm:col-span-3">
            <Ticket className="h-12 w-12 text-gray-300" />
            <p className="text-gray-500">No coupons yet.</p>
          </div>
        ) : coupons.map((c) => (
          <Card key={c.id}><CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-bold text-gray-900">{c.code}</p>
                <Badge color={c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>{c.is_active ? 'Active' : 'Inactive'}</Badge>
              </div>
              {c.description && <p className="text-sm text-gray-500">{c.description}</p>}
              <div className="flex items-center gap-2 text-sm">
                <Badge color="bg-blue-50 text-blue-700">{c.discount_type === 'percentage' ? `${c.discount_value}%` : formatCurrency(c.discount_value)}</Badge>
                {c.min_amount > 0 && <span className="text-gray-500">Min: {formatCurrency(c.min_amount)}</span>}
              </div>
              <p className="text-xs text-gray-500">Used: {c.used_count} / {c.max_uses > 0 ? c.max_uses : '∞'}{c.valid_until && ` · Valid until ${formatDate(c.valid_until)}`}</p>
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={() => toggleActive(c)} disabled={actionLoading === c.id}>
                  <Power className="mr-1 h-4 w-4" />{c.is_active ? 'Deactivate' : 'Activate'}
                </Button>
                <Button size="sm" variant="danger" onClick={() => deleteCoupon(c)}><Trash2 className="mr-1 h-4 w-4" />Delete</Button>
              </div>
            </div>
          </CardContent></Card>
        ))}
      </div>
    </div>
  )
}
