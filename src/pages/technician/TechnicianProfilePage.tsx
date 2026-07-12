import { useEffect, useState, type FormEvent } from 'react'
import { User, Phone, MapPin, Loader as Loader2, Save, Building2, Mail, Briefcase, Wrench, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { SERVICE_CATEGORIES, SERVICE_CITIES, TAMIL_NADU_DISTRICTS } from '@/lib/constants'
import {
  cn,
  VERIFICATION_STATUS_COLORS,
  VERIFICATION_STATUS_LABELS,
} from '@/lib/utils'

export default function TechnicianProfilePage() {
  const { profile, session, refreshProfile } = useAuth()
  const toast = useToast()

  const [name, setName] = useState(profile?.name || '')
  const [mobile, setMobile] = useState(profile?.mobile || '')
  const [experience, setExperience] = useState(profile?.experience || '')
  const [skills, setSkills] = useState<string[]>(profile?.skills || [])
  const [bio, setBio] = useState(profile?.bio || '')
  const [address, setAddress] = useState(profile?.address || '')
  const [city, setCity] = useState(profile?.city || '')
  const [district, setDistrict] = useState(profile?.district || '')
  const [pincode, setPincode] = useState(profile?.pincode || '')
  const [loading, setLoading] = useState(false)

  const userId = profile?.id || session?.user?.id
  const email = profile?.email || session?.user?.email || ''
  const verificationStatus = profile?.verification_status || 'pending_registration'

  useEffect(() => {
    if (profile) {
      setName(profile.name || '')
      setMobile(profile.mobile || '')
      setExperience(profile.experience || '')
      setSkills(profile.skills || [])
      setBio(profile.bio || '')
      setAddress(profile.address || '')
      setCity(profile.city || '')
      setDistrict(profile.district || '')
      setPincode(profile.pincode || '')
    }
  }, [profile])

  const handleToggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    )
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!userId) {
      toast.error('Authentication required', 'Please log in to update your profile.')
      return
    }

    if (!name.trim()) {
      toast.warning('Name required', 'Please enter your name.')
      return
    }
    if (mobile && mobile.replace(/\D/g, '').length !== 10) {
      toast.warning('Invalid mobile', 'Please enter a valid 10-digit mobile number.')
      return
    }
    if (pincode && pincode.length !== 6) {
      toast.warning('Invalid pincode', 'Pincode must be 6 digits.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: name.trim(),
          full_name: name.trim(),
          mobile: mobile.replace(/\D/g, ''),
          experience: experience.trim() || null,
          skills: skills.length > 0 ? skills : null,
          bio: bio.trim() || null,
          address: address.trim() || null,
          city: city || null,
          district: district || null,
          pincode: pincode || null,
        })
        .eq('id', userId)

      if (error) throw error

      await refreshProfile()
      toast.success('Profile updated', 'Your profile has been saved successfully.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile.'
      toast.error('Update failed', message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          Update your personal information, skills, and service details.
        </p>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600">
            <User className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-lg font-semibold text-slate-900">{profile?.name || 'Technician'}</p>
            <p className="text-sm text-slate-500">{email}</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge className={cn(VERIFICATION_STATUS_COLORS[verificationStatus] || 'bg-gray-100 text-gray-700')}>
                {VERIFICATION_STATUS_LABELS[verificationStatus] || verificationStatus}
              </Badge>
              <span className="text-xs text-slate-400 capitalize">Technician Account</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                <User className="mr-1 inline h-3 w-3" /> Full Name *
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">
                <Mail className="mr-1 inline h-3 w-3" /> Email
              </Label>
              <Input id="email" value={email} disabled className="bg-slate-50" />
              <p className="text-xs text-slate-400">Email cannot be changed. Contact support if needed.</p>
            </div>

            {/* Mobile */}
            <div className="space-y-2">
              <Label htmlFor="mobile">
                <Phone className="mr-1 inline h-3 w-3" /> Mobile Number
              </Label>
              <Input
                id="mobile"
                value={mobile}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit mobile number"
                maxLength={10}
              />
            </div>

            {/* Experience */}
            <div className="space-y-2">
              <Label htmlFor="experience">
                <Briefcase className="mr-1 inline h-3 w-3" /> Experience
              </Label>
              <Input
                id="experience"
                value={experience}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setExperience(e.target.value)}
                placeholder="e.g., 5 years in AC Service and Repair"
              />
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <Label>
                <Wrench className="mr-1 inline h-3 w-3" /> Service Skills
              </Label>
              <p className="text-xs text-slate-500">Select the services you can provide.</p>
              <div className="flex flex-wrap gap-2">
                {SERVICE_CATEGORIES.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleToggleSkill(skill)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-sm transition-colors',
                      skills.includes(skill)
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
                    )}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">
                <FileText className="mr-1 inline h-3 w-3" /> Bio / About
              </Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setBio(e.target.value)}
                placeholder="Brief description about yourself, your expertise, and what makes you reliable..."
                rows={4}
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">
                <MapPin className="mr-1 inline h-3 w-3" /> Street Address
              </Label>
              <Input
                id="address"
                value={address}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setAddress(e.target.value)}
                placeholder="Door no, Street name, Area"
              />
            </div>

            {/* City & District */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">
                  <Building2 className="mr-1 inline h-3 w-3" /> City
                </Label>
                <Select id="city" value={city} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setCity(e.target.value)}>
                  <option value="">Select city</option>
                  {SERVICE_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Select id="district" value={district} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setDistrict(e.target.value)}>
                  <option value="">Select district</option>
                  {TAMIL_NADU_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
              </div>
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

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-1 h-4 w-4" /> Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
