import { useEffect, useState, useCallback } from 'react'
import { Settings, Save, Loader as Loader2, Building2, Phone, MessageCircle, Share2, Clock, CreditCard, FileText, Globe, Palette } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth'
import { supabase, type Settings as SettingsType } from '@/lib/supabase'
import { createAuditLog } from '@/lib/notifications'
import { useToast } from '@/hooks/use-toast'

type FormData = {
  company_name: string
  company_logo: string
  upi_id: string
  gst_number: string
  working_hours: string
  customer_support_phone: string
  technician_support_phone: string
  whatsapp_number: string
  technician_whatsapp_number: string
  email: string
  website: string
  invoice_prefix: string
  theme_primary_color: string
  theme_accent_color: string
  language: string
  google_maps_link: string
  google_business_link: string
  google_review_link: string
  facebook_url: string
  instagram_url: string
  youtube_url: string
  linkedin_url: string
  twitter_url: string
  telegram_url: string
  whatsapp_business_url: string
  ga4_measurement_id: string
  meta_pixel_id: string
  google_site_verification: string
}

const emptyForm: FormData = {
  company_name: '',
  company_logo: '',
  upi_id: '',
  gst_number: '',
  working_hours: '',
  customer_support_phone: '',
  technician_support_phone: '',
  whatsapp_number: '',
  technician_whatsapp_number: '',
  email: '',
  website: '',
  invoice_prefix: '',
  theme_primary_color: '#2563eb',
  theme_accent_color: '#6366f1',
  language: 'en',
  google_maps_link: '',
  google_business_link: '',
  google_review_link: '',
  facebook_url: '',
  instagram_url: '',
  youtube_url: '',
  linkedin_url: '',
  twitter_url: '',
  telegram_url: '',
  whatsapp_business_url: '',
  ga4_measurement_id: '',
  meta_pixel_id: '',
  google_site_verification: '',
}

export default function AdminSettingsPage() {
  const { profile } = useAuth()
  const toast = useToast()

  const [form, setForm] = useState<FormData>(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settingsId, setSettingsId] = useState<string | null>(null)

  const loadSettings = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .maybeSingle()

      if (error) throw error

      if (data) {
        const settings = data as SettingsType
        setSettingsId(settings.id)
        setForm({
          company_name: settings.company_name || '',
          company_logo: settings.company_logo || '',
          upi_id: settings.upi_id || '',
          gst_number: settings.gst_number || '',
          working_hours: settings.working_hours || '',
          customer_support_phone: settings.customer_support_phone || '',
          technician_support_phone: settings.technician_support_phone || '',
          whatsapp_number: settings.whatsapp_number || '',
          technician_whatsapp_number: settings.technician_whatsapp_number || '',
          email: settings.email || '',
          website: settings.website || '',
          invoice_prefix: settings.invoice_prefix || '',
          theme_primary_color: settings.theme_primary_color || '#2563eb',
          theme_accent_color: settings.theme_accent_color || '#6366f1',
          language: settings.language || 'en',
          google_maps_link: settings.google_maps_link || '',
          google_business_link: settings.google_business_link || '',
          google_review_link: settings.google_review_link || '',
          facebook_url: settings.facebook_url || '',
          instagram_url: settings.instagram_url || '',
          youtube_url: settings.youtube_url || '',
          linkedin_url: settings.linkedin_url || '',
          twitter_url: settings.twitter_url || '',
          telegram_url: settings.telegram_url || '',
          whatsapp_business_url: settings.whatsapp_business_url || '',
          ga4_measurement_id: settings.ga4_measurement_id || '',
          meta_pixel_id: settings.meta_pixel_id || '',
          google_site_verification: settings.google_site_verification || '',
        })
      }
    } catch {
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  async function saveSettings() {
    setSaving(true)
    try {
      const updateData = {
        ...form,
        updated_at: new Date().toISOString(),
      }

      if (settingsId) {
        const { error } = await supabase
          .from('settings')
          .update(updateData)
          .eq('id', settingsId)

        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('settings')
          .insert(updateData)
          .select('id')
          .single()

        if (error) throw error
        if (data) setSettingsId(data.id)
      }

      await createAuditLog(
        profile?.id || '',
        'update_settings',
        'settings',
        settingsId,
        'Updated business settings',
      )

      toast.success('Settings saved successfully')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  function updateField(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
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
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your business and platform settings
          </p>
        </div>
        <Button onClick={saveSettings} loading={saving}>
          <Save className="mr-1 h-4 w-4" /> Save Changes
        </Button>
      </div>

      {/* Business Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-slate-500" /> Business
            Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Company Name</Label>
            <Input
              value={form.company_name}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => updateField('company_name', e.target.value)}
              placeholder="VATTAMS Home Services"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Company Logo URL</Label>
            <Input
              value={form.company_logo}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => updateField('company_logo', e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => updateField('email', e.target.value)}
              placeholder="info@vattams.net"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Website</Label>
            <Input
              value={form.website}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => updateField('website', e.target.value)}
              placeholder="https://vattams.net"
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" /> GST Number
              </span>
            </Label>
            <Input
              value={form.gst_number}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                updateField('gst_number', e.target.value.toUpperCase())
              }
              placeholder="33AAAAA0000A1Z5"
              maxLength={15}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Invoice Prefix</Label>
            <Input
              value={form.invoice_prefix}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => updateField('invoice_prefix', e.target.value)}
              placeholder="VAT-INV"
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-slate-500" /> Payment
            Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>UPI ID</Label>
            <Input
              value={form.upi_id}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => updateField('upi_id', e.target.value)}
              placeholder="vattams@upi"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-slate-500" /> Contact Numbers
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Customer Support Phone</Label>
            <Input
              value={form.customer_support_phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                updateField('customer_support_phone', e.target.value)
              }
              placeholder="8189800757"
              maxLength={10}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Technician Support Phone</Label>
            <Input
              value={form.technician_support_phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                updateField('technician_support_phone', e.target.value)
              }
              placeholder="8189800767"
              maxLength={10}
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" /> WhatsApp Number
              </span>
            </Label>
            <Input
              value={form.whatsapp_number}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => updateField('whatsapp_number', e.target.value)}
              placeholder="918189800757"
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" /> Technician WhatsApp
              </span>
            </Label>
            <Input
              value={form.technician_whatsapp_number}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                updateField('technician_whatsapp_number', e.target.value)
              }
              placeholder="918189800767"
            />
          </div>
        </CardContent>
      </Card>

      {/* Working Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-slate-500" /> Working Hours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label>Working Hours</Label>
            <Textarea
              value={form.working_hours}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => updateField('working_hours', e.target.value)}
              placeholder="Mon-Sat: 8:00 AM - 8:00 PM&#10;Sun: 9:00 AM - 5:00 PM"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-slate-500" /> Social Media Links
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Facebook URL</Label>
            <Input
              value={form.facebook_url}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => updateField('facebook_url', e.target.value)}
              placeholder="https://facebook.com/vattams"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Instagram URL</Label>
            <Input
              value={form.instagram_url}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => updateField('instagram_url', e.target.value)}
              placeholder="https://instagram.com/vattams"
            />
          </div>
          <div className="space-y-1.5">
            <Label>YouTube URL</Label>
            <Input
              value={form.youtube_url}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => updateField('youtube_url', e.target.value)}
              placeholder="https://youtube.com/@vattams"
            />
          </div>
          <div className="space-y-1.5">
            <Label>LinkedIn URL</Label>
            <Input
              value={form.linkedin_url}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => updateField('linkedin_url', e.target.value)}
              placeholder="https://linkedin.com/company/vattams"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Twitter / X URL</Label>
            <Input
              value={form.twitter_url}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => updateField('twitter_url', e.target.value)}
              placeholder="https://twitter.com/vattams"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Telegram URL</Label>
            <Input
              value={form.telegram_url}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => updateField('telegram_url', e.target.value)}
              placeholder="https://t.me/vattams"
            />
          </div>
          <div className="space-y-1.5">
            <Label>WhatsApp Business URL</Label>
            <Input
              value={form.whatsapp_business_url}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                updateField('whatsapp_business_url', e.target.value)
              }
              placeholder="https://wa.me/..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Google Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-slate-500" /> Google Links
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Google Maps Link</Label>
            <Input
              value={form.google_maps_link}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => updateField('google_maps_link', e.target.value)}
              placeholder="https://maps.google.com/..."
            />
          </div>
          <div className="space-y-1.5">
            <Label>Google Business Profile</Label>
            <Input
              value={form.google_business_link}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                updateField('google_business_link', e.target.value)
              }
              placeholder="https://business.google.com/..."
            />
          </div>
          <div className="space-y-1.5">
            <Label>Google Review Link</Label>
            <Input
              value={form.google_review_link}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => updateField('google_review_link', e.target.value)}
              placeholder="https://g.page/..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Theme & Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-slate-500" /> Theme & Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Primary Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.theme_primary_color}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                  updateField('theme_primary_color', e.target.value)
                }
                className="h-10 w-16 cursor-pointer rounded border border-slate-300"
              />
              <Input
                value={form.theme_primary_color}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                  updateField('theme_primary_color', e.target.value)
                }
                className="flex-1"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Accent Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.theme_accent_color}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                  updateField('theme_accent_color', e.target.value)
                }
                className="h-10 w-16 cursor-pointer rounded border border-slate-300"
              />
              <Input
                value={form.theme_accent_color}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                  updateField('theme_accent_color', e.target.value)
                }
                className="flex-1"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Default Language</Label>
            <select
              value={form.language}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => updateField('language', e.target.value)}
              className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="en">English</option>
              <option value="ta">Tamil</option>
              <option value="bi">Bilingual</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>GA4 Measurement ID</Label>
            <Input
              value={form.ga4_measurement_id}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => updateField('ga4_measurement_id', e.target.value)}
              placeholder="G-XXXXXXXXXX"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Meta Pixel ID</Label>
            <Input
              value={form.meta_pixel_id}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => updateField('meta_pixel_id', e.target.value)}
              placeholder="1234567890"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Google Site Verification</Label>
            <Input
              value={form.google_site_verification}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                updateField('google_site_verification', e.target.value)
              }
              placeholder="google-site-verification=..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button (Bottom) */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} loading={saving} size="lg">
          <Save className="mr-1 h-4 w-4" /> Save All Changes
        </Button>
      </div>
    </div>
  )
}
