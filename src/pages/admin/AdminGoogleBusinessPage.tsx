import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Building2, Save, Loader as Loader2, MapPin, Clock, Phone, Globe,
  Star, ExternalLink, Copy, Check, MapPinned, AlertCircle, FileText,
} from 'lucide-react'
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

function isValidUrl(url: string): boolean {
  if (!url.trim()) return true
  try {
    const u = new URL(url.trim())
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export default function AdminGoogleBusinessPage() {
  const toast = useToast()

  const [profileId, setProfileId] = useState<string | null>(null)
  const [form, setForm] = useState<ProfileForm>(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadProfile = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminApi.getGoogleBusinessProfile() as GoogleBusinessProfile | null

      if (data) {
        setProfileId(data.id)
        setForm({
          business_name: data.business_name || 'VATTAMS Home Services',
          business_description: data.business_description || '',
          address: data.address || '',
          service_areas: data.service_areas || '',
          working_hours: data.working_hours || '',
          contact_numbers: data.contact_numbers || '',
          whatsapp: data.whatsapp || '',
          email: data.email || '',
          website: data.website || '',
          maps_link: data.maps_link || '',
          business_profile_link: data.business_profile_link || '',
          review_link: data.review_link || '',
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

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
    }
  }, [])

  function updateField<K extends keyof ProfileForm>(key: K, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function copyToClipboard(text: string, field: string, label: string) {
    if (!text.trim()) {
      toast.warning(`No ${label} available to copy`)
      return
    }
    try {
      await navigator.clipboard.writeText(text.trim())
      setCopiedField(field)
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
      copiedTimerRef.current = setTimeout(() => setCopiedField(null), 2000)
      toast.success(`${label} copied to clipboard`)
    } catch {
      toast.error(`Failed to copy ${label}`)
    }
  }

  function openInMaps() {
    if (!form.maps_link.trim()) {
      toast.warning('No Google Maps URL saved. Please add one first.')
      return
    }
    if (!isValidUrl(form.maps_link)) {
      toast.error('Invalid Google Maps URL')
      return
    }
    window.open(form.maps_link.trim(), '_blank', 'noopener,noreferrer')
  }

  async function saveProfile() {
    if (!form.business_name.trim()) {
      toast.warning('Business name is required')
      return
    }

    const urlFields: Array<[string, string]> = [
      ['website', form.website],
      ['maps_link', form.maps_link],
      ['business_profile_link', form.business_profile_link],
      ['review_link', form.review_link],
    ]
    for (const [field, value] of urlFields) {
      if (value.trim() && !isValidUrl(value)) {
        toast.error(`Invalid URL in ${field.replace(/_/g, ' ')}`)
        return
      }
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
        const result = await adminApi.createGoogleBusinessProfile(payload) as GoogleBusinessProfile | null
        if (result?.id) setProfileId(result.id)
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

  const hasProfile = !!profileId || !!form.maps_link || !!form.business_profile_link || !!form.review_link

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Google Business Profile</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your Google Business Profile information</p>
        </div>
        <Button onClick={saveProfile} loading={saving} className="w-full sm:w-auto">
          <Save className="mr-1 h-4 w-4" /> Save Changes
        </Button>
      </div>

      {/* No Profile Instructions */}
      {!hasProfile && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-900">No Google Business Profile Found</h3>
                <p className="text-sm text-slate-600">
                  To get started, create a Google Business Profile for VATTAMS Home Services:
                </p>
                <ol className="ml-5 list-decimal space-y-1 text-sm text-slate-600">
                  <li>Go to <a href="https://business.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">business.google.com</a> and sign in with your Google account.</li>
                  <li>Click "Add your business" and enter "VATTAMS Home Services" as the business name.</li>
                  <li>Select your business category (e.g., "Home Service" or "Cleaning Service").</li>
                  <li>Add your business address and service areas.</li>
                  <li>Verify your business via phone, email, or postcard.</li>
                  <li>Once verified, copy your Maps URL, Business Profile URL, and Review Link into the fields below.</li>
                </ol>
                <a href="https://business.google.com" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="mt-2">
                    <ExternalLink className="mr-1 h-4 w-4" /> Go to Google Business
                  </Button>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Get Google Maps URL */}
        <Card className="hover:border-blue-300 hover:shadow-md transition-all">
          <CardContent className="flex flex-col items-start gap-3 p-4">
            <div className="flex w-full items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                <MapPinned className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">Google Maps</p>
                <p className="text-xs text-slate-500">Open location in Maps</p>
              </div>
            </div>
            <Button onClick={openInMaps} variant="outline" size="sm" className="w-full">
              <MapPin className="mr-1 h-4 w-4" /> Get Google Maps URL
            </Button>
          </CardContent>
        </Card>

        {/* Copy Business URL */}
        <Card className="hover:border-green-300 hover:shadow-md transition-all">
          <CardContent className="flex flex-col items-start gap-3 p-4">
            <div className="flex w-full items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100">
                <Building2 className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">Business URL</p>
                <p className="text-xs text-slate-500">Copy profile link</p>
              </div>
            </div>
            <Button
              onClick={() => copyToClipboard(form.business_profile_link, 'business', 'Business URL')}
              variant="outline"
              size="sm"
              className="w-full"
            >
              {copiedField === 'business' ? <Check className="mr-1 h-4 w-4 text-green-600" /> : <Copy className="mr-1 h-4 w-4" />}
              {copiedField === 'business' ? 'Copied!' : 'Copy Business URL'}
            </Button>
          </CardContent>
        </Card>

        {/* Copy Review Link */}
        <Card className="hover:border-amber-300 hover:shadow-md transition-all">
          <CardContent className="flex flex-col items-start gap-3 p-4">
            <div className="flex w-full items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                <Star className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">Review Link</p>
                <p className="text-xs text-slate-500">Copy review link</p>
              </div>
            </div>
            <Button
              onClick={() => copyToClipboard(form.review_link, 'review', 'Review Link')}
              variant="outline"
              size="sm"
              className="w-full"
            >
              {copiedField === 'review' ? <Check className="mr-1 h-4 w-4 text-green-600" /> : <Copy className="mr-1 h-4 w-4" />}
              {copiedField === 'review' ? 'Copied!' : 'Copy Review Link'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* External Links */}
      {(form.maps_link || form.business_profile_link || form.review_link) && (
        <div className="flex flex-wrap gap-3">
          {form.maps_link && (
            <a href={form.maps_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:border-blue-300 hover:bg-blue-50">
              <MapPin className="h-4 w-4 text-blue-600" /> View on Maps <ExternalLink className="h-3 w-3 text-slate-400" />
            </a>
          )}
          {form.business_profile_link && (
            <a href={form.business_profile_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:border-green-300 hover:bg-green-50">
              <Building2 className="h-4 w-4 text-green-600" /> Manage on Google <ExternalLink className="h-3 w-3 text-slate-400" />
            </a>
          )}
          {form.review_link && (
            <a href={form.review_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:border-amber-300 hover:bg-amber-50">
              <Star className="h-4 w-4 text-amber-600" /> View Reviews <ExternalLink className="h-3 w-3 text-slate-400" />
            </a>
          )}
        </div>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-5 w-5 text-slate-500" /> Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Business Name *</Label>
            <Input
              placeholder="VATTAMS Home Services"
              value={form.business_name}
              onChange={(e) => updateField('business_name', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Business Description</Label>
            <Textarea
              placeholder="Describe your business..."
              value={form.business_description}
              onChange={(e) => updateField('business_description', e.target.value)}
              rows={4}
            />
            <p className="text-xs text-slate-400">{form.business_description.length} / 750 characters</p>
          </div>
        </CardContent>
      </Card>

      {/* Location & Service Areas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-5 w-5 text-slate-500" /> Location & Service Areas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Textarea
              placeholder="Full business address..."
              value={form.address}
              onChange={(e) => updateField('address', e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Service Areas</Label>
            <Textarea
              placeholder="e.g., Chennai, Coimbatore, Madurai, Salem..."
              value={form.service_areas}
              onChange={(e) => updateField('service_areas', e.target.value)}
              rows={2}
            />
            <p className="text-xs text-slate-400">Comma-separated list of cities or areas you serve</p>
          </div>
        </CardContent>
      </Card>

      {/* Working Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-5 w-5 text-slate-500" /> Working Hours
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          <Label>Working Hours</Label>
          <Textarea
            placeholder="e.g., Mon-Sat: 8:00 AM - 8:00 PM, Sun: 9:00 AM - 5:00 PM"
            value={form.working_hours}
            onChange={(e) => updateField('working_hours', e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone className="h-5 w-5 text-slate-500" /> Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Contact Numbers</Label>
              <Input
                placeholder="e.g., +91 81898 00757"
                value={form.contact_numbers}
                onChange={(e) => updateField('contact_numbers', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>WhatsApp Number</Label>
              <Input
                placeholder="e.g., +91 81898 00757"
                value={form.whatsapp}
                onChange={(e) => updateField('whatsapp', e.target.value)}
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
                onChange={(e) => updateField('email', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Website</Label>
              <Input
                placeholder="https://vattams.net"
                value={form.website}
                onChange={(e) => updateField('website', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Google Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-5 w-5 text-slate-500" /> Google Links
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Google Maps Link</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="https://maps.google.com/..."
                value={form.maps_link}
                onChange={(e) => updateField('maps_link', e.target.value)}
                className="flex-1"
              />
              <Button onClick={() => copyToClipboard(form.maps_link, 'maps', 'Maps URL')} variant="outline" size="sm" className="shrink-0">
                {copiedField === 'maps' ? <Check className="mr-1 h-4 w-4 text-green-600" /> : <Copy className="mr-1 h-4 w-4" />}
                {copiedField === 'maps' ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            {form.maps_link && !isValidUrl(form.maps_link) && (
              <p className="text-xs text-red-500">Please enter a valid URL (starting with http:// or https://)</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Google Business Profile Link</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="https://business.google.com/..."
                value={form.business_profile_link}
                onChange={(e) => updateField('business_profile_link', e.target.value)}
                className="flex-1"
              />
              <Button onClick={() => copyToClipboard(form.business_profile_link, 'business', 'Business URL')} variant="outline" size="sm" className="shrink-0">
                {copiedField === 'business' ? <Check className="mr-1 h-4 w-4 text-green-600" /> : <Copy className="mr-1 h-4 w-4" />}
                {copiedField === 'business' ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            {form.business_profile_link && !isValidUrl(form.business_profile_link) && (
              <p className="text-xs text-red-500">Please enter a valid URL (starting with http:// or https://)</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Google Review Link</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="https://g.page/.../review"
                value={form.review_link}
                onChange={(e) => updateField('review_link', e.target.value)}
                className="flex-1"
              />
              <Button onClick={() => copyToClipboard(form.review_link, 'review', 'Review Link')} variant="outline" size="sm" className="shrink-0">
                {copiedField === 'review' ? <Check className="mr-1 h-4 w-4 text-green-600" /> : <Copy className="mr-1 h-4 w-4" />}
                {copiedField === 'review' ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            {form.review_link && !isValidUrl(form.review_link) && (
              <p className="text-xs text-red-500">Please enter a valid URL (starting with http:// or https://)</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveProfile} loading={saving} size="lg" className="w-full sm:w-auto">
          <Save className="mr-2 h-4 w-4" /> Save All Changes
        </Button>
      </div>
    </div>
  )
}
