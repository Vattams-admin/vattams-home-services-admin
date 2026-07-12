import { useEffect, useState } from 'react'
import { MapPin, Plus, Trash2, Power } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { LoadingScreen } from '@/components/LoadingScreen'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { TAMIL_NADU_DISTRICTS } from '@/lib/constants'

type WorkArea = {
  id: string; technician_id: string; district: string
  is_available: boolean; created_at: string
}

export function TechnicianAreasPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [areas, setAreas] = useState<WorkArea[]>([])
  const [newDistrict, setNewDistrict] = useState('')
  const [adding, setAdding] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) return
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from('technician_working_areas').select('*').eq('technician_id', profile.id).order('created_at', { ascending: false })
      if (mounted) { setAreas((data || []) as WorkArea[]); setLoading(false) }
    })()
    return () => { mounted = false }
  }, [profile])

  if (loading) return <LoadingScreen />

  const availableDistricts = TAMIL_NADU_DISTRICTS.filter((d) => !areas.some((a) => a.district === d))

  const addArea = async () => {
    if (!profile || !newDistrict) return
    setAdding(true)
    const { data, error } = await supabase
      .from('technician_working_areas').insert({ technician_id: profile.id, district: newDistrict, is_available: true })
      .select().single()
    if (error) { toast(error.message, 'error'); setAdding(false); return }
    setAreas((prev) => [data as WorkArea, ...prev])
    setNewDistrict('')
    toast('Working area added successfully', 'success')
    setAdding(false)
  }

  const removeArea = async (id: string) => {
    setRemoving(id)
    const { error } = await supabase.from('technician_working_areas').delete().eq('id', id)
    if (error) { toast(error.message, 'error'); setRemoving(null); return }
    setAreas((prev) => prev.filter((a) => a.id !== id))
    toast('Working area removed', 'success')
    setRemoving(null)
  }

  const toggleArea = async (area: WorkArea) => {
    setToggling(area.id)
    const { error } = await supabase
      .from('technician_working_areas').update({ is_available: !area.is_available }).eq('id', area.id)
    if (error) { toast(error.message, 'error'); setToggling(null); return }
    setAreas((prev) => prev.map((a) => a.id === area.id ? { ...a, is_available: !a.is_available } : a))
    toast(`Area is now ${!area.is_available ? 'available' : 'unavailable'}`, 'success')
    setToggling(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Working Areas</h1>
        <p className="text-sm text-gray-600">Manage the districts where you are available to work</p>
      </div>

      {/* Add New Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-blue-600" />Add New Area</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label htmlFor="district">Select District</Label>
              <Select id="district" value={newDistrict} onChange={(e) => setNewDistrict(e.target.value)}>
                <option value="">Select a district</option>
                {availableDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
              </Select>
            </div>
            <Button disabled={!newDistrict || adding} onClick={addArea}>
              <Plus className="mr-2 h-4 w-4" />
              {adding ? 'Adding...' : 'Add Area'}
            </Button>
          </div>
          {availableDistricts.length === 0 && (
            <p className="mt-2 text-sm text-gray-500">All districts have been added. Remove an area to add a different one.</p>
          )}
        </CardContent>
      </Card>

      {/* Existing Areas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-blue-600" />Your Areas ({areas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {areas.length === 0 ? (
            <div className="py-12 text-center">
              <MapPin className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-3 text-gray-500">No working areas added yet. Add a district to start receiving jobs.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {areas.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', a.is_available ? 'bg-green-50' : 'bg-gray-100')}>
                      <MapPin className={cn('h-5 w-5', a.is_available ? 'text-green-600' : 'text-gray-400')} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{a.district}</p>
                      <Badge color={a.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                        {a.is_available ? 'Available' : 'Unavailable'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={toggling === a.id} onClick={() => toggleArea(a)}>
                      <Power className="mr-1 h-4 w-4" />
                      {toggling === a.id ? '...' : a.is_available ? 'Disable' : 'Enable'}
                    </Button>
                    <Button variant="danger" size="sm" disabled={removing === a.id} onClick={() => removeArea(a.id)}>
                      <Trash2 className="mr-1 h-4 w-4" />
                      {removing === a.id ? '...' : 'Remove'}
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
