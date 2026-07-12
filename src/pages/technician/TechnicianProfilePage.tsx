import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { sanitizeInput, VERIFICATION_STATUS_COLORS, VERIFICATION_STATUS_LABELS } from '@/lib/utils'
import { createAuditLog } from '@/lib/notifications'
import { TAMIL_NADU_DISTRICTS } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/LoadingScreen'
import { Mail, Phone, MapPin, Power } from 'lucide-react'
import type { FormEvent } from 'react'

export function TechnicianProfilePage() {
  const { profile, refreshProfile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [form, setForm] = useState({
    name: '', mobile: '', experience: '', skills: '', bio: '',
    address: '', city: '', district: '', pincode: '',
  })

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '', mobile: profile.mobile || '',
        experience: profile.experience || '',
        skills: (profile.skills || []).join(', '),
        bio: profile.bio || '',
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
    const skillsArray = form.skills.split(',').map((s) => sanitizeInput(s)).filter(Boolean)
    const { error } = await supabase.from('profiles').update({
      name: sanitizeInput(form.name), mobile: sanitizeInput(form.mobile),
      experience: sanitizeInput(form.experience), skills: skillsArray,
      bio: sanitizeInput(form.bio), address: sanitizeInput(form.address),
      city: sanitizeInput(form.city), district: form.district,
      pincode: sanitizeInput(form.pincode),
    }).eq('id', profile.id)
    if (error) { toast('Failed to update profile', 'error'); setLoading(false); return }
    await createAuditLog(profile.id, 'profile_updated', 'profile', profile.id, 'Technician updated profile')
    await refreshProfile()
    toast('Profile updated successfully', 'success')
    setLoading(false)
  }

  const toggleAvailability = async () => {
    if (!profile) return
    setToggling(true)
    const newValue = !profile.is_available
    const { error } = await supabase.from('profiles').update({ is_available: newValue }).eq('id', profile.id)
    if (error) { toast('Failed to update availability', 'error'); setToggling(false); return }
    await refreshProfile()
    toast(newValue ? 'You are now available for jobs' : 'You are now unavailable', 'success')
    setToggling(false)
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
          {profile?.verification_status && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Verification:</span>
              <Badge color={VERIFICATION_STATUS_COLORS[profile.verification_status]}>
                {VERIFICATION_STATUS_LABELS[profile.verification_status] || profile.verification_status}
              </Badge>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Availability:</span>
            <Button size="sm" variant={profile?.is_available ? 'danger' : 'primary'} onClick={toggleAvailability} disabled={toggling}>
              <Power className="mr-2 h-4 w-4" />
              {toggling ? 'Updating...' : profile?.is_available ? 'Available (Disable)' : 'Unavailable (Enable)'}
            </Button>
          </div>
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
              <Label>Experience (years)</Label>
              <Input value={form.experience} onChange={(e) => handleChange('experience', e.target.value)} placeholder="e.g. 5" />
            </div>
            <div>
              <Label>Skills (comma-separated)</Label>
              <Input value={form.skills} onChange={(e) => handleChange('skills', e.target.value)} placeholder="e.g. Plumbing, Electrical, Carpentry" />
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea value={form.bio} onChange={(e) => handleChange('bio', e.target.value)} placeholder="Brief description of your experience" rows={3} />
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
