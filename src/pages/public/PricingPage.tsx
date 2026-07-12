import { useNavigate } from 'react-router-dom'
import {
  Snowflake,
  Droplets,
  Zap,
  Sparkles,
  Bug,
  PaintRoller,
  Hammer,
  Wrench,
  Check,
  X,
  ArrowRight,
  Phone,
  Star,
  ShieldCheck,
  Clock,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn, formatCurrency } from '@/lib/utils'
import { PRIMARY_PHONE, telLink } from '@/lib/constants'

interface PricingPlan {
  icon: typeof Snowflake
  name: string
  tagline: string
  popular: boolean
  startingPrice: number
  priceUnit: string
  color: string
  bgColor: string
  services: { name: string; price: string }[]
}

const pricingPlans: PricingPlan[] = [
  {
    icon: Snowflake,
    name: 'AC Service',
    tagline: 'Keep your AC running cool and efficient',
    popular: true,
    startingPrice: 499,
    priceUnit: 'service',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    services: [
      { name: 'General Service & Cleaning', price: '₹499' },
      { name: 'Deep Chemical Cleaning', price: '₹799' },
      { name: 'Gas Refilling (1.5 Ton)', price: '₹1,899' },
      { name: 'AC Installation', price: '₹999' },
      { name: 'AC Uninstallation', price: '₹499' },
      { name: 'PCB Repair', price: '₹1,499' },
      { name: 'Compressor Checkup', price: '₹899' },
    ],
  },
  {
    icon: Droplets,
    name: 'Plumbing',
    tagline: 'Fix leaks and keep water flowing',
    popular: true,
    startingPrice: 299,
    priceUnit: 'visit',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    services: [
      { name: 'General Plumbing Visit', price: '₹299' },
      { name: 'Tap / Mixer Repair', price: '₹399' },
      { name: 'Pipe Leak Repair', price: '₹499' },
      { name: 'Drainage Cleaning', price: '₹599' },
      { name: 'Water Tank Installation', price: '₹1,299' },
      { name: 'Bathroom Fittings', price: '₹799' },
      { name: 'Motor Repair', price: '₹899' },
    ],
  },
  {
    icon: Zap,
    name: 'Electrical',
    tagline: 'Safe and certified electrical work',
    popular: false,
    startingPrice: 299,
    priceUnit: 'visit',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    services: [
      { name: 'General Electrical Visit', price: '₹299' },
      { name: 'Switchboard Repair', price: '₹399' },
      { name: 'Fan Installation', price: '₹499' },
      { name: 'Light / Chandelier Fitting', price: '₹599' },
      { name: 'MCB / Fuse Replacement', price: '₹499' },
      { name: 'Full House Wiring Inspection', price: '₹1,499' },
      { name: 'Inverter / Battery Setup', price: '₹1,299' },
    ],
  },
  {
    icon: Sparkles,
    name: 'Deep Cleaning',
    tagline: 'Spotless cleaning with eco-friendly products',
    popular: true,
    startingPrice: 999,
    priceUnit: 'service',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    services: [
      { name: '1 BHK Full Home Cleaning', price: '₹2,499' },
      { name: '2 BHK Full Home Cleaning', price: '₹3,499' },
      { name: '3 BHK Full Home Cleaning', price: '₹4,999' },
      { name: 'Kitchen Deep Cleaning', price: '₹1,499' },
      { name: 'Bathroom Deep Cleaning (per)', price: '₹599' },
      { name: 'Sofa Cleaning (per seat)', price: '₹299' },
      { name: 'Carpet Cleaning', price: '₹999' },
    ],
  },
  {
    icon: Bug,
    name: 'Pest Control',
    tagline: 'Pest-free home with safe treatments',
    popular: false,
    startingPrice: 699,
    priceUnit: 'treatment',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    services: [
      { name: 'Cockroach Treatment (1BHK)', price: '₹699' },
      { name: 'Cockroach Treatment (2BHK)', price: '₹999' },
      { name: 'Termite Treatment', price: '₹2,499' },
      { name: 'Bedbug Treatment', price: '₹1,499' },
      { name: 'General Pest Control', price: '₹899' },
      { name: 'Mosquito Fogging', price: '₹1,299' },
      { name: 'Annual Contract (4 visits)', price: '₹3,999' },
    ],
  },
  {
    icon: PaintRoller,
    name: 'Painting',
    tagline: 'Fresh walls with professional painting',
    popular: false,
    startingPrice: 12,
    priceUnit: 'sq.ft',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    services: [
      { name: 'Interior Painting (per sq.ft)', price: '₹12' },
      { name: 'Exterior Painting (per sq.ft)', price: '₹18' },
      { name: 'Wall Putty (per sq.ft)', price: '₹6' },
      { name: 'Primer Coat (per sq.ft)', price: '₹4' },
      { name: 'Texture Painting (per sq.ft)', price: '₹35' },
      { name: 'Waterproofing (per sq.ft)', price: '₹25' },
      { name: 'Wood Polish (per sq.ft)', price: '₹20' },
    ],
  },
  {
    icon: Hammer,
    name: 'Carpentry',
    tagline: 'Skilled woodwork and furniture repair',
    popular: false,
    startingPrice: 399,
    priceUnit: 'visit',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    services: [
      { name: 'General Carpentry Visit', price: '₹399' },
      { name: 'Door Repair / Alignment', price: '₹599' },
      { name: 'Lock & Hinge Replacement', price: '₹299' },
      { name: 'Furniture Assembly (per item)', price: '₹499' },
      { name: 'Window Repair', price: '₹599' },
      { name: 'Custom Shelf Installation', price: '₹899' },
      { name: 'Modular Kitchen Work', price: 'On Quote' },
    ],
  },
  {
    icon: Wrench,
    name: 'Appliance Repair',
    tagline: 'Expert repair for all home appliances',
    popular: false,
    startingPrice: 399,
    priceUnit: 'visit',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    services: [
      { name: 'Washing Machine Repair', price: '₹399' },
      { name: 'Refrigerator Repair', price: '₹399' },
      { name: 'Microwave Repair', price: '₹499' },
      { name: 'Geyser Installation / Repair', price: '₹499' },
      { name: 'Chimney Service', price: '₹599' },
      { name: 'Gas Stove Repair', price: '₹399' },
      { name: 'Water Purifier Service', price: '₹499' },
    ],
  },
]

const comparisonFeatures = [
  { name: 'Verified Technicians', included: true },
  { name: 'Transparent Pricing', included: true },
  { name: '30-Day Service Warranty', included: true },
  { name: 'On-Time Arrival', included: true },
  { name: 'Quality Guaranteed', included: true },
  { name: '24/7 Customer Support', included: true },
  { name: 'Safe & Eco-Friendly Products', included: true },
  { name: 'Online Booking', included: true },
  { name: 'Hidden Charges', included: false },
  { name: 'Unverified Workers', included: false },
]

export default function PricingPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-4 border-white/20 bg-white/10 text-white">
              Transparent Pricing
            </Badge>
            <h1 className="text-4xl font-bold sm:text-5xl">Service Pricing</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-blue-100">
              No hidden charges. Know exactly what you'll pay before booking. Fair and transparent pricing for all our services.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {pricingPlans.map((plan) => (
              <Card
                key={plan.name}
                className={cn(
                  'relative overflow-hidden transition hover:shadow-lg',
                  plan.popular && 'ring-2 ring-blue-500'
                )}
              >
                {plan.popular && (
                  <div className="absolute right-0 top-0 rounded-bl-xl bg-blue-600 px-4 py-1.5 text-xs font-medium text-white">
                    <Star className="mr-1 inline h-3 w-3 fill-white" /> Popular
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-xl',
                        plan.bgColor
                      )}
                    >
                      <plan.icon className={cn('h-6 w-6', plan.color)} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <p className="text-sm text-slate-500">{plan.tagline}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 border-b border-slate-100 pb-4">
                    <p className="text-sm text-slate-500">Starting from</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-slate-900">
                        {formatCurrency(plan.startingPrice)}
                      </span>
                      <span className="text-sm text-slate-500">/{plan.priceUnit}</span>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {plan.services.map((service) => (
                      <li
                        key={service.name}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-slate-600">{service.name}</span>
                        <span className="font-semibold text-slate-900">{service.price}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-6 w-full"
                    variant={plan.popular ? 'primary' : 'outline'}
                    onClick={() => navigate('/book')}
                  >
                    Book {plan.name} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <Badge color="green" className="mb-3">What You Get</Badge>
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Included in Every Service
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Every booking comes with our commitment to quality and transparency.
            </p>
          </div>
          <div className="mx-auto max-w-3xl">
            <div className="grid gap-4 sm:grid-cols-2">
              {comparisonFeatures.map((feature) => (
                <div
                  key={feature.name}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border p-4',
                    feature.included
                      ? 'border-green-200 bg-green-50'
                      : 'border-red-200 bg-red-50'
                  )}
                >
                  {feature.included ? (
                    <Check className="h-5 w-5 flex-shrink-0 text-green-600" />
                  ) : (
                    <X className="h-5 w-5 flex-shrink-0 text-red-600" />
                  )}
                  <span
                    className={cn(
                      'text-sm font-medium',
                      feature.included ? 'text-green-900' : 'text-red-900'
                    )}
                  >
                    {feature.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
                <ShieldCheck className="h-7 w-7 text-blue-600" />
              </div>
              <p className="font-semibold text-slate-900">No Hidden Charges</p>
              <p className="text-sm text-slate-500">What you see is what you pay</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
                <Clock className="h-7 w-7 text-green-600" />
              </div>
              <p className="font-semibold text-slate-900">On-Time Service</p>
              <p className="text-sm text-slate-500">We respect your schedule</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
                <Star className="h-7 w-7 text-amber-500" />
              </div>
              <p className="font-semibold text-slate-900">Quality Assured</p>
              <p className="text-sm text-slate-500">4.8/5 customer rating</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-violet-50">
                <TrendingUp className="h-7 w-7 text-violet-600" />
              </div>
              <p className="font-semibold text-slate-900">Best Prices</p>
              <p className="text-sm text-slate-500">Competitive rates guaranteed</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold sm:text-4xl">Ready to Get Started?</h2>
          <p className="mt-4 text-lg text-blue-100">
            Book your service today or call us for a custom quote.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate('/book')}
              className="bg-white text-blue-700 hover:bg-blue-50"
            >
              Book Now <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <a href={telLink(PRIMARY_PHONE)}>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10"
              >
                <Phone className="mr-2 h-5 w-5" /> {PRIMARY_PHONE}
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
