import { useEffect, useState } from 'react'
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
import { Plus, Search, Trash2, Power } from 'lucide-react'

export function AdminServiceAreasPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [areas, setAreas] = useState<ServiceArea[]>([])
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ city: '', district: '', pincode: '', state: 'Tamil Nadu' })

  const fetchAreas = async () => {
    const { data } = await supabase.from('service_areas').select('*').order('created_at', { ascending: false })
    setAreas((data || []) as ServiceArea[])
    setLoading(false)
  }

  useEffect(() => {
    let mounted = true;
    (async () => { await fetchAreas(); if (!mounted) return })()
    return () => { mounted = false }
  }, [])

  const filtered = areas.filter((a) => a.district.toLowerCase().includes(search.toLowerCase()) || a.city.toLowerCase().includes(search.toLowerCase()))

  const addArea = async () => {
    if (!form.city || !form.district) return
    const { data } = await supabase.from('service_areas').insert({ city: form.city, district: form.district, pincode: form.pincode || null, state: form.state, is_active: true }).select().single()
    await createAuditLog(profile?.id || '', 'create_service_area', 'service_area', data?.id || null, `Added area ${form.city}, ${form.district}`)
    toast('Service area added', 'success')
    setForm({ city: '', district: '', pincode: '', state: 'Tamil Nadu' }); setShowAdd(false)
    await fetchAreas()
  }

  const toggleActive = async (a: ServiceArea) => {
    await supabase.from('service_areas').update({ is_active: !a.is_active }).eq('id', a.id)
    await createAuditLog(profile?.id || '', 'toggle_service_area', 'service_area', a.id, `${a.is_active ? 'Deactivated' : 'Activated'} ${a.city}`)
    toast(`Area ${a.is_active ? 'deactivated' : 'activated'}`, 'info')
    setAreas((as) => as.map((x) => x.id === a.id ? { ...x, is_active: !x.is_active } : x))
  }

  const deleteArea = async (a: ServiceArea) => {
    await supabase.from('service_areas').delete().eq('id', a.id)
    await createAuditLog(profile?.id || '', 'delete_service_area', 'service_area', a.id, `Deleted ${a.city}`)
    toast('Area deleted', 'info')
    setAreas((as) => as.filter((x) => x.id !== a.id))
  }

  if (loading) return <LoadingScreen message="Loading service areas..." />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Service Areas</h1>
        <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" />Add Area</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <Input className="pl-9" placeholder="Search by district or city..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardHeader><CardTitle>Areas ({filtered.length})</CardTitle></CardHeader>
        <CardContent>
          {filtered.length === 0 ? <p className="text-gray-500 text-sm">No service areas found.</p> : (
            <div className="space-y-2">
              {filtered.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium text-gray-900">{a.city}</p>
                    <p className="text-sm text-gray-500">{a.district} · {a.pincode || 'All pincodes'} · {a.state}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color={a.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>{a.is_active ? 'Active' : 'Inactive'}</Badge>
                    <Button size="sm" variant="outline" onClick={() => toggleActive(a)}><Power className="h-4 w-4" /></Button>
                    <Button size="sm" variant="danger" onClick={() => deleteArea(a)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Service Area">
        <div className="space-y-3">
          <div><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City name..." /></div>
          <div><Label>District</Label><Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} placeholder="District..." /></div>
          <div><Label>Pincode (optional)</Label><Input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} placeholder="Pincode..." /></div>
          <div><Label>State</Label><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
          <div className="flex gap-2 justify-end"><Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button><Button size="sm" onClick={addArea} disabled={!form.city || !form.district}>Add</Button></div>
        </div>
      </Modal>
    </div>
  )
}
