import { useNavigate, Link } from 'react-router-dom'
import {
  Target,
  Eye,
  Heart,
  Award,
  Users,
  ShieldCheck,
  TrendingUp,
  HandHeart,
  Lightbulb,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Star,
  CheckCircle2,
  Building2,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  PRIMARY_PHONE,
  TECHNICIAN_SUPPORT_PHONE,
  CONTACT,
  telLink,
} from '@/lib/constants'

const companyStats = [
  { label: 'Years of Experience', value: '5+', icon: Award },
  { label: 'Happy Customers', value: '10,000+', icon: Users },
  { label: 'Verified Technicians', value: '500+', icon: ShieldCheck },
  { label: 'Services Completed', value: '25,000+', icon: CheckCircle2 },
]

const coreValues = [
  {
    icon: ShieldCheck,
    title: 'Trust & Transparency',
    description: 'We believe in complete transparency. No hidden charges, no false promises. What we quote is what you pay.',
  },
  {
    icon: Award,
    title: 'Quality Excellence',
    description: 'We never compromise on quality. Every technician is trained and certified to deliver the best service.',
  },
  {
    icon: HandHeart,
    title: 'Customer First',
    description: 'Our customers are at the heart of everything we do. We go the extra mile to ensure your satisfaction.',
  },
  {
    icon: Lightbulb,
    title: 'Innovation',
    description: 'We constantly innovate to make home services easier, faster, and more reliable for you.',
  },
  {
    icon: Users,
    title: 'Community',
    description: 'We empower local technicians with fair wages, training, and dignity, building stronger communities.',
  },
  {
    icon: Heart,
    title: 'Care & Safety',
    description: 'We use safe, eco-friendly products and follow strict safety protocols for your family\'s wellbeing.',
  },
]

const teamMembers = [
  {
    name: 'Vattams Founder',
    role: 'Founder & CEO',
    bio: 'With a vision to organize the unorganized home services sector in Tamil Nadu, our founder started VATTAMS to bring trust and transparency to every household.',
    initials: 'VF',
  },
  {
    name: 'Operations Head',
    role: 'Head of Operations',
    bio: 'Ensures every service meets our quality standards. Oversees technician training and customer satisfaction across all cities.',
    initials: 'OH',
  },
  {
    name: 'Tech Lead',
    role: 'Head of Technology',
    bio: 'Building the technology platform that makes booking, tracking, and managing home services seamless for customers and technicians.',
    initials: 'TL',
  },
  {
    name: 'Customer Care',
    role: 'Customer Support Lead',
    bio: 'Leads our 24/7 customer support team, ensuring every customer query and concern is addressed promptly and effectively.',
    initials: 'CC',
  },
]

const milestones = [
  {
    year: '2020',
    title: 'The Beginning',
    description: 'VATTAMS was founded with a mission to provide reliable, professional home services across Tamil Nadu.',
  },
  {
    year: '2021',
    title: 'First 1,000 Customers',
    description: 'Reached our first milestone of 1,000 happy customers and expanded to 3 major cities in Tamil Nadu.',
  },
  {
    year: '2022',
    title: 'Technician Network',
    description: 'Built a network of 200+ verified technicians and launched our online booking platform.',
  },
  {
    year: '2023',
    title: 'Expansion',
    description: 'Expanded to 10+ cities across Tamil Nadu with 500+ technicians and 10,000+ satisfied customers.',
  },
  {
    year: '2024',
    title: 'Innovation',
    description: 'Launched real-time tracking, AI assistant, and referral program to enhance customer experience.',
  },
]

export default function AboutPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 py-20 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-20" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4 border-white/20 bg-white/10 text-white">
              About Us
            </Badge>
            <h1 className="text-4xl font-bold sm:text-5xl">Our Story</h1>
            <p className="mt-6 text-lg text-blue-100 sm:text-xl">
              VATTAMS is on a mission to transform home services in Tamil Nadu. We connect households with verified, skilled technicians for professional and reliable service — every single time.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {companyStats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
                  <stat.icon className="h-7 w-7 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <Card className="border-blue-200 bg-white">
              <CardHeader>
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50">
                  <Target className="h-7 w-7 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  To provide every household in Tamil Nadu with access to reliable, professional, and affordable home services. We strive to organize the unorganized home services sector by empowering local technicians with fair wages, training, and technology — while delivering an exceptional experience to every customer.
                </p>
              </CardContent>
            </Card>
            <Card className="border-indigo-200 bg-white">
              <CardHeader>
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-50">
                  <Eye className="h-7 w-7 text-indigo-600" />
                </div>
                <CardTitle className="text-2xl">Our Vision</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  To become Tamil Nadu's most trusted and preferred home services platform, known for quality, transparency, and customer satisfaction. We envision a future where booking a home service is as easy as ordering food — with verified professionals, transparent pricing, and guaranteed quality at your doorstep.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <Badge color="green" className="mb-3">Our Values</Badge>
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              What We Stand For
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              The principles that guide everything we do at VATTAMS.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {coreValues.map((value) => (
              <Card key={value.title} className="transition hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                    <value.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-slate-900">{value.title}</h3>
                  <p className="text-sm text-slate-600">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline / Journey */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <Badge color="cyan" className="mb-3">Our Journey</Badge>
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Milestones We've Achieved
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              From a small idea to Tamil Nadu's trusted home services platform.
            </p>
          </div>
          <div className="relative">
            <div className="absolute left-4 top-0 hidden h-full w-0.5 bg-blue-200 lg:left-1/2 lg:block" />
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div
                  key={milestone.year}
                  className={cn(
                    'flex flex-col gap-4 lg:flex-row',
                    index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                  )}
                >
                  <div className="lg:w-1/2" />
                  <div className="relative flex items-center">
                    <div className="absolute left-4 h-4 w-4 rounded-full border-4 border-blue-600 bg-white lg:left-1/2 lg:-translate-x-1/2" />
                  </div>
                  <div className="flex-1 lg:w-1/2 lg:px-8">
                    <Card className="transition hover:shadow-lg">
                      <CardContent className="p-6">
                        <Badge color="blue" className="mb-2">{milestone.year}</Badge>
                        <h3 className="mb-2 text-lg font-semibold text-slate-900">{milestone.title}</h3>
                        <p className="text-sm text-slate-600">{milestone.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <Badge color="amber" className="mb-3">Our Team</Badge>
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Meet the People Behind VATTAMS
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              A dedicated team working to make your home services experience better.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {teamMembers.map((member) => (
              <Card key={member.name} className="text-center transition hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xl font-bold text-white">
                    {member.initials}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{member.name}</h3>
                  <p className="mb-3 text-sm text-blue-600">{member.role}</p>
                  <p className="text-sm text-slate-600">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Info Banner */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="grid gap-0 md:grid-cols-3">
                <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                    <Phone className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Call Us</h3>
                  <p className="text-sm text-slate-500">Customer Support</p>
                  <a href={telLink(PRIMARY_PHONE)} className="text-blue-600 hover:underline">
                    {PRIMARY_PHONE}
                  </a>
                  <p className="text-sm text-slate-500">Technician Support</p>
                  <a href={telLink(TECHNICIAN_SUPPORT_PHONE)} className="text-blue-600 hover:underline">
                    {TECHNICIAN_SUPPORT_PHONE}
                  </a>
                </div>
                <div className="flex flex-col items-center justify-center gap-3 border-t border-slate-200 p-8 text-center md:border-l md:border-t-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50">
                    <Mail className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Email Us</h3>
                  <p className="text-sm text-slate-500">We respond within 24 hours</p>
                  <a href={`mailto:${CONTACT.email}`} className="text-blue-600 hover:underline">
                    {CONTACT.email}
                  </a>
                </div>
                <div className="flex flex-col items-center justify-center gap-3 border-t border-slate-200 p-8 text-center md:border-l md:border-t-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50">
                    <MapPin className="h-6 w-6 text-amber-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Visit Us</h3>
                  <p className="text-sm text-slate-500">Our Service Area</p>
                  <p className="text-slate-700">{CONTACT.address}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <Sparkles className="mx-auto mb-4 h-10 w-10" />
          <h2 className="text-3xl font-bold sm:text-4xl">Join the VATTAMS Family</h2>
          <p className="mt-4 text-lg text-blue-100">
            Experience the difference of professional, reliable, and transparent home services.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate('/book')}
              className="bg-white text-blue-700 hover:bg-blue-50"
            >
              Book a Service <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Link to="/contact">
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10"
              >
                Contact Us <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
