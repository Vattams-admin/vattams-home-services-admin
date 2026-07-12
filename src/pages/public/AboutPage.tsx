import { Target, Eye, Heart, Users, Award, TrendingUp, ShieldCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const stats = [
  { value: '10,000+', label: 'Services Completed' },
  { value: '500+', label: 'Verified Technicians' },
  { value: '10+', label: 'Cities Served' },
  { value: '4.8★', label: 'Customer Rating' },
]

const values = [
  { icon: ShieldCheck, title: 'Trust & Safety', desc: 'Every technician is background-verified and trained to deliver safe, reliable service.' },
  { icon: Heart, title: 'Customer First', desc: 'We put our customers at the center of everything we do, ensuring satisfaction at every step.' },
  { icon: Award, title: 'Quality Service', desc: 'We maintain high standards across all services with a satisfaction guarantee.' },
  { icon: TrendingUp, title: 'Continuous Improvement', desc: 'We constantly evolve our processes, training, and technology to serve you better.' },
]

export function AboutPage() {
  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4">
        {/* Hero */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">About VATTAMS</h1>
          <p className="mx-auto mt-3 max-w-3xl text-lg text-gray-600">
            VATTAMS Home Services connects homeowners across Tamil Nadu with verified,
            skilled technicians for all their home service needs — from AC repair to
            plumbing, electrical work, and beyond.
          </p>
        </div>

        {/* Story */}
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Our Story</h2>
            <p className="mt-4 text-gray-600">
              Founded with a simple mission — to make home services reliable, affordable, and
              accessible for every household in Tamil Nadu — VATTAMS began as a small team
              passionate about quality service. Today, we serve thousands of happy customers
              across the state.
            </p>
            <p className="mt-4 text-gray-600">
              We saw a gap between skilled technicians and the people who needed them. Long
              wait times, unpredictable pricing, and inconsistent quality were the norm.
              VATTAMS was built to change that — bringing transparency, trust, and technology
              to an industry that desperately needed it.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Card><CardContent className="flex flex-col items-center p-6 text-center"><Target className="h-10 w-10 text-blue-600" /><h3 className="mt-3 font-semibold">Our Mission</h3><p className="mt-1 text-sm text-gray-600">Reliable home services for everyone.</p></CardContent></Card>
            <Card><CardContent className="flex flex-col items-center p-6 text-center"><Eye className="h-10 w-10 text-blue-600" /><h3 className="mt-3 font-semibold">Our Vision</h3><p className="mt-1 text-sm text-gray-600">Tamil Nadu's most trusted service brand.</p></CardContent></Card>
            <Card><CardContent className="flex flex-col items-center p-6 text-center"><Users className="h-10 w-10 text-blue-600" /><h3 className="mt-3 font-semibold">For Customers</h3><p className="mt-1 text-sm text-gray-600">Easy booking, fair pricing, quality work.</p></CardContent></Card>
            <Card><CardContent className="flex flex-col items-center p-6 text-center"><Award className="h-10 w-10 text-blue-600" /><h3 className="mt-3 font-semibold">For Technicians</h3><p className="mt-1 text-sm text-gray-600">Steady income, dignity, and growth.</p></CardContent></Card>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-16 rounded-lg bg-blue-600 py-12 text-white">
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 px-4 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold">{s.value}</p>
                <p className="mt-1 text-sm text-blue-100">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="mt-16">
          <h2 className="text-center text-3xl font-bold text-gray-900">Our Core Values</h2>
          <p className="mt-2 text-center text-gray-600">The principles that guide everything we do</p>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <Card key={v.title}>
                <CardContent className="flex flex-col items-center p-6 text-center">
                  <v.icon className="h-10 w-10 text-blue-600" />
                  <h3 className="mt-4 font-semibold text-gray-900">{v.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{v.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
