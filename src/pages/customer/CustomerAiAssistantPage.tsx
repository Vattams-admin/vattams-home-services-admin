import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  Trash2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

const SUGGESTED_PROMPTS = [
  'How do I book a service?',
  'What services do you offer?',
  'How can I track my booking?',
  'What are the payment options?',
  'How do I cancel a booking?',
]

// Simple local response generator for common questions
function generateLocalResponse(input: string): string {
  const lower = input.toLowerCase()
  if (lower.includes('book') && (lower.includes('service') || lower.includes('how'))) {
    return 'To book a service, go to the "Book a Service" page from your dashboard. Select a service category, enter your address details, choose a preferred date and time slot, and confirm your booking. You will receive a confirmation once a technician is assigned.'
  }
  if (lower.includes('service') && (lower.includes('offer') || lower.includes('available') || lower.includes('provide'))) {
    return 'VATTAMS offers the following home services across Tamil Nadu: AC Service, Washing Machine repair, Refrigerator repair, Plumbing, Electrical work, General Repair, CCTV installation, and Pest Control. Visit our Services page for more details.'
  }
  if (lower.includes('track') || lower.includes('status')) {
    return 'You can track your active bookings in real-time from the "Track Bookings" page. It shows the current status timeline, technician details, and estimated arrival time.'
  }
  if (lower.includes('pay')) {
    return 'You can view and pay your invoices from the "Payments" page. We support UPI payments. Each invoice has a downloadable PDF with a QR code for easy UPI payment.'
  }
  if (lower.includes('cancel')) {
    return 'To cancel a booking, go to your Bookings page and select the booking you wish to cancel. Cancellation is available before the technician arrives. Please note that cancellation charges may apply depending on the booking status.'
  }
  if (lower.includes('refer') || lower.includes('friend')) {
    return 'You can refer friends through the "Refer & Earn" page. Share your unique referral code with friends. When they sign up and complete their first booking, you both earn rewards!'
  }
  if (lower.includes('review') || lower.includes('rating') || lower.includes('feedback')) {
    return 'After a service is completed, you can leave a review by visiting the booking and clicking on "Review". Your feedback helps us improve our services and helps other customers.'
  }
  if (lower.includes('price') || lower.includes('cost') || lower.includes('charge')) {
    return 'Service prices start from ₹249 for General Repair, ₹299 for Plumbing/Electrical, ₹399 for AC/Washing Machine/Refrigerator, ₹599 for CCTV, and ₹699 for Pest Control. Final pricing depends on the actual work performed.'
  }
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return 'Hello! I am the VATTAMS AI Assistant. I can help you with booking services, tracking orders, payments, referrals, and more. How can I assist you today?'
  }
  if (lower.includes('thank')) {
    return 'You are welcome! Is there anything else I can help you with?'
  }
  return 'I understand you are asking about "' + input + '". For more specific assistance, you can call our customer support at 8189800757 or browse the relevant section in your dashboard. Would you like me to help with anything else?'
}

export default function CustomerAiAssistantPage() {
  const { profile, session } = useAuth()
  const toast = useToast()

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello ${profile?.name || 'there'}! I am the VATTAMS AI Assistant. I can help you with booking services, tracking orders, payments, and more. How can I assist you today?`,
      timestamp: new Date().toISOString(),
    },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const userId = profile?.id || session?.user?.id

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim() || sending) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMessage])
    const userQuery = input.trim()
    setInput('')
    setSending(true)

    try {
      // Try calling the edge function first, fall back to local response
      let assistantContent: string
      try {
        const { data, error } = await supabase.functions.invoke('ai-assistant', {
          body: { message: userQuery, userId, role: 'customer' },
        })
        if (error || !data?.response) throw new Error('Edge function unavailable')
        assistantContent = data.response
      } catch {
        // Fallback to local response generator
        await new Promise((resolve) => setTimeout(resolve, 600))
        assistantContent = generateLocalResponse(userQuery)
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch {
      toast.error('Failed to get response', 'Please try again later.')
    } finally {
      setSending(false)
    }
  }

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt)
  }

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `Hello ${profile?.name || 'there'}! I am the VATTAMS AI Assistant. How can I help you today?`,
        timestamp: new Date().toISOString(),
      },
    ])
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">AI Assistant</h1>
            <p className="text-xs text-slate-500">Ask me anything about VATTAMS services</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleClearChat}>
          <Trash2 className="mr-1 h-4 w-4" /> Clear
        </Button>
      </div>

      {/* Chat Container */}
      <Card className="flex flex-1 flex-col overflow-hidden">
        {/* Messages */}
        <CardContent className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn('flex gap-3', msg.role === 'user' && 'flex-row-reverse')}
            >
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white',
                )}
              >
                {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div
                className={cn(
                  'max-w-[75%] rounded-2xl px-4 py-2 text-sm',
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-800',
                )}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-1 rounded-2xl bg-slate-100 px-4 py-3">
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Suggested Prompts */}
        {messages.length <= 1 && (
          <div className="border-t border-slate-100 p-3">
            <p className="mb-2 text-xs font-medium text-slate-500">Suggested questions:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSuggestedPrompt(prompt)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 transition-colors hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-slate-200 p-4">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={sending}
              className="flex-1"
            />
            <Button type="submit" disabled={sending || !input.trim()}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
