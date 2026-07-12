import { Link } from 'react-router-dom'
import { Users, Wrench, MapPin, Calendar, Shield, Heart, Target, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const stats = [
  { icon: Users, label: 'Happy Customers', value: '10,000+' },
  { icon: Wrench, label: 'Expert Technicians', value: '500+' },
  { icon: MapPin, label: 'Cities Served', value: '10' },
  { icon: Calendar, label: 'Years of Service', value: '5+' },
]

const values = [
  { icon: Shield, title: 'Trust & Safety', desc: 'Every technician is background-verified and trained to deliver safe, reliable service.' },
  { icon: Heart, title: 'Customer First', desc: 'We put our customers at the heart of everything we do, ensuring satisfaction at every step.' },
  { icon: Target, title: 'Quality Service', desc: 'We maintain high standards across all services with continuous training and quality checks.' },
  { icon: Award, title: 'Excellence', desc: 'We strive for excellence in every job, big or small, with attention to detail.' },
]

export function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 text-white">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">About VATTAMS</h1>
          <p className="mt-4 text-lg text-blue-100">
            Connecting homes with trusted professionals across Tamil Nadu — making quality home services accessible to everyone.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-6 text-center">
                <s.icon className="mx-auto h-8 w-8 text-blue-600" />
                <p className="mt-2 text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-sm text-gray-500">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-3xl font-bold text-gray-900">Our Story</h2>
          <div className="mt-6 space-y-4 text-gray-600">
            <p>
              VATTAMS Home Services was founded with a simple mission: to make professional home services
              reliable, affordable and accessible for every household in Tamil Nadu. We saw a gap between
              skilled technicians and customers who needed trustworthy service — and we set out to bridge it.
            </p>
            <p>
              Starting with a small team in Chennai, we have grown to serve 10 cities across the state,
              with a network of over 500 verified technicians. Our platform connects customers with
              professionals for AC service, deep cleaning, plumbing, electrical work, appliance repair and more.
            </p>
            <p>
              Today, we are proud to have served over 10,000 happy customers, and we continue to grow
              with the same commitment to quality and trust that we started with.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-gray-900">Our Values</h2>
          <p className="mt-2 text-gray-600">The principles that guide everything we do</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {values.map((v) => (
            <Card key={v.title}>
              <CardContent className="p-6">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600">
                  <v.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">{v.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{v.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold">Join the VATTAMS Family</h2>
          <p className="mt-2 text-blue-100">Book a service or become a technician partner today.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-white text-blue-700 hover:bg-blue-50">
              <Link to="/register/customer">Book a Service</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              <Link to="/register/technician">Become a Technician</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
