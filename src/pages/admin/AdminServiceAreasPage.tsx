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
import { LoadingScreen } from '@/components/LoadingScreen'
import { MapPin, Plus, Trash2, Power, Search } from 'lucide-react'

export function AdminServiceAreasPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [areas, setAreas] = useState<ServiceArea[]>([])
  const [search, setSearch] = useState('')
  const [newArea, setNewArea] = useState({ city: '', district: '', pincode: '', state: 'Tamil Nadu' })
  const [adding, setAdding] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.from('service_areas').select('*').order('created_at', { ascending: false })
      if (mounted) { setAreas((data || []) as ServiceArea[]); setLoading(false) }
    })()
    return () => { mounted = false }
  }, [])

  const filtered = areas.filter((a) => !search || a.district.toLowerCase().includes(search.toLowerCase()) || a.city.toLowerCase().includes(search.toLowerCase()))

  const addArea = async () => {
    if (!newArea.city.trim() || !newArea.district.trim()) { toast('City and district are required', 'error'); return }
    setAdding(true)
    const { data, error } = await supabase.from('service_areas').insert({ city: newArea.city.trim(), district: newArea.district.trim(), pincode: newArea.pincode.trim() || null, state: newArea.state, is_active: true }).select().single()
    if (error) { toast('Failed to add area', 'error'); setAdding(false); return }
    if (profile) await createAuditLog(profile.id, 'add_service_area', 'service_area', data.id, `Added area ${newArea.city}, ${newArea.district}`)
    toast('Service area added', 'success')
    setAreas((a) => [data as ServiceArea, ...a])
    setNewArea({ city: '', district: '', pincode: '', state: 'Tamil Nadu' })
    setAdding(false)
  }

  const toggleActive = async (area: ServiceArea) => {
    setToggling(area.id)
    const { error } = await supabase.from('service_areas').update({ is_active: !area.is_active }).eq('id', area.id)
    if (error) { toast('Failed to update', 'error'); setToggling(null); return }
    if (profile) await createAuditLog(profile.id, 'toggle_service_area', 'service_area', area.id, `${area.is_active ? 'Deactivated' : 'Activated'} ${area.city}`)
    toast(`Area ${area.is_active ? 'deactivated' : 'activated'}`, 'success')
    setAreas((a) => a.map((x) => x.id === area.id ? { ...x, is_active: !x.is_active } : x))
    setToggling(null)
  }

  const deleteArea = async (area: ServiceArea) => {
    if (!confirm(`Delete ${area.city}?`)) return
    const { error } = await supabase.from('service_areas').delete().eq('id', area.id)
    if (error) { toast('Failed to delete', 'error'); return }
    if (profile) await createAuditLog(profile.id, 'delete_service_area', 'service_area', area.id, `Deleted ${area.city}`)
    toast('Area deleted', 'info')
    setAreas((a) => a.filter((x) => x.id !== area.id))
  }

  if (loading) return <LoadingScreen message="Loading service areas..." />

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Service Areas</h1><p className="text-gray-600">Manage serviceable locations</p></div>

      <Card>
        <CardHeader><CardTitle>Add New Area</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div><Label htmlFor="city">City</Label><Input id="city" value={newArea.city} onChange={(e) => setNewArea({ ...newArea, city: e.target.value })} placeholder="City" /></div>
            <div><Label htmlFor="district">District</Label><Input id="district" value={newArea.district} onChange={(e) => setNewArea({ ...newArea, district: e.target.value })} placeholder="District" /></div>
            <div><Label htmlFor="pincode">Pincode</Label><Input id="pincode" value={newArea.pincode} onChange={(e) => setNewArea({ ...newArea, pincode: e.target.value })} placeholder="Pincode" /></div>
            <div><Label htmlFor="state">State</Label><Input id="state" value={newArea.state} onChange={(e) => setNewArea({ ...newArea, state: e.target.value })} placeholder="State" /></div>
          </div>
          <Button className="mt-3" onClick={addArea} disabled={adding}><Plus className="mr-2 h-4 w-4" />{adding ? 'Adding...' : 'Add Area'}</Button>
        </CardContent>
      </Card>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input className="pl-10" placeholder="Search by district or city..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? <p className="py-8 text-center text-gray-500 sm:col-span-3">No service areas found.</p> : filtered.map((a) => (
          <Card key={a.id}><CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <p className="font-medium text-gray-900">{a.city}</p>
                </div>
                <Badge color={a.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>{a.is_active ? 'Active' : 'Inactive'}</Badge>
              </div>
              <p className="text-sm text-gray-500">{a.district}, {a.state || 'Tamil Nadu'}{a.pincode && ` - ${a.pincode}`}</p>
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={() => toggleActive(a)} disabled={toggling === a.id}>
                  <Power className="mr-1 h-4 w-4" />{a.is_active ? 'Deactivate' : 'Activate'}
                </Button>
                <Button size="sm" variant="danger" onClick={() => deleteArea(a)}><Trash2 className="mr-1 h-4 w-4" />Delete</Button>
              </div>
            </div>
          </CardContent></Card>
        ))}
      </div>
    </div>
  )
}
