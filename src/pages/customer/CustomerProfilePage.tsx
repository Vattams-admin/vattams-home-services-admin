import { useEffect, useState, type FormEvent } from 'react'
import { User, Phone, MapPin, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { LoadingScreen } from '@/components/LoadingScreen'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sanitizeInput } from '@/lib/utils'
import { TAMIL_NADU_DISTRICTS, SERVICE_CITIES } from '@/lib/constants'
import { createAuditLog } from '@/lib/notifications'

export function CustomerProfilePage() {
  const { profile, refreshProfile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '', mobile: '', address: '', city: '', district: '', pincode: '',
  })

  useEffect(() => {
    if (!profile) return
    setForm({
      name: profile.name || '',
      mobile: profile.mobile || '',
      address: profile.address || '',
      city: profile.city || '',
      district: profile.district || '',
      pincode: profile.pincode || '',
    })
    setLoading(false)
  }, [profile])

  if (loading) return <LoadingScreen />

  const update = (k: string, v: string) => setForm({ ...form, [k]: v })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        name: sanitizeInput(form.name),
        mobile: form.mobile,
        address: sanitizeInput(form.address),
        city: form.city,
        district: form.district,
        pincode: form.pincode,
      })
      .eq('id', profile.id)
    if (error) { toast(error.message, 'error'); setSaving(false); return }
    await refreshProfile()
    await createAuditLog(profile.id, 'profile_updated', 'profile', profile.id, 'Customer updated their profile')
    toast('Profile updated successfully!', 'success')
    setSaving(false)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-600">Update your personal information</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle>{profile?.name}</CardTitle>
              <p className="text-sm text-gray-500">{profile?.email}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" required value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Your full name" />
              </div>
              <div>
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input id="mobile" required value={form.mobile} onChange={(e) => update('mobile', e.target.value)} placeholder="9876543210" maxLength={10} pattern="[0-9]{10}" />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="House no, Street, Landmark" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="city">City</Label>
                <Select id="city" value={form.city} onChange={(e) => update('city', e.target.value)}>
                  <option value="">Select city</option>
                  {SERVICE_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
              <div>
                <Label htmlFor="district">District</Label>
                <Select id="district" value={form.district} onChange={(e) => update('district', e.target.value)}>
                  <option value="">Select district</option>
                  {TAMIL_NADU_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </Select>
              </div>
              <div>
                <Label htmlFor="pincode">Pincode</Label>
                <Input id="pincode" value={form.pincode} onChange={(e) => update('pincode', e.target.value)} placeholder="600001" maxLength={6} pattern="[0-9]{6}" />
              </div>
            </div>

            <Button type="submit" disabled={saving} className="w-full sm:w-auto">
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
