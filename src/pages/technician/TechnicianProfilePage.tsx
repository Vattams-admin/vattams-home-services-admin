import { useEffect, useState } from 'react'
import { Loader2, Mail, Shield, UserCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function TechnicianProfilePage() {
  const { profile, refreshProfile } = useAuth()
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: '', mobile: '', address: '', city: '', district: '', pincode: '',
    experience: '', skills: '', bio: '',
  })

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name ?? '',
        mobile: profile.mobile ?? '',
        address: profile.address ?? '',
        city: profile.city ?? '',
        district: profile.district ?? '',
        pincode: profile.pincode ?? '',
        experience: profile.experience ?? '',
        skills: (profile.skills ?? []).join(', '),
        bio: profile.bio ?? '',
      })
    }
  }, [profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.id) return
    setSubmitting(true)
    try {
      const skillsArr = form.skills.split(',').map((s) => s.trim()).filter(Boolean)
      const { error } = await supabase
        .from('profiles')
        .update({
          name: form.name,
          mobile: form.mobile,
          address: form.address,
          city: form.city,
          district: form.district,
          pincode: form.pincode,
          experience: form.experience,
          skills: skillsArr,
          bio: form.bio,
        })
        .eq('id', profile.id)
      if (error) throw error
      await refreshProfile()
      toast({ title: 'Profile updated', description: 'Your changes have been saved.', variant: 'success' })
    } catch (err) {
      toast({ title: 'Update failed', description: (err as Error).message, variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const skillsList = form.skills.split(',').map((s) => s.trim()).filter(Boolean)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

      <Card>
        <CardHeader><CardTitle>Account Information</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-sm font-medium text-gray-900">{profile.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Role</p>
              <Badge variant="purple">{profile.role}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <UserCircle className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <Badge variant={profile.status === 'active' ? 'success' : 'warning'}>{profile.status}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Edit Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mobile">Mobile</Label>
              <Input id="mobile" required value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street address" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="district">District</Label>
                <Input id="district" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pincode">Pincode</Label>
              <Input id="pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="experience">Experience</Label>
              <Input id="experience" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} placeholder="e.g. 5 years" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="skills">Skills (comma-separated)</Label>
              <Input id="skills" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="e.g. Plumbing, Electrical, Carpentry" />
              {skillsList.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {skillsList.map((s, i) => (
                    <Badge key={i} variant="info">{s}</Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell customers about yourself..." />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
