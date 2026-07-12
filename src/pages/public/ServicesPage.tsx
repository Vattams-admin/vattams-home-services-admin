import { Link } from 'react-router-dom'
import {
  Wind, Sparkles, Snowflake, Droplets, Zap, Wrench, Cctv, Shield, ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const services = [
  { icon: Wind, title: 'AC Service', desc: 'AC installation, uninstallation, gas refill, general service, and major repairs for all brands including split, window, and cassette ACs.', price: '₹399 onwards', features: ['Gas refill & pressure check', 'Coil & filter cleaning', 'Cooling performance test'] },
  { icon: Sparkles, title: 'Washing Machine', desc: 'Repair and servicing for top-load, front-load, and semi-automatic washing machines of all brands.', price: '₹299 onwards', features: ['Drum & motor inspection', 'Drainage & inlet repair', 'Spin cycle test'] },
  { icon: Snowflake, title: 'Refrigerator', desc: 'Cooling issues, gas refill, compressor repair, and general maintenance for single and double-door fridges.', price: '₹349 onwards', features: ['Cooling performance check', 'Thermostat & compressor test', 'Gas refill & leak detection'] },
  { icon: Droplets, title: 'Plumbing', desc: 'Leak detection, tap fitting, motor repair, bathroom and kitchen plumbing, and drainage solutions.', price: '₹199 onwards', features: ['Leak detection & repair', 'Tap & pipe fitting', 'Motor & pump service'] },
  { icon: Zap, title: 'Electrical', desc: 'Wiring, switchboard repair, fan and light installation, and general electrical maintenance.', price: '₹199 onwards', features: ['Wiring & switchboard repair', 'Fan & light installation', 'Safety inspection'] },
  { icon: Wrench, title: 'General Repair', desc: 'Home appliance repair, furniture assembly, and general home maintenance services.', price: '₹249 onwards', features: ['Appliance diagnosis', 'Furniture assembly', 'General maintenance'] },
  { icon: Cctv, title: 'CCTV Installation', desc: 'Security camera installation, DVR setup, configuration, and surveillance system maintenance.', price: '₹499 onwards', features: ['Camera installation', 'DVR & NVR setup', 'Remote monitoring setup'] },
  { icon: Shield, title: 'Pest Control', desc: 'Termite treatment, cockroach control, rodent management, and general pest disinfection.', price: '₹599 onwards', features: ['Termite & cockroach control', 'Rodent management', 'Safe & eco-friendly chemicals'] },
]

export function ServicesPage() {
  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">Our Services</h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-gray-600">
            Professional home services at transparent prices. All services include a
            satisfaction guarantee and verified technicians.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Card key={s.title} className="flex flex-col transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-50 p-3">
                    <s.icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>{s.title}</CardTitle>
                    <p className="mt-1 text-sm font-medium text-blue-600">{s.price}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <p className="text-sm text-gray-600">{s.desc}</p>
                <ul className="mt-4 space-y-2">
                  {s.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex-1" />
                <Link to="/register/customer" className="mt-4">
                  <Button className="w-full">
                    Book Now <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
