import { useEffect, useState } from 'react'
import { Plus, Trash2, Power, BarChart3, Image, MessageSquare, Megaphone, Share2, Link2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { HomepageBanner, PopupAnnouncement, MarketingCampaign, WhatsappTemplate, SocialMediaLink, CampaignMetric } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Textarea, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/LoadingScreen'
import { SOCIAL_PLATFORMS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'

type Tab = 'banners' | 'popups' | 'campaigns' | 'whatsapp' | 'social' | 'analytics'

export function AdminMarketingPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('banners')
  const [banners, setBanners] = useState<HomepageBanner[]>([])
  const [popups, setPopups] = useState<PopupAnnouncement[]>([])
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([])
  const [templates, setTemplates] = useState<WhatsappTemplate[]>([])
  const [socials, setSocials] = useState<SocialMediaLink[]>([])
  const [metrics, setMetrics] = useState<CampaignMetric[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [b, p, c, w, s, m] = await Promise.all([
        supabase.from('homepage_banners').select('*').order('created_at', { ascending: false }),
        supabase.from('popup_announcements').select('*').order('created_at', { ascending: false }),
        supabase.from('marketing_campaigns').select('*').order('created_at', { ascending: false }),
        supabase.from('whatsapp_templates').select('*').order('created_at', { ascending: false }),
        supabase.from('social_media_links').select('*').order('created_at', { ascending: false }),
        supabase.from('campaign_metrics').select('*').order('created_at', { ascending: false }),
      ])
      if (mounted) {
        setBanners((b.data as HomepageBanner[]) || [])
        setPopups((p.data as PopupAnnouncement[]) || [])
        setCampaigns((c.data as MarketingCampaign[]) || [])
        setTemplates((w.data as WhatsappTemplate[]) || [])
        setSocials((s.data as SocialMediaLink[]) || [])
        setMetrics((m.data as CampaignMetric[]) || [])
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const saveItem = async (table: string, fields: Record<string, unknown>, resetForm: Record<string, string>) => {
    const { error } = await supabase.from(table).insert(fields)
    if (error) { toast('Failed to save', 'error'); return }
    toast('Added successfully', 'success')
    setShowForm(false); setForm(resetForm)
    const { data } = await supabase.from(table).select('*').order('created_at', { ascending: false })
    if (table === 'homepage_banners') setBanners((data as HomepageBanner[]) || [])
    if (table === 'popup_announcements') setPopups((data as PopupAnnouncement[]) || [])
    if (table === 'marketing_campaigns') setCampaigns((data as MarketingCampaign[]) || [])
    if (table === 'whatsapp_templates') setTemplates((data as WhatsappTemplate[]) || [])
    if (table === 'social_media_links') setSocials((data as SocialMediaLink[]) || [])
  }

  const toggleItem = async (table: string, id: string, current: boolean, setter: (fn: (prev: unknown[]) => unknown[]) => void) => {
    const { error } = await supabase.from(table).update({ is_active: !current }).eq('id', id)
    if (error) { toast('Failed to update', 'error'); return }
    setter((prev: unknown[]) => prev.map((x) => { const obj = x as Record<string, unknown>; return obj.id === id ? { ...obj, is_active: !current } : x }))
    toast('Updated', 'success')
  }

  const deleteItem = async (table: string, id: string, setter: (fn: (prev: unknown[]) => unknown[]) => void) => {
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) { toast('Failed to delete', 'error'); return }
    setter((prev: unknown[]) => prev.filter((x) => (x as Record<string, unknown>).id !== id))
    toast('Deleted', 'success')
  }

  if (loading) return <LoadingScreen message="Loading marketing data..." />

  const tabs: { key: Tab; label: string; icon: typeof Image }[] = [
    { key: 'banners', label: 'Banners', icon: Image }, { key: 'popups', label: 'Popups', icon: MessageSquare },
    { key: 'campaigns', label: 'Campaigns', icon: Megaphone }, { key: 'whatsapp', label: 'WhatsApp', icon: Share2 },
    { key: 'social', label: 'Social Links', icon: Link2 }, { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  ]

  const renderForm = () => {
    if (tab === 'banners') return (
      <form onSubmit={(e) => { e.preventDefault(); saveItem('homepage_banners', { title: form.title, image_url: form.image_url, link_url: form.link_url, position: form.position || 'top', is_active: true }, {}) }} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div><Label>Title</Label><Input value={form.title || ''} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required /></div>
        <div><Label>Image URL</Label><Input value={form.image_url || ''} onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))} required /></div>
        <div><Label>Link URL</Label><Input value={form.link_url || ''} onChange={(e) => setForm((p) => ({ ...p, link_url: e.target.value }))} /></div>
        <div><Label>Position</Label><Select value={form.position || 'top'} onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))}><option value="top">Top</option><option value="middle">Middle</option><option value="bottom">Bottom</option></Select></div>
        <div className="sm:col-span-2"><Button type="submit" size="sm"><Plus className="mr-1 h-4 w-4" /> Add Banner</Button></div>
      </form>
    )
    if (tab === 'popups') return (
      <form onSubmit={(e) => { e.preventDefault(); saveItem('popup_announcements', { title: form.title, content: form.content, type: form.type || 'info', start_date: form.start_date || null, end_date: form.end_date || null, dismissible: form.dismissible === 'true', is_active: true }, {}) }} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div><Label>Title</Label><Input value={form.title || ''} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required /></div>
        <div><Label>Type</Label><Select value={form.type || 'info'} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}><option value="info">Info</option><option value="promo">Promo</option><option value="announcement">Announcement</option></Select></div>
        <div className="sm:col-span-2"><Label>Content</Label><Textarea value={form.content || ''} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} required /></div>
        <div><Label>Start Date</Label><Input type="date" value={form.start_date || ''} onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))} /></div>
        <div><Label>End Date</Label><Input type="date" value={form.end_date || ''} onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))} /></div>
        <div><Label>Dismissible</Label><Select value={form.dismissible || 'true'} onChange={(e) => setForm((p) => ({ ...p, dismissible: e.target.value }))}><option value="true">Yes</option><option value="false">No</option></Select></div>
        <div className="sm:col-span-2"><Button type="submit" size="sm"><Plus className="mr-1 h-4 w-4" /> Add Popup</Button></div>
      </form>
    )
    if (tab === 'campaigns') return (
      <form onSubmit={(e) => { e.preventDefault(); saveItem('marketing_campaigns', { name: form.name, type: form.type || 'email', channel: form.channel || 'email', target_audience: form.target_audience || null, start_date: form.start_date || null, end_date: form.end_date || null, status: 'active', metrics: {} }, {}) }} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div><Label>Name</Label><Input value={form.name || ''} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required /></div>
        <div><Label>Type</Label><Select value={form.type || 'email'} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}><option value="email">Email</option><option value="sms">SMS</option><option value="social">Social</option><option value="whatsapp">WhatsApp</option></Select></div>
        <div><Label>Channel</Label><Input value={form.channel || ''} onChange={(e) => setForm((p) => ({ ...p, channel: e.target.value }))} placeholder="e.g. email" /></div>
        <div><Label>Target Audience</Label><Input value={form.target_audience || ''} onChange={(e) => setForm((p) => ({ ...p, target_audience: e.target.value }))} placeholder="e.g. all customers" /></div>
        <div><Label>Start Date</Label><Input type="date" value={form.start_date || ''} onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))} /></div>
        <div><Label>End Date</Label><Input type="date" value={form.end_date || ''} onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))} /></div>
        <div className="sm:col-span-2"><Button type="submit" size="sm"><Plus className="mr-1 h-4 w-4" /> Add Campaign</Button></div>
      </form>
    )
    if (tab === 'whatsapp') return (
      <form onSubmit={(e) => { e.preventDefault(); saveItem('whatsapp_templates', { name: form.name, template: form.template, category: form.category || 'general', is_active: true }, {}) }} className="grid grid-cols-1 gap-3">
        <div><Label>Name</Label><Input value={form.name || ''} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required /></div>
        <div><Label>Category</Label><Input value={form.category || ''} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} placeholder="e.g. booking" /></div>
        <div><Label>Template</Label><Textarea value={form.template || ''} onChange={(e) => setForm((p) => ({ ...p, template: e.target.value }))} placeholder="Hi {{name}}, your booking..." required /></div>
        <Button type="submit" size="sm"><Plus className="mr-1 h-4 w-4" /> Add Template</Button>
      </form>
    )
    if (tab === 'social') return (
      <form onSubmit={(e) => { e.preventDefault(); saveItem('social_media_links', { platform: form.platform, url: form.url, icon: form.icon || null, is_active: true }, {}) }} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div><Label>Platform</Label><Select value={form.platform || ''} onChange={(e) => setForm((p) => ({ ...p, platform: e.target.value }))} required><option value="">Select platform</option>{SOCIAL_PLATFORMS.map((s) => <option key={s} value={s}>{s}</option>)}</Select></div>
        <div><Label>URL</Label><Input value={form.url || ''} onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))} required /></div>
        <div><Label>Icon (Optional)</Label><Input value={form.icon || ''} onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))} placeholder="icon name" /></div>
        <div className="sm:col-span-2"><Button type="submit" size="sm"><Plus className="mr-1 h-4 w-4" /> Add Link</Button></div>
      </form>
    )
    return null
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Marketing Dashboard</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => { const Icon = t.icon; return (
          <Button key={t.key} size="sm" variant={tab === t.key ? 'primary' : 'outline'} onClick={() => { setTab(t.key); setShowForm(false); setForm({}) }}>
            <Icon className="mr-1 h-4 w-4" /> {t.label}
          </Button>
        )})}
      </div>

      {tab !== 'analytics' && (
        <Button className="mb-4" variant={showForm ? 'outline' : 'primary'} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : <><Plus className="mr-2 h-4 w-4" /> Add New</>}
        </Button>
      )}

      {showForm && tab !== 'analytics' && (
        <Card className="mb-6"><CardContent className="p-4">{renderForm()}</CardContent></Card>
      )}

      {tab === 'banners' && (
        <div className="space-y-2">
          {banners.map((b) => (
            <Card key={b.id}><CardContent className="flex items-center justify-between p-3">
              <div><p className="font-medium text-gray-900">{b.title}</p><p className="text-sm text-gray-500">Position: {b.position} • Clicks: {b.clicks}</p></div>
              <div className="flex gap-2"><Badge color={b.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>{b.is_active ? 'Active' : 'Inactive'}</Badge>
                <Button size="sm" variant="outline" onClick={() => toggleItem('homepage_banners', b.id, b.is_active, setBanners as (fn: (prev: unknown[]) => unknown[]) => void)}><Power className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="danger" onClick={() => deleteItem('homepage_banners', b.id, setBanners as (fn: (prev: unknown[]) => unknown[]) => void)}><Trash2 className="h-3.5 w-3.5" /></Button></div>
            </CardContent></Card>
          ))}
          {banners.length === 0 && <p className="py-8 text-center text-gray-500">No banners found.</p>}
        </div>
      )}

      {tab === 'popups' && (
        <div className="space-y-2">
          {popups.map((p) => (
            <Card key={p.id}><CardContent className="flex items-center justify-between p-3">
              <div><p className="font-medium text-gray-900">{p.title}</p><p className="text-sm text-gray-500">Type: {p.type} {p.start_date && `• ${formatDate(p.start_date)}`}</p></div>
              <div className="flex gap-2"><Badge color={p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>{p.is_active ? 'Active' : 'Inactive'}</Badge>
                <Button size="sm" variant="outline" onClick={() => toggleItem('popup_announcements', p.id, p.is_active, setPopups as (fn: (prev: unknown[]) => unknown[]) => void)}><Power className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="danger" onClick={() => deleteItem('popup_announcements', p.id, setPopups as (fn: (prev: unknown[]) => unknown[]) => void)}><Trash2 className="h-3.5 w-3.5" /></Button></div>
            </CardContent></Card>
          ))}
          {popups.length === 0 && <p className="py-8 text-center text-gray-500">No popups found.</p>}
        </div>
      )}

      {tab === 'campaigns' && (
        <div className="space-y-2">
          {campaigns.map((c) => (
            <Card key={c.id}><CardContent className="flex items-center justify-between p-3">
              <div><p className="font-medium text-gray-900">{c.name}</p><p className="text-sm text-gray-500">Type: {c.type} • Channel: {c.channel} • Status: {c.status}</p></div>
              <div className="flex gap-2"><Badge color="bg-blue-50 text-blue-700">{c.status}</Badge>
                <Button size="sm" variant="danger" onClick={() => deleteItem('marketing_campaigns', c.id, setCampaigns as (fn: (prev: unknown[]) => unknown[]) => void)}><Trash2 className="h-3.5 w-3.5" /></Button></div>
            </CardContent></Card>
          ))}
          {campaigns.length === 0 && <p className="py-8 text-center text-gray-500">No campaigns found.</p>}
        </div>
      )}

      {tab === 'whatsapp' && (
        <div className="space-y-2">
          {templates.map((t) => (
            <Card key={t.id}><CardContent className="flex items-center justify-between p-3">
              <div><p className="font-medium text-gray-900">{t.name}</p><p className="text-sm text-gray-500">Category: {t.category}</p><p className="text-xs text-gray-400">{t.template.slice(0, 80)}...</p></div>
              <div className="flex gap-2"><Badge color={t.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>{t.is_active ? 'Active' : 'Inactive'}</Badge>
                <Button size="sm" variant="outline" onClick={() => toggleItem('whatsapp_templates', t.id, t.is_active, setTemplates as (fn: (prev: unknown[]) => unknown[]) => void)}><Power className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="danger" onClick={() => deleteItem('whatsapp_templates', t.id, setTemplates as (fn: (prev: unknown[]) => unknown[]) => void)}><Trash2 className="h-3.5 w-3.5" /></Button></div>
            </CardContent></Card>
          ))}
          {templates.length === 0 && <p className="py-8 text-center text-gray-500">No templates found.</p>}
        </div>
      )}

      {tab === 'social' && (
        <div className="space-y-2">
          {socials.map((s) => (
            <Card key={s.id}><CardContent className="flex items-center justify-between p-3">
              <div><p className="font-medium text-gray-900">{s.platform}</p><a href={s.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">{s.url}</a></div>
              <div className="flex gap-2"><Badge color={s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>{s.is_active ? 'Active' : 'Inactive'}</Badge>
                <Button size="sm" variant="outline" onClick={() => toggleItem('social_media_links', s.id, s.is_active, setSocials as (fn: (prev: unknown[]) => unknown[]) => void)}><Power className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="danger" onClick={() => deleteItem('social_media_links', s.id, setSocials as (fn: (prev: unknown[]) => unknown[]) => void)}><Trash2 className="h-3.5 w-3.5" /></Button></div>
            </CardContent></Card>
          ))}
          {socials.length === 0 && <p className="py-8 text-center text-gray-500">No social links found.</p>}
        </div>
      )}

      {tab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card><CardContent className="p-4"><p className="text-sm text-gray-600">Total Impressions</p><p className="text-2xl font-bold">{metrics.reduce((s, m) => s + m.impressions, 0)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-gray-600">Total Clicks</p><p className="text-2xl font-bold">{metrics.reduce((s, m) => s + m.clicks, 0)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-gray-600">Total Conversions</p><p className="text-2xl font-bold">{metrics.reduce((s, m) => s + m.conversions, 0)}</p></CardContent></Card>
          </div>
          <Card><CardHeader><CardTitle className="text-base">Campaign Performance</CardTitle></CardHeader><CardContent>
            <div className="space-y-3">
              {campaigns.map((c) => {
                const cm = metrics.filter((m) => m.campaign_id === c.id)
                const clicks = cm.reduce((s, m) => s + m.clicks, 0)
                const maxClicks = Math.max(...campaigns.map((x) => metrics.filter((m) => m.campaign_id === x.id).reduce((s, m) => s + m.clicks, 0)), 1)
                return (
                  <div key={c.id}>
                    <div className="mb-1 flex justify-between text-sm"><span className="text-gray-700">{c.name}</span><span className="font-medium">{clicks} clicks</span></div>
                    <div className="h-2.5 w-full rounded-full bg-gray-100"><div className="h-2.5 rounded-full bg-blue-500" style={{ width: `${(clicks / maxClicks) * 100}%` }} /></div>
                  </div>
                )
              })}
              {campaigns.length === 0 && <p className="text-center text-gray-500">No campaign data.</p>}
            </div>
          </CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">Banner Click Counts</CardTitle></CardHeader><CardContent>
            <div className="space-y-2">
              {banners.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-2"><span className="text-sm font-medium">{b.title}</span><Badge color="bg-blue-50 text-blue-700">{b.clicks} clicks</Badge></div>
              ))}
              {banners.length === 0 && <p className="text-center text-gray-500">No banner data.</p>}
            </div>
          </CardContent></Card>
        </div>
      )}
    </div>
  )
}
