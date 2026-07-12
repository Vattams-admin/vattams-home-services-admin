import { useState } from 'react'
import { Phone, Mail, MessageCircle, MapPin, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  PRIMARY_PHONE_DISPLAY, SUPPORT_PHONE_DISPLAY, PRIMARY_PHONE, SUPPORT_PHONE,
  telLink, whatsappSupportLink,
} from '@/lib/constants'

export function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', mobile: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setForm({ name: '', email: '', mobile: '', message: '' })
  }

  return (
    <div>
      <section className="bg-gradient-to-br from-blue-700 to-blue-800 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h1 className="text-4xl font-bold">Contact Us</h1>
          <p className="mt-2 text-blue-100">We're here to help with any questions or service requests</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Contact Info */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Get in Touch</h3>
                <div className="space-y-4">
                  <a href={telLink(PRIMARY_PHONE)} className="flex items-center gap-3 text-gray-700 hover:text-blue-600">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                      <Phone className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Primary Phone</p>
                      <p className="font-medium">{PRIMARY_PHONE_DISPLAY}</p>
                    </div>
                  </a>
                  <a href={telLink(SUPPORT_PHONE)} className="flex items-center gap-3 text-gray-700 hover:text-blue-600">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                      <Phone className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Support Phone</p>
                      <p className="font-medium">{SUPPORT_PHONE_DISPLAY}</p>
                    </div>
                  </a>
                  <a href={whatsappSupportLink('Hello VATTAMS, I need assistance.')} className="flex items-center gap-3 text-gray-700 hover:text-green-600">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                      <MessageCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">WhatsApp</p>
                      <p className="font-medium">Chat with us</p>
                    </div>
                  </a>
                  <a href="mailto:support@vattams.com" className="flex items-center gap-3 text-gray-700 hover:text-blue-600">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">support@vattams.com</p>
                    </div>
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-gray-900">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Our Location</h3>
                </div>
                <div className="mt-4 h-48 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                  <MapPin className="h-10 w-10" />
                </div>
                <p className="mt-3 text-sm text-gray-500">Serving across Tamil Nadu, India</p>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Send a Message</h3>
              {submitted ? (
                <div className="rounded-lg bg-green-50 p-6 text-center">
                  <p className="font-medium text-green-700">Thank you for reaching out!</p>
                  <p className="mt-1 text-sm text-green-600">We'll get back to you shortly.</p>
                  <Button variant="outline" className="mt-4" onClick={() => setSubmitted(false)}>
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" value={form.name} onChange={handleChange} required placeholder="Your name" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required placeholder="you@example.com" />
                  </div>
                  <div>
                    <Label htmlFor="mobile">Mobile</Label>
                    <Input id="mobile" name="mobile" value={form.mobile} onChange={handleChange} required placeholder="+91 98765 43210" />
                  </div>
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea id="message" name="message" value={form.message} onChange={handleChange} required rows={4} placeholder="How can we help you?" />
                  </div>
                  <Button type="submit" className="w-full">
                    <Send className="mr-2 h-4 w-4" /> Send Message
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
