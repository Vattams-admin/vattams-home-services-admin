import { Link } from 'react-router-dom'
import { Check, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const pricingTiers = [
  {
    category: 'AC Service',
    icon: '❄️',
    popular: false,
    services: [
      { name: 'General Service (Split AC)', price: '₹399' },
      { name: 'General Service (Window AC)', price: '₹349' },
      { name: 'Gas Refill (R-32)', price: '₹1,499' },
      { name: 'Gas Refill (R-22)', price: '₹1,799' },
      { name: 'Installation / Uninstallation', price: '₹499' },
    ],
  },
  {
    category: 'Washing Machine',
    icon: '🧺',
    popular: false,
    services: [
      { name: 'Inspection & Diagnosis', price: '₹299' },
      { name: 'General Service', price: '₹499' },
      { name: 'Motor Repair', price: '₹899' },
      { name: 'Drum Bearing Replacement', price: '₹1,299' },
    ],
  },
  {
    category: 'Refrigerator',
    icon: '🧊',
    popular: false,
    services: [
      { name: 'Inspection & Diagnosis', price: '₹349' },
      { name: 'Gas Refill', price: '₹999' },
      { name: 'Compressor Replacement', price: '₹2,499' },
      { name: 'Thermostat Replacement', price: '₹699' },
    ],
  },
  {
    category: 'Plumbing',
    icon: '🔧',
    popular: false,
    services: [
      { name: 'Leak Detection', price: '₹199' },
      { name: 'Tap / Mixer Repair', price: '₹299' },
      { name: 'Motor Repair', price: '₹599' },
      { name: 'Pipe Fitting (per ft)', price: '₹99' },
    ],
  },
  {
    category: 'Electrical',
    icon: '⚡',
    popular: true,
    services: [
      { name: 'Inspection & Diagnosis', price: '₹199' },
      { name: 'Switchboard Repair', price: '₹299' },
      { name: 'Fan Installation', price: '₹399' },
      { name: 'Wiring (per point)', price: '₹249' },
    ],
  },
  {
    category: 'CCTV Installation',
    icon: '📹',
    popular: false,
    services: [
      { name: 'Per Camera Installation', price: '₹499' },
      { name: 'DVR / NVR Setup', price: '₹999' },
      { name: 'Remote Monitoring Setup', price: '₹699' },
      { name: 'Annual Maintenance', price: '₹2,499' },
    ],
  },
]

export function PricingPage() {
  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">Transparent Pricing</h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-gray-600">
            No hidden charges. Pay only for what you need. Final pricing may vary based on
            the complexity of the job and parts required.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pricingTiers.map((tier) => (
            <Card
              key={tier.category}
              className={tier.popular ? 'border-blue-500 ring-2 ring-blue-500' : ''}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{tier.icon}</span>
                    {tier.category}
                  </CardTitle>
                  {tier.popular && (
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                      Popular
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {tier.services.map((s) => (
                    <li key={s.name} className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm text-gray-600">
                        <Check className="h-4 w-4 text-green-500" />
                        {s.name}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">{s.price}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/register/customer" className="mt-6 block">
                  <Button className="w-full" variant={tier.popular ? 'primary' : 'outline'}>
                    Book Now <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 rounded-lg bg-blue-50 p-6 text-center">
          <p className="text-sm text-gray-600">
            <strong>Note:</strong> Prices shown are starting prices. Final charges depend on
            the scope of work and any replacement parts needed. A visit charge of ₹99 applies
            for all on-site inspections, which is adjusted in the final bill.
          </p>
        </div>
      </div>
    </div>
  )
}
