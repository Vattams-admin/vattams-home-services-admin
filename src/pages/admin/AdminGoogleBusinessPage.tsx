import { useEffect, useState } from 'react'
import { Save, MapPin, Navigation, Star, ExternalLink, Building2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { GoogleBusinessProfile } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { createAuditLog } from '@/lib/notifications'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingScreen } from '@/components/LoadingScreen'
import { PRIMARY_PHONE, WHATSAPP_NUMBER } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import type { FormEvent } from 'react'

interface GbpForm {
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

const emptyForm: GbpForm = {
  business_name: '', business_description: '', address: '', service_areas: '', working_hours: '',
  contact_numbers: PRIMARY_PHONE, whatsapp: WHATSAPP_NUMBER, email: '', website: '',
  maps_link: '', business_profile_link: '', review_link: '',
}

export function AdminGoogleBusinessPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [form, setForm] = useState<GbpForm>(emptyForm)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.from('google_business_profile').select('*').limit(1).maybeSingle()
      if (!mounted) return
      if (data) {
        const p = data as GoogleBusinessProfile
        setProfileId(p.id)
        setUpdatedAt(p.updated_at)
        setForm({
          business_name: p.business_name || '', business_description: p.business_description || '',
          address: p.address || '', service_areas: p.service_areas || '', working_hours: p.working_hours || '',
          contact_numbers: p.contact_numbers || PRIMARY_PHONE, whatsapp: p.whatsapp || WHATSAPP_NUMBER,
          email: p.email || '', website: p.website || '', maps_link: p.maps_link || '',
          business_profile_link: p.business_profile_link || '', review_link: p.review_link || '',
        })
      }
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.business_name) { toast('Business name is required', 'warning'); return }
    setSaving(true)
    let error: unknown
    if (profileId) {
      const r = await supabase.from('google_business_profile').update({ ...form, updated_at: new Date().toISOString() }).eq('id', profileId)
      error = r.error
    } else {
      const r = await supabase.from('google_business_profile').insert({ ...form }).select().single()
      error = r.error
      if (!error && r.data) { setProfileId((r.data as GoogleBusinessProfile).id) }
    }
    setSaving(false)
    if (error) { toast('Failed to save business profile', 'error'); return }
    if (profile) await createAuditLog(profile.id, 'google_business_update', 'google_business_profile', profileId, `Updated business profile: ${form.business_name}`)
    setUpdatedAt(new Date().toISOString())
    toast('Google Business Profile saved successfully', 'success')
  }

  if (loading) return <LoadingScreen message="Loading Google Business Profile..." />

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Building2 className="h-7 w-7 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Google Business Profile</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Business Information</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={save} className="space-y-4">
              <div><Label>Business Name *</Label><Input value={form.business_name} onChange={(e) => setForm((p) => ({ ...p, business_name: e.target.value }))} placeholder="VATTAMS Home Services" required /></div>
              <div><Label>Business Description</Label><Textarea rows={3} value={form.business_description} onChange={(e) => setForm((p) => ({ ...p, business_description: e.target.value }))} placeholder="Professional home services across Tamil Nadu..." /></div>
              <div><Label>Address</Label><Textarea rows={2} value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} placeholder="Full business address" /></div>
              <div><Label>Service Areas</Label><Input value={form.service_areas} onChange={(e) => setForm((p) => ({ ...p, service_areas: e.target.value }))} placeholder="Chennai, Coimbatore, Madurai..." /></div>
              <div><Label>Working Hours</Label><Input value={form.working_hours} onChange={(e) => setForm((p) => ({ ...p, working_hours: e.target.value }))} placeholder="Mon-Sun: 8:00 AM - 8:00 PM" /></div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div><Label>Contact Numbers</Label><Input value={form.contact_numbers} onChange={(e) => setForm((p) => ({ ...p, contact_numbers: e.target.value }))} placeholder="8189800757" /></div>
                <div><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={(e) => setForm((p) => ({ ...p, whatsapp: e.target.value }))} placeholder="918189800757" /></div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="info@vattams.com" /></div>
                <div><Label>Website</Label><Input value={form.website} onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))} placeholder="https://vattams.com" /></div>
              </div>
              <div><Label>Google Maps Link</Label><Input value={form.maps_link} onChange={(e) => setForm((p) => ({ ...p, maps_link: e.target.value }))} placeholder="https://maps.google.com/..." /></div>
              <div><Label>Business Profile Link</Label><Input value={form.business_profile_link} onChange={(e) => setForm((p) => ({ ...p, business_profile_link: e.target.value }))} placeholder="https://business.google.com/..." /></div>
              <div><Label>Review Link</Label><Input value={form.review_link} onChange={(e) => setForm((p) => ({ ...p, review_link: e.target.value }))} placeholder="https://g.page/r/..." /></div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{updatedAt ? `Last updated: ${formatDate(updatedAt)}` : ''}</span>
                <Button type="submit" disabled={saving}><Save className="mr-2 h-4 w-4" /> {saving ? 'Saving...' : 'Save Profile'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Profile Preview</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="text-lg font-bold text-gray-900">{form.business_name || 'Business Name'}</h3>
                {form.business_description && <p className="mt-2 text-sm text-gray-600">{form.business_description}</p>}
                <div className="mt-3 space-y-1 text-sm text-gray-500">
                  {form.address && <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gray-400" /> {form.address}</p>}
                  {form.working_hours && <p className="flex items-center gap-2"><Navigation className="h-4 w-4 text-gray-400" /> {form.working_hours}</p>}
                  {form.contact_numbers && <p className="flex items-center gap-2"><ExternalLink className="h-4 w-4 text-gray-400" /> {form.contact_numbers}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Customer-Facing Links</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                <a href={form.maps_link || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50" onClick={(e) => !form.maps_link && e.preventDefault()}>
                  <MapPin className="h-5 w-5 text-blue-600" /><div><p className="text-sm font-medium text-gray-900">View on Google Maps</p><p className="text-xs text-gray-500">{form.maps_link || 'Not configured'}</p></div>
                </a>
                <a href={form.maps_link ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(form.address || form.business_name)}` : '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50" onClick={(e) => !form.maps_link && !form.address && e.preventDefault()}>
                  <Navigation className="h-5 w-5 text-green-600" /><div><p className="text-sm font-medium text-gray-900">Get Directions</p><p className="text-xs text-gray-500">Open in Google Maps</p></div>
                </a>
                <a href={form.review_link || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50" onClick={(e) => !form.review_link && e.preventDefault()}>
                  <Star className="h-5 w-5 text-yellow-500" /><div><p className="text-sm font-medium text-gray-900">Leave Google Review</p><p className="text-xs text-gray-500">{form.review_link || 'Not configured'}</p></div>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
