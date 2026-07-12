import { useEffect, useState } from 'react'
import { Download, FileText, Eye, CalendarCheck, IndianRupee, MessageSquare, Phone, MapPin, Activity, BarChart3, Megaphone } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { AnalyticsEvent, Booking, Invoice, HomepageBanner, MarketingCampaign, CampaignMetric } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/LoadingScreen'
import { exportToCSV, generateReportPDF } from '@/lib/pdf'
import { formatCurrency, formatDateTime, formatDate } from '@/lib/utils'

export function AdminMarketingDashboardPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<AnalyticsEvent[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [banners, setBanners] = useState<HomepageBanner[]>([])
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([])
  const [metrics, setMetrics] = useState<CampaignMetric[]>([])

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [ev, bk, inv, bn, cm, mt] = await Promise.all([
        supabase.from('analytics_events').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('bookings').select('*').order('created_at', { ascending: false }),
        supabase.from('invoices').select('*').order('created_at', { ascending: false }),
        supabase.from('homepage_banners').select('*').order('created_at', { ascending: false }),
        supabase.from('marketing_campaigns').select('*').order('created_at', { ascending: false }),
        supabase.from('campaign_metrics').select('*').order('created_at', { ascending: false }),
      ])
      if (mounted) {
        setEvents((ev.data as AnalyticsEvent[]) || [])
        setBookings((bk.data as Booking[]) || [])
        setInvoices((inv.data as Invoice[]) || [])
        setBanners((bn.data as HomepageBanner[]) || [])
        setCampaigns((cm.data as MarketingCampaign[]) || [])
        setMetrics((mt.data as CampaignMetric[]) || [])
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  if (loading) return <LoadingScreen message="Loading marketing dashboard..." />

  const visitors = events.filter((e) => e.event_name === 'page_view').length
  const revenue = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const waClicks = events.filter((e) => e.event_name === 'whatsapp_click').length
  const callClicks = events.filter((e) => e.event_name === 'call_click').length

  const stats = [
    { label: 'Website Visitors', value: visitors, icon: Eye, color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Bookings', value: bookings.length, icon: CalendarCheck, color: 'bg-cyan-50 text-cyan-600' },
    { label: 'Revenue', value: formatCurrency(revenue), icon: IndianRupee, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'WhatsApp Clicks', value: waClicks, icon: MessageSquare, color: 'bg-green-50 text-green-600' },
    { label: 'Call Clicks', value: callClicks, icon: Phone, color: 'bg-purple-50 text-purple-600' },
  ]

  const serviceViews: Record<string, number> = {}
  events.filter((e) => e.event_name === 'service_view').forEach((e) => { const key = e.page_url || 'unknown'; serviceViews[key] = (serviceViews[key] || 0) + 1 })
  const topServices = Object.entries(serviceViews).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxService = Math.max(...topServices.map((s) => s[1]), 1)

  const districtCounts: Record<string, number> = {}
  bookings.forEach((b) => { if (b.district) districtCounts[b.district] = (districtCounts[b.district] || 0) + 1 })
  const topDistricts = Object.entries(districtCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxDistrict = Math.max(...topDistricts.map((d) => d[1]), 1)

  const campaignData = campaigns.map((c) => {
    const cm = metrics.filter((m) => m.campaign_id === c.id)
    return { ...c, impressions: cm.reduce((s, m) => s + m.impressions, 0), clicks: cm.reduce((s, m) => s + m.clicks, 0), conversions: cm.reduce((s, m) => s + m.conversions, 0) }
  })
  const maxCampaignClicks = Math.max(...campaignData.map((c) => c.clicks), 1)

  const recentActivity = events.slice(0, 10)

  const exportPDF = () => {
    const rows = [
      ['Website Visitors', String(visitors)],
      ['Total Bookings', String(bookings.length)],
      ['Revenue', formatCurrency(revenue)],
      ['WhatsApp Clicks', String(waClicks)],
      ['Call Clicks', String(callClicks)],
      ...topServices.map(([name, count]) => [`Service: ${name}`, String(count)]),
      ...topDistricts.map(([name, count]) => [`District: ${name}`, String(count)]),
      ...campaignData.map((c) => [`Campaign: ${c.name}`, `${c.impressions} imp / ${c.clicks} clicks / ${c.conversions} conv`]),
    ]
    generateReportPDF('Marketing Dashboard Report', ['Metric', 'Value'], rows, [
      { label: 'Generated', value: formatDate(new Date()) },
      { label: 'Total Visitors', value: String(visitors) },
      { label: 'Revenue', value: formatCurrency(revenue) },
    ])
    toast('PDF exported', 'success')
  }

  const exportCSV = () => {
    const rows = [
      ['Website Visitors', visitors], ['Total Bookings', bookings.length], ['Revenue', revenue],
      ['WhatsApp Clicks', waClicks], ['Call Clicks', callClicks],
      ...topServices.map(([name, count]) => [`Service: ${name}`, count]),
      ...topDistricts.map(([name, count]) => [`District: ${name}`, count]),
      ...campaignData.map((c) => [`Campaign: ${c.name}`, c.clicks]),
    ]
    exportToCSV('marketing-dashboard', ['Metric', 'Value'], rows)
    toast('CSV exported', 'success')
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Marketing Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
          <Button variant="outline" onClick={exportPDF}><FileText className="mr-2 h-4 w-4" /> Export PDF</Button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => { const Icon = s.icon; return (
          <Card key={s.label}><CardContent className="p-4">
            <div className={`mb-2 inline-flex rounded-lg p-2 ${s.color}`}><Icon className="h-5 w-5" /></div>
            <p className="text-xs text-gray-600">{s.label}</p><p className="text-lg font-bold">{s.value}</p>
          </CardContent></Card>
        )})}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle className="text-base"><BarChart3 className="mr-2 inline h-5 w-5 text-blue-600" />Most Viewed Services</CardTitle></CardHeader><CardContent>
          <div className="space-y-2">
            {topServices.map(([name, count]) => (
              <div key={name} className="flex items-center gap-3">
                <span className="w-32 truncate text-sm font-medium text-gray-700">{name}</span>
                <div className="h-5 flex-1 rounded bg-gray-100"><div className="h-5 rounded bg-blue-500" style={{ width: `${(count / maxService) * 100}%` }} /></div>
                <span className="w-8 text-right text-sm font-bold text-gray-900">{count}</span>
              </div>
            ))}
            {topServices.length === 0 && <p className="text-center text-gray-500">No service views recorded.</p>}
          </div>
        </CardContent></Card>

        <Card><CardHeader><CardTitle className="text-base"><MapPin className="mr-2 inline h-5 w-5 text-green-600" />Top Districts</CardTitle></CardHeader><CardContent>
          <div className="space-y-2">
            {topDistricts.map(([name, count]) => (
              <div key={name} className="flex items-center gap-3">
                <span className="w-32 truncate text-sm font-medium text-gray-700">{name}</span>
                <div className="h-5 flex-1 rounded bg-gray-100"><div className="h-5 rounded bg-green-500" style={{ width: `${(count / maxDistrict) * 100}%` }} /></div>
                <span className="w-8 text-right text-sm font-bold text-gray-900">{count}</span>
              </div>
            ))}
            {topDistricts.length === 0 && <p className="text-center text-gray-500">No booking data.</p>}
          </div>
        </CardContent></Card>
      </div>

      <Card className="mt-6"><CardHeader><CardTitle className="text-base"><Megaphone className="mr-2 inline h-5 w-5 text-purple-600" />Campaign Performance</CardTitle></CardHeader><CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-200 text-left text-xs text-gray-500"><th className="pb-2 pr-4">Campaign</th><th className="pb-2 pr-4">Type</th><th className="pb-2 pr-4">Impressions</th><th className="pb-2 pr-4">Clicks</th><th className="pb-2 pr-4">Conversions</th><th className="pb-2">Performance</th></tr></thead>
            <tbody>
              {campaignData.map((c) => (
                <tr key={c.id} className="border-b border-gray-100">
                  <td className="py-2 pr-4 font-medium text-gray-900">{c.name}</td>
                  <td className="py-2 pr-4"><Badge color="bg-blue-50 text-blue-700">{c.type}</Badge></td>
                  <td className="py-2 pr-4">{c.impressions}</td>
                  <td className="py-2 pr-4">{c.clicks}</td>
                  <td className="py-2 pr-4">{c.conversions}</td>
                  <td className="py-2"><div className="h-2 w-24 rounded-full bg-gray-100"><div className="h-2 rounded-full bg-purple-500" style={{ width: `${(c.clicks / maxCampaignClicks) * 100}%` }} /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {campaigns.length === 0 && <p className="py-4 text-center text-gray-500">No campaigns found.</p>}
        </div>
      </CardContent></Card>

      <Card className="mt-6"><CardHeader><CardTitle className="text-base"><Activity className="mr-2 inline h-5 w-5 text-blue-600" />Recent Activity</CardTitle></CardHeader><CardContent>
        <div className="space-y-2">
          {recentActivity.map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-2">
              <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-gray-400" /><Badge color="bg-blue-50 text-blue-700">{e.event_name}</Badge><span className="text-sm text-gray-500">{e.page_url || '-'}</span></div>
              <span className="text-xs text-gray-400">{formatDateTime(e.created_at)}</span>
            </div>
          ))}
          {recentActivity.length === 0 && <p className="text-center text-gray-500">No recent activity.</p>}
        </div>
      </CardContent></Card>
    </div>
  )
}
