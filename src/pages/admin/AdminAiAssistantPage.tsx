import { useEffect, useState, useRef } from 'react'
import { Send, Bot, User, Sparkles, TrendingUp, DollarSign, Wrench, Users, Lightbulb } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { AiConversation } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/LoadingScreen'
import { formatCurrency, formatDate, formatDateTime, BOOKING_STATUS_COLORS } from '@/lib/utils'
import type { FormEvent } from 'react'

type Msg = { role: string; content: string; timestamp: string }

export function AdminAiAssistantPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [conversation, setConversation] = useState<AiConversation | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!profile) return
      const { data } = await supabase.from('ai_conversations').select('*').eq('user_id', profile.id).eq('role', 'admin').order('created_at', { ascending: false }).limit(1).maybeSingle()
      if (data) {
        const conv = data as AiConversation
        setConversation(conv)
        setMessages(conv.messages || [])
      } else {
        const initMsgs: Msg[] = [{ role: 'assistant', content: 'Hello! I am your AI Admin Assistant. I can help you analyze bookings, revenue, technician performance, and customer trends. Try one of the quick suggestions below or ask me anything!', timestamp: new Date().toISOString() }]
        setMessages(initMsgs)
        const { data: created } = await supabase.from('ai_conversations').insert({ user_id: profile.id, role: 'admin', messages: initMsgs, title: 'Admin Assistant' }).select().single()
        if (created) setConversation(created as AiConversation)
      }
      if (mounted) setLoading(false)
    })()
    return () => { mounted = false }
  }, [profile])

  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight) }, [messages, typing])

  const saveMessages = async (msgs: Msg[]) => {
    if (!profile || !conversation) return
    await supabase.from('ai_conversations').update({ messages: msgs }).eq('id', conversation.id)
  }

  const generateResponse = async (query: string): Promise<string> => {
    const q = query.toLowerCase()
    if (q.includes('booking')) {
      const { data: bks } = await supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(100)
      const bookings = (bks as Record<string, unknown>[]) || []
      const total = bookings.length
      const completed = bookings.filter((b) => b.status === 'completed').length
      const active = bookings.filter((b) => !['completed', 'cancelled'].includes(b.status as string)).length
      const cancelled = bookings.filter((b) => b.status === 'cancelled').length
      return `📊 Booking Insights:\n\n• Total Bookings: ${total}\n• Active Bookings: ${active}\n• Completed: ${completed}\n• Cancelled: ${cancelled}\n• Completion Rate: ${total > 0 ? ((completed / total) * 100).toFixed(1) : 0}%\n\nThe booking system is performing well. ${active > 10 ? 'There are several active bookings that may need attention.' : 'Active bookings are at a manageable level.'}`
    }
    if (q.includes('revenue')) {
      const { data: invs } = await supabase.from('invoices').select('*').eq('status', 'paid')
      const { data: txns } = await supabase.from('revenue_transactions').select('*')
      const totalRev = ((invs as { amount: number }[]) || []).reduce((s, i) => s + i.amount, 0)
      const verFee = ((txns as { transaction_type: string; amount: number }[]) || []).filter((t) => t.transaction_type === 'verification_fee').reduce((s, t) => s + t.amount, 0)
      const commission = ((txns as { transaction_type: string; amount: number }[]) || []).filter((t) => t.transaction_type === 'commission').reduce((s, t) => s + t.amount, 0)
      return `💰 Revenue Summary:\n\n• Total Revenue: ${formatCurrency(totalRev)}\n• Verification Fees: ${formatCurrency(verFee)}\n• Commission: ${formatCurrency(commission)}\n• Platform Revenue: ${formatCurrency(verFee + commission)}\n\n${totalRev > 100000 ? 'Revenue is strong! Consider expanding service areas.' : 'Revenue is growing steadily. Keep monitoring trends.'}`
    }
    if (q.includes('technician')) {
      const { data: techs } = await supabase.from('profiles').select('*').eq('role', 'technician')
      const { data: bks } = await supabase.from('bookings').select('*')
      const techArr = (techs as { id: string; name: string; verification_status: string | null; status: string | null }[]) || []
      const approved = techArr.filter((t) => t.verification_status === 'approved').length
      const pending = techArr.filter((t) => t.verification_status === 'under_review' || t.verification_status === 'fee_pending').length
      const bookings = (bks as { technician_id: string | null; status: string }[]) || []
      const techJobs: Record<string, number> = {}
      bookings.forEach((b) => { if (b.technician_id) techJobs[b.technician_id] = (techJobs[b.technician_id] || 0) + 1 })
      const topTech = Object.entries(techJobs).sort((a, b) => b[1] - a[1])[0]
      const topTechName = topTech ? techArr.find((t) => t.id === topTech[0])?.name : 'N/A'
      return `🔧 Technician Performance:\n\n• Total Technicians: ${techArr.length}\n• Approved: ${approved}\n• Pending Verification: ${pending}\n• Top Performer: ${topTechName} (${topTech ? topTech[1] : 0} jobs)\n\n${pending > 0 ? `There are ${pending} technicians awaiting verification. Review them promptly to improve service capacity.` : 'All technicians are verified and ready to work.'}`
    }
    if (q.includes('customer') || q.includes('trend')) {
      const { data: custs } = await supabase.from('profiles').select('*').eq('role', 'customer')
      const { data: bks } = await supabase.from('bookings').select('*')
      const custArr = (custs as { id: string; created_at: string }[]) || []
      const bookings = (bks as { customer_id: string; service_name: string }[]) || []
      const serviceCounts: Record<string, number> = {}
      bookings.forEach((b) => { serviceCounts[b.service_name] = (serviceCounts[b.service_name] || 0) + 1 })
      const topService = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0]
      const last30 = custArr.filter((c) => { const d = new Date(c.created_at); const ago = new Date(); ago.setDate(ago.getDate() - 30); return d >= ago }).length
      return `📈 Customer Trends:\n\n• Total Customers: ${custArr.length}\n• New (Last 30 days): ${last30}\n• Total Bookings: ${bookings.length}\n• Most Popular Service: ${topService ? `${topService[0]} (${topService[1]} bookings)` : 'N/A'}\n\n${last30 > 5 ? 'Customer growth is strong! Keep up the marketing efforts.' : 'Consider running promotions to boost customer acquisition.'}`
    }
    if (q.includes('action') || q.includes('suggest')) {
      const { data: bks } = await supabase.from('bookings').select('*')
      const { data: techs } = await supabase.from('profiles').select('*').eq('role', 'technician')
      const bookings = (bks as { status: string; technician_id: string | null }[]) || []
      const unassigned = bookings.filter((b) => !b.technician_id && b.status === 'created').length
      const pendingTechs = ((techs as { verification_status: string | null }[]) || []).filter((t) => t.verification_status === 'under_review' || t.verification_status === 'fee_pending').length
      const actions: string[] = []
      if (unassigned > 0) actions.push(`• Assign technicians to ${unassigned} unassigned bookings`)
      if (pendingTechs > 0) actions.push(`• Review ${pendingTechs} pending technician verifications`)
      actions.push('• Check revenue reports for monthly performance')
      actions.push('• Review customer complaints and follow-ups')
      return `💡 Suggested Actions:\n\n${actions.join('\n')}\n\nFocus on these priorities to keep the platform running smoothly.`
    }
    return `I can help you with:\n\n• Booking Insights - View booking statistics and trends\n• Revenue Summary - Check revenue and transaction details\n• Technician Performance - Analyze technician activity\n• Customer Trends - Monitor customer growth and patterns\n• Suggested Actions - Get recommendations for admin tasks\n\nTry clicking one of the quick suggestion buttons above!`
  }

  const sendQuery = async (query: string) => {
    if (!query.trim() || typing) return
    const userMsg: Msg = { role: 'user', content: query, timestamp: new Date().toISOString() }
    const newMsgs = [...messages, userMsg]
    setMessages(newMsgs); setTyping(true)
    const response = await generateResponse(query)
    const aiMsg: Msg = { role: 'assistant', content: response, timestamp: new Date().toISOString() }
    const finalMsgs = [...newMsgs, aiMsg]
    setMessages(finalMsgs); setTyping(false)
    await saveMessages(finalMsgs)
  }

  const send = async (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim() || typing) return
    const query = input
    setInput('')
    await sendQuery(query)
  }

  if (loading) return <LoadingScreen message="Loading AI Assistant..." />

  const suggestions = [
    { label: 'Booking Insights', icon: TrendingUp }, { label: 'Revenue Summary', icon: DollarSign },
    { label: 'Technician Performance', icon: Wrench }, { label: 'Customer Trends', icon: Users },
    { label: 'Suggested Actions', icon: Lightbulb },
  ]

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">AI Admin Assistant</h1>
      </div>

      <Card>
        <CardContent className="p-0">
          <div ref={scrollRef} className="h-[500px] overflow-y-auto p-4">
            <div className="space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'assistant' && <div className="mt-1 rounded-full bg-blue-100 p-2"><Bot className="h-4 w-4 text-blue-600" /></div>}
                  <div className={`max-w-[75%] rounded-lg p-3 ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                    <p className="whitespace-pre-wrap text-sm">{m.content}</p>
                    <p className={`mt-1 text-xs ${m.role === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>{formatDateTime(m.timestamp)}</p>
                  </div>
                  {m.role === 'user' && <div className="mt-1 rounded-full bg-gray-200 p-2"><User className="h-4 w-4 text-gray-600" /></div>}
                </div>
              ))}
              {typing && (
                <div className="flex gap-3">
                  <div className="mt-1 rounded-full bg-blue-100 p-2"><Bot className="h-4 w-4 text-blue-600" /></div>
                  <div className="rounded-lg bg-gray-100 p-3"><div className="flex gap-1"><span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0ms' }} /><span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '150ms' }} /><span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '300ms' }} /></div></div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {suggestions.map((s) => { const Icon = s.icon; return (
                <Button key={s.label} size="sm" variant="outline" onClick={() => sendQuery(s.label)}>
                  <Icon className="mr-1 h-3.5 w-3.5" /> {s.label}
                </Button>
              )})}
            </div>
            <form onSubmit={send} className="flex gap-2">
              <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about bookings, revenue, technicians, customers..." />
              <Button type="submit" disabled={!input.trim() || typing}><Send className="h-4 w-4" /></Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
