import { Link } from 'react-router-dom'
import { Wind, Sparkles, Snowflake, Droplets, Zap, Wrench, Cctv, Shield, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

const services = [
  { icon: Wind, title: 'AC Service', desc: 'AC installation, uninstallation, gas refill, deep cleaning, and repair for all brands.', price: 499, priceLabel: 'starting at' },
  { icon: Sparkles, title: 'Washing Machine', desc: 'Top-load and front-load washing machine repair, drum issues, and servicing.', price: 399, priceLabel: 'starting at' },
  { icon: Snowflake, title: 'Refrigerator', desc: 'Cooling problems, gas refill, compressor check, and general maintenance.', price: 449, priceLabel: 'starting at' },
  { icon: Droplets, title: 'Plumbing', desc: 'Leakage, tap fitting, drainage cleaning, and complete plumbing solutions.', price: 299, priceLabel: 'starting at' },
  { icon: Zap, title: 'Electrical', desc: 'Wiring, switchboard repair, fan and light installation, safety inspection.', price: 299, priceLabel: 'starting at' },
  { icon: Wrench, title: 'General Repair', desc: 'Home appliance servicing, furniture repair, and general household fixes.', price: 249, priceLabel: 'starting at' },
  { icon: Cctv, title: 'CCTV Installation', desc: 'Security camera installation, DVR setup, and monitoring configuration.', price: 999, priceLabel: 'starting at' },
  { icon: Shield, title: 'Pest Control', desc: 'Termite treatment, cockroach control, and general pest management.', price: 799, priceLabel: 'starting at' },
]

export function ServicesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">Our Services</h1>
        <p className="mt-3 text-lg text-gray-600">
          Professional home services with transparent pricing across Tamil Nadu.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <Card key={s.title} className="flex flex-col">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-3"><s.icon className="h-7 w-7 text-blue-600" /></div>
              <CardTitle>{s.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <p className="flex-1 text-sm text-gray-600">{s.desc}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-xs text-gray-500">{s.priceLabel}</span>
                <span className="text-2xl font-bold text-gray-900">{formatCurrency(s.price)}</span>
              </div>
              <Link to="/register/customer" className="mt-4">
                <Button className="w-full">Book Now <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 rounded-lg bg-blue-50 p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Don't see what you need?</h2>
        <p className="mt-2 text-gray-600">Contact us and we'll connect you with the right professional.</p>
        <Link to="/contact" className="mt-4 inline-block">
          <Button variant="outline">Contact Us</Button>
        </Link>
      </div>
    </div>
  )
}
