import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { createAuditLog } from '@/lib/notifications'
import { TAMIL_NADU_DISTRICTS } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/LoadingScreen'
import { MapPin, Plus, Trash2, Power } from 'lucide-react'

type WorkingArea = {
  id: string
  technician_id: string
  district: string
  is_available: boolean
  created_at: string
}

export function TechnicianAreasPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [areas, setAreas] = useState<WorkingArea[]>([])
  const [newDistrict, setNewDistrict] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!profile) return
      const { data } = await supabase
        .from('technician_working_areas')
        .select('*')
        .eq('technician_id', profile.id)
        .order('created_at', { ascending: false })
      if (mounted && data) setAreas(data as WorkingArea[])
      if (mounted) setLoading(false)
    })()
    return () => { mounted = false }
  }, [profile])

  const handleAdd = async () => {
    if (!profile || !newDistrict) return
    if (areas.some((a) => a.district === newDistrict)) { toast('Area already added', 'warning'); return }
    setAdding(true)
    const { data, error } = await supabase
      .from('technician_working_areas')
      .insert({ technician_id: profile.id, district: newDistrict, is_available: true })
      .select('*')
      .single()
    if (error) { toast('Failed to add area', 'error'); setAdding(false); return }
    if (data) setAreas((a) => [data as WorkingArea, ...a])
    await createAuditLog(profile.id, 'area_added', 'technician_working_area', (data as WorkingArea)?.id || null, `Added working area: ${newDistrict}`)
    toast('Area added successfully', 'success')
    setNewDistrict('')
    setAdding(false)
  }

  const handleRemove = async (id: string, district: string) => {
    if (!profile) return
    const { error } = await supabase.from('technician_working_areas').delete().eq('id', id)
    if (error) { toast('Failed to remove area', 'error'); return }
    setAreas((a) => a.filter((x) => x.id !== id))
    await createAuditLog(profile.id, 'area_removed', 'technician_working_area', id, `Removed working area: ${district}`)
    toast('Area removed', 'success')
  }

  const handleToggle = async (area: WorkingArea) => {
    if (!profile) return
    const newValue = !area.is_available
    const { error } = await supabase
      .from('technician_working_areas')
      .update({ is_available: newValue })
      .eq('id', area.id)
    if (error) { toast('Failed to update availability', 'error'); return }
    setAreas((a) => a.map((x) => x.id === area.id ? { ...x, is_available: newValue } : x))
    toast(newValue ? 'Now available in this area' : 'Unavailable in this area', 'success')
  }

  if (loading) return <LoadingScreen message="Loading areas..." />

  const availableDistricts = TAMIL_NADU_DISTRICTS.filter((d) => !areas.some((a) => a.district === d))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Working Areas</h1>

      <Card>
        <CardHeader><CardTitle>Add New Area</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Select value={newDistrict} onChange={(e) => setNewDistrict(e.target.value)} className="flex-1">
              <option value="">Select District</option>
              {availableDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>
            <Button onClick={handleAdd} disabled={adding || !newDistrict}>
              <Plus className="mr-2 h-4 w-4" />{adding ? 'Adding...' : 'Add Area'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Your Areas ({areas.length})</CardTitle></CardHeader>
        <CardContent>
          {areas.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <MapPin className="h-12 w-12 text-gray-300" />
              <p className="text-gray-500">No working areas added yet. Add areas to receive job assignments.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {areas.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{a.district}</p>
                      <Badge color={a.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                        {a.is_available ? 'Available' : 'Unavailable'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleToggle(a)}>
                      <Power className="mr-1 h-4 w-4" />{a.is_available ? 'Disable' : 'Enable'}
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleRemove(a.id, a.district)}>
                      <Trash2 className="h-4 w-4" />
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
