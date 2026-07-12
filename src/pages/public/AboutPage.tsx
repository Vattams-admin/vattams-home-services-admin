import { Target, Eye, Heart, Users, Award, ThumbsUp, Handshake } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const stats = [
  { value: '10,000+', label: 'Happy Customers' },
  { value: '500+', label: 'Expert Technicians' },
  { value: '10', label: 'Cities Served' },
  { value: '4.8★', label: 'Average Rating' },
]

const values = [
  { icon: Heart, title: 'Customer First', desc: 'We put our customers at the center of everything we do.' },
  { icon: Award, title: 'Quality Excellence', desc: 'We maintain high standards in every service we deliver.' },
  { icon: ThumbsUp, title: 'Reliability', desc: 'Count on us for punctual, dependable service every time.' },
  { icon: Handshake, title: 'Trust & Transparency', desc: 'Honest pricing and clear communication, no hidden charges.' },
  { icon: Users, title: 'Empowering Technicians', desc: 'We support our technicians with fair work and growth.' },
  { icon: Target, title: 'Continuous Improvement', desc: 'We constantly refine our services based on feedback.' },
]

export function AboutPage() {
  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4">
        <section className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">About VATTAMS</h1>
          <p className="mx-auto mt-3 max-w-3xl text-gray-600">
            VATTAMS Home Services is a professional home services platform connecting customers
            across Tamil Nadu with verified, skilled technicians for AC service, washing machine
            repair, plumbing, electrical work, and more.
          </p>
        </section>

        <section className="mt-12 grid gap-8 md:grid-cols-2">
          <Card>
            <CardContent>
              <div className="flex items-center gap-3">
                <Target className="h-8 w-8 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Our Mission</h2>
              </div>
              <p className="mt-3 text-gray-600">
                To make professional home services accessible, affordable, and reliable for every
                household in Tamil Nadu — while creating fair income opportunities for skilled
                technicians.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="flex items-center gap-3">
                <Eye className="h-8 w-8 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Our Vision</h2>
              </div>
              <p className="mt-3 text-gray-600">
                To become Tamil Nadu&apos;s most trusted home services brand, known for quality,
                transparency, and empowering local technicians to build sustainable livelihoods.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="mt-12">
          <h2 className="text-center text-2xl font-bold text-gray-900">Our Story</h2>
          <div className="mx-auto mt-4 max-w-3xl space-y-4 text-gray-600">
            <p>
              Founded with a simple idea — finding a reliable technician for home repairs should not
              be a struggle. VATTAMS was born to bridge the gap between skilled technicians and
              households needing quality service.
            </p>
            <p>
              We started in Chennai and have expanded to serve 10 cities across Tamil Nadu. Every
              technician on our platform is background-verified, skill-tested, and trained to
              deliver a professional experience at your doorstep.
            </p>
            <p>
              Today, we are proud to have served over 10,000 happy customers and built a network of
              500+ expert technicians who share our commitment to quality and trust.
            </p>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-center text-2xl font-bold text-gray-900">Our Values</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((v) => (
              <Card key={v.title}>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                      <v.icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">{v.title}</h3>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{v.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-lg bg-blue-600 py-12">
          <div className="mx-auto grid max-w-4xl gap-6 px-4 text-center text-white sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-bold">{s.value}</p>
                <p className="mt-1 text-sm text-blue-100">{s.label}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
