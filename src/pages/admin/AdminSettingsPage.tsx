import { useEffect, useState } from 'react'
import { Save, Calendar, DollarSign, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Settings, ServicePricing, HolidayCalendar } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { createAuditLog } from '@/lib/notifications'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/LoadingScreen'
import { SERVICE_CATEGORIES } from '@/lib/constants'
import { formatDate } from '@/lib/utils'

interface FormState {
  company_name: string; company_logo: string; email: string; website: string
  customer_support_phone: string; technician_support_phone: string; whatsapp_number: string; technician_whatsapp_number: string
  working_hours: string; upi_id: string; invoice_prefix: string
  theme_primary_color: string; theme_accent_color: string; language: string
  facebook_url: string; instagram_url: string; youtube_url: string; linkedin_url: string; twitter_url: string; telegram_url: string; whatsapp_business_url: string
  google_maps_link: string; google_business_link: string; google_review_link: string; ga4_measurement_id: string; meta_pixel_id: string; google_site_verification: string
}

export function AdminSettingsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FormState>({
    company_name: '', company_logo: '', email: '', website: '', customer_support_phone: '', technician_support_phone: '', whatsapp_number: '', technician_whatsapp_number: '',
    working_hours: '', upi_id: '', invoice_prefix: '', theme_primary_color: '#2563eb', theme_accent_color: '#8b5cf6', language: 'en',
    facebook_url: '', instagram_url: '', youtube_url: '', linkedin_url: '', twitter_url: '', telegram_url: '', whatsapp_business_url: '',
    google_maps_link: '', google_business_link: '', google_review_link: '', ga4_measurement_id: '', meta_pixel_id: '', google_site_verification: '',
  })
  const [holidays, setHolidays] = useState<HolidayCalendar[]>([])
  const [pricing, setPricing] = useState<ServicePricing[]>([])
  const [newHoliday, setNewHoliday] = useState({ name: '', date: '', recurring: false })
  const [newPricing, setNewPricing] = useState({ service_name: '', category: '', base_price: '' })

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: s } = await supabase.from('settings').select('*').eq('id', 1).maybeSingle()
      const { data: h } = await supabase.from('holiday_calendar').select('*').order('holiday_date', { ascending: false })
      const { data: p } = await supabase.from('service_pricing').select('*').order('created_at', { ascending: false })
      if (mounted) {
        if (s) {
          const settings = s as Settings
          setForm({
            company_name: settings.company_name || '', company_logo: settings.company_logo || '', email: settings.email || '', website: settings.website || '',
            customer_support_phone: settings.customer_support_phone || '', technician_support_phone: settings.technician_support_phone || '', whatsapp_number: settings.whatsapp_number || '', technician_whatsapp_number: settings.technician_whatsapp_number || '',
            working_hours: settings.working_hours || '', upi_id: settings.upi_id || '', invoice_prefix: settings.invoice_prefix || '',
            theme_primary_color: settings.theme_primary_color || '#2563eb', theme_accent_color: settings.theme_accent_color || '#8b5cf6', language: settings.language || 'en',
            facebook_url: settings.facebook_url || '', instagram_url: settings.instagram_url || '', youtube_url: settings.youtube_url || '', linkedin_url: settings.linkedin_url || '', twitter_url: settings.twitter_url || '', telegram_url: settings.telegram_url || '', whatsapp_business_url: settings.whatsapp_business_url || '',
            google_maps_link: settings.google_maps_link || '', google_business_link: settings.google_business_link || '', google_review_link: settings.google_review_link || '', ga4_measurement_id: settings.ga4_measurement_id || '', meta_pixel_id: settings.meta_pixel_id || '', google_site_verification: settings.google_site_verification || '',
          })
        }
        setHolidays((h as HolidayCalendar[]) || [])
        setPricing((p as ServicePricing[]) || [])
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const save = async () => {
    setSaving(true)
    const { error } = await supabase.from('settings').upsert({ id: 1, ...form })
    setSaving(false)
    if (error) { toast('Failed to save settings', 'error'); return }
    if (profile) await createAuditLog(profile.id, 'settings_update', 'settings', '1', 'Updated settings')
    toast('Settings saved successfully', 'success')
  }

  const addHoliday = async () => {
    if (!newHoliday.name || !newHoliday.date) return
    const { error } = await supabase.from('holiday_calendar').insert({ holiday_name: newHoliday.name, holiday_date: newHoliday.date, is_recurring: newHoliday.recurring })
    if (error) { toast('Failed to add holiday', 'error'); return }
    toast('Holiday added', 'success'); setNewHoliday({ name: '', date: '', recurring: false })
    const { data } = await supabase.from('holiday_calendar').select('*').order('holiday_date', { ascending: false })
    setHolidays((data as HolidayCalendar[]) || [])
  }

  const deleteHoliday = async (id: string) => {
    await supabase.from('holiday_calendar').delete().eq('id', id)
    setHolidays((prev) => prev.filter((h) => h.id !== id))
    toast('Holiday removed', 'success')
  }

  const addPricing = async () => {
    if (!newPricing.service_name || !newPricing.base_price) return
    const { error } = await supabase.from('service_pricing').insert({ service_name: newPricing.service_name, category: newPricing.category || null, base_price: parseFloat(newPricing.base_price), is_active: true })
    if (error) { toast('Failed to add pricing', 'error'); return }
    toast('Pricing added', 'success'); setNewPricing({ service_name: '', category: '', base_price: '' })
    const { data } = await supabase.from('service_pricing').select('*').order('created_at', { ascending: false })
    setPricing((data as ServicePricing[]) || [])
  }

  const deletePricing = async (id: string) => {
    await supabase.from('service_pricing').delete().eq('id', id)
    setPricing((prev) => prev.filter((p) => p.id !== id))
    toast('Pricing removed', 'success')
  }

  if (loading) return <LoadingScreen message="Loading settings..." />

  const set = (k: keyof FormState, v: string) => setForm((prev) => ({ ...prev, [k]: v }))

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <Button onClick={save} disabled={saving}><Save className="mr-2 h-4 w-4" /> {saving ? 'Saving...' : 'Save Settings'}</Button>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Company Info</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><Label>Company Name</Label><Input value={form.company_name} onChange={(e) => set('company_name', e.target.value)} /></div>
            <div><Label>Company Logo URL</Label><Input value={form.company_logo} onChange={(e) => set('company_logo', e.target.value)} /></div>
            <div><Label>Email</Label><Input value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
            <div><Label>Website</Label><Input value={form.website} onChange={(e) => set('website', e.target.value)} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Contact</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><Label>Customer Support Phone</Label><Input value={form.customer_support_phone} onChange={(e) => set('customer_support_phone', e.target.value)} /></div>
            <div><Label>Technician Support Phone</Label><Input value={form.technician_support_phone} onChange={(e) => set('technician_support_phone', e.target.value)} /></div>
            <div><Label>WhatsApp Number</Label><Input value={form.whatsapp_number} onChange={(e) => set('whatsapp_number', e.target.value)} /></div>
            <div><Label>Technician WhatsApp Number</Label><Input value={form.technician_whatsapp_number} onChange={(e) => set('technician_whatsapp_number', e.target.value)} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Business</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div><Label>Working Hours</Label><Input value={form.working_hours} onChange={(e) => set('working_hours', e.target.value)} placeholder="9 AM - 9 PM" /></div>
            <div><Label>UPI ID</Label><Input value={form.upi_id} onChange={(e) => set('upi_id', e.target.value)} /></div>
            <div><Label>Invoice Prefix</Label><Input value={form.invoice_prefix} onChange={(e) => set('invoice_prefix', e.target.value)} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Theme & Language</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div><Label>Primary Color</Label><Input type="color" value={form.theme_primary_color} onChange={(e) => set('theme_primary_color', e.target.value)} className="h-10" /></div>
            <div><Label>Accent Color</Label><Input type="color" value={form.theme_accent_color} onChange={(e) => set('theme_accent_color', e.target.value)} className="h-10" /></div>
            <div><Label>Language</Label><Select value={form.language} onChange={(e) => set('language', e.target.value)}><option value="en">English</option><option value="ta">Tamil</option></Select></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Social Media</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><Label>Facebook URL</Label><Input value={form.facebook_url} onChange={(e) => set('facebook_url', e.target.value)} /></div>
            <div><Label>Instagram URL</Label><Input value={form.instagram_url} onChange={(e) => set('instagram_url', e.target.value)} /></div>
            <div><Label>YouTube URL</Label><Input value={form.youtube_url} onChange={(e) => set('youtube_url', e.target.value)} /></div>
            <div><Label>LinkedIn URL</Label><Input value={form.linkedin_url} onChange={(e) => set('linkedin_url', e.target.value)} /></div>
            <div><Label>Twitter URL</Label><Input value={form.twitter_url} onChange={(e) => set('twitter_url', e.target.value)} /></div>
            <div><Label>Telegram URL</Label><Input value={form.telegram_url} onChange={(e) => set('telegram_url', e.target.value)} /></div>
            <div><Label>WhatsApp Business URL</Label><Input value={form.whatsapp_business_url} onChange={(e) => set('whatsapp_business_url', e.target.value)} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Google & Analytics</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><Label>Google Maps Link</Label><Input value={form.google_maps_link} onChange={(e) => set('google_maps_link', e.target.value)} /></div>
            <div><Label>Google Business Link</Label><Input value={form.google_business_link} onChange={(e) => set('google_business_link', e.target.value)} /></div>
            <div><Label>Google Review Link</Label><Input value={form.google_review_link} onChange={(e) => set('google_review_link', e.target.value)} /></div>
            <div><Label>GA4 Measurement ID</Label><Input value={form.ga4_measurement_id} onChange={(e) => set('ga4_measurement_id', e.target.value)} /></div>
            <div><Label>Meta Pixel ID</Label><Input value={form.meta_pixel_id} onChange={(e) => set('meta_pixel_id', e.target.value)} /></div>
            <div><Label>Google Site Verification</Label><Input value={form.google_site_verification} onChange={(e) => set('google_site_verification', e.target.value)} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base"><Calendar className="mr-2 inline h-4 w-4" /> Holiday Calendar</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap items-end gap-2">
              <div><Label>Name</Label><Input value={newHoliday.name} onChange={(e) => setNewHoliday((p) => ({ ...p, name: e.target.value }))} placeholder="Holiday name" /></div>
              <div><Label>Date</Label><Input type="date" value={newHoliday.date} onChange={(e) => setNewHoliday((p) => ({ ...p, date: e.target.value }))} /></div>
              <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={newHoliday.recurring} onChange={(e) => setNewHoliday((p) => ({ ...p, recurring: e.target.checked }))} /> Recurring</label>
              <Button size="sm" onClick={addHoliday}><Plus className="mr-1 h-4 w-4" /> Add</Button>
            </div>
            <div className="space-y-2">
              {holidays.map((h) => (
                <div key={h.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-2">
                  <div><span className="text-sm font-medium">{h.holiday_name}</span> <span className="text-xs text-gray-500">{formatDate(h.holiday_date)} {h.is_recurring && <Badge color="bg-blue-50 text-blue-700">Recurring</Badge>}</span></div>
                  <Button size="sm" variant="danger" onClick={() => deleteHoliday(h.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              ))}
              {holidays.length === 0 && <p className="text-center text-sm text-gray-500">No holidays added.</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base"><DollarSign className="mr-2 inline h-4 w-4" /> Service Pricing</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap items-end gap-2">
              <div><Label>Service Name</Label><Input value={newPricing.service_name} onChange={(e) => setNewPricing((p) => ({ ...p, service_name: e.target.value }))} placeholder="e.g. AC Service" /></div>
              <div><Label>Category</Label><Select value={newPricing.category} onChange={(e) => setNewPricing((p) => ({ ...p, category: e.target.value }))}><option value="">Select category</option>{SERVICE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</Select></div>
              <div><Label>Base Price</Label><Input type="number" value={newPricing.base_price} onChange={(e) => setNewPricing((p) => ({ ...p, base_price: e.target.value }))} placeholder="0" /></div>
              <Button size="sm" onClick={addPricing}><Plus className="mr-1 h-4 w-4" /> Add</Button>
            </div>
            <div className="space-y-2">
              {pricing.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-2">
                  <div><span className="text-sm font-medium">{p.service_name}</span> {p.category && <Badge color="bg-gray-50 text-gray-700">{p.category}</Badge>} <span className="text-sm text-gray-500">₹{p.base_price}</span></div>
                  <Button size="sm" variant="danger" onClick={() => deletePricing(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              ))}
              {pricing.length === 0 && <p className="text-center text-sm text-gray-500">No pricing added.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
