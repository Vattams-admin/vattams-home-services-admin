import { Link } from 'react-router-dom'
import {
  Wind, Sparkles, Snowflake, Droplets, Zap, Wrench, Cctv, Shield, CheckCircle, ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

type Service = { icon: typeof Wind; name: string; desc: string; starting: number; features: string[] }

const services: Service[] = [
  { icon: Wind, name: 'AC Service', desc: 'Comprehensive AC service including installation, repair, gas refill, and annual maintenance contracts.', starting: 499, features: ['AC installation & uninstallation', 'Gas refill & leak repair', 'Compressor replacement', 'Annual maintenance contracts'] },
  { icon: Sparkles, name: 'Washing Machine', desc: 'Expert repair and servicing for all washing machine brands — top load, front load & semi-automatic.', starting: 399, features: ['Drum & motor repair', 'Water inlet/outlet fixing', 'Spin & drain issues', 'All brands serviced'] },
  { icon: Snowflake, name: 'Refrigerator', desc: 'Fridge cooling problems, gas refill, compressor and thermostat repair by certified technicians.', starting: 449, features: ['Cooling issue diagnosis', 'Gas refill & leak fix', 'Compressor replacement', 'Thermostat & sensor repair'] },
  { icon: Droplets, name: 'Plumbing', desc: 'Complete plumbing solutions — pipe leaks, tap fitting, motor repair, and drainage cleaning.', starting: 299, features: ['Pipe leak repair', 'Tap & mixer fitting', 'Motor & pump service', 'Drainage cleaning'] },
  { icon: Zap, name: 'Electrical', desc: 'Electrical wiring, switchboard repair, fan installation, and appliance repair services.', starting: 299, features: ['Wiring & rewiring', 'Switchboard repair', 'Fan & light installation', 'Appliance repair'] },
  { icon: Wrench, name: 'General Repair', desc: 'General household appliance and home repair services by multi-skilled technicians.', starting: 249, features: ['Appliance servicing', 'Furniture & fixture repair', 'Door & lock repair', 'Multi-skill technicians'] },
  { icon: Cctv, name: 'CCTV Installation', desc: 'CCTV camera installation, DVR/NVR setup, and surveillance system configuration.', starting: 999, features: ['Camera installation', 'DVR/NVR configuration', 'Remote viewing setup', 'Cable & mounting'] },
  { icon: Shield, name: 'Pest Control', desc: 'Termite, cockroach, rodent, and general pest control with safe, effective treatment.', starting: 599, features: ['Termite treatment', 'Cockroach & ant control', 'Rodent control', 'Safe chemicals used'] },
]

export function ServicesPage() {
  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">Our Services</h1>
          <p className="mx-auto mt-3 max-w-2xl text-gray-600">
            Professional home services at transparent prices. All services are performed by
            verified, background-checked technicians across Tamil Nadu.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Card key={s.name} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-100">
                    <s.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle>{s.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <p className="text-sm text-gray-600">{s.desc}</p>
                <ul className="mt-4 flex-1 space-y-2">
                  {s.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                  <div>
                    <span className="text-xs text-gray-500">Starting from</span>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(s.starting)}</p>
                  </div>
                  <Link to="/register/customer">
                    <Button>Book Now <ArrowRight className="ml-1 h-4 w-4" /></Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
