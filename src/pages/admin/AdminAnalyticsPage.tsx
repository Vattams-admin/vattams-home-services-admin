import { useEffect, useState } from 'react'
import { Save, Download, BarChart3, Eye, MousePointerClick, Phone, MessageSquare, CalendarCheck, IndianRupee, Activity } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { AnalyticsSettings, AnalyticsEvent } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { createAuditLog } from '@/lib/notifications'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/LoadingScreen'
import { exportToCSV } from '@/lib/pdf'
import { formatDateTime } from '@/lib/utils'
import type { FormEvent } from 'react'

interface AnalyticsForm {
  ga4_measurement_id: string
  ga4_api_secret: string
  meta_pixel_id: string
  meta_access_token: string
  gsc_verification_token: string
  firebase_config: string
}

const emptyForm: AnalyticsForm = {
  ga4_measurement_id: '', ga4_api_secret: '', meta_pixel_id: '', meta_access_token: '',
  gsc_verification_token: '', firebase_config: '',
}

export function AdminAnalyticsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settingsId, setSettingsId] = useState<string | null>(null)
  const [form, setForm] = useState<AnalyticsForm>(emptyForm)
  const [events, setEvents] = useState<AnalyticsEvent[]>([])

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [s, ev] = await Promise.all([
        supabase.from('analytics_settings').select('*').limit(1).maybeSingle(),
        supabase.from('analytics_events').select('*').order('created_at', { ascending: false }).limit(20),
      ])
      if (!mounted) return
      if (s.data) {
        const d = s.data as AnalyticsSettings
        setSettingsId(d.id)
        setForm({
          ga4_measurement_id: d.ga4_measurement_id || '', ga4_api_secret: d.ga4_api_secret || '',
          meta_pixel_id: d.meta_pixel_id || '', meta_access_token: d.meta_access_token || '',
          gsc_verification_token: d.gsc_verification_token || '',
          firebase_config: d.firebase_config ? JSON.stringify(d.firebase_config, null, 2) : '',
        })
      }
      setEvents((ev.data as AnalyticsEvent[]) || [])
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  const save = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    let firebaseConfig: Record<string, unknown> | null = null
    if (form.firebase_config) { try { firebaseConfig = JSON.parse(form.firebase_config) } catch { toast('Invalid JSON in Firebase config', 'error'); setSaving(false); return } }
    const payload = {
      ga4_measurement_id: form.ga4_measurement_id || null, ga4_api_secret: form.ga4_api_secret || null,
      meta_pixel_id: form.meta_pixel_id || null, meta_access_token: form.meta_access_token || null,
      gsc_verification_token: form.gsc_verification_token || null, firebase_config: firebaseConfig,
      updated_at: new Date().toISOString(),
    }
    let error: unknown
    if (settingsId) {
      const r = await supabase.from('analytics_settings').update(payload).eq('id', settingsId)
      error = r.error
    } else {
      const r = await supabase.from('analytics_settings').insert(payload).select().single()
      error = r.error
      if (!error && r.data) setSettingsId((r.data as AnalyticsSettings).id)
    }
    setSaving(false)
    if (error) { toast('Failed to save analytics settings', 'error'); return }
    if (profile) await createAuditLog(profile.id, 'analytics_settings_update', 'analytics_settings', settingsId, 'Updated analytics settings')
    toast('Analytics settings saved successfully', 'success')
  }

  const statFor = (name: string) => events.filter((e) => e.event_name === name).length
  const eventCounts: Record<string, number> = {}
  events.forEach((e) => { eventCounts[e.event_name] = (eventCounts[e.event_name] || 0) + 1 })
  const sortedEvents = Object.entries(eventCounts).sort((a, b) => b[1] - a[1])
  const maxCount = Math.max(...sortedEvents.map((s) => s[1]), 1)

  const exportCSV = () => {
    const rows = events.map((e) => [e.event_name, e.event_category, e.page_url || '', e.session_id || '', formatDateTime(e.created_at)])
    exportToCSV('analytics-events', ['Event Name', 'Category', 'Page URL', 'Session ID', 'Created At'], rows)
    toast('CSV exported', 'success')
  }

  if (loading) return <LoadingScreen message="Loading analytics data..." />

  const stats = [
    { label: 'Total Visitors', value: events.length, icon: Eye, color: 'bg-blue-50 text-blue-600' },
    { label: 'Page Views', value: statFor('page_view'), icon: BarChart3, color: 'bg-cyan-50 text-cyan-600' },
    { label: 'WhatsApp Clicks', value: statFor('whatsapp_click'), icon: MessageSquare, color: 'bg-green-50 text-green-600' },
    { label: 'Call Clicks', value: statFor('call_click'), icon: Phone, color: 'bg-purple-50 text-purple-600' },
    { label: 'Booking Events', value: statFor('booking'), icon: CalendarCheck, color: 'bg-amber-50 text-amber-600' },
    { label: 'Revenue Events', value: statFor('revenue'), icon: IndianRupee, color: 'bg-emerald-50 text-emerald-600' },
  ]

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Analytics & Pixel Settings</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">GA4 Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>GA4 Measurement ID</Label><Input value={form.ga4_measurement_id} onChange={(e) => setForm((p) => ({ ...p, ga4_measurement_id: e.target.value }))} placeholder="G-XXXXXXXXXX" /></div>
            <div><Label>GA4 API Secret</Label><Input value={form.ga4_api_secret} onChange={(e) => setForm((p) => ({ ...p, ga4_api_secret: e.target.value }))} placeholder="API secret key" /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Meta Pixel Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Meta Pixel ID</Label><Input value={form.meta_pixel_id} onChange={(e) => setForm((p) => ({ ...p, meta_pixel_id: e.target.value }))} placeholder="123456789012345" /></div>
            <div><Label>Meta Access Token</Label><Input value={form.meta_access_token} onChange={(e) => setForm((p) => ({ ...p, meta_access_token: e.target.value }))} placeholder="Access token" /></div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">Search Console & Firebase</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Google Search Console Verification Token</Label><Input value={form.gsc_verification_token} onChange={(e) => setForm((p) => ({ ...p, gsc_verification_token: e.target.value }))} placeholder="google-site-verification token" /></div>
          <div><Label>Firebase Config (JSON)</Label><Textarea rows={5} value={form.firebase_config} onChange={(e) => setForm((p) => ({ ...p, firebase_config: e.target.value }))} placeholder='{"apiKey":"...","authDomain":"...","projectId":"..."}' /></div>
          <Button onClick={save} disabled={saving}><Save className="mr-2 h-4 w-4" /> {saving ? 'Saving...' : 'Save Settings'}</Button>
        </CardContent>
      </Card>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Analytics Events</h2>
        <Button variant="outline" onClick={exportCSV}><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => { const Icon = s.icon; return (
          <Card key={s.label}><CardContent className="p-4">
            <div className={`mb-2 inline-flex rounded-lg p-2 ${s.color}`}><Icon className="h-5 w-5" /></div>
            <p className="text-xs text-gray-600">{s.label}</p><p className="text-xl font-bold">{s.value}</p>
          </CardContent></Card>
        )})}
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">Event Breakdown</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sortedEvents.map(([name, count]) => (
              <div key={name} className="flex items-center gap-3">
                <span className="w-40 text-sm font-medium text-gray-700">{name}</span>
                <div className="h-6 flex-1 rounded bg-gray-100"><div className="h-6 rounded bg-blue-500" style={{ width: `${(count / maxCount) * 100}%` }} /></div>
                <span className="w-10 text-right text-sm font-bold text-gray-900">{count}</span>
              </div>
            ))}
            {sortedEvents.length === 0 && <p className="text-center text-gray-500">No events recorded.</p>}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">Recent Events (Latest 20)</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {events.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-gray-400" />
                  <Badge color="bg-blue-50 text-blue-700">{e.event_name}</Badge>
                  <span className="text-sm text-gray-500">{e.page_url || '-'}</span>
                </div>
                <span className="text-xs text-gray-400">{formatDateTime(e.created_at)}</span>
              </div>
            ))}
            {events.length === 0 && <p className="text-center text-gray-500">No events recorded.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
