import { useEffect, useState } from 'react'
import { Loader as Loader2, MapPin, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { ServiceArea } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type WorkingArea = {
  id: string
  technician_id: string
  district: string
  city: string
  pincode: string
  created_at: string
}

export function TechnicianAreasPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [areas, setAreas] = useState<WorkingArea[]>([])
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ district: '', city: '', pincode: '' })

  useEffect(() => {
    if (!profile?.id) return
    let mounted = true
    ;(async () => {
      setLoading(true)
      const [wa, sa] = await Promise.all([
        supabase.from('technician_working_areas').select('*').eq('technician_id', profile.id).order('created_at', { ascending: false }),
        supabase.from('service_areas').select('*').eq('is_active', true).order('district', { ascending: true }),
      ])
      if (!mounted) return
      setAreas((wa.data ?? []) as WorkingArea[])
      setServiceAreas((sa.data ?? []) as ServiceArea[])
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [profile?.id])

  const uniqueDistricts = [...new Set(serviceAreas.map((s) => s.district))].sort()
  const cityOptions = serviceAreas.filter((s) => !form.district || s.district === form.district)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.id || !form.district || !form.city || !form.pincode) return
    setSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('technician_working_areas')
        .insert({ technician_id: profile.id, ...form })
        .select()
        .single()
      if (error) throw error
      setAreas((prev) => [data as WorkingArea, ...prev])
      setForm({ district: '', city: '', pincode: '' })
      toast({ title: 'Working area added', variant: 'success' })
    } catch (err) {
      toast({ title: 'Failed to add area', description: (err as Error).message, variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('technician_working_areas').delete().eq('id', id)
      if (error) throw error
      setAreas((prev) => prev.filter((a) => a.id !== id))
      toast({ title: 'Area removed', variant: 'success' })
    } catch (err) {
      toast({ title: 'Delete failed', description: (err as Error).message, variant: 'error' })
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
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Working Areas</h1>

      <Card>
        <CardHeader><CardTitle>Add New Area</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="district">District</Label>
              <Select id="district" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value, city: '' })} required>
                <option value="">Select district</option>
                {uniqueDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Select id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required disabled={!form.district}>
                <option value="">Select city</option>
                {[...new Set(cityOptions.map((s) => s.city))].map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pincode">Pincode</Label>
              <Input id="pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} placeholder="e.g. 600001" required />
            </div>
            <div className="sm:col-span-3">
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                {submitting ? 'Adding...' : 'Add Area'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Current Areas ({areas.length})</CardTitle></CardHeader>
        <CardContent>
          {areas.length === 0 ? (
            <div className="py-12 text-center">
              <MapPin className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-500">No working areas added yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {areas.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{a.district}</p>
                      <p className="text-sm text-gray-500">{a.city} · {a.pincode}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(a.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
