import { useEffect, useState, type FormEvent } from 'react'
import { Loader2, Save, Power } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/LoadingScreen'
import { cn, sanitizeInput, VERIFICATION_STATUS_COLORS, VERIFICATION_STATUS_LABELS } from '@/lib/utils'
import { TAMIL_NADU_DISTRICTS } from '@/lib/constants'

type FormState = {
  name: string; mobile: string; experience: string; skills: string
  bio: string; address: string; city: string; district: string; pincode: string
}

export function TechnicianProfilePage() {
  const { profile, refreshProfile } = useAuth()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [form, setForm] = useState<FormState>({
    name: '', mobile: '', experience: '', skills: '', bio: '', address: '', city: '', district: '', pincode: '',
  })

  useEffect(() => {
    if (!profile) return
    setForm({
      name: profile.name || '', mobile: profile.mobile || '',
      experience: profile.experience || '', skills: (profile.skills || []).join(', '),
      bio: profile.bio || '', address: profile.address || '',
      city: profile.city || '', district: profile.district || '', pincode: profile.pincode || '',
    })
  }, [profile])

  const set = (k: keyof FormState, v: string) => setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    const skillsArray = form.skills.split(',').map((s) => sanitizeInput(s)).filter(Boolean)
    const { error } = await supabase.from('profiles').update({
      name: sanitizeInput(form.name), mobile: sanitizeInput(form.mobile),
      experience: sanitizeInput(form.experience) || null, skills: skillsArray.length > 0 ? skillsArray : null,
      bio: sanitizeInput(form.bio) || null, address: sanitizeInput(form.address) || null,
      city: sanitizeInput(form.city) || null, district: form.district || null,
      pincode: sanitizeInput(form.pincode) || null,
    }).eq('id', profile.id)
    setSaving(false)
    if (error) { toast(error.message, 'error'); return }
    await refreshProfile()
    toast('Profile updated successfully!', 'success')
  }

  const toggleAvailability = async () => {
    if (!profile) return
    setToggling(true)
    const newValue = !profile.is_available
    const { error } = await supabase.from('profiles').update({ is_available: newValue }).eq('id', profile.id)
    setToggling(false)
    if (error) { toast('Failed to update availability', 'error'); return }
    await refreshProfile()
    toast(newValue ? 'You are now available for jobs' : 'You are now unavailable', 'success')
  }

  if (!profile) return <LoadingScreen message="Loading profile..." />

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        {profile.verification_status && (
          <Badge color={VERIFICATION_STATUS_COLORS[profile.verification_status] || 'bg-gray-100 text-gray-700'}>
            {VERIFICATION_STATUS_LABELS[profile.verification_status] || profile.verification_status}
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle>Availability</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{profile.is_available ? 'Available for Jobs' : 'Unavailable'}</p>
              <p className="text-sm text-gray-500">Toggle your availability to receive new job assignments</p>
            </div>
            <Button variant={profile.is_available ? 'outline' : 'primary'} onClick={toggleAvailability} disabled={toggling}>
              <Power className="mr-2 h-4 w-4" />{toggling ? 'Updating...' : profile.is_available ? 'Go Unavailable' : 'Go Available'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label htmlFor="name">Full Name *</Label><Input id="name" required value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
            <div><Label htmlFor="mobile">Mobile Number *</Label><Input id="mobile" required pattern="[0-9]{10}" value={form.mobile} onChange={(e) => set('mobile', e.target.value)} placeholder="10-digit mobile number" /></div>
            <div><Label htmlFor="email">Email</Label><Input id="email" value={profile.email} disabled className="bg-gray-50" /></div>
            <div><Label htmlFor="experience">Experience</Label><Input id="experience" value={form.experience} onChange={(e) => set('experience', e.target.value)} placeholder="e.g. 5 years" /></div>
            <div><Label htmlFor="skills">Skills</Label><Input id="skills" value={form.skills} onChange={(e) => set('skills', e.target.value)} placeholder="Comma-separated, e.g. Plumbing, Electrical, Carpentry" /></div>
            <div><Label htmlFor="bio">Bio</Label><Textarea id="bio" rows={3} value={form.bio} onChange={(e) => set('bio', e.target.value)} placeholder="Tell customers about yourself" /></div>
            <div><Label htmlFor="address">Address</Label><Textarea id="address" rows={2} value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Street address" /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label htmlFor="city">City</Label><Input id="city" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="City" /></div>
              <div><Label htmlFor="district">District</Label><Select id="district" value={form.district} onChange={(e) => set('district', e.target.value)}><option value="">Select district</option>{TAMIL_NADU_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}</Select></div>
            </div>
            <div><Label htmlFor="pincode">Pincode</Label><Input id="pincode" pattern="[0-9]{6}" value={form.pincode} onChange={(e) => set('pincode', e.target.value)} placeholder="6-digit pincode" /></div>
            <Button type="submit" className="w-full" disabled={saving}>{saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Save Changes</>}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
