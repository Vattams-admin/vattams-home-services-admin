import { useState } from 'react'
import { Phone, MessageCircle, PlayCircle, MapPin, Mail, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { trackEvent } from '@/lib/notifications'
import { sanitizeInput } from '@/lib/utils'
import { PRIMARY_PHONE, WHATSAPP_NUMBER, YOUTUBE_URL, YOUTUBE_CHANNEL, telLink, whatsappSupportLink } from '@/lib/constants'
import type { FormEvent } from 'react'

export function ContactPage() {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await trackEvent('contact_form_submit', 'engagement', { name: form.name })
    setSubmitting(false)
    toast('Your message has been sent. We will get back to you soon!', 'success')
    setForm({ name: '', email: '', phone: '', message: '' })
  }

  const contactCards = [
    { icon: Phone, title: 'Call Us', value: PRIMARY_PHONE, href: telLink(PRIMARY_PHONE), desc: 'Mon-Sun, 8 AM - 8 PM' },
    { icon: MessageCircle, title: 'WhatsApp', value: WHATSAPP_NUMBER, href: whatsappSupportLink('Hello VATTAMS, I have a query'), desc: 'Chat with us anytime' },
    { icon: PlayCircle, title: 'YouTube', value: YOUTUBE_CHANNEL, href: YOUTUBE_URL, desc: 'Watch service tutorials' },
    { icon: MapPin, title: 'Service Area', value: 'Tamil Nadu', href: 'https://maps.google.com/?q=Tamil+Nadu', desc: 'Across 10+ cities' },
  ]

  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-10 text-center">
          <h1 className="mb-3 text-4xl font-bold text-gray-900">Contact Us</h1>
          <p className="mx-auto max-w-2xl text-gray-600">
            Have a question or need help? Reach out to us — we're here to help.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="mb-6 text-2xl font-bold text-gray-900">Get in Touch</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {contactCards.map((c) => (
                <a key={c.title} href={c.href} target="_blank" rel="noreferrer" className="block">
                  <Card className="h-full transition-shadow hover:shadow-md">
                    <CardContent className="pt-5">
                      <c.icon className="mb-3 h-8 w-8 text-blue-600" />
                      <h3 className="font-semibold text-gray-900">{c.title}</h3>
                      <p className="text-sm font-medium text-blue-600">{c.value}</p>
                      <p className="text-xs text-gray-500">{c.desc}</p>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>

            <div className="mt-6">
              <Card>
                <CardContent className="pt-5">
                  <Mail className="mb-2 h-6 w-6 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Email</h3>
                  <a href="mailto:support@vattams.com" className="text-sm text-blue-600 hover:underline">support@vattams.com</a>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card>
            <CardHeader><CardTitle>Send a Message</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: sanitizeInput(e.target.value) })} placeholder="Your name" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Your phone number" />
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" required rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: sanitizeInput(e.target.value) })} placeholder="How can we help you?" />
                </div>
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? 'Sending...' : <>Send Message <Send className="ml-2 h-4 w-4" /></>}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
