import { useEffect, useState, useCallback } from 'react'
import { BarChart3, Loader as Loader2, Eye, MousePointerClick, TrendingUp, Users, Globe, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type AnalyticsEvent, type AnalyticsSettings } from '@/lib/supabase'
import { adminApi } from '@/lib/admin-api'
import { formatDateTime, formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

type TopPage = {
  url: string
  views: number
}

type CategoryCount = {
  category: string
  count: number
}

export default function AdminAnalyticsPage() {
  const toast = useToast()

  const [events, setEvents] = useState<AnalyticsEvent[]>([])
  const [settings, setSettings] = useState<AnalyticsSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const [stats, setStats] = useState({
    totalPageViews: 0,
    totalEvents: 0,
    uniqueUsers: 0,
    uniqueSessions: 0,
  })
  const [topPages, setTopPages] = useState<TopPage[]>([])
  const [categoryCounts, setCategoryCounts] = useState<CategoryCount[]>([])

  const loadAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const filters: { start_date?: string; end_date?: string; category?: string } = {}
      if (dateFilter) {
        filters.start_date = `${dateFilter}T00:00:00`
        filters.end_date = `${dateFilter}T23:59:59`
      }
      if (categoryFilter !== 'all') {
        filters.category = categoryFilter
      }

      const { data } = await adminApi.getAnalyticsEvents(filters)

      const allEvents = data || []
      setEvents(allEvents)

      // Calculate stats
      const pageViewEvents = allEvents.filter(
        (e: any) => e.event_category === 'page_view',
      )
      const userIds = new Set(
        allEvents.filter((e: any) => e.user_id).map((e: any) => e.user_id),
      )
      const sessionIds = new Set(
        allEvents.filter((e: any) => e.session_id).map((e: any) => e.session_id),
      )

      setStats({
        totalPageViews: pageViewEvents.length,
        totalEvents: allEvents.length,
        uniqueUsers: userIds.size,
        uniqueSessions: sessionIds.size,
      })

      // Calculate top pages
      const pageCountMap: Record<string, number> = {}
      pageViewEvents.forEach((e: any) => {
        const url = e.page_url || 'unknown'
        pageCountMap[url] = (pageCountMap[url] || 0) + 1
      })
      const sortedPages = Object.entries(pageCountMap)
        .map(([url, views]) => ({ url, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10)
      setTopPages(sortedPages)

      // Calculate category counts
      const categoryMap: Record<string, number> = {}
      allEvents.forEach((e: any) => {
        const cat = e.event_category || 'other'
        categoryMap[cat] = (categoryMap[cat] || 0) + 1
      })
      const sortedCategories = Object.entries(categoryMap)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
      setCategoryCounts(sortedCategories)

      // Load analytics settings
      const { data: settingsData } = await adminApi.getAnalyticsSettings()

      if (settingsData) {
        setSettings(settingsData)
      }
    } catch {
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }, [dateFilter, categoryFilter, toast])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  const maxPageViews = Math.max(...topPages.map((p) => p.views), 1)
  const maxCategoryCount = Math.max(
    ...categoryCounts.map((c) => c.count),
    1,
  )

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
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">
          Track page views, user events, and traffic patterns
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Eye className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Page Views</p>
              <p className="text-xl font-bold text-slate-900">
                {stats.totalPageViews}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <Activity className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Events</p>
              <p className="text-xl font-bold text-slate-900">
                {stats.totalEvents}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Unique Users</p>
              <p className="text-xl font-bold text-slate-900">
                {stats.uniqueUsers}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
              <Globe className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Sessions</p>
              <p className="text-xl font-bold text-slate-900">
                {stats.uniqueSessions}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end">
          <div className="space-y-1.5 sm:w-48">
            <Label>Date</Label>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setDateFilter(e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:w-48">
            <Label>Event Category</Label>
            <Select
              value={categoryFilter}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="page_view">Page View</option>
              <option value="click">Click</option>
              <option value="booking">Booking</option>
              <option value="search">Search</option>
              <option value="conversion">Conversion</option>
              <option value="engagement">Engagement</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-slate-500" />
              Top Pages
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topPages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart3 className="h-10 w-10 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">
                  No page view data available
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {topPages.map((page, idx) => (
                  <div key={page.url} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded bg-slate-100 text-xs font-medium text-slate-600">
                          {idx + 1}
                        </span>
                        <span className="font-medium text-slate-700">
                          {page.url}
                        </span>
                      </div>
                      <span className="font-semibold text-slate-900">
                        {page.views}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{
                          width: `${(page.views / maxPageViews) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Event Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MousePointerClick className="h-5 w-5 text-slate-500" />
              Events by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryCounts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart3 className="h-10 w-10 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">
                  No event data available
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {categoryCounts.map((cat) => (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <Badge color="blue">{cat.category}</Badge>
                      <span className="font-semibold text-slate-900">
                        {cat.count}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-green-500"
                        style={{
                          width: `${(cat.count / maxCategoryCount) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analytics Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-5 w-5 text-slate-500" />
            Analytics Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          {settings ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs font-medium text-slate-500">
                  GA4 Measurement ID
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {settings.ga4_measurement_id || 'Not configured'}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs font-medium text-slate-500">
                  Meta Pixel ID
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {settings.meta_pixel_id || 'Not configured'}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs font-medium text-slate-500">
                  GSC Verification
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {settings.gsc_verification_token ? 'Configured' : 'Not configured'}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs font-medium text-slate-500">
                  Last Updated
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {settings.updated_at
                    ? formatDate(settings.updated_at)
                    : 'N/A'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Globe className="h-10 w-10 text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">
                Analytics settings not configured
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Configure GA4 and Meta Pixel in Settings
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-5 w-5 text-slate-500" />
            Recent Events
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="h-10 w-10 text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">No events recorded</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Event Name
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Page URL
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      User
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {events.slice(0, 50).map((event) => (
                    <tr key={event.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {event.event_name}
                      </td>
                      <td className="px-4 py-3">
                        <Badge color="blue">{event.event_category}</Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {event.page_url || '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {event.user_id ? (
                          <span className="font-mono text-xs">
                            {event.user_id.slice(0, 8)}...
                          </span>
                        ) : (
                          <span className="text-slate-400">Anonymous</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatDateTime(event.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
