import { useEffect, useState, type FormEvent } from 'react'
import { User, Phone, MapPin, Loader as Loader2, Save, Building2, Mail } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { SERVICE_CITIES, TAMIL_NADU_DISTRICTS } from '@/lib/constants'

export default function CustomerProfilePage() {
  const { profile, session, refreshProfile } = useAuth()
  const toast = useToast()

  const [name, setName] = useState(profile?.name || '')
  const [mobile, setMobile] = useState(profile?.mobile || '')
  const [address, setAddress] = useState(profile?.address || '')
  const [city, setCity] = useState(profile?.city || '')
  const [district, setDistrict] = useState(profile?.district || '')
  const [pincode, setPincode] = useState(profile?.pincode || '')
  const [loading, setLoading] = useState(false)

  const userId = profile?.id || session?.user?.id
  const email = profile?.email || session?.user?.email || ''

  useEffect(() => {
    if (profile) {
      setName(profile.name || '')
      setMobile(profile.mobile || '')
      setAddress(profile.address || '')
      setCity(profile.city || '')
      setDistrict(profile.district || '')
      setPincode(profile.pincode || '')
    }
  }, [profile])

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
        <p className="mt-1 text-sm text-slate-500">Update your personal information and address.</p>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600">
            <User className="h-8 w-8 text-white" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">{profile?.name || 'Customer'}</p>
            <p className="text-sm text-slate-500">{email}</p>
            <p className="text-xs text-slate-400 capitalize">Customer Account</p>
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
