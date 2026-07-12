import { useState, type FormEvent } from 'react'
import { Phone, MessageCircle, PlayCircle, MapPin, Mail, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { sanitizeInput } from '@/lib/utils'
import {
  PRIMARY_PHONE, SUPPORT_PHONE, WHATSAPP_NUMBER, YOUTUBE_URL, YOUTUBE_CHANNEL,
  telLink, whatsappSupportLink,
} from '@/lib/constants'

const contactInfo = [
  { icon: Phone, title: 'Call Us', value: PRIMARY_PHONE, href: telLink(PRIMARY_PHONE), desc: 'Mon-Sun, 8am to 8pm' },
  { icon: MessageCircle, title: 'WhatsApp', value: WHATSAPP_NUMBER, href: whatsappSupportLink('Hello VATTAMS, I have a query'), desc: 'Chat with our support team' },
  { icon: PlayCircle, title: 'YouTube', value: YOUTUBE_CHANNEL, href: YOUTUBE_URL, desc: 'Tips, tutorials & reviews' },
  { icon: MapPin, title: 'Address', value: 'Chennai, Tamil Nadu', href: '#', desc: 'Serving across Tamil Nadu' },
]

export function ContactPage() {
  const { toast } = useToast()
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Simulate submission
    setTimeout(() => {
      setLoading(false)
      setForm({ name: '', email: '', phone: '', message: '' })
      toast('Thank you! We will get back to you soon.', 'success')
    }, 600)
  }

  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">Contact Us</h1>
          <p className="mx-auto mt-3 max-w-2xl text-gray-600">
            Have a question or need help? Reach out to us — we&apos;re here to help.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Get in Touch</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {contactInfo.map((c) => (
                <Card key={c.title}>
                  <CardContent>
                    <a href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="block">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                          <c.icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{c.title}</p>
                          <p className="text-sm text-blue-600">{c.value}</p>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">{c.desc}</p>
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
              <Mail className="h-4 w-4 text-blue-600" />
              <span>support@vattams.com</span>
            </div>
            <p className="mt-2 text-xs text-gray-500">Support phone: {SUPPORT_PHONE}</p>
          </div>

          <Card>
            <CardContent>
              <h2 className="text-xl font-bold text-gray-900">Send a Message</h2>
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" required value={form.name}
                    onChange={(e) => setForm({ ...form, name: sanitizeInput(e.target.value) })}
                    placeholder="Your name" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={form.email}
                    onChange={(e) => setForm({ ...form, email: sanitizeInput(e.target.value) })}
                    placeholder="you@example.com" />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" type="tel" required value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: sanitizeInput(e.target.value) })}
                    placeholder="Your mobile number" />
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" required rows={4} value={form.message}
                    onChange={(e) => setForm({ ...form, message: sanitizeInput(e.target.value) })}
                    placeholder="How can we help you?" />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Sending...' : <>Send Message <Send className="ml-2 h-4 w-4" /></>}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
