import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Snowflake, Droplets, Zap, Sparkles, Bug, PaintRoller, Hammer, Wrench, ArrowRight, CircleCheck as CheckCircle2, Phone, Clock, Star, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn, formatCurrency } from '@/lib/utils'
import {
  PRIMARY_PHONE,
  WHATSAPP_NUMBER,
  telLink,
  whatsappLink,
} from '@/lib/constants'

interface ServiceCategory {
  icon: typeof Snowflake
  name: string
  description: string
  startingPrice: number
  popular: boolean
  features: string[]
  color: string
  bgColor: string
}

const serviceCategories: ServiceCategory[] = [
  {
    icon: Snowflake,
    name: 'AC Service & Repair',
    description: 'Complete air conditioning service including installation, gas refilling, deep cleaning, and repair for all brands.',
    startingPrice: 499,
    popular: true,
    features: [
      'AC installation & uninstallation',
      'Gas refilling & top-up',
      'Deep chemical cleaning',
      'Compressor & coil repair',
      'All brands supported',
    ],
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
  },
  {
    icon: Droplets,
    name: 'Plumbing',
    description: 'Professional plumbing services for bathrooms, kitchens, and water systems with experienced plumbers.',
    startingPrice: 299,
    popular: true,
    features: [
      'Pipe fitting & leak repair',
      'Tap & mixer replacement',
      'Bathroom & kitchen plumbing',
      'Water tank installation',
      'Drainage cleaning',
    ],
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    icon: Zap,
    name: 'Electrical',
    description: 'Certified electricians for all your electrical needs, from wiring to safety inspections.',
    startingPrice: 299,
    popular: false,
    features: [
      'Wiring & rewiring',
      'Switchboard & socket repair',
      'Fan & light installation',
      'MCB & fuse replacement',
      'Electrical safety inspection',
    ],
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  {
    icon: Sparkles,
    name: 'Deep Cleaning',
    description: 'Professional deep cleaning services for your entire home using safe, eco-friendly products.',
    startingPrice: 999,
    popular: true,
    features: [
      'Full home deep cleaning',
      'Kitchen sanitization',
      'Bathroom deep cleaning',
      'Sofa & carpet cleaning',
      'Window & grill cleaning',
    ],
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    icon: Bug,
    name: 'Pest Control',
    description: 'Effective pest control treatments using government-approved, safe chemicals for your family.',
    startingPrice: 699,
    popular: false,
    features: [
      'Cockroach & ant treatment',
      'Termite control',
      'Bedbug treatment',
      'Mosquito control',
      'General pest management',
    ],
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  {
    icon: PaintRoller,
    name: 'Painting',
    description: 'Transform your walls with professional painting services for interiors and exteriors.',
    startingPrice: 12,
    popular: false,
    features: [
      'Interior wall painting',
      'Exterior painting',
      'Waterproofing',
      'Texture & stencil painting',
      'Wall putty & primer',
    ],
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
  },
  {
    icon: Hammer,
    name: 'Carpentry',
    description: 'Skilled carpenters for furniture repair, door installation, and custom woodwork.',
    startingPrice: 399,
    popular: false,
    features: [
      'Door & window repair',
      'Furniture assembly',
      'Lock & hinge replacement',
      'Modular kitchen work',
      'Custom woodwork',
    ],
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    icon: Wrench,
    name: 'Appliance Repair',
    description: 'Expert repair services for washing machines, refrigerators, microwaves, and more.',
    startingPrice: 399,
    popular: false,
    features: [
      'Washing machine repair',
      'Refrigerator service',
      'Microwave repair',
      'Geyser installation & repair',
      'Chimney & hob service',
    ],
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
]

const bookingSteps = [
  {
    step: 1,
    title: 'Choose Your Service',
    description: 'Select from our wide range of home services based on your needs.',
  },
  {
    step: 2,
    title: 'Pick a Time Slot',
    description: 'Choose a convenient date and time for the technician to visit.',
  },
  {
    step: 3,
    title: 'Get Verified Technician',
    description: 'We assign a background-verified technician for your service.',
  },
  {
    step: 4,
    title: 'Relax & Enjoy',
    description: 'Sit back while our professional takes care of your home service needs.',
  },
]

export default function ServicesPage() {
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  return (
    <div className="flex flex-col">
      {/* Page Header */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-4 border-white/20 bg-white/10 text-white">
              Our Services
            </Badge>
            <h1 className="text-4xl font-bold sm:text-5xl">Home Services We Offer</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-blue-100">
              Professional and reliable home services across Tamil Nadu. Transparent pricing, verified technicians, and quality guaranteed.
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            {serviceCategories.map((service) => (
              <Card
                key={service.name}
                className={cn(
                  'overflow-hidden transition hover:shadow-lg',
                  selectedCategory === service.name && 'ring-2 ring-blue-500'
                )}
                onClick={() => setSelectedCategory(service.name)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          'flex h-14 w-14 items-center justify-center rounded-xl',
                          service.bgColor
                        )}
                      >
                        <service.icon className={cn('h-7 w-7', service.color)} />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{service.name}</CardTitle>
                        <p className="mt-1 text-sm text-slate-500">{service.description}</p>
                      </div>
                    </div>
                    {service.popular && (
                      <Badge color="amber" className="flex-shrink-0">
                        <Star className="mr-1 h-3 w-3 fill-amber-400" /> Popular
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-3 text-sm font-semibold text-slate-700">What's included:</p>
                      <ul className="space-y-2">
                        {service.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-col justify-between rounded-lg bg-slate-50 p-4">
                      <div>
                        <p className="text-xs text-slate-500">Starting from</p>
                        <p className="text-3xl font-bold text-slate-900">
                          {formatCurrency(service.startingPrice)}
                          {service.name === 'Painting' && (
                            <span className="text-base font-normal text-slate-500">/sq.ft</span>
                          )}
                        </p>
                      </div>
                      <div className="mt-4 space-y-2">
                        <Button
                          className="w-full"
                          onClick={() => navigate('/book')}
                        >
                          Book Now <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                        <a href={telLink(PRIMARY_PHONE)} className="block">
                          <Button variant="outline" className="w-full">
                            <Phone className="mr-2 h-4 w-4" /> Call to Book
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <Badge color="blue" className="mb-3">How It Works</Badge>
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Book in 4 Simple Steps
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Getting your home service done has never been easier.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {bookingSteps.map((step, index) => (
              <div key={step.step} className="relative text-center">
                {index < bookingSteps.length - 1 && (
                  <div className="absolute top-8 left-1/2 hidden h-0.5 w-full bg-slate-200 lg:block" />
                )}
                <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white">
                  <span className="text-xl font-bold">{step.step}</span>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="text-sm text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-4 rounded-xl bg-white p-6 shadow-sm">
              <ShieldCheck className="h-10 w-10 text-blue-600" />
              <div>
                <p className="font-semibold text-slate-900">Verified Pros</p>
                <p className="text-sm text-slate-500">Background-checked</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl bg-white p-6 shadow-sm">
              <Clock className="h-10 w-10 text-green-600" />
              <div>
                <p className="font-semibold text-slate-900">On-Time</p>
                <p className="text-sm text-slate-500">Guaranteed arrival</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl bg-white p-6 shadow-sm">
              <Star className="h-10 w-10 text-amber-500" />
              <div>
                <p className="font-semibold text-slate-900">Quality Work</p>
                <p className="text-sm text-slate-500">4.8/5 rated</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl bg-white p-6 shadow-sm">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
              <div>
                <p className="font-semibold text-slate-900">Warranty</p>
                <p className="text-sm text-slate-500">30-day guarantee</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold sm:text-4xl">Need a Service?</h2>
          <p className="mt-4 text-lg text-blue-100">
            Book online or call us directly. Our team is ready to help.
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
            <a href={whatsappLink(WHATSAPP_NUMBER, 'Hi, I would like to book a service.')}>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10"
              >
                <Phone className="mr-2 h-5 w-5" /> WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
