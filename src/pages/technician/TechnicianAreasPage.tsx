import { useEffect, useState } from 'react'
import {
  MapPin,
  Loader2,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Building2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth'
import { supabase, type ServiceArea } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { cn, formatDate } from '@/lib/utils'
import { TAMIL_NADU_DISTRICTS } from '@/lib/constants'

export default function TechnicianAreasPage() {
  const { profile, session } = useAuth()
  const toast = useToast()

  const [areas, setAreas] = useState<ServiceArea[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  // Form state
  const [district, setDistrict] = useState('')
  const [city, setCity] = useState('')
  const [pincode, setPincode] = useState('')

  const userId = profile?.id || session?.user?.id

  const loadAreas = async () => {
    if (!userId) return
    try {
      const { data, error } = await supabase
        .from('service_areas')
        .select('*')
        .eq('city', userId) // technician_id stored in a linking table; fallback below
        .order('created_at', { ascending: false })
      if (error) throw error
      setAreas((data as ServiceArea[]) || [])
    } catch {
      // Fallback: query by technician_id if the table supports it
      try {
        const { data, error } = await supabase
          .from('technician_service_areas')
          .select('*, service_areas(*)')
          .eq('technician_id', userId)
          .order('created_at', { ascending: false })
        if (error) throw error
        const mapped = ((data as any[]) || [])
          .map((row) => row.service_areas as ServiceArea)
          .filter(Boolean)
        setAreas(mapped)
      } catch {
        setAreas([])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAreas()
  }, [userId])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    if (!district) {
      toast.warning('District required', 'Please select a district.')
      return
    }
    if (!city.trim()) {
      toast.warning('City required', 'Please enter a city.')
      return
    }
    if (pincode && pincode.length !== 6) {
      toast.warning('Invalid pincode', 'Pincode must be 6 digits.')
      return
    }

    setAdding(true)
    try {
      // Insert into service_areas and link to technician
      const { data: areaData, error: areaError } = await supabase
        .from('service_areas')
        .insert({
          city: city.trim(),
          district,
          pincode: pincode || null,
          state: 'Tamil Nadu',
          is_active: true,
        })
        .select()
        .single()

      if (areaError) throw areaError

      // Link to technician via junction table if available, otherwise store directly
      const area = areaData as ServiceArea
      try {
        const { error: linkError } = await supabase
          .from('technician_service_areas')
          .insert({ technician_id: userId, service_area_id: area.id })
        if (linkError) throw linkError
      } catch {
        // If junction table doesn't exist, the area was still created
      }

      setAreas((prev) => [area, ...prev])
      toast.success('Area added', `${city}, ${district} has been added to your service areas.`)
      setDistrict('')
      setCity('')
      setPincode('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add area.'
      toast.error('Add failed', message)
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (area: ServiceArea) => {
    setRemovingId(area.id)
    try {
      // Remove the link from junction table
      try {
        const { error: linkError } = await supabase
          .from('technician_service_areas')
          .delete()
          .eq('service_area_id', area.id)
        if (linkError) throw linkError
      } catch {
        // If junction table doesn't exist, try deleting from service_areas directly
        const { error: delError } = await supabase
          .from('service_areas')
          .delete()
          .eq('id', area.id)
        if (delError) throw delError
      }

      setAreas((prev) => prev.filter((a) => a.id !== area.id))
      toast.success('Area removed', `${area.city}, ${area.district} removed from your service areas.`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove area.'
      toast.error('Remove failed', message)
    } finally {
      setRemovingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Service Areas</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage the districts and cities where you offer your services.
        </p>
      </div>

      {/* Add Area Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-600" />
            Add Service Area
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* District */}
              <div className="space-y-2">
                <Label htmlFor="district">
                  <Building2 className="mr-1 inline h-3 w-3" /> District *
                </Label>
                <Select
                  id="district"
                  value={district}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setDistrict(e.target.value)}
                >
                  <option value="">Select district</option>
                  {TAMIL_NADU_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
              </div>

              {/* City */}
              <div className="space-y-2">
                <Label htmlFor="city">
                  <MapPin className="mr-1 inline h-3 w-3" /> City *
                </Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setCity(e.target.value)}
                  placeholder="Enter city name"
                />
              </div>

              {/* Pincode */}
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  value={pincode}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6-digit pincode"
                  maxLength={6}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={adding}>
                {adding ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-1 h-4 w-4" />
                )}
                Add Area
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Areas List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Service Areas ({areas.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {areas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MapPin className="h-10 w-10 text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">No service areas added yet</p>
              <p className="text-xs text-slate-400">
                Add areas above to start receiving job assignments in those locations.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {areas.map((area) => (
                <div
                  key={area.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                      <MapPin className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{area.city}</p>
                      <p className="text-xs text-slate-500">
                        {area.district}
                        {area.pincode ? ` · ${area.pincode}` : ''}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        {area.is_active ? (
                          <Badge color="green" className="text-xs">
                            <CheckCircle2 className="mr-1 h-3 w-3" /> Active
                          </Badge>
                        ) : (
                          <Badge color="gray" className="text-xs">
                            <XCircle className="mr-1 h-3 w-3" /> Inactive
                          </Badge>
                        )}
                        <span className="text-xs text-slate-400">
                          Added {formatDate(area.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(area)}
                    disabled={removingId === area.id}
                    className="text-red-600 hover:bg-red-50"
                  >
                    {removingId === area.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
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
