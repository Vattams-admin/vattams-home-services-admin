import { useEffect, useState, useCallback } from 'react'
import { TrendingUp, Eye, MousePointerClick, Mail, Star, Users, Megaphone, Globe, Loader as Loader2, ArrowUpRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  type MarketingCampaign,
  type EmailCampaign,
  type CustomerReview,
  type AnalyticsEvent,
  type HomepageBanner,
} from '@/lib/supabase'
import { adminApi } from '@/lib/admin-api'
import { useToast } from '@/hooks/use-toast'

type TrafficSource = {
  source: string
  count: number
  percentage: number
}

type RatingDistribution = {
  rating: number
  count: number
  percentage: number
}

export default function AdminMarketingDashboardPage() {
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([])
  const [emailCampaigns, setEmailCampaigns] = useState<EmailCampaign[]>([])
  const [reviews, setReviews] = useState<CustomerReview[]>([])
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvent[]>([])
  const [banners, setBanners] = useState<HomepageBanner[]>([])

  const [stats, setStats] = useState({
    totalPageViews: 0,
    totalEvents: 0,
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalEmailSent: 0,
    totalEmailOpens: 0,
    totalEmailClicks: 0,
    totalReviews: 0,
    avgRating: 0,
    totalBanners: 0,
    activeBanners: 0,
  })

  const [trafficSources, setTrafficSources] = useState<TrafficSource[]>([])
  const [ratingDistribution, setRatingDistribution] = useState<
    RatingDistribution[]
  >([])
  const [topCampaigns, setTopCampaigns] = useState<MarketingCampaign[]>([])

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminApi.getMarketingDashboard()

      const allCampaigns = data.campaigns || []
      const allEmails = data.emailCampaigns || []
      const allReviews = data.reviews || []
      const allEvents = data.events || []
      const allBanners = data.banners || []

      setCampaigns(allCampaigns)
      setEmailCampaigns(allEmails)
      setReviews(allReviews)
      setAnalyticsEvents(allEvents)
      setBanners(allBanners)

      // Calculate stats
      const pageViews = allEvents.filter(
        (e: any) => e.event_category === 'page_view',
      )
      const totalEmailSent = allEmails.reduce(
        (sum: number, c: any) => sum + (c.sent_count || 0),
        0,
      )
      const totalEmailOpens = allEmails.reduce(
        (sum: number, c: any) => sum + (c.open_count || 0),
        0,
      )
      const totalEmailClicks = allEmails.reduce(
        (sum: number, c: any) => sum + (c.click_count || 0),
        0,
      )
      const totalRating = allReviews.reduce(
        (sum: number, r: any) => sum + (r.rating || 0),
        0,
      )

      setStats({
        totalPageViews: pageViews.length,
        totalEvents: allEvents.length,
        totalCampaigns: allCampaigns.length,
        activeCampaigns: allCampaigns.filter((c: any) => c.status === 'active')
          .length,
        totalEmailSent,
        totalEmailOpens,
        totalEmailClicks,
        totalReviews: allReviews.length,
        avgRating:
          allReviews.length > 0
            ? Math.round((totalRating / allReviews.length) * 10) / 10
            : 0,
        totalBanners: allBanners.length,
        activeBanners: allBanners.filter((b: any) => b.is_active).length,
      })

      // Calculate traffic sources from analytics
      const sourceMap: Record<string, number> = {}
      pageViews.forEach((e: any) => {
        const metaData = e.metadata as Record<string, unknown>
        const source =
          (metaData?.source as string) ||
          (metaData?.referrer as string) ||
          'direct'
        const cleanSource = sourceMap[source] !== undefined ? source : source
        sourceMap[cleanSource] = (sourceMap[cleanSource] || 0) + 1
      })
      const totalPageViewCount = pageViews.length || 1
      const sources: TrafficSource[] = Object.entries(sourceMap)
        .map(([source, count]) => ({
          source,
          count,
          percentage: Math.round((count / totalPageViewCount) * 100),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)
      setTrafficSources(sources)

      // Calculate rating distribution
      const ratingMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      allReviews.forEach((r: any) => {
        if (r.rating >= 1 && r.rating <= 5) {
          ratingMap[r.rating]++
        }
      })
      const totalReviewCount = allReviews.length || 1
      const distribution: RatingDistribution[] = [5, 4, 3, 2, 1].map(
        (rating) => ({
          rating,
          count: ratingMap[rating],
          percentage: Math.round((ratingMap[rating] / totalReviewCount) * 100),
        }),
      )
      setRatingDistribution(distribution)

      // Top campaigns by metrics
      const sortedByImpressions = [...allCampaigns]
        .map((c) => ({
          ...c,
          impressions: Number((c.metrics as Record<string, unknown>)?.impressions) || 0,
        }))
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, 5)
      setTopCampaigns(sortedByImpressions)
    } catch {
      toast.error('Failed to load marketing dashboard data')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const emailOpenRate =
    stats.totalEmailSent > 0
      ? Math.round((stats.totalEmailOpens / stats.totalEmailSent) * 100)
      : 0
  const emailClickRate =
    stats.totalEmailOpens > 0
      ? Math.round((stats.totalEmailClicks / stats.totalEmailOpens) * 100)
      : 0

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
          Marketing Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Overview of all marketing channels and performance metrics
        </p>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Eye className="h-5 w-5 text-blue-600" />
              </div>
              <Badge color="green">
                <ArrowUpRight className="mr-0.5 h-3 w-3" />
                Live
              </Badge>
            </div>
            <p className="mt-3 text-sm text-slate-500">Page Views</p>
            <p className="text-2xl font-bold text-slate-900">
              {stats.totalPageViews}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <Megaphone className="h-5 w-5 text-green-600" />
              </div>
              <Badge color="blue">{stats.activeCampaigns} active</Badge>
            </div>
            <p className="mt-3 text-sm text-slate-500">Campaigns</p>
            <p className="text-2xl font-bold text-slate-900">
              {stats.totalCampaigns}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <Mail className="h-5 w-5 text-purple-600" />
              </div>
              <Badge color="indigo">{emailOpenRate}% open</Badge>
            </div>
            <p className="mt-3 text-sm text-slate-500">Emails Sent</p>
            <p className="text-2xl font-bold text-slate-900">
              {stats.totalEmailSent}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <Star className="h-5 w-5 text-amber-600" />
              </div>
              <Badge color="amber">{stats.avgRating} / 5</Badge>
            </div>
            <p className="mt-3 text-sm text-slate-500">Total Reviews</p>
            <p className="text-2xl font-bold text-slate-900">
              {stats.totalReviews}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Performance & Email Stats */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Campaign Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-slate-500" />
              Top Campaigns by Impressions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topCampaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Megaphone className="h-10 w-10 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">
                  No campaign data available
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {topCampaigns.map((c, idx) => {
                  const metrics = c.metrics as Record<string, unknown>
                  const impressions = Number(metrics?.impressions) || 0
                  const clicks = Number(metrics?.clicks) || 0
                  const conversions = Number(metrics?.conversions) || 0
                  const ctr =
                    impressions > 0
                      ? Math.round((clicks / impressions) * 100)
                      : 0
                  return (
                    <div
                      key={c.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-sm font-medium text-slate-600">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {c.name}
                          </p>
                          <div className="mt-0.5 flex gap-2">
                            <Badge color="blue">{c.channel}</Badge>
                            <Badge color="indigo">{ctr}% CTR</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">
                          {impressions.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500">impressions</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Campaign Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-5 w-5 text-slate-500" />
              Email Campaign Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {emailCampaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Mail className="h-10 w-10 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">
                  No email campaign data available
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-blue-50 p-3 text-center">
                    <p className="text-xs text-slate-500">Sent</p>
                    <p className="text-lg font-bold text-slate-900">
                      {stats.totalEmailSent}
                    </p>
                  </div>
                  <div className="rounded-lg bg-green-50 p-3 text-center">
                    <p className="text-xs text-slate-500">Opens</p>
                    <p className="text-lg font-bold text-slate-900">
                      {stats.totalEmailOpens}
                    </p>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-3 text-center">
                    <p className="text-xs text-slate-500">Clicks</p>
                    <p className="text-lg font-bold text-slate-900">
                      {stats.totalEmailClicks}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Open Rate</span>
                      <span className="font-semibold text-slate-900">
                        {emailOpenRate}%
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-green-500"
                        style={{ width: `${emailOpenRate}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Click Rate</span>
                      <span className="font-semibold text-slate-900">
                        {emailClickRate}%
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${emailClickRate}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3">
                  <p className="mb-2 text-xs font-medium text-slate-500">
                    Recent Campaigns
                  </p>
                  <div className="space-y-2">
                    {emailCampaigns.slice(0, 3).map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="truncate font-medium text-slate-700">
                          {c.name}
                        </span>
                        <Badge
                          color={
                            c.status === 'sent'
                              ? 'green'
                              : c.status === 'draft'
                                ? 'gray'
                                : 'blue'
                          }
                        >
                          {c.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Traffic Sources & Rating Distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Traffic Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-5 w-5 text-slate-500" />
              Traffic Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trafficSources.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Globe className="h-10 w-10 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">
                  No traffic data available
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {trafficSources.map((source) => (
                  <div key={source.source} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-700 capitalize">
                          {source.source}
                        </span>
                        <Badge color="gray">{source.percentage}%</Badge>
                      </div>
                      <span className="font-semibold text-slate-900">
                        {source.count}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${source.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="h-5 w-5 text-slate-500" />
              Review Ratings Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ratingDistribution.length === 0 ||
            stats.totalReviews === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Star className="h-10 w-10 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">
                  No review data available
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {ratingDistribution.map((r) => (
                  <div key={r.rating} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < r.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'fill-slate-200 text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-slate-500">{r.count} reviews</span>
                      </div>
                      <span className="font-semibold text-slate-900">
                        {r.percentage}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${
                          r.rating >= 4
                            ? 'bg-green-500'
                            : r.rating === 3
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${r.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
                <div className="border-t border-slate-200 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      Average Rating
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-slate-900">
                        {stats.avgRating}
                      </span>
                      <span className="text-sm text-slate-500">/ 5</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Social Media & Banner Stats */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Social Media Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-slate-500" />
              Social Media
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                    <Globe className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">
                    Facebook
                  </span>
                </div>
                <span className="text-sm text-slate-500">Connected</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                    <Globe className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">
                    Instagram
                  </span>
                </div>
                <span className="text-sm text-slate-500">Connected</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                    <Globe className="h-4 w-4 text-red-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">
                    YouTube
                  </span>
                </div>
                <span className="text-sm text-slate-500">Connected</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                    <Globe className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">
                    WhatsApp
                  </span>
                </div>
                <span className="text-sm text-slate-500">Connected</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Banner Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="h-5 w-5 text-slate-500" />
              Homepage Banners
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-blue-50 p-3 text-center">
                  <p className="text-xs text-slate-500">Total</p>
                  <p className="text-lg font-bold text-slate-900">
                    {stats.totalBanners}
                  </p>
                </div>
                <div className="rounded-lg bg-green-50 p-3 text-center">
                  <p className="text-xs text-slate-500">Active</p>
                  <p className="text-lg font-bold text-slate-900">
                    {stats.activeBanners}
                  </p>
                </div>
              </div>
              <div className="border-t border-slate-200 pt-3">
                <p className="mb-2 text-xs font-medium text-slate-500">
                  Banner Clicks
                </p>
                <div className="space-y-2">
                  {banners.slice(0, 3).map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="truncate font-medium text-slate-700">
                        {b.title}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <MousePointerClick className="h-3.5 w-3.5" />
                        {b.clicks || 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Event Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-slate-500" />
              Analytics Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-blue-50 p-3 text-center">
                  <p className="text-xs text-slate-500">Total Events</p>
                  <p className="text-lg font-bold text-slate-900">
                    {stats.totalEvents}
                  </p>
                </div>
                <div className="rounded-lg bg-purple-50 p-3 text-center">
                  <p className="text-xs text-slate-500">Page Views</p>
                  <p className="text-lg font-bold text-slate-900">
                    {stats.totalPageViews}
                  </p>
                </div>
              </div>
              <div className="border-t border-slate-200 pt-3">
                <p className="mb-2 text-xs font-medium text-slate-500">
                  Events by Category
                </p>
                <div className="space-y-2">
                  {(() => {
                    const catMap: Record<string, number> = {}
                    analyticsEvents.forEach((e) => {
                      const cat = e.event_category || 'other'
                      catMap[cat] = (catMap[cat] || 0) + 1
                    })
                    return Object.entries(catMap)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 4)
                      .map(([cat, count]) => (
                        <div
                          key={cat}
                          className="flex items-center justify-between text-sm"
                        >
                          <Badge color="blue">{cat}</Badge>
                          <span className="font-semibold text-slate-900">
                            {count}
                          </span>
                        </div>
                      ))
                  })()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
