import { useEffect, useState, useMemo } from 'react'
import {
  Loader2, MapPin, Plus, Trash2, Search,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { ServiceArea } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function AdminServiceAreasPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [areas, setAreas] = useState<ServiceArea[]>([])
  const [search, setSearch] = useState('')
  const [newArea, setNewArea] = useState({ district: '', city: '', pincode: '' })
  const [actioning, setActioning] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('service_areas')
        .select('*')
        .order('district', { ascending: true })
        .order('city', { ascending: true })
      if (!mounted) return
      setAreas((data ?? []) as ServiceArea[])
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return areas
    return areas.filter((a) => a.district.toLowerCase().includes(q))
  }, [areas, search])

  const addArea = async () => {
    if (!newArea.district.trim() || !newArea.city.trim() || !newArea.pincode.trim()) return
    setActioning(true)
    try {
      const { data, error } = await supabase
        .from('service_areas')
        .insert({ district: newArea.district, city: newArea.city, pincode: newArea.pincode, is_active: true })
        .select()
        .single()
      if (error) throw error
      setAreas((prev) => [...prev, data as ServiceArea].sort((a, b) => a.district.localeCompare(b.district) || a.city.localeCompare(b.city)))
      setNewArea({ district: '', city: '', pincode: '' })
      toast({ title: 'Service area added', variant: 'success' })
    } catch (err) {
      toast({ title: 'Failed to add area', description: (err as Error).message, variant: 'error' })
    } finally {
      setActioning(false)
    }
  }

  const toggleActive = async (area: ServiceArea) => {
    setActioning(true)
    try {
      const next = !area.is_active
      const { error } = await supabase.from('service_areas').update({ is_active: next }).eq('id', area.id)
      if (error) throw error
      setAreas((prev) => prev.map((a) => a.id === area.id ? { ...a, is_active: next } : a))
      toast({ title: next ? 'Area activated' : 'Area deactivated', variant: 'success' })
    } catch (err) {
      toast({ title: 'Update failed', description: (err as Error).message, variant: 'error' })
    } finally {
      setActioning(false)
    }
  }

  const deleteArea = async (area: ServiceArea) => {
    if (!confirm('Delete this service area?')) return
    setActioning(true)
    try {
      const { error } = await supabase.from('service_areas').delete().eq('id', area.id)
      if (error) throw error
      setAreas((prev) => prev.filter((a) => a.id !== area.id))
      toast({ title: 'Area deleted', variant: 'success' })
    } catch (err) {
      toast({ title: 'Delete failed', description: (err as Error).message, variant: 'error' })
    } finally {
      setActioning(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Service Areas</h1>
        <p className="text-sm text-gray-500">Manage the districts and cities where services are available.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Area</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <Label>District</Label>
              <Input className="mt-1" placeholder="e.g. Chennai" value={newArea.district} onChange={(e) => setNewArea({ ...newArea, district: e.target.value })} />
            </div>
            <div>
              <Label>City</Label>
              <Input className="mt-1" placeholder="e.g. T. Nagar" value={newArea.city} onChange={(e) => setNewArea({ ...newArea, city: e.target.value })} />
            </div>
            <div>
              <Label>Pincode</Label>
              <Input className="mt-1" placeholder="e.g. 600017" value={newArea.pincode} onChange={(e) => setNewArea({ ...newArea, pincode: e.target.value })} />
            </div>
            <div className="flex items-end">
              <Button className="w-full" onClick={addArea} disabled={actioning || !newArea.district.trim() || !newArea.city.trim() || !newArea.pincode.trim()}>
                {actioning ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
                Add Area
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input className="pl-10" placeholder="Search by district..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <MapPin className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-500">No service areas found.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn('rounded-lg p-2', a.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400')}>
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{a.district} — {a.city}</p>
                      <p className="text-sm text-gray-500">Pincode: {a.pincode}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActive(a)}
                      disabled={actioning}
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                        a.is_active ? 'bg-green-500' : 'bg-gray-300',
                      )}
                    >
                      <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform', a.is_active ? 'translate-x-6' : 'translate-x-1')} />
                    </button>
                    <Badge variant={a.is_active ? 'success' : 'secondary'}>
                      {a.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => deleteArea(a)} disabled={actioning}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
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
