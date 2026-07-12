import { useEffect, useState, type FormEvent } from 'react'
import { Loader as Loader2, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingScreen } from '@/components/LoadingScreen'
import { sanitizeInput } from '@/lib/utils'
import { TAMIL_NADU_DISTRICTS } from '@/lib/constants'

export function CustomerProfilePage() {
  const { profile, refreshProfile } = useAuth()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', mobile: '', address: '', city: '', district: '', pincode: '' })

  useEffect(() => {
    if (!profile) return
    setForm({
      name: profile.name || '', mobile: profile.mobile || '',
      address: profile.address || '', city: profile.city || '',
      district: profile.district || '', pincode: profile.pincode || '',
    })
  }, [profile])

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      name: sanitizeInput(form.name), mobile: sanitizeInput(form.mobile),
      address: sanitizeInput(form.address) || null, city: sanitizeInput(form.city) || null,
      district: form.district || null, pincode: sanitizeInput(form.pincode) || null,
    }).eq('id', profile.id)
    setSaving(false)
    if (error) { toast(error.message, 'error'); return }
    await refreshProfile()
    toast('Profile updated successfully!', 'success')
  }

  if (!profile) return <LoadingScreen message="Loading profile..." />

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
      <Card>
        <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label htmlFor="name">Full Name *</Label><Input id="name" required value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
            <div><Label htmlFor="mobile">Mobile Number *</Label><Input id="mobile" required pattern="[0-9]{10}" value={form.mobile} onChange={(e) => set('mobile', e.target.value)} placeholder="10-digit mobile number" /></div>
            <div><Label htmlFor="email">Email</Label><Input id="email" value={profile.email} disabled className="bg-gray-50" /></div>
            <div><Label htmlFor="address">Address</Label><Input id="address" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Street address" /></div>
            <div><Label htmlFor="city">City</Label><Input id="city" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="City" /></div>
            <div><Label htmlFor="district">District</Label><Select id="district" value={form.district} onChange={(e) => set('district', e.target.value)}><option value="">Select district</option>{TAMIL_NADU_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}</Select></div>
            <div><Label htmlFor="pincode">Pincode</Label><Input id="pincode" pattern="[0-9]{6}" value={form.pincode} onChange={(e) => set('pincode', e.target.value)} placeholder="6-digit pincode" /></div>
            <Button type="submit" className="w-full" disabled={saving}>{saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Save Changes</>}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
