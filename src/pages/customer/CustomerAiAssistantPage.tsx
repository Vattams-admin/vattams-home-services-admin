import { useEffect, useState, useRef } from 'react'
import { Send, Bot, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { AiConversation } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingScreen } from '@/components/LoadingScreen'
import { cn } from '@/lib/utils'
import { trackEvent } from '@/lib/notifications'
import type { FormEvent } from 'react'

type Msg = { role: string; content: string; timestamp: string }

const SUGGESTIONS = ['Book a Service', 'Track My Booking', 'Service Recommendations', 'File a Complaint', 'FAQ']

const getCannedResponse = (text: string): string => {
  const t = text.toLowerCase()
  if (t.includes('book') || t.includes('service')) return "You can book a service by clicking the \"Book New Service\" button on your dashboard. Choose your service, date, and address, and we'll assign a technician right away!"
  if (t.includes('track') || t.includes('booking')) return 'You can track your booking from the "My Bookings" page. Click on any booking to see its real-time status and technician details.'
  if (t.includes('recommend') || t.includes('suggest')) return 'Based on popular services, we recommend AC Service, Washing Machine Repair, and Plumbing. Check our Services page for the full list!'
  if (t.includes('complaint') || t.includes('issue') || t.includes('problem')) return 'We\'re sorry for the inconvenience! Please contact our support team at 8189800757 or reach out via WhatsApp for immediate assistance with your complaint.'
  if (t.includes('faq') || t.includes('question') || t.includes('help')) return 'FAQ: 1) How do I book? Go to Book New Service. 2) How do I pay? Visit the Payments page. 3) How do I track? Check My Bookings. 4) How do I review? Click Review on a completed booking.'
  return 'I\'m here to help! You can ask me about booking services, tracking your bookings, service recommendations, filing complaints, or FAQs. What would you like to know?'
}

export function CustomerAiAssistantPage() {
  const { profile } = useAuth()
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
      const { data: conv } = await supabase.from('ai_conversations').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
      if (!mounted) return
      const c = conv as AiConversation
      setConversation(c)
      if (c?.messages?.length) setMessages(c.messages)
      else setMessages([{ role: 'assistant', content: 'Hi! I\'m your VATTAMS AI Assistant. How can I help you today?', timestamp: new Date().toISOString() }])
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [profile])

  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight) }, [messages, typing])

  const saveConversation = async (msgs: Msg[]) => {
    if (!profile) return
    if (conversation) {
      await supabase.from('ai_conversations').update({ messages: msgs }).eq('id', conversation.id)
    } else {
      const { data } = await supabase.from('ai_conversations').insert({ user_id: profile.id, role: 'customer', messages: msgs, title: 'Customer Chat' }).select().single()
      setConversation(data as AiConversation)
    }
  }

  const sendMessage = async (text: string) => {
    if (!text.trim() || !profile) return
    const userMsg: Msg = { role: 'user', content: text, timestamp: new Date().toISOString() }
    const newMsgs = [...messages, userMsg]
    setMessages(newMsgs)
    setInput('')
    setTyping(true)
    await trackEvent('ai_chat_message', 'engagement', { role: 'customer' })

    setTimeout(async () => {
      const response = getCannedResponse(text)
      const botMsg: Msg = { role: 'assistant', content: response, timestamp: new Date().toISOString() }
      const allMsgs = [...newMsgs, botMsg]
      setMessages(allMsgs)
      setTyping(false)
      await saveConversation(allMsgs)
    }, 800)
  }

  const handleSubmit = (e: FormEvent) => { e.preventDefault(); sendMessage(input) }

  if (loading) return <LoadingScreen message="Loading AI Assistant..." />

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-3xl flex-col px-4 py-4">
      <div className="mb-4 flex items-center gap-2">
        <Bot className="h-6 w-6 text-blue-600" />
        <h1 className="text-xl font-bold text-gray-900">AI Assistant</h1>
      </div>

      <Card className="flex flex-1 flex-col">
        <CardContent className="flex flex-1 flex-col p-0">
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div key={i} className={cn('flex gap-2', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                {m.role === 'assistant' && <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100"><Bot className="h-4 w-4 text-blue-600" /></div>}
                <div className={cn('max-w-[75%] rounded-lg px-4 py-2', m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900')}>
                  <p className="text-sm">{m.content}</p>
                </div>
                {m.role === 'user' && <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-200"><User className="h-4 w-4 text-gray-600" /></div>}
              </div>
            ))}
            {typing && (
              <div className="flex gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100"><Bot className="h-4 w-4 text-blue-600" /></div>
                <div className="flex items-center gap-1 rounded-lg bg-gray-100 px-4 py-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 p-3">
            <div className="mb-2 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => <button key={s} onClick={() => sendMessage(s)} className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50">{s}</button>)}
            </div>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your message..." className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              <Button type="submit" disabled={!input.trim()}><Send className="h-4 w-4" /></Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
