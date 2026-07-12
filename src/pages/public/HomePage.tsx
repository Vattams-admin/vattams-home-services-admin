import { Link } from 'react-router-dom'
import { Wind, Sparkles, Snowflake, WashingMachine, Droplets, Zap, Wrench, Cctv, Shield, Clock, Star, CircleCheck as CheckCircle, Phone, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  SERVICE_AREAS, PRIMARY_PHONE_DISPLAY, telLink, PRIMARY_PHONE, whatsappSupportLink,
} from '@/lib/constants'

const services = [
  { icon: Wind, name: 'AC Service', desc: 'Installation, repair & maintenance' },
  { icon: Sparkles, name: 'Deep Cleaning', desc: 'Home & office deep cleaning' },
  { icon: Snowflake, name: 'Refrigerator', desc: 'Fridge repair & servicing' },
  { icon: WashingMachine, name: 'Washing Machine', desc: 'Repair & installation' },
  { icon: Droplets, name: 'Plumbing', desc: 'Leaks, fittings & fixtures' },
  { icon: Zap, name: 'Electrical', desc: 'Wiring, repairs & safety' },
  { icon: Wrench, name: 'Appliance Repair', desc: 'All home appliance repairs' },
  { icon: Cctv, name: 'CCTV Installation', desc: 'Security camera setup' },
]

const features = [
  { icon: Shield, title: 'Verified Professionals', desc: 'Background-checked technicians' },
  { icon: Clock, title: 'On-Time Service', desc: 'Punctual and reliable visits' },
  { icon: Star, title: 'Quality Assured', desc: 'Rated by thousands of customers' },
  { icon: CheckCircle, title: 'Satisfaction Guarantee', desc: 'Work done right, guaranteed' },
]

export function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 text-white">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="relative mx-auto max-w-7xl px-4 py-20 md:py-28">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Trusted Home Services at Your Doorstep
            </h1>
            <p className="mt-4 text-lg text-blue-100">
              Professional technicians for AC, cleaning, plumbing, electrical and more across Tamil Nadu.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-white text-blue-700 hover:bg-blue-50">
                <Link to="/register/customer">Book a Service <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <a href={telLink(PRIMARY_PHONE)}><Phone className="mr-2 h-4 w-4" /> {PRIMARY_PHONE_DISPLAY}</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-gray-900">Our Services</h2>
          <p className="mt-2 text-gray-600">Comprehensive home services by trusted professionals</p>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {services.map((s) => (
            <Card key={s.name} className="transition-shadow hover:shadow-md">
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                  <s.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">{s.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{s.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button asChild variant="outline">
            <Link to="/services">View All Services <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-gray-900">Why Choose VATTAMS?</h2>
            <p className="mt-2 text-gray-600">We make home services simple, reliable and affordable</p>
          </div>
          <div className="grid gap-6 md:grid-cols-4">
            {features.map((f) => (
              <Card key={f.title}>
                <CardContent className="p-6 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600">
                    <f.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900">{f.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Cities */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-gray-900">Cities We Serve</h2>
          <p className="mt-2 text-gray-600">Available across {SERVICE_AREAS.length} cities in Tamil Nadu</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {SERVICE_AREAS.map((city) => (
            <span key={city} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm">
              {city}
            </span>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button asChild variant="outline">
            <Link to="/cities">View All Cities <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold">Ready to Book a Service?</h2>
          <p className="mt-2 text-blue-100">Get started in minutes — our technicians are ready to help.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-white text-blue-700 hover:bg-blue-50">
              <Link to="/register/customer">Book Now</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              <a href={whatsappSupportLink('Hello VATTAMS, I would like to book a service.')}>WhatsApp Us</a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
