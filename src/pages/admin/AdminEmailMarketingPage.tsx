import { useEffect, useState } from 'react'
import { Plus, Trash2, Power, Download, Mail, FileText, Send } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { EmailCampaign, EmailTemplate } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { createAuditLog } from '@/lib/notifications'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Textarea, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/LoadingScreen'
import { exportToCSV } from '@/lib/pdf'
import { formatDate } from '@/lib/utils'
import type { FormEvent } from 'react'

type Tab = 'campaigns' | 'templates'

interface CampaignForm { name: string; subject: string; template: string; recipient_type: string; status: string }
const emptyCampaign: CampaignForm = { name: '', subject: '', template: '', recipient_type: 'all', status: 'draft' }
interface TemplateForm { name: string; subject: string; body: string; category: string }
const emptyTemplate: TemplateForm = { name: '', subject: '', body: '', category: 'newsletter' }

export function AdminEmailMarketingPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('campaigns')
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [campaignForm, setCampaignForm] = useState<CampaignForm>(emptyCampaign)
  const [templateForm, setTemplateForm] = useState<TemplateForm>(emptyTemplate)

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [c, t] = await Promise.all([
        supabase.from('email_campaigns').select('*').order('created_at', { ascending: false }),
        supabase.from('email_templates').select('*').order('created_at', { ascending: false }),
      ])
      if (mounted) {
        setCampaigns((c.data as EmailCampaign[]) || [])
        setTemplates((t.data as EmailTemplate[]) || [])
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const saveCampaign = async (e: FormEvent) => {
    e.preventDefault()
    if (!campaignForm.name || !campaignForm.subject) return
    setSaving(true)
    const { error } = await supabase.from('email_campaigns').insert({
      name: campaignForm.name, subject: campaignForm.subject, template: campaignForm.template,
      recipient_type: campaignForm.recipient_type, status: campaignForm.status, sent_count: 0, open_count: 0, click_count: 0,
    })
    setSaving(false)
    if (error) { toast('Failed to create campaign', 'error'); return }
    if (profile) await createAuditLog(profile.id, 'email_campaign_create', 'email_campaign', null, `Created campaign ${campaignForm.name}`)
    toast('Campaign created successfully', 'success')
    setShowForm(false); setCampaignForm(emptyCampaign)
    const { data } = await supabase.from('email_campaigns').select('*').order('created_at', { ascending: false })
    setCampaigns((data as EmailCampaign[]) || [])
  }

  const saveTemplate = async (e: FormEvent) => {
    e.preventDefault()
    if (!templateForm.name || !templateForm.subject) return
    setSaving(true)
    const { error } = await supabase.from('email_templates').insert({
      name: templateForm.name, subject: templateForm.subject, body: templateForm.body,
      category: templateForm.category, is_active: true,
    })
    setSaving(false)
    if (error) { toast('Failed to create template', 'error'); return }
    if (profile) await createAuditLog(profile.id, 'email_template_create', 'email_template', null, `Created template ${templateForm.name}`)
    toast('Template created successfully', 'success')
    setShowForm(false); setTemplateForm(emptyTemplate)
    const { data } = await supabase.from('email_templates').select('*').order('created_at', { ascending: false })
    setTemplates((data as EmailTemplate[]) || [])
  }

  const toggleTemplate = async (t: EmailTemplate) => {
    const { error } = await supabase.from('email_templates').update({ is_active: !t.is_active }).eq('id', t.id)
    if (error) { toast('Failed to update', 'error'); return }
    setTemplates((prev) => prev.map((x) => x.id === t.id ? { ...x, is_active: !x.is_active } : x))
    toast('Template updated', 'success')
  }

  const deleteCampaign = async (c: EmailCampaign) => {
    const { error } = await supabase.from('email_campaigns').delete().eq('id', c.id)
    if (error) { toast('Failed to delete', 'error'); return }
    if (profile) await createAuditLog(profile.id, 'email_campaign_delete', 'email_campaign', c.id, `Deleted campaign ${c.name}`)
    setCampaigns((prev) => prev.filter((x) => x.id !== c.id))
    toast('Campaign deleted', 'success')
  }

  const deleteTemplate = async (t: EmailTemplate) => {
    const { error } = await supabase.from('email_templates').delete().eq('id', t.id)
    if (error) { toast('Failed to delete', 'error'); return }
    setTemplates((prev) => prev.filter((x) => x.id !== t.id))
    toast('Template deleted', 'success')
  }

  const exportCSV = () => {
    const rows = campaigns.map((c) => [c.name, c.subject, c.recipient_type, c.status, c.sent_count, c.open_count, c.click_count, formatDate(c.created_at)])
    exportToCSV('email-campaigns', ['Name', 'Subject', 'Recipients', 'Status', 'Sent', 'Opened', 'Clicked', 'Created'], rows)
    toast('CSV exported', 'success')
  }

  if (loading) return <LoadingScreen message="Loading email marketing..." />

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Email Marketing</h1>
        {tab === 'campaigns' && <Button variant="outline" onClick={exportCSV}><Download className="mr-2 h-4 w-4" /> Export CSV</Button>}
      </div>

      <div className="mb-4 flex gap-2">
        <Button size="sm" variant={tab === 'campaigns' ? 'primary' : 'outline'} onClick={() => { setTab('campaigns'); setShowForm(false) }}><Mail className="mr-1 h-4 w-4" /> Campaigns</Button>
        <Button size="sm" variant={tab === 'templates' ? 'primary' : 'outline'} onClick={() => { setTab('templates'); setShowForm(false) }}><FileText className="mr-1 h-4 w-4" /> Templates</Button>
        <Button size="sm" variant={showForm ? 'outline' : 'primary'} onClick={() => setShowForm(!showForm)}><Plus className="mr-1 h-4 w-4" /> {showForm ? 'Cancel' : 'Add New'}</Button>
      </div>

      {showForm && tab === 'campaigns' && (
        <Card className="mb-6"><CardHeader><CardTitle className="text-base">New Campaign</CardTitle></CardHeader><CardContent>
          <form onSubmit={saveCampaign} className="space-y-4">
            <div><Label>Name</Label><Input value={campaignForm.name} onChange={(e) => setCampaignForm((p) => ({ ...p, name: e.target.value }))} required /></div>
            <div><Label>Subject</Label><Input value={campaignForm.subject} onChange={(e) => setCampaignForm((p) => ({ ...p, subject: e.target.value }))} required /></div>
            <div><Label>Template / Body</Label><Textarea rows={4} value={campaignForm.template} onChange={(e) => setCampaignForm((p) => ({ ...p, template: e.target.value }))} placeholder="Email body..." /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Recipient Type</Label><Select value={campaignForm.recipient_type} onChange={(e) => setCampaignForm((p) => ({ ...p, recipient_type: e.target.value }))}><option value="all">All</option><option value="customers">Customers</option><option value="technicians">Technicians</option></Select></div>
              <div><Label>Status</Label><Select value={campaignForm.status} onChange={(e) => setCampaignForm((p) => ({ ...p, status: e.target.value }))}><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="sent">Sent</option></Select></div>
            </div>
            <Button type="submit" disabled={saving}><Send className="mr-2 h-4 w-4" /> {saving ? 'Creating...' : 'Create Campaign'}</Button>
          </form>
        </CardContent></Card>
      )}

      {showForm && tab === 'templates' && (
        <Card className="mb-6"><CardHeader><CardTitle className="text-base">New Template</CardTitle></CardHeader><CardContent>
          <form onSubmit={saveTemplate} className="space-y-4">
            <div><Label>Name</Label><Input value={templateForm.name} onChange={(e) => setTemplateForm((p) => ({ ...p, name: e.target.value }))} required /></div>
            <div><Label>Subject</Label><Input value={templateForm.subject} onChange={(e) => setTemplateForm((p) => ({ ...p, subject: e.target.value }))} required /></div>
            <div><Label>Body</Label><Textarea rows={4} value={templateForm.body} onChange={(e) => setTemplateForm((p) => ({ ...p, body: e.target.value }))} placeholder="Email template body..." /></div>
            <div><Label>Category</Label><Select value={templateForm.category} onChange={(e) => setTemplateForm((p) => ({ ...p, category: e.target.value }))}><option value="newsletter">Newsletter</option><option value="booking_reminder">Booking Reminder</option><option value="service_reminder">Service Reminder</option><option value="promotional">Promotional</option></Select></div>
            <Button type="submit" disabled={saving}><Plus className="mr-2 h-4 w-4" /> {saving ? 'Creating...' : 'Create Template'}</Button>
          </form>
        </CardContent></Card>
      )}

      {tab === 'campaigns' && (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <Card key={c.id}><CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2"><p className="font-medium text-gray-900">{c.name}</p><Badge color={c.status === 'sent' ? 'bg-green-100 text-green-700' : c.status === 'scheduled' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'}>{c.status}</Badge></div>
                <p className="text-sm text-gray-500">{c.subject}</p>
                <p className="text-xs text-gray-400">Recipients: {c.recipient_type} • Sent: {c.sent_count} • Opened: {c.open_count} • Clicked: {c.click_count} • {formatDate(c.created_at)}</p>
              </div>
              <Button size="sm" variant="danger" onClick={() => deleteCampaign(c)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </CardContent></Card>
          ))}
          {campaigns.length === 0 && <p className="py-8 text-center text-gray-500">No campaigns found.</p>}
        </div>
      )}

      {tab === 'templates' && (
        <div className="space-y-3">
          {templates.map((t) => (
            <Card key={t.id}><CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2"><p className="font-medium text-gray-900">{t.name}</p><Badge color="bg-blue-50 text-blue-700">{t.category}</Badge><Badge color={t.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>{t.is_active ? 'Active' : 'Inactive'}</Badge></div>
                <p className="text-sm text-gray-500">{t.subject}</p>
                <p className="text-xs text-gray-400">{t.body.slice(0, 80)}...</p>
              </div>
              <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => toggleTemplate(t)}><Power className="h-3.5 w-3.5" /></Button><Button size="sm" variant="danger" onClick={() => deleteTemplate(t)}><Trash2 className="h-3.5 w-3.5" /></Button></div>
            </CardContent></Card>
          ))}
          {templates.length === 0 && <p className="py-8 text-center text-gray-500">No templates found.</p>}
        </div>
      )}
    </div>
  )
}
