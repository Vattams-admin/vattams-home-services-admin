import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Coupon } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { createAuditLog } from '@/lib/notifications'
import { cn, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { LoadingScreen } from '@/components/LoadingScreen'
import { Plus, Trash2, Power, Ticket } from 'lucide-react'

export function AdminCouponsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ code: '', description: '', discount_type: 'percentage' as 'percentage' | 'fixed', discount_value: 0, min_amount: 0, max_uses: 100, valid_until: '' })

  const fetchCoupons = async () => {
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
    setCoupons((data || []) as Coupon[])
    setLoading(false)
  }

  useEffect(() => {
    let mounted = true;
    (async () => { await fetchCoupons(); if (!mounted) return })()
    return () => { mounted = false }
  }, [])

  const addCoupon = async () => {
    if (!form.code.trim()) return
    await supabase.from('coupons').insert({
      code: form.code.toUpperCase(), description: form.description || null, discount_type: form.discount_type,
      discount_value: form.discount_value, min_amount: form.min_amount, max_uses: form.max_uses,
      valid_until: form.valid_until || null, is_active: true, used_count: 0,
    })
    await createAuditLog(profile?.id || '', 'create_coupon', 'coupon', null, `Created coupon ${form.code}`)
    toast('Coupon created', 'success')
    setForm({ code: '', description: '', discount_type: 'percentage', discount_value: 0, min_amount: 0, max_uses: 100, valid_until: '' })
    setShowAdd(false)
    await fetchCoupons()
  }

  const toggleActive = async (c: Coupon) => {
    await supabase.from('coupons').update({ is_active: !c.is_active }).eq('id', c.id)
    await createAuditLog(profile?.id || '', 'toggle_coupon', 'coupon', c.id, `${c.is_active ? 'Deactivated' : 'Activated'} ${c.code}`)
    toast(`Coupon ${c.is_active ? 'deactivated' : 'activated'}`, 'info')
    setCoupons((cs) => cs.map((x) => x.id === c.id ? { ...x, is_active: !x.is_active } : x))
  }

  const deleteCoupon = async (c: Coupon) => {
    await supabase.from('coupons').delete().eq('id', c.id)
    await createAuditLog(profile?.id || '', 'delete_coupon', 'coupon', c.id, `Deleted ${c.code}`)
    toast('Coupon deleted', 'info')
    setCoupons((cs) => cs.filter((x) => x.id !== c.id))
  }

  if (loading) return <LoadingScreen message="Loading coupons..." />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
        <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" />Add Coupon</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Ticket className="h-5 w-5 text-blue-600" />All Coupons ({coupons.length})</CardTitle></CardHeader>
        <CardContent>
          {coupons.length === 0 ? <p className="text-gray-500 text-sm">No coupons found.</p> : (
            <div className="space-y-2">
              {coupons.map((c) => (
                <div key={c.id} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-mono font-bold text-gray-900">{c.code}</p>
                      <Badge color={c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>{c.is_active ? 'Active' : 'Inactive'}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">{c.description || '-'}</p>
                    <p className="text-xs text-gray-400">
                      {c.discount_type === 'percentage' ? `${c.discount_value}%` : `₹${c.discount_value}`} off · Min ₹{c.min_amount} · Used {c.used_count}/{c.max_uses}
                      {c.valid_until && ` · Valid until ${formatDate(c.valid_until)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20"><div className="h-2 w-full rounded bg-gray-100"><div className={cn('h-2 rounded', c.used_count >= c.max_uses ? 'bg-red-500' : 'bg-blue-500')} style={{ width: `${Math.min((c.used_count / c.max_uses) * 100, 100)}%` }} /></div></div>
                    <Button size="sm" variant="outline" onClick={() => toggleActive(c)}><Power className="h-4 w-4" /></Button>
                    <Button size="sm" variant="danger" onClick={() => deleteCoupon(c)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Coupon">
        <div className="space-y-3">
          <div><Label>Code</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="SAVE10..." /></div>
          <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="10% off..." /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Discount Type</Label><Select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value as 'percentage' | 'fixed' })}><option value="percentage">Percentage</option><option value="fixed">Fixed</option></Select></div>
            <div><Label>Discount Value</Label><Input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Min Amount</Label><Input type="number" value={form.min_amount} onChange={(e) => setForm({ ...form, min_amount: Number(e.target.value) })} /></div>
            <div><Label>Max Uses</Label><Input type="number" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: Number(e.target.value) })} /></div>
          </div>
          <div><Label>Valid Until</Label><Input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} /></div>
          <div className="flex gap-2 justify-end"><Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button><Button size="sm" onClick={addCoupon} disabled={!form.code.trim()}>Add Coupon</Button></div>
        </div>
      </Modal>
    </div>
  )
}
