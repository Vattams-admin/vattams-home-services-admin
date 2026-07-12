import { Link } from 'react-router-dom'
import { Shield, Clock, Star, Users, Target, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'

const values = [
  { icon: Shield, title: 'Trust & Safety', desc: 'Every technician is background-verified and skill-tested before joining our network.' },
  { icon: Star, title: 'Quality First', desc: 'We never compromise on service quality. Your satisfaction is our top priority.' },
  { icon: Heart, title: 'Customer Care', desc: 'We treat every home with respect and every customer like family.' },
  { icon: Target, title: 'Transparency', desc: 'Honest pricing, clear communication, and no hidden charges — ever.' },
]

const stats = [
  { value: '10,000+', label: 'Services Completed' },
  { value: '500+', label: 'Verified Technicians' },
  { value: '10+', label: 'Cities Served' },
  { value: '4.8★', label: 'Customer Rating' },
]

export function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">About VATTAMS</h1>
          <p className="mt-4 max-w-3xl text-lg text-blue-100">
            Connecting Tamil Nadu homes with trusted, professional service technicians since day one.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Our Story</h2>
            <p className="mt-4 text-gray-600">
              VATTAMS was born from a simple idea: finding reliable home service professionals should not be a struggle.
              Across Tamil Nadu, families faced the same challenge — unverified technicians, unpredictable pricing,
              and inconsistent service quality.
            </p>
            <p className="mt-4 text-gray-600">
              We set out to change that. Today, VATTAMS connects thousands of homes with background-verified,
              skill-tested technicians across AC service, appliance repair, plumbing, electrical work, and more.
              Every booking is tracked, every technician is accountable, and every service is backed by our quality guarantee.
            </p>
          </div>
          <div className="flex flex-col justify-center rounded-lg bg-blue-50 p-8">
            <h3 className="text-xl font-semibold text-gray-900">Our Mission</h3>
            <p className="mt-3 text-gray-600">
              To make professional home services accessible, affordable, and trustworthy for every household in Tamil Nadu —
              one verified technician at a time.
            </p>
            <h3 className="mt-6 text-xl font-semibold text-gray-900">Our Vision</h3>
            <p className="mt-3 text-gray-600">
              To be Tamil Nadu's most trusted home services platform, empowering technicians with fair work and
              customers with peace of mind.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="text-center text-3xl font-bold text-gray-900">Our Values</h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.title} className="rounded-lg bg-white p-6 text-center shadow-sm">
                <v.icon className="mx-auto h-10 w-10 text-blue-600" />
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{v.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{v.desc}</p>
              </div>
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

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h2 className="text-3xl font-bold text-gray-900">Join the VATTAMS Family</h2>
        <p className="mt-2 text-gray-600">Whether you need a service or want to provide one, we'd love to have you.</p>
        <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link to="/register/customer"><Button size="lg">Book a Service</Button></Link>
          <Link to="/register/technician"><Button size="lg" variant="outline">Become a Technician</Button></Link>
        </div>
      </section>
    </div>
  )
}
