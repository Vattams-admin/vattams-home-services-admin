import { useEffect, useState } from 'react'
import { MapPin, Plus, Trash2, Power, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { ServiceArea } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { createAuditLog } from '@/lib/notifications'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/LoadingScreen'
import { TAMIL_NADU_DISTRICTS } from '@/lib/constants'
import type { FormEvent } from 'react'

export function AdminServiceAreasPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [areas, setAreas] = useState<ServiceArea[]>([])
  const [search, setSearch] = useState('')
  const [newCity, setNewCity] = useState('')
  const [newDistrict, setNewDistrict] = useState('')
  const [newState, setNewState] = useState('Tamil Nadu')
  const [adding, setAdding] = useState(false)

  const fetchAreas = async () => {
    const { data } = await supabase.from('service_areas').select('*').order('created_at', { ascending: false })
    setAreas((data as ServiceArea[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    let mounted = true;
    (async () => { if (mounted) { await fetchAreas() } })()
    return () => { mounted = false }
  }, [])

  const addArea = async (e: FormEvent) => {
    e.preventDefault()
    if (!newCity || !newDistrict) return
    if (areas.some((a) => a.city.toLowerCase() === newCity.toLowerCase() && a.district === newDistrict)) { toast('Area already exists', 'warning'); return }
    setAdding(true)
    const { error } = await supabase.from('service_areas').insert({ city: newCity, district: newDistrict, state: newState, is_active: true })
    setAdding(false)
    if (error) { toast('Failed to add area', 'error'); return }
    if (profile) await createAuditLog(profile.id, 'area_add', 'service_area', null, `Added ${newCity}, ${newDistrict}`)
    toast('Area added successfully', 'success')
    setNewCity(''); setNewDistrict('')
    fetchAreas()
  }

  const toggleArea = async (area: ServiceArea) => {
    const newVal = !area.is_active
    const { error } = await supabase.from('service_areas').update({ is_active: newVal }).eq('id', area.id)
    if (error) { toast('Failed to update', 'error'); return }
    setAreas((prev) => prev.map((a) => a.id === area.id ? { ...a, is_active: newVal } : a))
    toast(`Area ${newVal ? 'enabled' : 'disabled'}`, 'success')
  }

  const deleteArea = async (area: ServiceArea) => {
    const { error } = await supabase.from('service_areas').delete().eq('id', area.id)
    if (error) { toast('Failed to delete area', 'error'); return }
    if (profile) await createAuditLog(profile.id, 'area_delete', 'service_area', area.id, `Deleted ${area.city}, ${area.district}`)
    setAreas((prev) => prev.filter((a) => a.id !== area.id))
    toast('Area deleted', 'success')
  }

  if (loading) return <LoadingScreen message="Loading service areas..." />

  const filtered = areas.filter((a) => {
    const q = search.toLowerCase()
    return !q || a.city.toLowerCase().includes(q) || a.district.toLowerCase().includes(q)
  })

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Service Areas</h1>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Add New Area</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={addArea} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" value={newCity} onChange={(e) => setNewCity(e.target.value)} placeholder="e.g. Chennai" required />
            </div>
            <div>
              <Label htmlFor="district">District</Label>
              <Select id="district" value={newDistrict} onChange={(e) => setNewDistrict(e.target.value)} required>
                <option value="">Select district</option>
                {TAMIL_NADU_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input id="state" value={newState} onChange={(e) => setNewState(e.target.value)} placeholder="Tamil Nadu" />
            </div>
            <div className="sm:col-span-3">
              <Button type="submit" disabled={adding || !newCity || !newDistrict}><Plus className="mr-2 h-4 w-4" /> {adding ? 'Adding...' : 'Add Area'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input className="pl-10" placeholder="Search by district or city..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Service Areas ({filtered.length})</CardTitle></CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-gray-500">No service areas found.</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">{a.city}</p>
                      <p className="text-sm text-gray-500">{a.district}, {a.state || 'Tamil Nadu'}</p>
                      <Badge color={a.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>{a.is_active ? 'Active' : 'Inactive'}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => toggleArea(a)}><Power className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="danger" onClick={() => deleteArea(a)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
