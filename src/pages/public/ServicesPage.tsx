import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Wind, Sparkles, Snowflake, Droplets, Zap, Wrench, Cctv, Shield, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { trackEvent } from '@/lib/notifications'
import { formatCurrency } from '@/lib/utils'

const services = [
  { icon: Wind, name: 'AC Service', desc: 'AC installation, repair, gas refill, deep cleaning & annual maintenance contracts.', price: 499, tags: ['Installation', 'Gas Refill', 'Deep Clean'] },
  { icon: Sparkles, name: 'Washing Machine', desc: 'Top & front load washing machine repair, drum issues & motor servicing.', price: 399, tags: ['Top Load', 'Front Load', 'Motor'] },
  { icon: Snowflake, name: 'Refrigerator', desc: 'Single door, double door & side-by-side fridge repair and cooling fixes.', price: 399, tags: ['Cooling', 'Compressor', 'Defrost'] },
  { icon: Droplets, name: 'Plumbing', desc: 'Pipe fitting, tap repair, leak detection, bathroom & kitchen plumbing.', price: 299, tags: ['Leaks', 'Taps', 'Fittings'] },
  { icon: Zap, name: 'Electrical', desc: 'Wiring, switchboard, fan, light & general electrical repair services.', price: 299, tags: ['Wiring', 'Switches', 'Fans'] },
  { icon: Wrench, name: 'General Repair', desc: 'Home appliance servicing, furniture repair & general home maintenance.', price: 249, tags: ['Appliances', 'Furniture', 'Maintenance'] },
  { icon: Cctv, name: 'CCTV Installation', desc: 'CCTV camera installation, DVR/NVR setup, wiring & maintenance.', price: 599, tags: ['Installation', 'DVR', 'Monitoring'] },
  { icon: Shield, name: 'Pest Control', desc: 'Termite, cockroach, rodent & general pest control treatments.', price: 799, tags: ['Termite', 'Cockroach', 'Rodents'] },
]

export function ServicesPage() {
  useEffect(() => { trackEvent('service_view') }, [])

  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-10 text-center">
          <h1 className="mb-3 text-4xl font-bold text-gray-900">Our Services</h1>
          <p className="mx-auto max-w-2xl text-gray-600">
            Professional home services across Tamil Nadu. Transparent pricing, verified technicians, and quality guaranteed.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Card key={s.name} className="flex flex-col transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                    <s.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle>{s.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <p className="mb-4 text-sm text-gray-600">{s.desc}</p>
                <div className="mb-4 flex flex-wrap gap-2">
                  {s.tags.map((t) => <Badge key={t} color="bg-blue-50 text-blue-700">{t}</Badge>)}
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-500">Starting from</span>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(s.price)}</p>
                  </div>
                  <Link to="/register/customer">
                    <Button>Book Now <ArrowRight className="ml-1 h-4 w-4" /></Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 rounded-lg bg-blue-50 p-8 text-center">
          <h2 className="mb-2 text-2xl font-bold text-gray-900">Don't See What You Need?</h2>
          <p className="mb-4 text-gray-600">Call us — we offer many more home services on request.</p>
          <Link to="/contact"><Button size="lg">Contact Us</Button></Link>
        </div>
      </div>
    </div>
  )
}
