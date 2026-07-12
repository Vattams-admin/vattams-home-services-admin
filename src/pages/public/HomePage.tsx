import { Link } from 'react-router-dom'
import { Wind, Sparkles, Snowflake, Droplets, Zap, Wrench, Cctv, Shield, Clock, Star, CircleCheck as CheckCircle, Phone, CirclePlay as PlayCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  PRIMARY_PHONE, YOUTUBE_URL, YOUTUBE_CHANNEL, telLink,
} from '@/lib/constants'

const services = [
  { icon: Wind, title: 'AC Service', desc: 'AC installation, repair, gas refill & annual maintenance' },
  { icon: Sparkles, title: 'Washing Machine', desc: 'Washing machine repair & servicing for all brands' },
  { icon: Snowflake, title: 'Refrigerator', desc: 'Fridge cooling issues, gas refill & compressor repair' },
  { icon: Droplets, title: 'Plumbing', desc: 'Pipe leaks, tap fitting, motor & drainage solutions' },
  { icon: Zap, title: 'Electrical', desc: 'Wiring, switchboard, fan & appliance installation' },
  { icon: Wrench, title: 'General Repair', desc: 'Home appliance & general household repairs' },
  { icon: Cctv, title: 'CCTV', desc: 'CCTV camera installation & surveillance setup' },
  { icon: Shield, title: 'Pest Control', desc: 'Termite, cockroach & general pest control services' },
]

const features = [
  { icon: Shield, title: 'Verified Technicians', desc: 'Background-checked & skilled professionals' },
  { icon: Clock, title: 'On-Time Service', desc: 'Punctual technicians at your doorstep' },
  { icon: Star, title: 'Quality Guarantee', desc: 'Service quality you can trust' },
  { icon: CheckCircle, title: 'Easy Booking', desc: 'Book in minutes, track in real-time' },
]

const stats = [
  { value: '10,000+', label: 'Happy Customers' },
  { value: '500+', label: 'Expert Technicians' },
  { value: '10', label: 'Cities Served' },
  { value: '4.8★', label: 'Average Rating' },
]

export function HomePage() {
  return (
    <div>
      <section className="bg-gradient-to-b from-blue-50 to-white py-20">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h1 className="text-4xl font-bold text-gray-900 md:text-5xl">
            Professional Home Services at Your Doorstep
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            AC service, washing machine, plumbing, electrical and more —
            trusted technicians across Tamil Nadu, ready to help at your convenience.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link to="/register/customer"><Button size="lg">Book Now</Button></Link>
            <a href={YOUTUBE_URL} target="_blank" rel="noreferrer">
              <Button size="lg" variant="outline"><PlayCircle className="mr-2 h-5 w-5" />YouTube</Button>
            </a>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-center text-3xl font-bold text-gray-900">Our Services</h2>
          <p className="mt-2 text-center text-gray-600">Comprehensive home services by verified professionals</p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s) => (
              <Card key={s.title} className="text-center transition-shadow hover:shadow-md">
                <CardContent className="flex flex-col items-center py-6">
                  <s.icon className="h-10 w-10 text-blue-600" />
                  <h3 className="mt-3 font-semibold text-gray-900">{s.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-center text-3xl font-bold text-gray-900">Why Choose VATTAMS</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
                  <f.icon className="h-7 w-7 text-blue-600" />
                </div>
                <h3 className="mt-4 font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-6 text-center sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((st) => (
              <div key={st.label}>
                <p className="text-3xl font-bold text-blue-600">{st.value}</p>
                <p className="mt-1 text-sm text-gray-600">{st.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-blue-600 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center text-white">
          <h2 className="text-3xl font-bold">Need a Service Today?</h2>
          <p className="mt-2 text-blue-100">Call us now or book online in minutes.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <a href={telLink(PRIMARY_PHONE)}>
              <Button size="lg" variant="secondary"><Phone className="mr-2 h-5 w-5" />{PRIMARY_PHONE}</Button>
            </a>
            <Link to="/register/customer">
              <Button size="lg" variant="outline" className="bg-white">Book Online <ArrowRight className="ml-2 h-5 w-5" /></Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-blue-100">Subscribe to our YouTube channel {YOUTUBE_CHANNEL} for tips & tutorials.</p>
        </div>
      </section>
    </div>
  )
}
