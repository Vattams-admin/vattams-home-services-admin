import { useEffect, useState, useCallback } from 'react'
import { MapPin, Plus, Pencil, Trash2, Loader as Loader2, Search, X, CircleAlert as AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/ui/modal'
import { useAuth } from '@/lib/auth'
import { supabase, type ServiceArea } from '@/lib/supabase'
import { cn, formatDate } from '@/lib/utils'
import { TAMIL_NADU_DISTRICTS, SERVICE_CITIES } from '@/lib/constants'
import { createAuditLog } from '@/lib/notifications'
import { useToast } from '@/hooks/use-toast'

type FormData = {
  city: string
  city_ta: string
  district: string
  pincode: string
  area: string
  is_active: boolean
}

const emptyForm: FormData = {
  city: '',
  city_ta: '',
  district: '',
  pincode: '',
  area: '',
  is_active: true,
}

export default function AdminServiceAreasPage() {
  const { profile } = useAuth()
  const toast = useToast()

  const [areas, setAreas] = useState<ServiceArea[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('all')
  const [activeFilter, setActiveFilter] = useState('all')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingArea, setEditingArea] = useState<ServiceArea | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadAreas = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('service_areas')
        .select('*')
        .order('created_at', { ascending: false })

      if (cityFilter !== 'all') {
        query = query.eq('city', cityFilter)
      }
      if (activeFilter === 'active') {
        query = query.eq('is_active', true)
      } else if (activeFilter === 'inactive') {
        query = query.eq('is_active', false)
      }

      const { data, error } = await query
      if (error) throw error

      let result = (data as ServiceArea[]) || []

      if (search.trim()) {
        const q = search.toLowerCase()
        result = result.filter(
          (a) =>
            a.city?.toLowerCase().includes(q) ||
            a.district?.toLowerCase().includes(q) ||
            a.pincode?.includes(q) ||
            a.area?.toLowerCase().includes(q),
        )
      }

      setAreas(result)
    } catch {
      toast.error('Failed to load service areas')
    } finally {
      setLoading(false)
    }
  }, [cityFilter, activeFilter, search, toast])

  useEffect(() => {
    loadAreas()
  }, [loadAreas])

  function openAddModal() {
    setEditingArea(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEditModal(area: ServiceArea) {
    setEditingArea(area)
    setForm({
      city: area.city || '',
      city_ta: area.city_ta || '',
      district: area.district || '',
      pincode: area.pincode || '',
      area: area.area || '',
      is_active: area.is_active,
    })
    setModalOpen(true)
  }

  async function saveArea() {
    if (!form.city.trim() || !form.district.trim()) {
      toast.warning('City and district are required')
      return
    }

    setSaving(true)
    try {
      if (editingArea) {
        const { error } = await supabase
          .from('service_areas')
          .update({
            city: form.city.trim(),
            city_ta: form.city_ta.trim() || null,
            district: form.district.trim(),
            pincode: form.pincode.trim() || null,
            area: form.area.trim() || null,
            is_active: form.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingArea.id)

        if (error) throw error

        await createAuditLog(
          profile?.id || '',
          'update_service_area',
          'service_area',
          editingArea.id,
          `Updated service area: ${form.city}`,
        )

        toast.success('Service area updated successfully')
      } else {
        const { error } = await supabase.from('service_areas').insert({
          city: form.city.trim(),
          city_ta: form.city_ta.trim() || null,
          district: form.district.trim(),
          pincode: form.pincode.trim() || null,
          area: form.area.trim() || null,
          is_active: form.is_active,
          state: 'Tamil Nadu',
        })

        if (error) throw error

        await createAuditLog(
          profile?.id || '',
          'create_service_area',
          'service_area',
          null,
          `Created service area: ${form.city}`,
        )

        toast.success('Service area created successfully')
      }

      setModalOpen(false)
      setForm(emptyForm)
      setEditingArea(null)
      await loadAreas()
    } catch {
      toast.error('Failed to save service area')
    } finally {
      setSaving(false)
    }
  }

  async function deleteArea() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('service_areas')
        .delete()
        .eq('id', deleteId)

      if (error) throw error

      await createAuditLog(
        profile?.id || '',
        'delete_service_area',
        'service_area',
        deleteId,
        'Deleted service area',
      )

      toast.success('Service area deleted')
      setDeleteId(null)
      await loadAreas()
    } catch {
      toast.error('Failed to delete service area')
    } finally {
      setDeleting(false)
    }
  }

  async function toggleActive(area: ServiceArea) {
    try {
      const { error } = await supabase
        .from('service_areas')
        .update({
          is_active: !area.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', area.id)

      if (error) throw error

      await createAuditLog(
        profile?.id || '',
        'toggle_service_area',
        'service_area',
        area.id,
        `${area.is_active ? 'Deactivated' : 'Activated'} service area: ${area.city}`,
      )

      toast.success(`Area ${area.is_active ? 'deactivated' : 'activated'}`)
      await loadAreas()
    } catch {
      toast.error('Failed to update area status')
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
          <h1 className="text-2xl font-bold text-slate-900">Service Areas</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage cities and areas where VATTAMS operates
          </p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="mr-1 h-4 w-4" /> Add Area
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label>Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by city, district, pincode..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-1.5 sm:w-48">
            <Label>City</Label>
            <Select
              value={cityFilter}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setCityFilter(e.target.value)}
            >
              <option value="all">All Cities</option>
              {SERVICE_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5 sm:w-40">
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

      {/* Areas Table */}
      {areas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <MapPin className="h-12 w-12 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-500">
              No service areas found
            </p>
            <Button onClick={openAddModal} className="mt-3" size="sm">
              <Plus className="mr-1 h-4 w-4" /> Add First Area
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
                      City
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      District
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Area
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Pincode
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Status
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
                  {areas.map((area) => (
                    <tr key={area.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {area.city}
                        </div>
                        {area.city_ta && (
                          <div className="text-xs text-slate-500">
                            {area.city_ta}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {area.district}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {area.area || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {area.pincode || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleActive(area)}>
                          <Badge
                            color={area.is_active ? 'green' : 'gray'}
                            className="cursor-pointer"
                          >
                            {area.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatDate(area.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(area)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => setDeleteId(area.id)}
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
          title={editingArea ? 'Edit Service Area' : 'Add Service Area'}
          onClose={() => setModalOpen(false)}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>City *</Label>
                <Input
                  list="city-list"
                  placeholder="Enter city name"
                  value={form.city}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    setForm({ ...form, city: e.target.value })
                  }
                />
                <datalist id="city-list">
                  {SERVICE_CITIES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-1.5">
                <Label>City (Tamil)</Label>
                <Input
                  placeholder="நகரம்"
                  value={form.city_ta}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    setForm({ ...form, city_ta: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>District *</Label>
              <Select
                value={form.district}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                  setForm({ ...form, district: e.target.value })
                }
              >
                <option value="">Select district...</option>
                {TAMIL_NADU_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Area / Locality</Label>
                <Input
                  placeholder="e.g., T. Nagar, Anna Nagar..."
                  value={form.area}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    setForm({ ...form, area: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Pincode</Label>
                <Input
                  placeholder="e.g., 600017"
                  maxLength={6}
                  value={form.pincode}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    setForm({
                      ...form,
                      pincode: e.target.value.replace(/\D/g, ''),
                    })
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
              <Label htmlFor="is_active">Active (available for bookings)</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveArea} loading={saving}>
                {editingArea ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <Modal title="Delete Service Area" onClose={() => setDeleteId(null)}>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-sm text-slate-600">
                Are you sure you want to delete this service area? This action
                cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteId(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={deleteArea}
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
