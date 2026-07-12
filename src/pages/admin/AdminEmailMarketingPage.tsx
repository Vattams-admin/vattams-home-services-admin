import { useEffect, useState, useCallback } from 'react'
import {
  Mail,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
  AlertCircle,
  Eye,
  MousePointerClick,
  Send,
  FileText,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input, Textarea, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/ui/modal'
import { useAuth } from '@/lib/auth'
import {
  supabase,
  type EmailCampaign,
  type EmailTemplate,
} from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import { createAuditLog } from '@/lib/notifications'
import { useToast } from '@/hooks/use-toast'

type CampaignForm = {
  name: string
  subject: string
  template: string
  recipient_type: string
  status: string
}

const emptyCampaign: CampaignForm = {
  name: '',
  subject: '',
  template: '',
  recipient_type: 'all',
  status: 'draft',
}

type TemplateForm = {
  name: string
  subject: string
  body: string
  category: string
  is_active: boolean
}

const emptyTemplate: TemplateForm = {
  name: '',
  subject: '',
  body: '',
  category: 'general',
  is_active: true,
}

const CAMPAIGN_STATUS_COLORS: Record<string, string> = {
  draft: 'gray',
  scheduled: 'blue',
  sending: 'amber',
  sent: 'green',
  failed: 'red',
}

export default function AdminEmailMarketingPage() {
  const { profile } = useAuth()
  const toast = useToast()

  const [activeTab, setActiveTab] = useState<'campaigns' | 'templates'>(
    'campaigns',
  )

  // Campaigns
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [campaignSearch, setCampaignSearch] = useState('')
  const [campaignModal, setCampaignModal] = useState(false)
  const [editingCampaign, setEditingCampaign] =
    useState<EmailCampaign | null>(null)
  const [campaignForm, setCampaignForm] = useState<CampaignForm>(emptyCampaign)
  const [savingCampaign, setSavingCampaign] = useState(false)
  const [deleteCampaignId, setDeleteCampaignId] = useState<string | null>(null)
  const [deletingCampaign, setDeletingCampaign] = useState(false)

  // Templates
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [templateModal, setTemplateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] =
    useState<EmailTemplate | null>(null)
  const [templateForm, setTemplateForm] = useState<TemplateForm>(emptyTemplate)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null)
  const [deletingTemplate, setDeletingTemplate] = useState(false)

  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [campRes, tplRes] = await Promise.all([
        supabase
          .from('email_campaigns')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('email_templates')
          .select('*')
          .order('created_at', { ascending: false }),
      ])

      if (campRes.error) throw campRes.error
      if (tplRes.error) throw tplRes.error

      setCampaigns((campRes.data as EmailCampaign[]) || [])
      setTemplates((tplRes.data as EmailTemplate[]) || [])
    } catch {
      toast.error('Failed to load email marketing data')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Campaign handlers
  function openAddCampaign() {
    setEditingCampaign(null)
    setCampaignForm(emptyCampaign)
    setCampaignModal(true)
  }

  function openEditCampaign(c: EmailCampaign) {
    setEditingCampaign(c)
    setCampaignForm({
      name: c.name || '',
      subject: c.subject || '',
      template: c.template || '',
      recipient_type: c.recipient_type || 'all',
      status: c.status || 'draft',
    })
    setCampaignModal(true)
  }

  async function saveCampaign() {
    if (!campaignForm.name.trim() || !campaignForm.subject.trim()) {
      toast.warning('Campaign name and subject are required')
      return
    }
    setSavingCampaign(true)
    try {
      const payload = {
        name: campaignForm.name.trim(),
        subject: campaignForm.subject.trim(),
        template: campaignForm.template,
        recipient_type: campaignForm.recipient_type,
        status: campaignForm.status,
        updated_at: new Date().toISOString(),
      }

      if (editingCampaign) {
        const { error } = await supabase
          .from('email_campaigns')
          .update(payload)
          .eq('id', editingCampaign.id)
        if (error) throw error
        await createAuditLog(
          profile?.id || '',
          'update_email_campaign',
          'email_campaign',
          editingCampaign.id,
          `Updated email campaign: ${campaignForm.name}`,
        )
        toast.success('Campaign updated successfully')
      } else {
        const { error } = await supabase
          .from('email_campaigns')
          .insert(payload)
        if (error) throw error
        await createAuditLog(
          profile?.id || '',
          'create_email_campaign',
          'email_campaign',
          null,
          `Created email campaign: ${campaignForm.name}`,
        )
        toast.success('Campaign created successfully')
      }
      setCampaignModal(false)
      await loadData()
    } catch {
      toast.error('Failed to save campaign')
    } finally {
      setSavingCampaign(false)
    }
  }

  async function deleteCampaign() {
    if (!deleteCampaignId) return
    setDeletingCampaign(true)
    try {
      const { error } = await supabase
        .from('email_campaigns')
        .delete()
        .eq('id', deleteCampaignId)
      if (error) throw error
      await createAuditLog(
        profile?.id || '',
        'delete_email_campaign',
        'email_campaign',
        deleteCampaignId,
        'Deleted email campaign',
      )
      toast.success('Campaign deleted')
      setDeleteCampaignId(null)
      await loadData()
    } catch {
      toast.error('Failed to delete campaign')
    } finally {
      setDeletingCampaign(false)
    }
  }

  // Template handlers
  function openAddTemplate() {
    setEditingTemplate(null)
    setTemplateForm(emptyTemplate)
    setTemplateModal(true)
  }

  function openEditTemplate(t: EmailTemplate) {
    setEditingTemplate(t)
    setTemplateForm({
      name: t.name || '',
      subject: t.subject || '',
      body: t.body || '',
      category: t.category || 'general',
      is_active: t.is_active,
    })
    setTemplateModal(true)
  }

  async function saveTemplate() {
    if (!templateForm.name.trim() || !templateForm.subject.trim()) {
      toast.warning('Template name and subject are required')
      return
    }
    setSavingTemplate(true)
    try {
      const payload = {
        name: templateForm.name.trim(),
        subject: templateForm.subject.trim(),
        body: templateForm.body.trim(),
        category: templateForm.category,
        is_active: templateForm.is_active,
      }

      if (editingTemplate) {
        const { error } = await supabase
          .from('email_templates')
          .update(payload)
          .eq('id', editingTemplate.id)
        if (error) throw error
        await createAuditLog(
          profile?.id || '',
          'update_email_template',
          'email_template',
          editingTemplate.id,
          `Updated email template: ${templateForm.name}`,
        )
        toast.success('Template updated successfully')
      } else {
        const { error } = await supabase
          .from('email_templates')
          .insert(payload)
        if (error) throw error
        await createAuditLog(
          profile?.id || '',
          'create_email_template',
          'email_template',
          null,
          `Created email template: ${templateForm.name}`,
        )
        toast.success('Template created successfully')
      }
      setTemplateModal(false)
      await loadData()
    } catch {
      toast.error('Failed to save template')
    } finally {
      setSavingTemplate(false)
    }
  }

  async function deleteTemplate() {
    if (!deleteTemplateId) return
    setDeletingTemplate(true)
    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', deleteTemplateId)
      if (error) throw error
      await createAuditLog(
        profile?.id || '',
        'delete_email_template',
        'email_template',
        deleteTemplateId,
        'Deleted email template',
      )
      toast.success('Template deleted')
      setDeleteTemplateId(null)
      await loadData()
    } catch {
      toast.error('Failed to delete template')
    } finally {
      setDeletingTemplate(false)
    }
  }

  const filteredCampaigns = campaignSearch.trim()
    ? campaigns.filter(
        (c) =>
          c.name?.toLowerCase().includes(campaignSearch.toLowerCase()) ||
          c.subject?.toLowerCase().includes(campaignSearch.toLowerCase()),
      )
    : campaigns

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Email Marketing</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage email campaigns and templates
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Campaigns</p>
              <p className="text-xl font-bold text-slate-900">
                {campaigns.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <Send className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Sent</p>
              <p className="text-xl font-bold text-slate-900">
                {campaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <Eye className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Opens</p>
              <p className="text-xl font-bold text-slate-900">
                {campaigns.reduce((sum, c) => sum + (c.open_count || 0), 0)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
              <MousePointerClick className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Clicks</p>
              <p className="text-xl font-bold text-slate-900">
                {campaigns.reduce((sum, c) => sum + (c.click_count || 0), 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'campaigns'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Mail className="h-4 w-4" /> Campaigns
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'templates'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="h-4 w-4" /> Templates
        </button>
      </div>

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search campaigns..."
                value={campaignSearch}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setCampaignSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={openAddCampaign}>
              <Plus className="mr-1 h-4 w-4" /> Add Campaign
            </Button>
          </div>

          {filteredCampaigns.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Mail className="h-12 w-12 text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-500">
                  No email campaigns found
                </p>
                <Button onClick={openAddCampaign} className="mt-3" size="sm">
                  <Plus className="mr-1 h-4 w-4" /> Add First Campaign
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">
                          Subject
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">
                          Recipients
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">
                          Sent
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">
                          Opens
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">
                          Clicks
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">
                          Created
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-slate-700">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCampaigns.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {c.name}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {c.subject}
                          </td>
                          <td className="px-4 py-3">
                            <Badge color="indigo">{c.recipient_type}</Badge>
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {c.sent_count || 0}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {c.open_count || 0}
                            {c.sent_count
                              ? ` (${Math.round(
                                  ((c.open_count || 0) / c.sent_count) * 100,
                                )}%)`
                              : ''}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {c.click_count || 0}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              color={
                                (CAMPAIGN_STATUS_COLORS[c.status] as any) ||
                                'gray'
                              }
                            >
                              {c.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {formatDate(c.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditCampaign(c)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => setDeleteCampaignId(c.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-end">
            <Button onClick={openAddTemplate}>
              <Plus className="mr-1 h-4 w-4" /> Add Template
            </Button>
          </div>

          {templates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="h-12 w-12 text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-500">
                  No email templates found
                </p>
                <Button onClick={openAddTemplate} className="mt-3" size="sm">
                  <Plus className="mr-1 h-4 w-4" /> Add First Template
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((t) => (
                <Card key={t.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{t.name}</CardTitle>
                        <p className="mt-1 text-xs text-slate-500">
                          {t.subject}
                        </p>
                      </div>
                      <Badge color={t.is_active ? 'green' : 'gray'}>
                        {t.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="line-clamp-3 text-sm text-slate-600">
                      {t.body}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge color="blue">{t.category}</Badge>
                      <span className="text-xs text-slate-400">
                        {formatDate(t.created_at)}
                      </span>
                    </div>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditTemplate(t)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => setDeleteTemplateId(t.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Campaign Modal */}
      {campaignModal && (
        <Modal
          title={editingCampaign ? 'Edit Campaign' : 'Add Campaign'}
          onClose={() => setCampaignModal(false)}
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Campaign Name *</Label>
              <Input
                placeholder="e.g., Diwali Special Offer"
                value={campaignForm.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                  setCampaignForm({ ...campaignForm, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Subject *</Label>
              <Input
                placeholder="Email subject line"
                value={campaignForm.subject}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                  setCampaignForm({ ...campaignForm, subject: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Template</Label>
              <Select
                value={campaignForm.template}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                  setCampaignForm({ ...campaignForm, template: e.target.value })
                }
              >
                <option value="">Select template...</option>
                {templates
                  .filter((t) => t.is_active)
                  .map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Recipient Type</Label>
                <Select
                  value={campaignForm.recipient_type}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    setCampaignForm({
                      ...campaignForm,
                      recipient_type: e.target.value,
                    })
                  }
                >
                  <option value="all">All Users</option>
                  <option value="customers">Customers</option>
                  <option value="technicians">Technicians</option>
                  <option value="newsletter">Newsletter Subscribers</option>
                  <option value="inactive">Inactive Users</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={campaignForm.status}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    setCampaignForm({
                      ...campaignForm,
                      status: e.target.value,
                    })
                  }
                >
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="sending">Sending</option>
                  <option value="sent">Sent</option>
                  <option value="failed">Failed</option>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCampaignModal(false)}>
                Cancel
              </Button>
              <Button onClick={saveCampaign} loading={savingCampaign}>
                {editingCampaign ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Template Modal */}
      {templateModal && (
        <Modal
          title={editingTemplate ? 'Edit Template' : 'Add Template'}
          onClose={() => setTemplateModal(false)}
          className="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Template Name *</Label>
                <Input
                  placeholder="e.g., Welcome Email"
                  value={templateForm.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    setTemplateForm({ ...templateForm, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={templateForm.category}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    setTemplateForm({
                      ...templateForm,
                      category: e.target.value,
                    })
                  }
                >
                  <option value="general">General</option>
                  <option value="welcome">Welcome</option>
                  <option value="promotion">Promotion</option>
                  <option value="newsletter">Newsletter</option>
                  <option value="transactional">Transactional</option>
                  <option value="follow_up">Follow Up</option>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Subject *</Label>
              <Input
                placeholder="Email subject"
                value={templateForm.subject}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                  setTemplateForm({ ...templateForm, subject: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Body</Label>
              <Textarea
                placeholder="Email body content..."
                value={templateForm.body}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                  setTemplateForm({ ...templateForm, body: e.target.value })
                }
                rows={8}
              />
              <p className="text-xs text-slate-400">
                Use {'{{name}}'}, {'{{email}}'} for personalization
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="tpl_active"
                checked={templateForm.is_active}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                  setTemplateForm({
                    ...templateForm,
                    is_active: (e.target as HTMLInputElement).checked,
                  })
                }
                className="h-4 w-4 rounded border-slate-300"
              />
              <Label htmlFor="tpl_active">Active</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setTemplateModal(false)}>
                Cancel
              </Button>
              <Button onClick={saveTemplate} loading={savingTemplate}>
                {editingTemplate ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Campaign Confirmation */}
      {deleteCampaignId && (
        <Modal
          title="Delete Campaign"
          onClose={() => setDeleteCampaignId(null)}
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-sm text-slate-600">
                Are you sure you want to delete this email campaign? This action
                cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteCampaignId(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={deleteCampaign}
                loading={deletingCampaign}
              >
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Template Confirmation */}
      {deleteTemplateId && (
        <Modal
          title="Delete Template"
          onClose={() => setDeleteTemplateId(null)}
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-sm text-slate-600">
                Are you sure you want to delete this email template? This action
                cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteTemplateId(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={deleteTemplate}
                loading={deletingTemplate}
              >
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
