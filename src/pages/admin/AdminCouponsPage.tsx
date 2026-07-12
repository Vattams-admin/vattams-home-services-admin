import { useEffect, useState, useCallback } from 'react'
import { Ticket, Plus, Pencil, Trash2, Loader as Loader2, Search, X, CircleAlert as AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input, Textarea, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/ui/modal'
import { useAuth } from '@/lib/auth'
import { supabase, type Coupon } from '@/lib/supabase'
import { formatDate, formatCurrency } from '@/lib/utils'
import { COUPON_OFFER_TYPES } from '@/lib/constants'
import { createAuditLog } from '@/lib/notifications'
import { useToast } from '@/hooks/use-toast'

type FormData = {
  code: string
  description: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_amount: number
  max_uses: number
  valid_from: string
  valid_until: string
  is_active: boolean
  offer_type: string
  max_discount_amount: number
}

const emptyForm: FormData = {
  code: '',
  description: '',
  discount_type: 'percentage',
  discount_value: 0,
  min_amount: 0,
  max_uses: 100,
  valid_from: new Date().toISOString().slice(0, 10),
  valid_until: '',
  is_active: true,
  offer_type: 'flat',
  max_discount_amount: 0,
}

export default function AdminCouponsPage() {
  const { profile } = useAuth()
  const toast = useToast()

  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadCoupons = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false })

      if (activeFilter === 'active') {
        query = query.eq('is_active', true)
      } else if (activeFilter === 'inactive') {
        query = query.eq('is_active', false)
      }

      const { data, error } = await query
      if (error) throw error

      let result = (data as Coupon[]) || []

      if (search.trim()) {
        const q = search.toLowerCase()
        result = result.filter(
          (c) =>
            c.code?.toLowerCase().includes(q) ||
            c.description?.toLowerCase().includes(q),
        )
      }

      setCoupons(result)
    } catch {
      toast.error('Failed to load coupons')
    } finally {
      setLoading(false)
    }
  }, [activeFilter, search, toast])

  useEffect(() => {
    loadCoupons()
  }, [loadCoupons])

  function openAddModal() {
    setEditingCoupon(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEditModal(coupon: Coupon) {
    setEditingCoupon(coupon)
    setForm({
      code: coupon.code || '',
      description: coupon.description || '',
      discount_type: coupon.discount_type || 'percentage',
      discount_value: coupon.discount_value || 0,
      min_amount: coupon.min_amount || 0,
      max_uses: coupon.max_uses || 100,
      valid_from: coupon.valid_from
        ? new Date(coupon.valid_from).toISOString().slice(0, 10)
        : '',
      valid_until: coupon.valid_until
        ? new Date(coupon.valid_until).toISOString().slice(0, 10)
        : '',
      is_active: coupon.is_active,
      offer_type: coupon.offer_type || 'flat',
      max_discount_amount: coupon.max_discount_amount || 0,
    })
    setModalOpen(true)
  }

  async function saveCoupon() {
    if (!form.code.trim()) {
      toast.warning('Coupon code is required')
      return
    }
    if (form.discount_value <= 0) {
      toast.warning('Discount value must be greater than 0')
      return
    }
    if (form.discount_type === 'percentage' && form.discount_value > 100) {
      toast.warning('Percentage discount cannot exceed 100%')
      return
    }

    setSaving(true)
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || null,
        discount_type: form.discount_type,
        discount_value: form.discount_value,
        min_amount: form.min_amount,
        max_uses: form.max_uses,
        valid_from: form.valid_from
          ? new Date(form.valid_from).toISOString()
          : null,
        valid_until: form.valid_until
          ? new Date(form.valid_until + 'T23:59:59').toISOString()
          : null,
        is_active: form.is_active,
        offer_type: form.offer_type,
        max_discount_amount:
          form.max_discount_amount > 0 ? form.max_discount_amount : null,
      }

      if (editingCoupon) {
        const { error } = await supabase
          .from('coupons')
          .update(payload)
          .eq('id', editingCoupon.id)
        if (error) throw error

        await createAuditLog(
          profile?.id || '',
          'update_coupon',
          'coupon',
          editingCoupon.id,
          `Updated coupon: ${form.code}`,
        )
        toast.success('Coupon updated successfully')
      } else {
        const { error } = await supabase.from('coupons').insert(payload)
        if (error) throw error

        await createAuditLog(
          profile?.id || '',
          'create_coupon',
          'coupon',
          null,
          `Created coupon: ${form.code}`,
        )
        toast.success('Coupon created successfully')
      }

      setModalOpen(false)
      setForm(emptyForm)
      setEditingCoupon(null)
      await loadCoupons()
    } catch {
      toast.error('Failed to save coupon')
    } finally {
      setSaving(false)
    }
  }

  async function deleteCoupon() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', deleteId)
      if (error) throw error

      await createAuditLog(
        profile?.id || '',
        'delete_coupon',
        'coupon',
        deleteId,
        'Deleted coupon',
      )
      toast.success('Coupon deleted')
      setDeleteId(null)
      await loadCoupons()
    } catch {
      toast.error('Failed to delete coupon')
    } finally {
      setDeleting(false)
    }
  }

  async function toggleActive(coupon: Coupon) {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !coupon.is_active })
        .eq('id', coupon.id)
      if (error) throw error

      await createAuditLog(
        profile?.id || '',
        'toggle_coupon',
        'coupon',
        coupon.id,
        `${coupon.is_active ? 'Deactivated' : 'Activated'} coupon: ${coupon.code}`,
      )
      toast.success(`Coupon ${coupon.is_active ? 'deactivated' : 'activated'}`)
      await loadCoupons()
    } catch {
      toast.error('Failed to update coupon status')
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Coupons</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage discount coupons and promotional offers
          </p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="mr-1 h-4 w-4" /> Add Coupon
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Ticket className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Coupons</p>
              <p className="text-xl font-bold text-slate-900">
                {coupons.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <Ticket className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Active</p>
              <p className="text-xl font-bold text-slate-900">
                {coupons.filter((c) => c.is_active).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
              <Ticket className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Used</p>
              <p className="text-xl font-bold text-slate-900">
                {coupons.reduce((sum, c) => sum + (c.used_count || 0), 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label>Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by code or description..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-1.5 sm:w-48">
            <Label>Status</Label>
            <Select
              value={activeFilter}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setActiveFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Coupons Table */}
      {coupons.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Ticket className="h-12 w-12 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-500">
              No coupons found
            </p>
            <Button onClick={openAddModal} className="mt-3" size="sm">
              <Plus className="mr-1 h-4 w-4" /> Add First Coupon
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
                      Code
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Discount
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Min Amount
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Usage
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Validity
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {coupons.map((coupon) => (
                    <tr key={coupon.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-mono font-semibold text-slate-900">
                          {coupon.code}
                        </div>
                        {coupon.description && (
                          <div className="text-xs text-slate-500">
                            {coupon.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {coupon.discount_type === 'percentage'
                          ? `${coupon.discount_value}%`
                          : formatCurrency(coupon.discount_value)}
                        {coupon.max_discount_amount
                          ? ` (max ${formatCurrency(coupon.max_discount_amount)})`
                          : ''}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {coupon.min_amount > 0
                          ? formatCurrency(coupon.min_amount)
                          : 'None'}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {coupon.used_count || 0} / {coupon.max_uses}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        <div>{formatDate(coupon.valid_from)}</div>
                        {coupon.valid_until && (
                          <div>to {formatDate(coupon.valid_until)}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleActive(coupon)}>
                          <Badge
                            color={coupon.is_active ? 'green' : 'gray'}
                            className="cursor-pointer"
                          >
                            {coupon.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(coupon)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => setDeleteId(coupon.id)}
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

      {/* Add/Edit Modal */}
      {modalOpen && (
        <Modal
          title={editingCoupon ? 'Edit Coupon' : 'Add Coupon'}
          onClose={() => setModalOpen(false)}
          className="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Code *</Label>
                <Input
                  placeholder="e.g., DIWALI2024"
                  value={form.code}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    setForm({ ...form, code: e.target.value.toUpperCase() })
                  }
                  className="font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Offer Type</Label>
                <Select
                  value={form.offer_type}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    setForm({ ...form, offer_type: e.target.value })
                  }
                >
                  {COUPON_OFFER_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t
                        .split('_')
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(' ')}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                placeholder="Coupon description..."
                value={form.description}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Discount Type *</Label>
                <Select
                  value={form.discount_type}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    setForm({
                      ...form,
                      discount_type: e.target.value as 'percentage' | 'fixed',
                    })
                  }
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>
                  Discount Value *{' '}
                  {form.discount_type === 'percentage' ? '(%)' : '(₹)'}
                </Label>
                <Input
                  type="number"
                  min="0"
                  step={form.discount_type === 'percentage' ? '1' : '10'}
                  value={form.discount_value}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    setForm({
                      ...form,
                      discount_value: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Min Order Amount (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.min_amount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    setForm({
                      ...form,
                      min_amount: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Max Uses</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.max_uses}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    setForm({
                      ...form,
                      max_uses: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
            </div>

            {form.discount_type === 'percentage' && (
              <div className="space-y-1.5">
                <Label>Max Discount Amount (₹) - Optional</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0 = no cap"
                  value={form.max_discount_amount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    setForm({
                      ...form,
                      max_discount_amount: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Valid From *</Label>
                <Input
                  type="date"
                  value={form.valid_from}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    setForm({ ...form, valid_from: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Valid Until</Label>
                <Input
                  type="date"
                  value={form.valid_until}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    setForm({ ...form, valid_until: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={form.is_active}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                  setForm({ ...form, is_active: (e.target as HTMLInputElement).checked })
                }
                className="h-4 w-4 rounded border-slate-300"
              />
              <Label htmlFor="is_active">Active (available for use)</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveCoupon} loading={saving}>
                {editingCoupon ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <Modal title="Delete Coupon" onClose={() => setDeleteId(null)}>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-sm text-slate-600">
                Are you sure you want to delete this coupon? This action cannot
                be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteId(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={deleteCoupon}
                loading={deleting}
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
