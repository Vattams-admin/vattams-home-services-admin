import { useState } from 'react'
import {
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Clock,
  Send,
  Headphones,
  Wrench,
  ArrowRight,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input, Textarea, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn, sanitizeInput } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import {
  PRIMARY_PHONE,
  TECHNICIAN_SUPPORT_PHONE,
  WHATSAPP_NUMBER,
  TECHNICIAN_WHATSAPP_NUMBER,
  CONTACT,
  telLink,
  whatsappLink,
} from '@/lib/constants'

const contactMethods = [
  {
    icon: Phone,
    title: 'Call Customer Support',
    description: 'For booking, queries, and general support',
    phone: PRIMARY_PHONE,
    action: telLink(PRIMARY_PHONE),
    color: 'text-blue-600 bg-blue-50',
  },
  {
    icon: Wrench,
    title: 'Technician Helpline',
    description: 'For technician support and verification',
    phone: TECHNICIAN_SUPPORT_PHONE,
    action: telLink(TECHNICIAN_SUPPORT_PHONE),
    color: 'text-orange-600 bg-orange-50',
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp Us',
    description: 'Quick chat for any questions or bookings',
    phone: PRIMARY_PHONE,
    action: whatsappLink(WHATSAPP_NUMBER, 'Hi, I would like to know more about your services.'),
    color: 'text-green-600 bg-green-50',
  },
  {
    icon: Mail,
    title: 'Email Us',
    description: 'We respond within 24 hours',
    phone: CONTACT.email,
    action: `mailto:${CONTACT.email}`,
    color: 'text-violet-600 bg-violet-50',
  },
]

const socialLinks = [
  { icon: Facebook, label: 'Facebook', url: CONTACT.social.facebook },
  { icon: Twitter, label: 'Twitter', url: CONTACT.social.twitter },
  { icon: Linkedin, label: 'LinkedIn', url: CONTACT.social.linkedin },
  { icon: Youtube, label: 'YouTube', url: CONTACT.social.youtube },
]

const serviceCategories = [
  'AC Service',
  'Plumbing',
  'Electrical',
  'Deep Cleaning',
  'Pest Control',
  'Painting',
  'Carpentry',
  'Appliance Repair',
  'General Inquiry',
  'Feedback',
  'Complaint',
  'Other',
]

interface ContactFormData {
  name: string
  email: string
  phone: string
  subject: string
  message: string
}

export default function ContactPage() {
  const toast = useToast()
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'name' || name === 'message' ? sanitizeInput(value) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    toast.success(
      'Message Sent!',
      'Thank you for reaching out. We will get back to you within 24 hours.'
    )

    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: 'General Inquiry',
      message: '',
    })
    setSubmitting(false)
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-4 border-white/20 bg-white/10 text-white">
              Get in Touch
            </Badge>
            <h1 className="text-4xl font-bold sm:text-5xl">Contact Us</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-blue-100">
              Have a question or need help? We're here for you. Reach out through any of the channels below.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {contactMethods.map((method) => (
              <a key={method.title} href={method.action} className="block">
                <Card className="h-full transition hover:shadow-lg">
                  <CardContent className="p-6 text-center">
                    <div
                      className={cn(
                        'mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl',
                        method.color
                      )}
                    >
                      <method.icon className="h-7 w-7" />
                    </div>
                    <h3 className="mb-1 text-lg font-semibold text-slate-900">{method.title}</h3>
                    <p className="mb-3 text-sm text-slate-500">{method.description}</p>
                    <p className="font-medium text-blue-600">{method.phone}</p>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Form */}
            <div>
              <Badge color="blue" className="mb-3">Send a Message</Badge>
              <h2 className="mb-2 text-2xl font-bold text-slate-900">We'd Love to Hear From You</h2>
              <p className="mb-6 text-slate-600">
                Fill out the form below and our team will get back to you as soon as possible.
              </p>
              <Card>
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Your Name *</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Enter your name"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="9876543210"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Select
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                      >
                        {serviceCategories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell us how we can help you..."
                        rows={5}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" loading={submitting}>
                      {submitting ? (
                        'Sending...'
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" /> Send Message
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Info */}
            <div className="space-y-6">
              <div>
                <Badge color="green" className="mb-3">Contact Information</Badge>
                <h2 className="mb-2 text-2xl font-bold text-slate-900">Reach Out Anytime</h2>
                <p className="mb-6 text-slate-600">
                  Our customer support team is available to assist you with bookings, queries, and any service-related questions.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50">
                      <Phone className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Customer Support</p>
                      <a href={telLink(PRIMARY_PHONE)} className="text-blue-600 hover:underline">
                        {PRIMARY_PHONE}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-orange-50">
                      <Wrench className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Technician Helpline</p>
                      <a href={telLink(TECHNICIAN_SUPPORT_PHONE)} className="text-blue-600 hover:underline">
                        {TECHNICIAN_SUPPORT_PHONE}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-green-50">
                      <MessageCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">WhatsApp</p>
                      <a
                        href={whatsappLink(WHATSAPP_NUMBER, 'Hi, I have a question.')}
                        className="text-blue-600 hover:underline"
                      >
                        Chat with us on WhatsApp
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-violet-50">
                      <Mail className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Email</p>
                      <a href={`mailto:${CONTACT.email}`} className="text-blue-600 hover:underline">
                        {CONTACT.email}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-50">
                      <MapPin className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Address</p>
                      <p className="text-slate-600">{CONTACT.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-cyan-50">
                      <Clock className="h-5 w-5 text-cyan-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Working Hours</p>
                      <p className="text-slate-600">Monday - Sunday: 7:00 AM - 10:00 PM</p>
                      <p className="text-sm text-slate-500">Emergency services available 24/7</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div>
                <h3 className="mb-4 font-semibold text-slate-900">Follow Us</h3>
                <div className="flex gap-3">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                      aria-label={social.label}
                    >
                      <social.icon className="h-5 w-5" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Quick WhatsApp Buttons */}
              <div className="rounded-xl bg-green-50 p-6">
                <div className="mb-4 flex items-center gap-3">
                  <MessageCircle className="h-6 w-6 text-green-600" />
                  <h3 className="font-semibold text-slate-900">Quick WhatsApp Actions</h3>
                </div>
                <div className="space-y-2">
                  <a
                    href={whatsappLink(WHATSAPP_NUMBER, 'Hi, I would like to book a service.')}
                    className="flex items-center justify-between rounded-lg bg-white p-3 text-sm transition hover:shadow-sm"
                  >
                    <span className="text-slate-700">Book a service</span>
                    <ArrowRight className="h-4 w-4 text-green-600" />
                  </a>
                  <a
                    href={whatsappLink(WHATSAPP_NUMBER, 'Hi, I have a query about my booking.')}
                    className="flex items-center justify-between rounded-lg bg-white p-3 text-sm transition hover:shadow-sm"
                  >
                    <span className="text-slate-700">Ask about existing booking</span>
                    <ArrowRight className="h-4 w-4 text-green-600" />
                  </a>
                  <a
                    href={whatsappLink(TECHNICIAN_WHATSAPP_NUMBER, 'Hi, I am a technician and would like to join VATTAMS.')}
                    className="flex items-center justify-between rounded-lg bg-white p-3 text-sm transition hover:shadow-sm"
                  >
                    <span className="text-slate-700">Join as technician</span>
                    <ArrowRight className="h-4 w-4 text-green-600" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Placeholder */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <Badge color="cyan" className="mb-3">Find Us</Badge>
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Our Service Area</h2>
            <p className="mt-4 text-lg text-slate-600">
              We currently serve across Tamil Nadu. Check if we're available in your city.
            </p>
          </div>
          <Card className="overflow-hidden">
            <div className="relative flex h-96 items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg">
                  <MapPin className="h-8 w-8" />
                </div>
                <p className="text-lg font-semibold text-slate-900">Tamil Nadu, India</p>
                <p className="mt-1 text-sm text-slate-600">
                  Serving 10+ cities across Tamil Nadu
                </p>
                <a href="/cities" className="mt-4 inline-block">
                  <Button variant="outline" size="sm">
                    View All Cities <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Support Banner */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-4">
              <Headphones className="h-10 w-10" />
              <div>
                <h3 className="text-xl font-bold">Need Immediate Help?</h3>
                <p className="text-blue-100">Our support team is just a call away</p>
              </div>
            </div>
            <div className="flex gap-3">
              <a href={telLink(PRIMARY_PHONE)}>
                <Button size="lg" variant="secondary" className="bg-white text-blue-700 hover:bg-blue-50">
                  <Phone className="mr-2 h-5 w-5" /> Call Now
                </Button>
              </a>
              <a href={whatsappLink(WHATSAPP_NUMBER)}>
                <Button size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">
                  <MessageCircle className="mr-2 h-5 w-5" /> WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
