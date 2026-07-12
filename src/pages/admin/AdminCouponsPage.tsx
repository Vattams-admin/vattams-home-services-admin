import { useEffect, useState } from 'react'
import { Plus, Trash2, Ticket, ToggleLeft, ToggleRight } from 'lucide-react'
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
import { Modal } from '@/components/ui/modal'
import { LoadingScreen } from '@/components/LoadingScreen'

export function AdminCouponsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ code: '', description: '', discount_type: 'percentage' as 'percentage' | 'fixed', discount_value: '', min_amount: '', max_uses: '', valid_until: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
      if (!mounted) return
      setCoupons((data || []) as Coupon[])
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  const handleAdd = async () => {
    if (!form.code.trim() || !form.discount_value) { toast('Code and discount value are required', 'error'); return }
    setSaving(true)
    const { data, error } = await supabase.from('coupons').insert({
      code: form.code.trim().toUpperCase(), description: form.description.trim() || null,
      discount_type: form.discount_type, discount_value: Number(form.discount_value),
      min_amount: Number(form.min_amount) || 0, max_uses: Number(form.max_uses) || 0,
      valid_until: form.valid_until || null, is_active: true, used_count: 0,
    }).select().single()
    setSaving(false)
    if (error) { toast('Failed to create coupon', 'error'); return }
    if (profile) await createAuditLog(profile.id, 'create_coupon', 'coupon', (data as Coupon).id, `Created coupon ${form.code.trim().toUpperCase()}`)
    toast('Coupon created successfully', 'success')
    setCoupons((prev) => [(data as Coupon), ...prev])
    setShowAdd(false)
    setForm({ code: '', description: '', discount_type: 'percentage', discount_value: '', min_amount: '', max_uses: '', valid_until: '' })
  }

  const toggleActive = async (c: Coupon) => {
    const { error } = await supabase.from('coupons').update({ is_active: !c.is_active }).eq('id', c.id)
    if (error) { toast('Failed to update', 'error'); return }
    if (profile) await createAuditLog(profile.id, 'toggle_coupon', 'coupon', c.id, `${c.is_active ? 'Deactivated' : 'Activated'} coupon ${c.code}`)
    toast(`Coupon ${c.is_active ? 'deactivated' : 'activated'}`, 'success')
    setCoupons((prev) => prev.map((x) => x.id === c.id ? { ...x, is_active: !x.is_active } : x))
  }

  const handleDelete = async (c: Coupon) => {
    const { error } = await supabase.from('coupons').delete().eq('id', c.id)
    if (error) { toast('Failed to delete coupon', 'error'); return }
    if (profile) await createAuditLog(profile.id, 'delete_coupon', 'coupon', c.id, `Deleted coupon ${c.code}`)
    toast('Coupon deleted', 'success')
    setCoupons((prev) => prev.filter((x) => x.id !== c.id))
  }

  if (loading) return <LoadingScreen message="Loading coupons..." />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Coupons</h1><p className="text-sm text-gray-500">Manage discount coupons</p></div>
        <Button onClick={() => setShowAdd(true)}><Plus className="mr-2 h-4 w-4" />Add Coupon</Button>
      </div>

      {coupons.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-12">
          <Ticket className="h-12 w-12 text-gray-300" />
          <p className="text-gray-500">No coupons yet.</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {coupons.map((c) => (
            <Card key={c.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <Ticket className="mt-0.5 h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-mono font-bold text-gray-900">{c.code}</p>
                      {c.description && <p className="text-sm text-gray-500">{c.description}</p>}
                    </div>
                  </div>
                  <Badge color={c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>{c.is_active ? 'Active' : 'Inactive'}</Badge>
                </div>
                <div className="mt-3 space-y-1 text-sm text-gray-600">
                  <p>Discount: <span className="font-medium">{c.discount_type === 'percentage' ? `${c.discount_value}%` : formatCurrency(c.discount_value)}</span></p>
                  <p>Min Amount: <span className="font-medium">{formatCurrency(c.min_amount)}</span></p>
                  <p>Usage: <span className={cn('font-medium', c.used_count >= c.max_uses && c.max_uses > 0 ? 'text-red-600' : '')}>{c.used_count} / {c.max_uses > 0 ? c.max_uses : '∞'}</span></p>
                  {c.valid_until && <p>Valid Until: <span className="font-medium">{formatDate(c.valid_until)}</span></p>}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => toggleActive(c)}>
                    {c.is_active ? <><ToggleRight className="mr-1 h-4 w-4 text-green-600" />Deactivate</> : <><ToggleLeft className="mr-1 h-4 w-4" />Activate</>}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(c)}><Trash2 className="mr-1 h-4 w-4" />Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Coupon">
        <div className="space-y-4">
          <div>
            <Label htmlFor="code">Coupon Code</Label>
            <Input id="code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="SUMMER50" />
          </div>
          <div>
            <Label htmlFor="desc">Description</Label>
            <Input id="desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Summer discount" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="dtype">Discount Type</Label>
              <Select id="dtype" value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value as 'percentage' | 'fixed' })}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="dvalue">Discount Value</Label>
              <Input id="dvalue" type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} placeholder="50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="minamt">Min Amount</Label>
              <Input id="minamt" type="number" value={form.min_amount} onChange={(e) => setForm({ ...form, min_amount: e.target.value })} placeholder="0" />
            </div>
            <div>
              <Label htmlFor="maxuses">Max Uses (0 = unlimited)</Label>
              <Input id="maxuses" type="number" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} placeholder="100" />
            </div>
          </div>
          <div>
            <Label htmlFor="valid">Valid Until (optional)</Label>
            <Input id="valid" type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button><Button onClick={handleAdd} disabled={saving}>{saving ? 'Saving...' : 'Add Coupon'}</Button></div>
        </div>
      </Modal>
    </div>
  )
}
