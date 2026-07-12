import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

const plans = [
  {
    category: 'AC Services',
    icon: '❄️',
    popular: false,
    services: [
      { name: 'AC Deep Cleaning', price: 499 },
      { name: 'AC Gas Refill', price: 1499 },
      { name: 'AC Installation', price: 799 },
      { name: 'AC Repair (General)', price: 399 },
    ],
  },
  {
    category: 'Appliance Repair',
    icon: '🔧',
    popular: true,
    services: [
      { name: 'Washing Machine Service', price: 399 },
      { name: 'Refrigerator Repair', price: 449 },
      { name: 'Microwave Repair', price: 349 },
      { name: 'Water Heater Service', price: 399 },
    ],
  },
  {
    category: 'Home Maintenance',
    icon: '🏠',
    popular: false,
    services: [
      { name: 'Plumbing Service', price: 299 },
      { name: 'Electrical Work', price: 299 },
      { name: 'General Repair', price: 249 },
      { name: 'CCTV Installation', price: 999 },
    ],
  },
]

const features = [
  'Verified & background-checked technicians',
  'Upfront pricing with no hidden charges',
  'Service warranty on all repairs',
  'Easy online booking and tracking',
]

export function PricingPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">Transparent Pricing</h1>
        <p className="mt-3 text-lg text-gray-600">
          Fair, upfront pricing for every service. No hidden charges.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.category} className={plan.popular ? 'border-blue-600 ring-2 ring-blue-600' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{plan.category}</CardTitle>
                {plan.popular && (
                  <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white">Popular</span>
                )}
              </div>
              <span className="text-3xl">{plan.icon}</span>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plan.services.map((s) => (
                  <li key={s.name} className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <span className="text-sm text-gray-700">{s.name}</span>
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(s.price)}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register/customer" className="mt-6 block">
                <Button className="w-full" variant={plan.popular ? 'primary' : 'outline'}>Book Now</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-16 rounded-lg bg-gray-50 p-8">
        <h2 className="text-center text-2xl font-bold text-gray-900">What's Included</h2>
        <div className="mx-auto mt-6 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
          {features.map((f) => (
            <div key={f} className="flex items-center gap-3">
              <span className="rounded-full bg-green-100 p-1"><Check className="h-4 w-4 text-green-600" /></span>
              <span className="text-sm text-gray-700">{f}</span>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-gray-500">
          * Prices may vary based on complexity and parts required. Final quote provided before service begins.
        </p>
      </div>
    </div>
  )
}
