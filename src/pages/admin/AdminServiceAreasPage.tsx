import { useEffect, useState } from 'react'
import { Plus, Trash2, Search, MapPin } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { ServiceArea } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { createAuditLog } from '@/lib/notifications'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { LoadingScreen } from '@/components/LoadingScreen'
import { TAMIL_NADU_DISTRICTS } from '@/lib/constants'

export function AdminServiceAreasPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [areas, setAreas] = useState<ServiceArea[]>([])
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ city: '', district: '', pincode: '', state: 'Tamil Nadu' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.from('service_areas').select('*').order('created_at', { ascending: false })
      if (!mounted) return
      setAreas((data || []) as ServiceArea[])
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  const filtered = areas.filter((a) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return a.district?.toLowerCase().includes(q) || a.city.toLowerCase().includes(q)
  })

  const handleAdd = async () => {
    if (!form.city.trim() || !form.district.trim()) { toast('City and district are required', 'error'); return }
    setSaving(true)
    const { data, error } = await supabase.from('service_areas').insert({ city: form.city.trim(), district: form.district.trim(), pincode: form.pincode.trim() || null, state: form.state, is_active: true }).select().single()
    setSaving(false)
    if (error) { toast('Failed to add service area', 'error'); return }
    if (profile) await createAuditLog(profile.id, 'create_service_area', 'service_area', (data as ServiceArea).id, `Added service area ${form.city}, ${form.district}`)
    toast('Service area added', 'success')
    setAreas((prev) => [(data as ServiceArea), ...prev])
    setShowAdd(false)
    setForm({ city: '', district: '', pincode: '', state: 'Tamil Nadu' })
  }

  const toggleActive = async (area: ServiceArea) => {
    const { error } = await supabase.from('service_areas').update({ is_active: !area.is_active }).eq('id', area.id)
    if (error) { toast('Failed to update', 'error'); return }
    if (profile) await createAuditLog(profile.id, 'toggle_service_area', 'service_area', area.id, `${area.is_active ? 'Deactivated' : 'Activated'} ${area.city}`)
    toast(`Area ${area.is_active ? 'deactivated' : 'activated'}`, 'success')
    setAreas((prev) => prev.map((a) => a.id === area.id ? { ...a, is_active: !a.is_active } : a))
  }

  const handleDelete = async (area: ServiceArea) => {
    const { error } = await supabase.from('service_areas').delete().eq('id', area.id)
    if (error) { toast('Failed to delete', 'error'); return }
    if (profile) await createAuditLog(profile.id, 'delete_service_area', 'service_area', area.id, `Deleted ${area.city}`)
    toast('Service area deleted', 'success')
    setAreas((prev) => prev.filter((a) => a.id !== area.id))
  }

  if (loading) return <LoadingScreen message="Loading service areas..." />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Service Areas</h1><p className="text-sm text-gray-500">Manage serviceable locations</p></div>
        <Button onClick={() => setShowAdd(true)}><Plus className="mr-2 h-4 w-4" />Add Area</Button>
      </div>

      <div className="relative max-w-md">
    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
    <Input className="pl-9" placeholder="Search by district or city..." value={search} onChange={(e) => setSearch(e.target.value)} />
  </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><p className="text-gray-500">No service areas found.</p></CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => (
            <Card key={a.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">{a.city}</p>
                      <p className="text-sm text-gray-500">{a.district}{a.pincode ? ` - ${a.pincode}` : ''}</p>
                      <p className="text-xs text-gray-400">{a.state || 'Tamil Nadu'}</p>
                    </div>
                  </div>
                  <Badge color={a.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>{a.is_active ? 'Active' : 'Inactive'}</Badge>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => toggleActive(a)}>{a.is_active ? 'Deactivate' : 'Activate'}</Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(a)}><Trash2 className="mr-1 h-4 w-4" />Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Service Area">
        <div className="space-y-4">
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Enter city name" />
          </div>
          <div>
            <Label htmlFor="district">District</Label>
            <Input id="district" list="districts" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} placeholder="Select or enter district" />
            <datalist id="districts">{TAMIL_NADU_DISTRICTS.map((d) => <option key={d} value={d} />)}</datalist>
          </div>
          <div>
            <Label htmlFor="pincode">Pincode (optional)</Label>
            <Input id="pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} placeholder="Enter pincode" />
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Input id="state" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button><Button onClick={handleAdd} disabled={saving}>{saving ? 'Saving...' : 'Add Area'}</Button></div>
        </div>
      </Modal>
    </div>
  )
}
