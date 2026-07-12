import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { sanitizeInput } from '@/lib/utils'
import { createAuditLog } from '@/lib/notifications'
import { TAMIL_NADU_DISTRICTS } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingScreen } from '@/components/LoadingScreen'
import { Mail, Phone, MapPin } from 'lucide-react'
import type { FormEvent } from 'react'

export function CustomerProfilePage() {
  const { profile, refreshProfile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [form, setForm] = useState({ name: '', mobile: '', address: '', city: '', district: '', pincode: '' })

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '', mobile: profile.mobile || '',
        address: profile.address || '', city: profile.city || '',
        district: profile.district || '', pincode: profile.pincode || '',
      })
    }
    setPageLoading(false)
  }, [profile])

  const handleChange = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!profile) return
    if (!form.name || !form.mobile) { toast('Name and mobile are required', 'warning'); return }
    setLoading(true)
    const { error } = await supabase.from('profiles').update({
      name: sanitizeInput(form.name), mobile: sanitizeInput(form.mobile),
      address: sanitizeInput(form.address), city: sanitizeInput(form.city),
      district: form.district, pincode: sanitizeInput(form.pincode),
    }).eq('id', profile.id)
    if (error) { toast('Failed to update profile', 'error'); setLoading(false); return }
    await createAuditLog(profile.id, 'profile_updated', 'profile', profile.id, 'Customer updated profile')
    await refreshProfile()
    toast('Profile updated successfully', 'success')
    setLoading(false)
  }

  if (pageLoading) return <LoadingScreen message="Loading profile..." />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

      <Card className="max-w-md">
        <CardHeader><CardTitle>Account Info</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600"><Mail className="h-4 w-4" />{profile?.email}</div>
          <div className="flex items-center gap-2 text-sm text-gray-600"><Phone className="h-4 w-4" />{profile?.mobile}</div>
          {profile?.address && <div className="flex items-center gap-2 text-sm text-gray-600"><MapPin className="h-4 w-4" />{profile.address}, {profile.city}, {profile.district}</div>}
        </CardContent>
      </Card>

      <Card className="max-w-md">
        <CardHeader><CardTitle>Edit Profile</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Full Name *</Label>
              <Input value={form.name} onChange={(e) => handleChange('name', e.target.value)} required />
            </div>
            <div>
              <Label>Mobile *</Label>
              <Input value={form.mobile} onChange={(e) => handleChange('mobile', e.target.value)} maxLength={10} required />
            </div>
            <div>
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => handleChange('address', e.target.value)} placeholder="Street address" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>City</Label>
                <Input value={form.city} onChange={(e) => handleChange('city', e.target.value)} placeholder="City" />
              </div>
              <div>
                <Label>District</Label>
                <Select value={form.district} onChange={(e) => handleChange('district', e.target.value)}>
                  <option value="">Select District</option>
                  {TAMIL_NADU_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </Select>
              </div>
            </div>
            <div>
              <Label>Pincode</Label>
              <Input value={form.pincode} onChange={(e) => handleChange('pincode', e.target.value)} maxLength={6} placeholder="6-digit pincode" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
