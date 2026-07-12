import { Link } from 'react-router-dom'
import { Check, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

type Plan = {
  name: string; price: number; period: string; popular?: boolean
  desc: string; features: string[]
}

const plans: Plan[] = [
  {
    name: 'Basic Repair', price: 249, period: 'per visit', desc: 'One-time repair for minor issues.',
    features: ['Single issue diagnosis', 'Basic repair work', 'Up to 1 hour service', '7-day service warranty', 'All major brands'],
  },
  {
    name: 'Standard Service', price: 499, period: 'per visit', popular: true, desc: 'Complete service for regular maintenance.',
    features: ['Full diagnosis & inspection', 'Comprehensive service', 'Up to 2 hours service', '30-day service warranty', 'Genuine parts used', 'Priority support'],
  },
  {
    name: 'Annual Maintenance', price: 1999, period: 'per year', desc: 'Year-round maintenance and priority service.',
    features: ['4 scheduled visits', 'Unlimited minor repairs', '15% off on spare parts', 'Priority booking', '12-month coverage', 'Dedicated technician'],
  },
]

const categoryPricing = [
  { category: 'AC Service', items: [{ name: 'AC General Service', price: 499 }, { name: 'AC Gas Refill', price: 1499 }, { name: 'AC Installation', price: 999 }] },
  { category: 'Washing Machine', items: [{ name: 'Inspection & Minor Repair', price: 399 }, { name: 'Drum/Motor Repair', price: 899 }, { name: 'Full Service', price: 699 }] },
  { category: 'Refrigerator', items: [{ name: 'Cooling Issue Diagnosis', price: 449 }, { name: 'Gas Refill', price: 1299 }, { name: 'Compressor Replacement', price: 2499 }] },
  { category: 'Plumbing', items: [{ name: 'Leak Repair', price: 299 }, { name: 'Tap/Mixer Fitting', price: 349 }, { name: 'Motor Service', price: 599 }] },
  { category: 'Electrical', items: [{ name: 'Switchboard Repair', price: 299 }, { name: 'Fan Installation', price: 399 }, { name: 'Wiring (per point)', price: 449 }] },
  { category: 'CCTV Installation', items: [{ name: '2-Camera Setup', price: 2999 }, { name: '4-Camera Setup', price: 4999 }, { name: 'DVR Configuration', price: 999 }] },
]

export function PricingPage() {
  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">Transparent Pricing</h1>
          <p className="mx-auto mt-3 max-w-2xl text-gray-600">
            No hidden charges. Pay only for what you need with clear, upfront pricing.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <Card key={p.name} className={p.popular ? 'border-blue-600 ring-2 ring-blue-600' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{p.name}</CardTitle>
                  {p.popular && <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">Popular</span>}
                </div>
                <p className="text-sm text-gray-500">{p.desc}</p>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-gray-900">{formatCurrency(p.price)}</span>
                  <span className="text-sm text-gray-500">{p.period}</span>
                </div>
                <ul className="mt-5 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/register/customer" className="mt-6 block">
                  <Button className="w-full" variant={p.popular ? 'primary' : 'outline'}>
                    Book Now <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <h2 className="mt-16 text-center text-2xl font-bold text-gray-900">Service Price List</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categoryPricing.map((cat) => (
            <Card key={cat.category}>
              <CardHeader><CardTitle className="text-base">{cat.category}</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {cat.items.map((it) => (
                    <li key={it.name} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{it.name}</span>
                      <span className="font-medium text-gray-900">{formatCurrency(it.price)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-gray-500">
          * Prices may vary based on location and complexity. Final quote provided before service.
        </p>
      </div>
    </div>
  )
}
