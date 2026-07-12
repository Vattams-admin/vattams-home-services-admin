import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Bot,
  Send,
  Loader2,
  Sparkles,
  Brain,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Trash2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase, type AiInsight } from '@/lib/supabase'
import { formatDateTime } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

const INSIGHT_ICONS: Record<string, typeof TrendingUp> = {
  trend: TrendingUp,
  alert: AlertTriangle,
  suggestion: Lightbulb,
  analysis: Brain,
  prediction: Sparkles,
}

const INSIGHT_COLORS: Record<string, string> = {
  trend: 'blue',
  alert: 'red',
  suggestion: 'amber',
  analysis: 'purple',
  prediction: 'indigo',
}

export default function AdminAiAssistantPage() {
  const toast = useToast()

  const [insights, setInsights] = useState<AiInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [config, setConfig] = useState({
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 1000,
    systemPrompt:
      'You are an AI assistant for VATTAMS Home Services, a home services platform in Tamil Nadu, India. Help admins with analytics, insights, and operational questions.',
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const loadInsights = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setInsights((data as AiInsight[]) || [])
    } catch {
      toast.error('Failed to load AI insights')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadInsights()
    // Initialize with a welcome message
    setMessages([
      {
        role: 'assistant',
        content:
          'Hello! I am the VATTAMS AI Assistant. I can help you with analytics, insights, and operational questions about your home services platform. How can I help you today?',
        timestamp: new Date().toISOString(),
      },
    ])
  }, [loadInsights])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!input.trim() || sending) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setSending(true)

    try {
      // Simulate AI response (in production, this would call an edge function)
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const responses = [
        'Based on the current data, your bookings have increased by 15% this month. AC Service and Washing Machine repairs are the top categories. I recommend focusing marketing efforts on these high-demand services.',
        'I notice that customer retention rates are highest for technicians with ratings above 4.5. Consider implementing a reward system for top-rated technicians to maintain service quality.',
        'Your service area coverage shows good penetration in Chennai and Coimbatore. Consider expanding to Madurai and Tiruchirappalli where demand is growing. The peak booking hours are between 10 AM and 2 PM.',
        'The referral program has generated 234 new customers this quarter. The conversion rate from referral to first booking is 68%, which is above industry average. Consider increasing the referral reward to boost growth further.',
        'I detect a pattern of increased cancellations on weekends for plumbing services. This may indicate a need for more plumbing technicians available during weekend slots. I recommend adjusting technician schedules accordingly.',
      ]

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch {
      toast.error('Failed to get AI response')
    } finally {
      setSending(false)
    }
  }

  async function clearInsights() {
    setClearing(true)
    try {
      const { error } = await supabase.from('ai_insights').delete().neq('id', '')
      if (error) throw error
      toast.success('Insights cleared')
      await loadInsights()
    } catch {
      toast.error('Failed to clear insights')
    } finally {
      setClearing(false)
    }
  }

  function renderInsightData(data: Record<string, unknown>): string {
    const entries = Object.entries(data)
    if (entries.length === 0) return 'No data available'
    return entries
      .map(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          return `${key}: ${JSON.stringify(value)}`
        }
        return `${key}: ${String(value)}`
      })
      .join(', ')
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
      <div>
        <h1 className="text-2xl font-bold text-slate-900">AI Assistant</h1>
        <p className="mt-1 text-sm text-slate-500">
          Interact with AI and view generated insights for your platform
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Chat Interface */}
        <Card className="flex flex-col" style={{ minHeight: '500px' }}>
          <CardHeader className="border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                <Bot className="h-5 w-5 text-blue-600" />
              </div>
              <CardTitle className="text-base">AI Chat</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col p-0">
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`flex max-w-[80%] gap-2 ${
                      msg.role === 'user'
                        ? 'flex-row-reverse'
                        : 'flex-row'
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        msg.role === 'user'
                          ? 'bg-blue-600'
                          : 'bg-slate-200'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <span className="text-xs font-medium text-white">
                          You
                        </span>
                      ) : (
                        <Bot className="h-4 w-4 text-slate-600" />
                      )}
                    </div>
                    <div
                      className={`rounded-lg px-4 py-2 text-sm ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200">
                      <Bot className="h-4 w-4 text-slate-600" />
                    </div>
                    <div className="flex items-center gap-1 rounded-lg bg-slate-100 px-4 py-3">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                      <span
                        className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
                        style={{ animationDelay: '0.2s' }}
                      />
                      <span
                        className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
                        style={{ animationDelay: '0.4s' }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="border-t border-slate-200 p-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Ask about analytics, insights, or operations..."
                  value={input}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  rows={1}
                  className="resize-none"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  size="md"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Configuration */}
        <Card>
          <CardHeader className="border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                <Brain className="h-5 w-5 text-purple-600" />
              </div>
              <CardTitle className="text-base">AI Configuration</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Model</Label>
              <input
                type="text"
                value={config.model}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                  setConfig({ ...config, model: e.target.value })
                }
                className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Temperature</Label>
                <input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={config.temperature}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    setConfig({
                      ...config,
                      temperature: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Max Tokens</Label>
                <input
                  type="number"
                  min="100"
                  max="4000"
                  step="100"
                  value={config.maxTokens}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                    setConfig({
                      ...config,
                      maxTokens: parseInt(e.target.value) || 1000,
                    })
                  }
                  className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>System Prompt</Label>
              <Textarea
                value={config.systemPrompt}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                  setConfig({ ...config, systemPrompt: e.target.value })
                }
                rows={5}
              />
            </div>
            <Button
              onClick={() => toast.success('Configuration saved')}
              className="w-full"
            >
              Save Configuration
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
              <Sparkles className="h-5 w-5 text-amber-600" />
            </div>
            <CardTitle className="text-base">AI Insights</CardTitle>
            <Badge color="blue">{insights.length}</Badge>
          </div>
          {insights.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearInsights}
              loading={clearing}
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 className="mr-1 h-4 w-4" /> Clear All
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {insights.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Sparkles className="h-12 w-12 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-500">
                No AI insights available
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Insights will be generated as the AI analyzes your platform data
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {insights.map((insight) => {
                const insightData = insight.data as Record<string, unknown>
                const Icon =
                  INSIGHT_ICONS[insight.insight_type] || Sparkles
                return (
                  <div
                    key={insight.id}
                    className="flex items-start gap-3 rounded-lg border border-slate-200 p-4 hover:bg-slate-50"
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-${
                        INSIGHT_COLORS[insight.insight_type] || 'gray'
                      }-100`}
                    >
                      <Icon
                        className={`h-5 w-5 text-${
                          INSIGHT_COLORS[insight.insight_type] || 'gray'
                        }-600`}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            color={
                              (INSIGHT_COLORS[insight.insight_type] as any) ||
                              'gray'
                            }
                          >
                            {insight.insight_type}
                          </Badge>
                          <span className="text-xs text-slate-400">
                            {formatDateTime(insight.created_at)}
                          </span>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        {renderInsightData(insightData)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
