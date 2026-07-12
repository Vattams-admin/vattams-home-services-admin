import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Wind, Sparkles, Snowflake, Droplets, Zap, Wrench, Cctv, Shield, Clock, Star, CheckCircle, PlayCircle, Phone, Star as StarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PRIMARY_PHONE, YOUTUBE_URL, telLink } from '@/lib/constants'
import { trackEvent } from '@/lib/notifications'
import { supabase } from '@/lib/supabase'
import type { CustomerReview } from '@/lib/supabase'

const services = [
  { icon: Wind, title: 'AC Service', desc: 'AC installation, repair, gas refill & servicing' },
  { icon: Sparkles, title: 'Washing Machine', desc: 'Washing machine repair & maintenance' },
  { icon: Snowflake, title: 'Refrigerator', desc: 'Fridge repair, cooling issues & servicing' },
  { icon: Droplets, title: 'Plumbing', desc: 'Pipes, taps, leaks & bathroom fittings' },
  { icon: Zap, title: 'Electrical', desc: 'Wiring, switches, fans & electrical repairs' },
  { icon: Wrench, title: 'General Repair', desc: 'Home appliance & general repairs' },
  { icon: Cctv, title: 'CCTV', desc: 'CCTV camera installation & maintenance' },
  { icon: Shield, title: 'Pest Control', desc: 'Termite, cockroach & general pest control' },
]

const features = [
  { icon: Shield, title: 'Verified Technicians', desc: 'Background-checked & skilled professionals' },
  { icon: Clock, title: 'On-Time Service', desc: 'Punctual technicians at your doorstep' },
  { icon: Star, title: 'Quality Guarantee', desc: 'Satisfaction guaranteed on every service' },
  { icon: CheckCircle, title: 'Easy Booking', desc: 'Book online in under 2 minutes' },
]

const stats = [
  { value: '10,000+', label: 'Happy Customers' },
  { value: '500+', label: 'Verified Technicians' },
  { value: '10+', label: 'Cities Served' },
  { value: '4.8★', label: 'Average Rating' },
]

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <StarIcon key={i} className={i < rating ? 'h-4 w-4 fill-yellow-400 text-yellow-400' : 'h-4 w-4 text-gray-300'} />
      ))}
    </div>
  )
}

export function HomePage() {
  const [reviews, setReviews] = useState<CustomerReview[]>([])

  useEffect(() => {
    trackEvent('page_view', 'navigation')
    ;(async () => {
      const { data } = await supabase
        .from('customer_reviews')
        .select('*')
        .eq('is_featured', true)
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(3)
      if (data) setReviews(data as CustomerReview[])
    })()
  }, [])

  return (
    <div>
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">Professional Home Services at Your Doorstep</h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-blue-100">
            AC service, washing machine, plumbing, electrical and more — trusted technicians across Tamil Nadu.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register/customer"><Button size="lg" variant="secondary">Book Now</Button></Link>
            <a href={YOUTUBE_URL} target="_blank" rel="noreferrer">
              <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20">
                <PlayCircle className="mr-2 h-5 w-5" /> YouTube
              </Button>
            </a>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">Our Services</h2>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
            {services.map((s) => (
              <Card key={s.title} className="text-center transition-shadow hover:shadow-md">
                <CardContent className="pt-6">
                  <s.icon className="mx-auto mb-3 h-10 w-10 text-blue-600" />
                  <h3 className="mb-1 font-semibold text-gray-900">{s.title}</h3>
                  <p className="text-sm text-gray-600">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">Why Choose VATTAMS?</h2>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
                  <f.icon className="h-7 w-7 text-blue-600" />
                </div>
                <h3 className="mb-1 font-semibold text-gray-900">{f.title}</h3>
                <p className="text-sm text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold text-blue-600">{s.value}</p>
                <p className="text-sm text-gray-600">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {reviews.length > 0 && (
        <section className="bg-gray-50 py-16">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">Featured Reviews</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {reviews.map((r) => (
                <Card key={r.id}>
                  <CardContent className="pt-6">
                    <StarRating rating={r.rating} />
                    <p className="mt-3 text-sm text-gray-600">"{r.review_text}"</p>
                    <p className="mt-3 font-semibold text-gray-900">{r.customer_name}</p>
                    {r.service_name && <p className="text-xs text-gray-500">{r.service_name}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-blue-600 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">Need a Service Today?</h2>
          <p className="mb-8 text-blue-100">Call us now or book online to get started.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href={telLink(PRIMARY_PHONE)}><Button size="lg" variant="secondary"><Phone className="mr-2 h-5 w-5" /> {PRIMARY_PHONE}</Button></a>
            <Link to="/register/customer"><Button size="lg" variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20">Book Online</Button></Link>
          </div>
        </div>
      </section>
    </div>
  )
}
