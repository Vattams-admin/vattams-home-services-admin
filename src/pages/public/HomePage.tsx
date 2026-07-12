import { Link } from 'react-router-dom'
import { Wind, Sparkles, Snowflake, Droplets, Zap, Wrench, Cctv, Shield, Clock, Star, CircleCheck as CheckCircle, Phone, CirclePlay as PlayCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  PRIMARY_PHONE, YOUTUBE_URL, YOUTUBE_CHANNEL, telLink,
} from '@/lib/constants'

const services = [
  { icon: Wind, title: 'AC Service', desc: 'Installation, repair, and maintenance for all AC brands.' },
  { icon: Sparkles, title: 'Washing Machine', desc: 'Top-load, front-load, and semi-automatic servicing.' },
  { icon: Snowflake, title: 'Refrigerator', desc: 'Cooling issues, gas refill, and compressor repair.' },
  { icon: Droplets, title: 'Plumbing', desc: 'Leaks, fittings, motor repair, and drainage solutions.' },
  { icon: Zap, title: 'Electrical', desc: 'Wiring, switchboard, fan, and lighting repairs.' },
  { icon: Wrench, title: 'General Repair', desc: 'Home appliance and general maintenance services.' },
  { icon: Cctv, title: 'CCTV', desc: 'Camera installation, DVR setup, and surveillance.' },
  { icon: Shield, title: 'Pest Control', desc: 'Termite, cockroach, and general pest management.' },
]

const features = [
  { icon: Shield, title: 'Verified Technicians', desc: 'Background-checked and skilled professionals.' },
  { icon: Clock, title: 'On-Time Service', desc: 'Punctual arrival and timely completion.' },
  { icon: Star, title: 'Quality Guarantee', desc: 'Satisfaction assured with every service.' },
  { icon: CheckCircle, title: 'Easy Booking', desc: 'Book in minutes with a few simple steps.' },
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
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Professional Home Services at Your Doorstep
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-blue-100">
            AC service, washing machine repair, plumbing, electrical work and more —
            trusted technicians across Tamil Nadu, ready to help.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/register/customer">
              <Button size="lg" variant="secondary">
                Book Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href={YOUTUBE_URL} target="_blank" rel="noreferrer">
              <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20">
                <PlayCircle className="mr-2 h-5 w-5" /> YouTube
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Our Services</h2>
            <p className="mt-2 text-gray-600">Comprehensive home services by trusted professionals</p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s) => (
              <Card key={s.title} className="text-center transition-shadow hover:shadow-md">
                <CardContent className="flex flex-col items-center p-6">
                  <s.icon className="h-12 w-12 text-blue-600" />
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">{s.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Why Choose VATTAMS?</h2>
            <p className="mt-2 text-gray-600">We make home services simple, reliable, and affordable</p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <Card key={f.title}>
                <CardContent className="flex flex-col items-center p-6 text-center">
                  <f.icon className="h-10 w-10 text-blue-600" />
                  <h3 className="mt-4 font-semibold text-gray-900">{f.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold text-blue-600">{s.value}</p>
                <p className="mt-1 text-sm text-gray-600">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-blue-600 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h2 className="text-3xl font-bold">Need a Service Today?</h2>
          <p className="mt-2 text-blue-100">Call us now or book online in minutes</p>
          <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a href={telLink(PRIMARY_PHONE)}>
              <Button size="lg" variant="secondary">
                <Phone className="mr-2 h-5 w-5" /> {PRIMARY_PHONE}
              </Button>
            </a>
            <Link to="/register/customer">
              <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20">
                Book Online <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-blue-200">
            Watch tutorials on YouTube: {YOUTUBE_CHANNEL}
          </p>
        </div>
      </section>
    </div>
  )
}
