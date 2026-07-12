import { Link } from 'react-router-dom'
import {
  Wind, Sparkles, Snowflake, Droplets, Zap, Wrench, Cctv, Shield,
  Clock, Star, CheckCircle, Phone, PlayCircle, ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PRIMARY_PHONE, YOUTUBE_URL, telLink } from '@/lib/constants'

const services = [
  { icon: Wind, title: 'AC Service', desc: 'Installation, repair, and maintenance for all AC brands.' },
  { icon: Sparkles, title: 'Washing Machine', desc: 'Expert repair and servicing for all washing machine types.' },
  { icon: Snowflake, title: 'Refrigerator', desc: 'Cooling issues, gas refill, and comprehensive repairs.' },
  { icon: Droplets, title: 'Plumbing', desc: 'Leaks, fittings, and complete plumbing solutions.' },
  { icon: Zap, title: 'Electrical', desc: 'Wiring, switchboard, and electrical safety checks.' },
  { icon: Wrench, title: 'General Repair', desc: 'Home appliance and general household repairs.' },
  { icon: Cctv, title: 'CCTV', desc: 'Security camera installation and monitoring setup.' },
  { icon: Shield, title: 'Pest Control', desc: 'Termite, cockroach, and general pest management.' },
]

const features = [
  { icon: Shield, title: 'Verified Technicians', desc: 'Background-verified and skill-tested professionals.' },
  { icon: Clock, title: 'On-Time Service', desc: 'Punctual service at your scheduled time slot.' },
  { icon: Star, title: 'Quality Guarantee', desc: 'Service quality backed by our satisfaction guarantee.' },
  { icon: CheckCircle, title: 'Easy Booking', desc: 'Book in under 2 minutes through our simple portal.' },
]

const stats = [
  { value: '10,000+', label: 'Services Completed' },
  { value: '500+', label: 'Verified Technicians' },
  { value: '10+', label: 'Cities Served' },
  { value: '4.8★', label: 'Customer Rating' },
]

export function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Professional Home Services at Your Doorstep
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-blue-100">
            AC service, washing machine, plumbing, electrical, and more — trusted professionals across Tamil Nadu.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/register/customer"><Button size="lg">Book Now</Button></Link>
            <a href={YOUTUBE_URL} target="_blank" rel="noreferrer">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <PlayCircle className="mr-2 h-5 w-5" /> YouTube
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-center text-3xl font-bold text-gray-900">Our Services</h2>
        <p className="mt-2 text-center text-gray-600">Comprehensive home services by trained professionals.</p>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <Card key={s.title} className="text-center transition-shadow hover:shadow-md">
              <CardContent className="flex flex-col items-center pt-6">
                <s.icon className="h-10 w-10 text-blue-600" />
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{s.desc}</p>
                <Link to="/services" className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700">
                  Learn more <ArrowRight className="inline h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="text-center text-3xl font-bold text-gray-900">Why Choose VATTAMS?</h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <Card key={f.title} className="text-center">
                <CardContent className="flex flex-col items-center pt-6">
                  <f.icon className="h-10 w-10 text-blue-600" />
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">{f.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-blue-700 text-white">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold">{s.value}</p>
                <p className="mt-1 text-sm text-blue-100">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h2 className="text-3xl font-bold text-gray-900">Need Help Right Away?</h2>
        <p className="mt-2 text-gray-600">Call us now and get connected to a verified technician.</p>
        <a href={telLink(PRIMARY_PHONE)} className="mt-6 inline-block">
          <Button size="lg"><Phone className="mr-2 h-5 w-5" /> {PRIMARY_PHONE}</Button>
        </a>
      </section>
    </div>
  )
}
