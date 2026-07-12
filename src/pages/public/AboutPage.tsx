import { Target, Eye, Heart, Users, Award, Wrench, ShieldCheck, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const values = [
  { icon: ShieldCheck, title: 'Trust & Safety', desc: 'Every technician is background-verified and vetted for quality.' },
  { icon: Heart, title: 'Customer First', desc: 'We put customers at the center of everything we do.' },
  { icon: Award, title: 'Quality Service', desc: 'We never compromise on the quality of our work.' },
  { icon: TrendingUp, title: 'Continuous Improvement', desc: 'We constantly evolve to serve you better.' },
]

const stats = [
  { value: '10,000+', label: 'Happy Customers' },
  { value: '500+', label: 'Verified Technicians' },
  { value: '10+', label: 'Cities Served' },
  { value: '4.8★', label: 'Average Rating' },
  { value: '50,000+', label: 'Services Completed' },
  { value: '5+', label: 'Years of Service' },
]

export function AboutPage() {
  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4">
        <section className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">About VATTAMS</h1>
          <p className="mx-auto max-w-3xl text-lg text-gray-600">
            VATTAMS Home Services brings professional, reliable, and affordable home services to your doorstep across Tamil Nadu.
            From AC repair to plumbing, we connect you with verified technicians you can trust.
          </p>
        </section>

        <section className="mb-16 grid gap-8 md:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <Target className="mb-3 h-10 w-10 text-blue-600" />
              <h2 className="mb-2 text-xl font-bold text-gray-900">Our Mission</h2>
              <p className="text-gray-600">
                To make professional home services accessible, affordable, and reliable for every household in Tamil Nadu.
                We empower skilled technicians with fair work and customers with trusted service.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Eye className="mb-3 h-10 w-10 text-blue-600" />
              <h2 className="mb-2 text-xl font-bold text-gray-900">Our Vision</h2>
              <p className="text-gray-600">
                To become Tamil Nadu's most trusted home services platform, known for quality, transparency, and customer satisfaction
                across every city and town we serve.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="mb-16">
          <div className="rounded-lg bg-blue-50 p-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">Our Story</h2>
            <p className="mb-4 text-gray-600">
              Founded with a simple idea — finding a reliable technician shouldn't be a struggle. VATTAMS was born to bridge the gap
              between skilled technicians and households needing quality home services.
            </p>
            <p className="text-gray-600">
              Today, we serve thousands of happy customers across Tamil Nadu with a growing network of verified technicians.
              Our commitment to quality, transparency, and customer satisfaction drives everything we do.
            </p>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">Our Values</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <Card key={v.title} className="text-center">
                <CardContent className="pt-6">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
                    <v.icon className="h-7 w-7 text-blue-600" />
                  </div>
                  <h3 className="mb-1 font-semibold text-gray-900">{v.title}</h3>
                  <p className="text-sm text-gray-600">{v.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">Our Impact</h2>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <Users className="mx-auto mb-2 h-8 w-8 text-blue-600" />
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
