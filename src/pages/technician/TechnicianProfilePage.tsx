import { useEffect, useState } from 'react'
import { User, Phone, MapPin, Wrench, Briefcase, FileText, Power } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingScreen } from '@/components/LoadingScreen'
import { sanitizeInput } from '@/lib/utils'
import { TAMIL_NADU_DISTRICTS } from '@/lib/constants'
import { createAuditLog } from '@/lib/notifications'
import type { FormEvent } from 'react'

export function TechnicianProfilePage() {
  const { profile, refreshProfile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', mobile: '', experience: '', skills: '', bio: '', address: '', city: '', district: '', pincode: '' })

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '', mobile: profile.mobile || '', experience: profile.experience || '',
        skills: (profile.skills || []).join(', '), bio: profile.bio || '',
        address: profile.address || '', city: profile.city || '', district: profile.district || '', pincode: profile.pincode || '',
      })
      setLoading(false)
    }
  }, [profile])

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      name: form.name, mobile: form.mobile, experience: form.experience,
      skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
      bio: form.bio, address: form.address, city: form.city, district: form.district, pincode: form.pincode,
    }).eq('id', profile.id)
    setSaving(false)
    if (error) { toast('Failed to update profile', 'error'); return }
    await refreshProfile()
    await createAuditLog(profile.id, 'profile_update', 'profile', profile.id, 'Technician updated profile')
    toast('Profile updated successfully', 'success')
  }

  const toggleAvailability = async () => {
    if (!profile) return
    const newVal = !profile.is_available
    const { error } = await supabase.from('profiles').update({ is_available: newVal }).eq('id', profile.id)
    if (error) { toast('Failed to toggle status', 'error'); return }
    await refreshProfile()
    toast(`You are now ${newVal ? 'available' : 'unavailable'}`, 'success')
  }

  if (loading) return <LoadingScreen message="Loading profile..." />

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>My Profile</CardTitle>
            <Button size="sm" variant={profile?.is_available ? 'primary' : 'outline'} onClick={toggleAvailability}><Power className="mr-2 h-3.5 w-3.5" /> {profile?.is_available ? 'Available' : 'Unavailable'}</Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <div className="relative"><User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><Input id="name" required value={form.name} onChange={(e) => set('name', sanitizeInput(e.target.value))} className="pl-10" /></div>
            </div>
            <div>
              <Label htmlFor="mobile">Mobile Number</Label>
              <div className="relative"><Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><Input id="mobile" type="tel" required value={form.mobile} onChange={(e) => set('mobile', e.target.value.replace(/[^0-9]/g, ''))} maxLength={10} className="pl-10" /></div>
            </div>
            <div>
              <Label htmlFor="experience">Experience</Label>
              <div className="relative"><Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><Input id="experience" value={form.experience} onChange={(e) => set('experience', sanitizeInput(e.target.value))} placeholder="e.g. 5 years" className="pl-10" /></div>
            </div>
            <div>
              <Label htmlFor="skills">Skills (comma-separated)</Label>
              <div className="relative"><Wrench className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><Input id="skills" value={form.skills} onChange={(e) => set('skills', e.target.value)} placeholder="AC Service, Plumbing" className="pl-10" /></div>
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" rows={3} value={form.bio} onChange={(e) => set('bio', sanitizeInput(e.target.value))} placeholder="Tell us about your expertise" />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" rows={2} value={form.address} onChange={(e) => set('address', sanitizeInput(e.target.value))} placeholder="Your address" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="city">City</Label>
                <div className="relative"><MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><Input id="city" value={form.city} onChange={(e) => set('city', sanitizeInput(e.target.value))} className="pl-10" /></div>
              </div>
              <div>
                <Label htmlFor="district">District</Label>
                <Select id="district" value={form.district} onChange={(e) => set('district', e.target.value)}>
                  <option value="">Select district</option>
                  {TAMIL_NADU_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="pincode">Pincode</Label>
              <Input id="pincode" value={form.pincode} onChange={(e) => set('pincode', e.target.value.replace(/[^0-9]/g, ''))} maxLength={6} placeholder="6-digit pincode" />
            </div>
            <Button type="submit" disabled={saving} className="w-full">{saving ? 'Saving...' : 'Save Changes'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
