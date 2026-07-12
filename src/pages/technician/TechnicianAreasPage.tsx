import { useEffect, useState } from 'react'
import { MapPin, Plus, Trash2, Power } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingScreen } from '@/components/LoadingScreen'
import { TAMIL_NADU_DISTRICTS } from '@/lib/constants'
import { createAuditLog } from '@/lib/notifications'
import type { FormEvent } from 'react'

type WorkingArea = { id: string; technician_id: string; district: string; city: string | null; is_available: boolean; created_at: string }

export function TechnicianAreasPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [areas, setAreas] = useState<WorkingArea[]>([])
  const [newDistrict, setNewDistrict] = useState('')
  const [adding, setAdding] = useState(false)

  const fetchAreas = async () => {
    if (!profile) return
    const { data } = await supabase.from('technician_working_areas').select('*').eq('technician_id', profile.id).order('created_at', { ascending: false })
    setAreas((data as WorkingArea[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    let mounted = true;
    (async () => { if (profile) { await fetchAreas(); if (!mounted) return } })()
    return () => { mounted = false }
  }, [profile])

  const addArea = async (e: FormEvent) => {
    e.preventDefault()
    if (!profile || !newDistrict) return
    if (areas.some((a) => a.district === newDistrict)) { toast('Area already added', 'warning'); return }
    setAdding(true)
    const { error } = await supabase.from('technician_working_areas').insert({ technician_id: profile.id, district: newDistrict, is_available: true })
    setAdding(false)
    if (error) { toast('Failed to add area', 'error'); return }
    await createAuditLog(profile.id, 'area_add', 'working_area', null, `Added ${newDistrict}`)
    toast('Area added successfully', 'success')
    setNewDistrict('')
    fetchAreas()
  }

  const removeArea = async (area: WorkingArea) => {
    const { error } = await supabase.from('technician_working_areas').delete().eq('id', area.id)
    if (error) { toast('Failed to remove area', 'error'); return }
    if (profile) await createAuditLog(profile.id, 'area_remove', 'working_area', area.id, `Removed ${area.district}`)
    setAreas((prev) => prev.filter((a) => a.id !== area.id))
    toast('Area removed', 'success')
  }

  const toggleArea = async (area: WorkingArea) => {
    const newVal = !area.is_available
    const { error } = await supabase.from('technician_working_areas').update({ is_available: newVal }).eq('id', area.id)
    if (error) { toast('Failed to update', 'error'); return }
    setAreas((prev) => prev.map((a) => a.id === area.id ? { ...a, is_available: newVal } : a))
    toast(`Area ${newVal ? 'enabled' : 'disabled'}`, 'success')
  }

  if (loading) return <LoadingScreen message="Loading areas..." />

  const availableDistricts = TAMIL_NADU_DISTRICTS.filter((d) => !areas.some((a) => a.district === d))

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Working Areas</h1>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Add New Area</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={addArea} className="flex items-end gap-3">
            <div className="flex-1">
              <Label htmlFor="district">Select District</Label>
              <Select id="district" value={newDistrict} onChange={(e) => setNewDistrict(e.target.value)} required>
                <option value="">Select a district</option>
                {availableDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
              </Select>
            </div>
            <Button type="submit" disabled={adding || !newDistrict}><Plus className="mr-2 h-4 w-4" /> {adding ? 'Adding...' : 'Add Area'}</Button>
          </form>
          {availableDistricts.length === 0 && <p className="mt-2 text-sm text-gray-500">All districts have been added.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">My Working Areas ({areas.length})</CardTitle></CardHeader>
        <CardContent>
          {areas.length === 0 ? (
            <p className="py-8 text-center text-gray-500">No working areas added yet. Add areas to start receiving jobs.</p>
          ) : (
            <div className="space-y-3">
              {areas.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">{a.district}</p>
                      <Badge color={a.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>{a.is_available ? 'Available' : 'Unavailable'}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => toggleArea(a)}><Power className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="danger" onClick={() => removeArea(a)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
