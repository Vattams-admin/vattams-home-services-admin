import { useEffect, useState, useCallback } from 'react'
import { Megaphone, Plus, Pencil, Trash2, Loader as Loader2, Search, CircleAlert as AlertCircle, Image, Bell, Eye, MousePointerClick, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input, Textarea, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/ui/modal'
import {
  type MarketingCampaign,
  type HomepageBanner,
  type PopupAnnouncement,
} from '@/lib/supabase'
import { adminApi } from '@/lib/admin-api'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

type CampaignForm = {
  name: string
  type: string
  channel: string
  target_audience: string
  status: string
  start_date: string
  end_date: string
}

const emptyCampaign: CampaignForm = {
  name: '',
  type: 'promotion',
  channel: 'email',
  target_audience: 'all',
  status: 'draft',
  start_date: '',
  end_date: '',
}

type BannerForm = {
  title: string
  image_url: string
  link_url: string
  position: string
  is_active: boolean
}

const emptyBanner: BannerForm = {
  title: '',
  image_url: '',
  link_url: '',
  position: 'top',
  is_active: true,
}

type PopupForm = {
  title: string
  content: string
  type: string
  is_active: boolean
  start_date: string
  end_date: string
  dismissible: boolean
}

const emptyPopup: PopupForm = {
  title: '',
  content: '',
  type: 'info',
  is_active: true,
  start_date: '',
  end_date: '',
  dismissible: true,
}

const CAMPAIGN_STATUS_COLORS: Record<string, string> = {
  draft: 'gray',
  active: 'green',
  paused: 'amber',
  completed: 'blue',
  cancelled: 'red',
}

export default function AdminMarketingPage() {
  const toast = useToast()

  const [activeTab, setActiveTab] = useState<'campaigns' | 'banners' | 'popups'>(
    'campaigns',
  )

  // Campaigns
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([])
  const [campaignSearch, setCampaignSearch] = useState('')
  const [campaignModal, setCampaignModal] = useState(false)
  const [editingCampaign, setEditingCampaign] =
    useState<MarketingCampaign | null>(null)
  const [campaignForm, setCampaignForm] = useState<CampaignForm>(emptyCampaign)
  const [savingCampaign, setSavingCampaign] = useState(false)
  const [deleteCampaignId, setDeleteCampaignId] = useState<string | null>(null)
  const [deletingCampaign, setDeletingCampaign] = useState(false)

  // Banners
  const [banners, setBanners] = useState<HomepageBanner[]>([])
  const [bannerModal, setBannerModal] = useState(false)
  const [editingBanner, setEditingBanner] = useState<HomepageBanner | null>(
    null,
  )
  const [bannerForm, setBannerForm] = useState<BannerForm>(emptyBanner)
  const [savingBanner, setSavingBanner] = useState(false)
  const [deleteBannerId, setDeleteBannerId] = useState<string | null>(null)
  const [deletingBanner, setDeletingBanner] = useState(false)

  // Popups
  const [popups, setPopups] = useState<PopupAnnouncement[]>([])
  const [popupModal, setPopupModal] = useState(false)
  const [editingPopup, setEditingPopup] = useState<PopupAnnouncement | null>(
    null,
  )
  const [popupForm, setPopupForm] = useState<PopupForm>(emptyPopup)
  const [savingPopup, setSavingPopup] = useState(false)
  const [deletePopupId, setDeletePopupId] = useState<string | null>(null)
  const [deletingPopup, setDeletingPopup] = useState(false)

  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [campRes, banRes, popRes] = await Promise.all([
        adminApi.getMarketingCampaigns(),
        adminApi.getHomepageBanners(),
        adminApi.getPopupAnnouncements(),
      ])

      setCampaigns(campRes.data || [])
      setBanners(banRes.data || [])
      setPopups(popRes.data || [])
    } catch {
      toast.error('Failed to load marketing data')
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

  function openEditCampaign(c: MarketingCampaign) {
    setEditingCampaign(c)
    setCampaignForm({
      name: c.name || '',
      type: c.type || 'promotion',
      channel: c.channel || 'email',
      target_audience: c.target_audience || 'all',
      status: c.status || 'draft',
      start_date: c.start_date
        ? new Date(c.start_date).toISOString().slice(0, 10)
        : '',
      end_date: c.end_date
        ? new Date(c.end_date).toISOString().slice(0, 10)
        : '',
    })
    setCampaignModal(true)
  }

  async function saveCampaign() {
    if (!campaignForm.name.trim()) {
      toast.warning('Campaign name is required')
      return
    }
    setSavingCampaign(true)
    try {
      const payload = {
        name: campaignForm.name.trim(),
        type: campaignForm.type,
        channel: campaignForm.channel,
        target_audience: campaignForm.target_audience,
        status: campaignForm.status,
        start_date: campaignForm.start_date
          ? new Date(campaignForm.start_date).toISOString()
          : null,
        end_date: campaignForm.end_date
          ? new Date(campaignForm.end_date + 'T23:59:59').toISOString()
          : null,
      }

      if (editingCampaign) {
        await adminApi.updateMarketingCampaign(editingCampaign.id, payload)
        await adminApi.createAuditLog(
          'Admin',
          'update_campaign',
          'marketing_campaign',
          editingCampaign.id,
          `Updated campaign: ${campaignForm.name}`,
        )
        toast.success('Campaign updated successfully')
      } else {
        await adminApi.createMarketingCampaign(payload)
        await adminApi.createAuditLog(
          'Admin',
          'create_campaign',
          'marketing_campaign',
          null,
          `Created campaign: ${campaignForm.name}`,
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
      await adminApi.deleteMarketingCampaign(deleteCampaignId)
      await adminApi.createAuditLog(
        'Admin',
        'delete_campaign',
        'marketing_campaign',
        deleteCampaignId,
        'Deleted campaign',
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

  // Banner handlers
  function openAddBanner() {
    setEditingBanner(null)
    setBannerForm(emptyBanner)
    setBannerModal(true)
  }

  function openEditBanner(b: HomepageBanner) {
    setEditingBanner(b)
    setBannerForm({
      title: b.title || '',
      image_url: b.image_url || '',
      link_url: b.link_url || '',
      position: b.position || 'top',
      is_active: b.is_active,
    })
    setBannerModal(true)
  }

  async function saveBanner() {
    if (!bannerForm.title.trim()) {
      toast.warning('Banner title is required')
      return
    }
    setSavingBanner(true)
    try {
      const payload = {
        title: bannerForm.title.trim(),
        image_url: bannerForm.image_url.trim() || null,
        link_url: bannerForm.link_url.trim() || null,
        position: bannerForm.position,
        is_active: bannerForm.is_active,
      }

      if (editingBanner) {
        await adminApi.updateHomepageBanner(editingBanner.id, payload)
        await adminApi.createAuditLog(
          'Admin',
          'update_banner',
          'homepage_banner',
          editingBanner.id,
          `Updated banner: ${bannerForm.title}`,
        )
        toast.success('Banner updated successfully')
      } else {
        await adminApi.createHomepageBanner(payload)
        await adminApi.createAuditLog(
          'Admin',
          'create_banner',
          'homepage_banner',
          null,
          `Created banner: ${bannerForm.title}`,
        )
        toast.success('Banner created successfully')
      }
      setBannerModal(false)
      await loadData()
    } catch {
      toast.error('Failed to save banner')
    } finally {
      setSavingBanner(false)
    }
  }

  async function deleteBanner() {
    if (!deleteBannerId) return
    setDeletingBanner(true)
    try {
      await adminApi.deleteHomepageBanner(deleteBannerId)
      await adminApi.createAuditLog(
        'Admin',
        'delete_banner',
        'homepage_banner',
        deleteBannerId,
        'Deleted banner',
      )
      toast.success('Banner deleted')
      setDeleteBannerId(null)
      await loadData()
    } catch {
      toast.error('Failed to delete banner')
    } finally {
      setDeletingBanner(false)
    }
  }

  async function toggleBannerActive(b: HomepageBanner) {
    try {
      await adminApi.toggleHomepageBanner(b.id, !b.is_active)
      toast.success(`Banner ${b.is_active ? 'deactivated' : 'activated'}`)
      await loadData()
    } catch {
      toast.error('Failed to update banner status')
    }
  }

  // Popup handlers
  function openAddPopup() {
    setEditingPopup(null)
    setPopupForm(emptyPopup)
    setPopupModal(true)
  }

  function openEditPopup(p: PopupAnnouncement) {
    setEditingPopup(p)
    setPopupForm({
      title: p.title || '',
      content: p.content || '',
      type: p.type || 'info',
      is_active: p.is_active,
      start_date: p.start_date
        ? new Date(p.start_date).toISOString().slice(0, 10)
        : '',
      end_date: p.end_date
        ? new Date(p.end_date).toISOString().slice(0, 10)
        : '',
      dismissible: p.dismissible,
    })
    setPopupModal(true)
  }

  async function savePopup() {
    if (!popupForm.title.trim()) {
      toast.warning('Popup title is required')
      return
    }
    setSavingPopup(true)
    try {
      const payload = {
        title: popupForm.title.trim(),
        content: popupForm.content.trim(),
        type: popupForm.type,
        is_active: popupForm.is_active,
        start_date: popupForm.start_date
          ? new Date(popupForm.start_date).toISOString()
          : null,
        end_date: popupForm.end_date
          ? new Date(popupForm.end_date + 'T23:59:59').toISOString()
          : null,
        dismissible: popupForm.dismissible,
      }

      if (editingPopup) {
        await adminApi.updatePopupAnnouncement(editingPopup.id, payload)
        await adminApi.createAuditLog(
          'Admin',
          'update_popup',
          'popup_announcement',
          editingPopup.id,
          `Updated popup: ${popupForm.title}`,
        )
        toast.success('Popup updated successfully')
      } else {
        await adminApi.createPopupAnnouncement(payload)
        await adminApi.createAuditLog(
          'Admin',
          'create_popup',
          'popup_announcement',
          null,
          `Created popup: ${popupForm.title}`,
        )
        toast.success('Popup created successfully')
      }
      setPopupModal(false)
      await loadData()
    } catch {
      toast.error('Failed to save popup')
    } finally {
      setSavingPopup(false)
    }
  }

  async function deletePopup() {
    if (!deletePopupId) return
    setDeletingPopup(true)
    try {
      await adminApi.deletePopupAnnouncement(deletePopupId)
      await adminApi.createAuditLog(
        'Admin',
        'delete_popup',
        'popup_announcement',
        deletePopupId,
        'Deleted popup',
      )
      toast.success('Popup deleted')
      setDeletePopupId(null)
      await loadData()
    } catch {
      toast.error('Failed to delete popup')
    } finally {
      setDeletingPopup(false)
    }
  }

  async function togglePopupActive(p: PopupAnnouncement) {
    try {
      await adminApi.togglePopupAnnouncement(p.id, !p.is_active)
      toast.success(`Popup ${p.is_active ? 'deactivated' : 'activated'}`)
      await loadData()
    } catch {
      toast.error('Failed to update popup status')
    }
  }

  const filteredCampaigns = campaignSearch.trim()
    ? campaigns.filter(
        (c) =>
          c.name?.toLowerCase().includes(campaignSearch.toLowerCase()) ||
          c.channel?.toLowerCase().includes(campaignSearch.toLowerCase()),
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
        <h1 className="text-2xl font-bold text-slate-900">
          Marketing Campaigns
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage campaigns, homepage banners, and popup announcements
        </p>
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
          <Megaphone className="h-4 w-4" /> Campaigns
        </button>
        <button
          onClick={() => setActiveTab('banners')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'banners'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Image className="h-4 w-4" /> Banners
        </button>
        <button
          onClick={() => setActiveTab('popups')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'popups'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Bell className="h-4 w-4" /> Popups
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
                <Megaphone className="h-12 w-12 text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-500">
                  No campaigns found
                </p>
                <Button
                  onClick={openAddCampaign}
                  className="mt-3"
                  size="sm"
                >
                  <Plus className="mr-1 h-4 w-4" /> Add First Campaign
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCampaigns.map((c) => {
                const metrics = c.metrics || {}
                const impressions = Number(metrics.impressions) || 0
                const clicks = Number(metrics.clicks) || 0
                const conversions = Number(metrics.conversions) || 0
                return (
                  <Card key={c.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">
                            {c.name}
                          </CardTitle>
                          <div className="mt-1 flex gap-2">
                            <Badge color="blue">{c.type}</Badge>
                            <Badge color="indigo">{c.channel}</Badge>
                          </div>
                        </div>
                        <Badge
                          color={
                            (CAMPAIGN_STATUS_COLORS[c.status] as any) || 'gray'
                          }
                        >
                          {c.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {c.target_audience && (
                        <p className="text-xs text-slate-500">
                          Audience: {c.target_audience}
                        </p>
                      )}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-lg bg-slate-50 p-2">
                          <Eye className="mx-auto h-4 w-4 text-slate-400" />
                          <p className="mt-1 text-xs text-slate-500">Imp.</p>
                          <p className="text-sm font-semibold text-slate-900">
                            {impressions}
                          </p>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-2">
                          <MousePointerClick className="mx-auto h-4 w-4 text-slate-400" />
                          <p className="mt-1 text-xs text-slate-500">Clicks</p>
                          <p className="text-sm font-semibold text-slate-900">
                            {clicks}
                          </p>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-2">
                          <TrendingUp className="mx-auto h-4 w-4 text-slate-400" />
                          <p className="mt-1 text-xs text-slate-500">Conv.</p>
                          <p className="text-sm font-semibold text-slate-900">
                            {conversions}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>
                          {c.start_date ? formatDate(c.start_date) : 'N/A'}
                        </span>
                        <span>
                          {c.end_date ? formatDate(c.end_date) : 'Ongoing'}
                        </span>
                      </div>
                      <div className="flex justify-end gap-1">
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
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Banners Tab */}
      {activeTab === 'banners' && (
        <div className="space-y-4">
          <div className="flex items-center justify-end">
            <Button onClick={openAddBanner}>
              <Plus className="mr-1 h-4 w-4" /> Add Banner
            </Button>
          </div>

          {banners.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Image className="h-12 w-12 text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-500">
                  No banners found
                </p>
                <Button onClick={openAddBanner} className="mt-3" size="sm">
                  <Plus className="mr-1 h-4 w-4" /> Add First Banner
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
                          Title
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">
                          Position
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
                      {banners.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {b.image_url ? (
                                <img
                                  src={b.image_url}
                                  alt={b.title}
                                  className="h-10 w-16 rounded object-cover"
                                />
                              ) : (
                                <div className="flex h-10 w-16 items-center justify-center rounded bg-slate-100">
                                  <Image className="h-4 w-4 text-slate-400" />
                                </div>
                              )}
                              <div className="font-medium text-slate-900">
                                {b.title}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {b.position}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {b.clicks || 0}
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => toggleBannerActive(b)}>
                              <Badge
                                color={b.is_active ? 'green' : 'gray'}
                                className="cursor-pointer"
                              >
                                {b.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </button>
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {formatDate(b.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditBanner(b)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => setDeleteBannerId(b.id)}
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

      {/* Popups Tab */}
      {activeTab === 'popups' && (
        <div className="space-y-4">
          <div className="flex items-center justify-end">
            <Button onClick={openAddPopup}>
              <Plus className="mr-1 h-4 w-4" /> Add Popup
            </Button>
          </div>

          {popups.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Bell className="h-12 w-12 text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-500">
                  No popups found
                </p>
                <Button onClick={openAddPopup} className="mt-3" size="sm">
                  <Plus className="mr-1 h-4 w-4" /> Add First Popup
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
                          Title
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">
                          Schedule
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">
                          Dismissible
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">
                          Status
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-slate-700">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {popups.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900">
                              {p.title}
                            </div>
                            <div className="text-xs text-slate-500 line-clamp-1">
                              {p.content}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge color="blue">{p.type}</Badge>
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs">
                            {p.start_date ? formatDate(p.start_date) : 'Now'}
                            {' → '}
                            {p.end_date ? formatDate(p.end_date) : 'Ongoing'}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              color={p.dismissible ? 'green' : 'red'}
                            >
                              {p.dismissible ? 'Yes' : 'No'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => togglePopupActive(p)}>
                              <Badge
                                color={p.is_active ? 'green' : 'gray'}
                                className="cursor-pointer"
                              >
                                {p.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditPopup(p)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => setDeletePopupId(p.id)}
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

      {/* Campaign Modal */}
      {campaignModal && (
        <Modal
          title={editingCampaign ? 'Edit Campaign' : 'Add Campaign'}
          onClose={() => setCampaignModal(false)}
          className="max-w-2xl"
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={campaignForm.type}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    setCampaignForm({ ...campaignForm, type: e.target.value })
                  }
                >
                  <option value="promotion">Promotion</option>
                  <option value="discount">Discount</option>
                  <option value="awareness">Awareness</option>
                  <option value="retention">Retention</option>
                  <option value="acquisition">Acquisition</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Channel</Label>
                <Select
                  value={campaignForm.channel}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    setCampaignForm({
                      ...campaignForm,
                      channel: e.target.value,
                    })
                  }
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="social_media">Social Media</option>
                  <option value="push">Push Notification</option>
                  <option value="google_ads">Google Ads</option>
                  <option value="meta_ads">Meta Ads</option>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Target Audience</Label>
                <Select
                  value={campaignForm.target_audience}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    setCampaignForm({
                      ...campaignForm,
                      target_audience: e.target.value,
                    })
                  }
                >
                  <option value="all">All Users</option>
                  <option value="customers">Customers</option>
                  <option value="technicians">Technicians</option>
                  <option value="new_users">New Users</option>
                  <option value="inactive_users">Inactive Users</option>
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
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={campaignForm.start_date}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    setCampaignForm({
                      ...campaignForm,
                      start_date: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={campaignForm.end_date}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    setCampaignForm({
                      ...campaignForm,
                      end_date: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setCampaignModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={saveCampaign} loading={savingCampaign}>
                {editingCampaign ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Banner Modal */}
      {bannerModal && (
        <Modal
          title={editingBanner ? 'Edit Banner' : 'Add Banner'}
          onClose={() => setBannerModal(false)}
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input
                placeholder="Banner title"
                value={bannerForm.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                  setBannerForm({ ...bannerForm, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Image URL</Label>
              <Input
                placeholder="https://..."
                value={bannerForm.image_url}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                  setBannerForm({ ...bannerForm, image_url: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Link URL</Label>
              <Input
                placeholder="https://..."
                value={bannerForm.link_url}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                  setBannerForm({ ...bannerForm, link_url: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Position</Label>
              <Select
                value={bannerForm.position}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                  setBannerForm({ ...bannerForm, position: e.target.value })
                }
              >
                <option value="top">Top</option>
                <option value="middle">Middle</option>
                <option value="bottom">Bottom</option>
                <option value="sidebar">Sidebar</option>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="banner_active"
                checked={bannerForm.is_active}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                  setBannerForm({ ...bannerForm, is_active: (e.target as HTMLInputElement).checked })
                }
                className="h-4 w-4 rounded border-slate-300"
              />
              <Label htmlFor="banner_active">Active</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setBannerModal(false)}>
                Cancel
              </Button>
              <Button onClick={saveBanner} loading={savingBanner}>
                {editingBanner ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Popup Modal */}
      {popupModal && (
        <Modal
          title={editingPopup ? 'Edit Popup' : 'Add Popup'}
          onClose={() => setPopupModal(false)}
          className="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input
                placeholder="Popup title"
                value={popupForm.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                  setPopupForm({ ...popupForm, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Content</Label>
              <Textarea
                placeholder="Popup content..."
                value={popupForm.content}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                  setPopupForm({ ...popupForm, content: e.target.value })
                }
                rows={4}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={popupForm.type}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    setPopupForm({ ...popupForm, type: e.target.value })
                  }
                >
                  <option value="info">Info</option>
                  <option value="offer">Offer</option>
                  <option value="announcement">Announcement</option>
                  <option value="festival">Festival</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Dismissible</Label>
                <Select
                  value={popupForm.dismissible ? 'yes' : 'no'}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    setPopupForm({
                      ...popupForm,
                      dismissible: e.target.value === 'yes',
                    })
                  }
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={popupForm.start_date}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    setPopupForm({
                      ...popupForm,
                      start_date: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={popupForm.end_date}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    setPopupForm({ ...popupForm, end_date: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="popup_active"
                checked={popupForm.is_active}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                  setPopupForm({ ...popupForm, is_active: (e.target as HTMLInputElement).checked })
                }
                className="h-4 w-4 rounded border-slate-300"
              />
              <Label htmlFor="popup_active">Active</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPopupModal(false)}>
                Cancel
              </Button>
              <Button onClick={savePopup} loading={savingPopup}>
                {editingPopup ? 'Update' : 'Create'}
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
                Are you sure you want to delete this campaign? This action
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

      {/* Delete Banner Confirmation */}
      {deleteBannerId && (
        <Modal title="Delete Banner" onClose={() => setDeleteBannerId(null)}>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-sm text-slate-600">
                Are you sure you want to delete this banner? This action cannot
                be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteBannerId(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={deleteBanner}
                loading={deletingBanner}
              >
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Popup Confirmation */}
      {deletePopupId && (
        <Modal title="Delete Popup" onClose={() => setDeletePopupId(null)}>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-sm text-slate-600">
                Are you sure you want to delete this popup? This action cannot
                be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeletePopupId(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={deletePopup}
                loading={deletingPopup}
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
