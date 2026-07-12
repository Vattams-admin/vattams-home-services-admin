import { useState, type FormEvent } from 'react'
import { Phone, MessageCircle, PlayCircle, MapPin, Mail, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { sanitizeInput } from '@/lib/utils'
import {
  PRIMARY_PHONE, SUPPORT_PHONE, WHATSAPP_NUMBER, YOUTUBE_URL, YOUTUBE_CHANNEL,
  telLink, whatsappSupportLink,
} from '@/lib/constants'

const contactInfo = [
  { icon: Phone, title: 'Phone', value: PRIMARY_PHONE, href: telLink(PRIMARY_PHONE), desc: 'Mon-Sun, 8am - 8pm' },
  { icon: MessageCircle, title: 'WhatsApp', value: 'Chat with us', href: whatsappSupportLink('Hello VATTAMS, I have a query.'), desc: WHATSAPP_NUMBER },
  { icon: PlayCircle, title: 'YouTube', value: YOUTUBE_CHANNEL, href: YOUTUBE_URL, desc: 'Watch tutorials & tips' },
  { icon: MapPin, title: 'Address', value: 'Tamil Nadu, India', href: null, desc: 'Serving across Tamil Nadu' },
]

export function ContactPage() {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await new Promise((r) => setTimeout(r, 800))
      toast('Your message has been sent. We will contact you soon!', 'success')
      setForm({ name: '', email: '', phone: '', message: '' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">Contact Us</h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-gray-600">
            Have a question or need help? Reach out to us — we're here to serve you.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Contact Info */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {contactInfo.map((c) => (
              <Card key={c.title}>
                <CardContent className="flex flex-col items-start p-6">
                  <div className="rounded-lg bg-blue-50 p-3">
                    <c.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="mt-4 font-semibold text-gray-900">{c.title}</h3>
                  {c.href ? (
                    <a href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="mt-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                      {c.value}
                    </a>
                  ) : (
                    <p className="mt-1 text-sm font-medium text-gray-900">{c.value}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">{c.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle>Send us a message</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: sanitizeInput(e.target.value) })}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="9876543210"
                  />
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    required
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: sanitizeInput(e.target.value) })}
                    placeholder="How can we help you?"
                  />
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
