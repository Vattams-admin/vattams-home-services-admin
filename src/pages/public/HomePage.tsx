import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Wrench, Snowflake, Droplets, Zap, Sparkles, Bug, PaintRoller, Hammer, ShieldCheck, Clock, Star, Phone, MapPin, Users, CircleCheck as CheckCircle2, ArrowRight, Quote, Award, Headphones, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/lib/i18n'
import { cn, formatCurrency } from '@/lib/utils'
import {
  PRIMARY_PHONE,
  TECHNICIAN_SUPPORT_PHONE,
  WHATSAPP_NUMBER,
  SERVICE_CITIES,
  CONTACT,
  telLink,
  whatsappLink,
} from '@/lib/constants'

const featuredServices = [
  {
    icon: Snowflake,
    name: 'AC Service & Repair',
    description: 'AC installation, gas refilling, deep cleaning, and comprehensive repair services.',
    startingPrice: 499,
    color: 'text-cyan-600 bg-cyan-50',
  },
  {
    icon: Droplets,
    name: 'Plumbing',
    description: 'Pipe fitting, leak repair, tap replacement, bathroom and kitchen plumbing.',
    startingPrice: 299,
    color: 'text-blue-600 bg-blue-50',
  },
  {
    icon: Zap,
    name: 'Electrical',
    description: 'Wiring, switchboard repair, fan & light installation, electrical safety checks.',
    startingPrice: 299,
    color: 'text-amber-600 bg-amber-50',
  },
  {
    icon: Sparkles,
    name: 'Deep Cleaning',
    description: 'Home deep cleaning, kitchen sanitization, bathroom cleaning, sofa & carpet cleaning.',
    startingPrice: 999,
    color: 'text-green-600 bg-green-50',
  },
  {
    icon: Bug,
    name: 'Pest Control',
    description: 'Cockroach, termite, bedbug, and general pest control with safe chemicals.',
    startingPrice: 699,
    color: 'text-red-600 bg-red-50',
  },
  {
    icon: PaintRoller,
    name: 'Painting',
    description: 'Interior & exterior painting, waterproofing, texture and stencil painting.',
    startingPrice: 12,
    color: 'text-violet-600 bg-violet-50',
  },
  {
    icon: Hammer,
    name: 'Carpentry',
    description: 'Door & window repair, furniture assembly, modular kitchen installation.',
    startingPrice: 399,
    color: 'text-orange-600 bg-orange-50',
  },
  {
    icon: Wrench,
    name: 'Appliance Repair',
    description: 'Washing machine, refrigerator, microwave, and geyser repair services.',
    startingPrice: 399,
    color: 'text-indigo-600 bg-indigo-50',
  },
]

const whyChooseUs = [
  {
    icon: ShieldCheck,
    title: 'Verified Technicians',
    description: 'Every technician is background-verified, trained, and certified for quality service.',
  },
  {
    icon: Wallet,
    title: 'Transparent Pricing',
    description: 'No hidden charges. Know the price upfront before booking any service.',
  },
  {
    icon: Clock,
    title: 'On-Time Service',
    description: 'We respect your time. Our technicians arrive at the scheduled slot, guaranteed.',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    description: 'Dedicated customer support team available round the clock for all your needs.',
  },
  {
    icon: Award,
    title: 'Service Warranty',
    description: 'Up to 30-day service warranty on repairs. Free re-visit if the issue recurs.',
  },
  {
    icon: Users,
    title: '10,000+ Happy Customers',
    description: 'Trusted by thousands of households across Tamil Nadu for home services.',
  },
]

const testimonials = [
  {
    name: 'Rajesh Kumar',
    location: 'Chennai',
    rating: 5,
    text: 'Excellent AC service! The technician was professional and fixed the cooling issue in under an hour. Very transparent pricing with no hidden charges.',
    service: 'AC Service',
  },
  {
    name: 'Priya Sundaram',
    location: 'Coimbatore',
    rating: 5,
    text: 'Booked deep cleaning service for my 3BHK. The team was thorough and professional. My home looks brand new. Highly recommend VATTAMS!',
    service: 'Deep Cleaning',
  },
  {
    name: 'Murugan Velu',
    location: 'Madurai',
    rating: 5,
    text: 'Fixed a major plumbing leak on the same day I booked. The technician was knowledgeable and courteous. Great service at a fair price.',
    service: 'Plumbing',
  },
]

const stats = [
  { label: 'Happy Customers', value: '10,000+', icon: Users },
  { label: 'Verified Technicians', value: '500+', icon: ShieldCheck },
  { label: 'Services Completed', value: '25,000+', icon: CheckCircle2 },
  { label: 'Cities Served', value: '10+', icon: MapPin },
]

export default function HomePage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 100)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-20" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="space-y-6">
              <Badge color="blue" className="border-white/20 bg-white/10 text-white">
                <Star className="mr-1 h-3 w-3" /> Trusted by 10,000+ customers
              </Badge>
              <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                {t('hero.title')}
              </h1>
              <p className="text-lg text-blue-100 sm:text-xl">
                {t('hero.subtitle')}
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => navigate('/login')}
                  className="bg-white text-blue-700 hover:bg-blue-50"
                >
                  {t('cta.bookNow')} <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <a href={telLink(PRIMARY_PHONE)}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/30 bg-transparent text-white hover:bg-white/10"
                  >
                    <Phone className="mr-2 h-5 w-5" /> {PRIMARY_PHONE}
                  </Button>
                </a>
                <Link to="/register">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/30 bg-transparent text-white hover:bg-white/10"
                  >
                    <Wrench className="mr-2 h-5 w-5" /> Join as Technician
                  </Button>
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-6 text-sm text-blue-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400" /> Verified Technicians
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400" /> Transparent Pricing
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400" /> Service Warranty
                </div>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="rounded-2xl bg-white/10 p-8 backdrop-blur-sm">
                <div className="grid grid-cols-2 gap-4">
                  {featuredServices.slice(0, 4).map((service) => (
                    <div
                      key={service.name}
                      className="rounded-xl bg-white/10 p-6 text-center transition hover:bg-white/20"
                    >
                      <service.icon className="mx-auto mb-3 h-10 w-10" />
                      <p className="text-sm font-medium">{service.name}</p>
                      <p className="mt-1 text-xs text-blue-200">
                        from {formatCurrency(service.startingPrice)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((stat) => (
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

      {/* Featured Services */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <Badge color="blue" className="mb-3">Our Services</Badge>
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Professional Home Services
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              From AC repair to deep cleaning, we've got all your home service needs covered.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredServices.map((service) => (
              <Card
                key={service.name}
                className="group cursor-pointer transition hover:shadow-lg"
                onClick={() => navigate('/services')}
              >
                <CardContent className="p-6">
                  <div
                    className={cn(
                      'mb-4 flex h-14 w-14 items-center justify-center rounded-xl',
                      service.color
                    )}
                  >
                    <service.icon className="h-7 w-7" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-slate-900 group-hover:text-blue-600">
                    {service.name}
                  </h3>
                  <p className="text-sm text-slate-600">{service.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      from <span className="font-semibold text-slate-900">{formatCurrency(service.startingPrice)}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-blue-600 transition group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link to="/services">
              <Button size="lg" variant="outline">
                View All Services <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <Badge color="green" className="mb-3">Why Choose Us</Badge>
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              The VATTAMS Advantage
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              We're committed to delivering the best home service experience in Tamil Nadu.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {whyChooseUs.map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50">
                  <item.icon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="mb-1 text-lg font-semibold text-slate-900">{item.title}</h3>
                  <p className="text-sm text-slate-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <Badge color="amber" className="mb-3">Testimonials</Badge>
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              What Our Customers Say
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Real stories from real customers across Tamil Nadu.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name} className="relative">
                <CardContent className="p-6">
                  <Quote className="mb-4 h-8 w-8 text-blue-200" />
                  <div className="mb-4 flex gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="mb-4 text-sm text-slate-700">"{testimonial.text}"</p>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    <div>
                      <p className="font-semibold text-slate-900">{testimonial.name}</p>
                      <p className="text-xs text-slate-500">{testimonial.location}</p>
                    </div>
                    <Badge color="blue">{testimonial.service}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link to="/reviews">
              <Button variant="outline" size="lg">
                Read More Reviews <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Service Areas */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <Badge color="cyan" className="mb-3">Service Areas</Badge>
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Cities We Serve in Tamil Nadu
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Expanding across Tamil Nadu to bring professional home services near you.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {SERVICE_CITIES.map((city) => (
              <Link
                key={city}
                to="/cities"
                className="group flex items-center gap-2 rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50"
              >
                <MapPin className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">
                  {city}
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link to="/cities">
              <Button variant="outline" size="lg">
                View All Cities <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold sm:text-4xl">Ready to Book a Service?</h2>
          <p className="mt-4 text-lg text-blue-100">
            Get professional home services at your doorstep. Call us or book online today.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate('/login')}
              className="bg-white text-blue-700 hover:bg-blue-50"
            >
              {t('cta.bookNow')} <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <a href={whatsappLink(WHATSAPP_NUMBER, 'Hi, I would like to book a service.')}>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10"
              >
                <Phone className="mr-2 h-5 w-5" /> WhatsApp Us
              </Button>
            </a>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-8 text-sm text-blue-100">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" /> Customer: {PRIMARY_PHONE}
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" /> Technician: {TECHNICIAN_SUPPORT_PHONE}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> {CONTACT.address}
            </div>
          </div>
        </div>
      </section>

      {/* Scroll to top button */}
      {scrolled && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:bg-blue-700"
          aria-label="Scroll to top"
        >
          <ArrowRight className="h-5 w-5 -rotate-90" />
        </button>
      )}
    </div>
  )
}
