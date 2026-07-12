import { Link } from 'react-router-dom'
import { Check, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'

const plans = [
  {
    name: 'Basic Service',
    category: 'General Repair & Plumbing',
    price: 249,
    features: ['Single issue diagnosis', 'Basic repair work', '1-hour service', '30-day warranty', 'Genuine parts (extra cost)'],
    popular: false,
  },
  {
    name: 'Standard Service',
    category: 'AC, Washing Machine & Electrical',
    price: 499,
    features: ['Full diagnosis', 'Comprehensive repair', 'Up to 2-hour service', '90-day warranty', 'Genuine parts included*', 'Free follow-up call'],
    popular: true,
  },
  {
    name: 'Premium Service',
    category: 'CCTV, Pest Control & AMC',
    price: 799,
    features: ['Full diagnosis & inspection', 'Premium repair service', 'Priority scheduling', '6-month warranty', 'Genuine parts included', 'Free follow-up visits', 'Dedicated support'],
    popular: false,
  },
]

const addons = [
  { name: 'AC Deep Cleaning', price: 299 },
  { name: 'Gas Refill (1 ton)', price: 999 },
  { name: 'Annual Maintenance Contract', price: 1999 },
  { name: 'Emergency Same-Day Service', price: 199 },
  { name: 'Extended Warranty (6 months)', price: 149 },
  { name: 'Multi-Appliance Combo (3 services)', price: 999 },
]

export function PricingPage() {
  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-10 text-center">
          <h1 className="mb-3 text-4xl font-bold text-gray-900">Pricing</h1>
          <p className="mx-auto max-w-2xl text-gray-600">
            Transparent pricing with no hidden charges. Pay only for what you need.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <Card key={p.name} className={p.popular ? 'border-blue-600 ring-2 ring-blue-600' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{p.name}</CardTitle>
                  {p.popular && <Badge color="bg-blue-600 text-white">Most Popular</Badge>}
                </div>
                <p className="text-sm text-gray-500">{p.category}</p>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">{formatCurrency(p.price)}</span>
                  <span className="text-sm text-gray-500"> onwards</span>
                </div>
                <ul className="mb-6 space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/register/customer" className="block">
                  <Button className="w-full" variant={p.popular ? 'primary' : 'outline'}>
                    Book Now <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16">
          <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">Add-On Services</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {addons.map((a) => (
              <Card key={a.name}>
                <CardContent className="flex items-center justify-between py-4">
                  <span className="font-medium text-gray-900">{a.name}</span>
                  <span className="font-bold text-blue-600">{formatCurrency(a.price)}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="mt-12 rounded-lg bg-gray-50 p-6 text-center text-sm text-gray-500">
          <p>*Genuine parts included for standard repairs up to ₹500. Additional parts charged at actual cost.</p>
          <p className="mt-2">Prices may vary based on city, appliance brand, and complexity of the issue.</p>
        </div>
      </div>
    </div>
  )
}
