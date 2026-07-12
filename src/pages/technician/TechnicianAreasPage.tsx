import { useEffect, useState } from 'react'
import { MapPin, Plus, Trash2, Power, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/LoadingScreen'
import { cn } from '@/lib/utils'
import { TAMIL_NADU_DISTRICTS } from '@/lib/constants'

type WorkingArea = {
  id: string; technician_id: string; district: string; city: string | null
  is_active: boolean; created_at: string
}

export function TechnicianAreasPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [areas, setAreas] = useState<WorkingArea[]>([])
  const [newDistrict, setNewDistrict] = useState('')
  const [adding, setAdding] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) return
    let mounted = true;
    (async () => {
      const { data } = await supabase.from('technician_working_areas').select('*').eq('technician_id', profile.id).order('created_at', { ascending: false })
      if (!mounted) return
      setAreas((data || []) as WorkingArea[])
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [profile])

  const availableDistricts = TAMIL_NADU_DISTRICTS.filter((d) => !areas.some((a) => a.district === d))

  const addArea = async () => {
    if (!profile || !newDistrict) return
    setAdding(true)
    const { data, error } = await supabase.from('technician_working_areas').insert({ technician_id: profile.id, district: newDistrict, is_active: true }).select('*').single()
    setAdding(false)
    if (error) { toast('Failed to add area', 'error'); return }
    setAreas((prev) => [data as WorkingArea, ...prev])
    setNewDistrict('')
    toast('Working area added', 'success')
  }

  const removeArea = async (id: string) => {
    setActionId(id)
    const { error } = await supabase.from('technician_working_areas').delete().eq('id', id)
    setActionId(null)
    if (error) { toast('Failed to remove area', 'error'); return }
    setAreas((prev) => prev.filter((a) => a.id !== id))
    toast('Working area removed', 'success')
  }

  const toggleActive = async (area: WorkingArea) => {
    setActionId(area.id)
    const { error } = await supabase.from('technician_working_areas').update({ is_active: !area.is_active }).eq('id', area.id)
    setActionId(null)
    if (error) { toast('Failed to update area', 'error'); return }
    setAreas((prev) => prev.map((a) => a.id === area.id ? { ...a, is_active: !a.is_active } : a))
    toast(area.is_active ? 'Area set to inactive' : 'Area set to active', 'success')
  }

  if (loading) return <LoadingScreen message="Loading working areas..." />
  if (!profile) return null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Working Areas</h1>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" />Add New Area</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Select value={newDistrict} onChange={(e) => setNewDistrict(e.target.value)} className="flex-1">
              <option value="">Select a district</option>
              {availableDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>
            <Button onClick={addArea} disabled={!newDistrict || adding}>
              {adding ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adding...</> : <><Plus className="mr-2 h-4 w-4" />Add Area</>}
            </Button>
          </div>
          {availableDistricts.length === 0 && areas.length > 0 && (
            <p className="mt-2 text-sm text-gray-500">All districts have been added.</p>
          )}
        </CardContent>
      </Card>

      {areas.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><MapPin className="mx-auto mb-3 h-12 w-12 text-gray-300" /><p className="text-gray-500">No working areas added yet.</p><p className="mt-1 text-sm text-gray-400">Add districts where you are available to work.</p></CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((a) => (
            <Card key={a.id} className={cn(!a.is_active && 'opacity-60')}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', a.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400')}>
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{a.district}</p>
                    <Badge color={a.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>{a.is_active ? 'Active' : 'Inactive'}</Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => toggleActive(a)} disabled={actionId === a.id}>
                    <Power className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => removeArea(a.id)} disabled={actionId === a.id}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
