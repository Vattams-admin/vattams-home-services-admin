import { useEffect, useState, useCallback } from 'react'
import { Building2, Save, Loader as Loader2, MapPin, Clock, Phone, Globe, Star, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type GoogleBusinessProfile } from '@/lib/supabase'
import { adminApi } from '@/lib/admin-api'
import { useToast } from '@/hooks/use-toast'

type ProfileForm = {
  business_name: string
  business_description: string
  address: string
  service_areas: string
  working_hours: string
  contact_numbers: string
  whatsapp: string
  email: string
  website: string
  maps_link: string
  business_profile_link: string
  review_link: string
}

const emptyForm: ProfileForm = {
  business_name: 'VATTAMS Home Services',
  business_description: '',
  address: '',
  service_areas: '',
  working_hours: '',
  contact_numbers: '',
  whatsapp: '',
  email: '',
  website: '',
  maps_link: '',
  business_profile_link: '',
  review_link: '',
}

export default function AdminGoogleBusinessPage() {
  const toast = useToast()

  const [profileId, setProfileId] = useState<string | null>(null)
  const [form, setForm] = useState<ProfileForm>(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadProfile = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminApi.getGoogleBusinessProfile() as GoogleBusinessProfile | null

      if (data) {
        const p = data
        setProfileId(p.id)
        setForm({
          business_name: p.business_name || 'VATTAMS Home Services',
          business_description: p.business_description || '',
          address: p.address || '',
          service_areas: p.service_areas || '',
          working_hours: p.working_hours || '',
          contact_numbers: p.contact_numbers || '',
          whatsapp: p.whatsapp || '',
          email: p.email || '',
          website: p.website || '',
          maps_link: p.maps_link || '',
          business_profile_link: p.business_profile_link || '',
          review_link: p.review_link || '',
        })
      }
    } catch {
      toast.error('Failed to load Google Business Profile')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  async function saveProfile() {
    if (!form.business_name.trim()) {
      toast.warning('Business name is required')
      return
    }

    setSaving(true)
    try {
      const payload = {
        business_name: form.business_name.trim(),
        business_description: form.business_description.trim() || null,
        address: form.address.trim() || null,
        service_areas: form.service_areas.trim() || null,
        working_hours: form.working_hours.trim() || null,
        contact_numbers: form.contact_numbers.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        email: form.email.trim() || null,
        website: form.website.trim() || null,
        maps_link: form.maps_link.trim() || null,
        business_profile_link: form.business_profile_link.trim() || null,
        review_link: form.review_link.trim() || null,
        updated_at: new Date().toISOString(),
      }

      if (profileId) {
        await adminApi.updateGoogleBusinessProfile(profileId, payload)

        await adminApi.createAuditLog(
          'Admin',
          'update_google_business_profile',
          'google_business_profile',
          profileId,
          `Updated Google Business Profile: ${form.business_name}`,
        )
        toast.success('Google Business Profile updated successfully')
      } else {
        const result = await adminApi.createGoogleBusinessProfile(payload)

        if (result?.data) {
          setProfileId((result.data as GoogleBusinessProfile).id)
        }
        await adminApi.createAuditLog(
          'Admin',
          'create_google_business_profile',
          'google_business_profile',
          null,
          `Created Google Business Profile: ${form.business_name}`,
        )
        toast.success('Google Business Profile created successfully')
      }
    } catch {
      toast.error('Failed to save Google Business Profile')
    } finally {
      setSaving(false)
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Google Business Profile
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your Google Business Profile information
          </p>
        </div>
        <Button onClick={saveProfile} loading={saving}>
          <Save className="mr-1 h-4 w-4" /> Save Changes
        </Button>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <a
          href={form.maps_link || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Card className="hover:border-blue-300 hover:shadow-md transition-all">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Google Maps
                </p>
                <p className="text-xs text-slate-500">View on Maps</p>
              </div>
              <ExternalLink className="ml-auto h-4 w-4 text-slate-400" />
            </CardContent>
          </Card>
        </a>
        <a
          href={form.business_profile_link || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Card className="hover:border-blue-300 hover:shadow-md transition-all">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <Building2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Business Profile
                </p>
                <p className="text-xs text-slate-500">Manage on Google</p>
              </div>
              <ExternalLink className="ml-auto h-4 w-4 text-slate-400" />
            </CardContent>
          </Card>
        </a>
        <a
          href={form.review_link || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Card className="hover:border-blue-300 hover:shadow-md transition-all">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <Star className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Review Link
                </p>
                <p className="text-xs text-slate-500">Customer Reviews</p>
              </div>
              <ExternalLink className="ml-auto h-4 w-4 text-slate-400" />
            </CardContent>
          </Card>
        </a>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-5 w-5 text-slate-500" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Business Name *</Label>
            <Input
              placeholder="VATTAMS Home Services"
              value={form.business_name}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                setForm({ ...form, business_name: e.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Business Description</Label>
            <Textarea
              placeholder="Describe your business..."
              value={form.business_description}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                setForm({ ...form, business_description: e.target.value })
              }
              rows={4}
            />
            <p className="text-xs text-slate-400">
              {form.business_description.length} / 750 characters
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Location & Service Areas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-5 w-5 text-slate-500" />
            Location & Service Areas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Textarea
              placeholder="Full business address..."
              value={form.address}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm({ ...form, address: e.target.value })}
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Service Areas</Label>
            <Textarea
              placeholder="e.g., Chennai, Coimbatore, Madurai, Salem..."
              value={form.service_areas}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                setForm({ ...form, service_areas: e.target.value })
              }
              rows={2}
            />
            <p className="text-xs text-slate-400">
              Comma-separated list of cities or areas you serve
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Working Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-5 w-5 text-slate-500" />
            Working Hours
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          <Label>Working Hours</Label>
          <Textarea
            placeholder="e.g., Mon-Sat: 8:00 AM - 8:00 PM, Sun: 9:00 AM - 5:00 PM"
            value={form.working_hours}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
              setForm({ ...form, working_hours: e.target.value })
            }
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone className="h-5 w-5 text-slate-500" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Contact Numbers</Label>
              <Input
                placeholder="e.g., +91 81898 00757"
                value={form.contact_numbers}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                  setForm({ ...form, contact_numbers: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>WhatsApp Number</Label>
              <Input
                placeholder="e.g., +91 81898 00757"
                value={form.whatsapp}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                  setForm({ ...form, whatsapp: e.target.value })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="info@vattams.net"
                value={form.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Website</Label>
              <Input
                placeholder="https://vattams.net"
                value={form.website}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                  setForm({ ...form, website: e.target.value })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Google Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-5 w-5 text-slate-500" />
            Google Links
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Google Maps Link</Label>
            <Input
              placeholder="https://maps.google.com/..."
              value={form.maps_link}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                setForm({ ...form, maps_link: e.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Google Business Profile Link</Label>
            <Input
              placeholder="https://business.google.com/..."
              value={form.business_profile_link}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                setForm({ ...form, business_profile_link: e.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Google Review Link</Label>
            <Input
              placeholder="https://g.page/.../review"
              value={form.review_link}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                setForm({ ...form, review_link: e.target.value })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveProfile} loading={saving} size="lg">
          <Save className="mr-2 h-4 w-4" /> Save All Changes
        </Button>
      </div>
    </div>
  )
}
