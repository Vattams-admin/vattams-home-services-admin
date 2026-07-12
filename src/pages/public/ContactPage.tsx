import { useState, type FormEvent } from 'react'
import { Phone, MessageCircle, PlayCircle, MapPin, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { sanitizeInput } from '@/lib/utils'
import { PRIMARY_PHONE, WHATSAPP_NUMBER, YOUTUBE_URL, YOUTUBE_CHANNEL, telLink, whatsappSupportLink } from '@/lib/constants'

const contactCards = [
  { icon: Phone, title: 'Phone', value: PRIMARY_PHONE, href: telLink(PRIMARY_PHONE) },
  { icon: MessageCircle, title: 'WhatsApp', value: WHATSAPP_NUMBER, href: whatsappSupportLink('Hello VATTAMS, I have a question.') },
  { icon: PlayCircle, title: 'YouTube', value: YOUTUBE_CHANNEL, href: YOUTUBE_URL },
  { icon: MapPin, title: 'Address', value: 'Tamil Nadu, India', href: '#' },
]

export function ContactPage() {
  const { toast } = useToast()
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Simulate submission delay for UX feedback
    await new Promise((r) => setTimeout(r, 500))
    setLoading(false)
    setForm({ name: '', email: '', phone: '', message: '' })
    toast('Thank you! We will get back to you soon.', 'success')
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">Contact Us</h1>
        <p className="mt-3 text-lg text-gray-600">
          Have a question or need help? We're here for you.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Contact Info */}
        <div className="space-y-4">
          {contactCards.map((c) => (
            <Card key={c.title}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-lg bg-blue-50 p-3"><c.icon className="h-6 w-6 text-blue-600" /></div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{c.title}</p>
                  <a href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="text-lg font-semibold text-gray-900 hover:text-blue-600">
                    {c.value}
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Form */}
        <Card>
          <CardHeader><CardTitle>Send us a message</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: sanitizeInput(e.target.value) })} placeholder="Your name" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value.trim() })} placeholder="you@example.com" />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/[^0-9]/g, '') })} placeholder="9876543210" />
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" required rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: sanitizeInput(e.target.value) })} placeholder="How can we help you?" />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Sending...' : <>Send Message <Send className="ml-2 h-4 w-4" /></>}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
