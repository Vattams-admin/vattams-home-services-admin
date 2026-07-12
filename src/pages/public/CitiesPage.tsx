import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, MapPin, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { SERVICE_CITIES } from '@/lib/constants'

const cityInfo: Record<string, { districts: string[]; desc: string }> = {
  Chennai: { districts: ['Chennai', 'Kancheepuram', 'Tiruvallur'], desc: 'Full home services across the Chennai metro area.' },
  Coimbatore: { districts: ['Coimbatore'], desc: 'Trusted technicians serving Coimbatore and surroundings.' },
  Madurai: { districts: ['Madurai'], desc: 'Professional home services in the temple city.' },
  Tiruchirappalli: { districts: ['Tiruchirappalli'], desc: 'Reliable service professionals in Trichy region.' },
  Salem: { districts: ['Salem'], desc: 'Home services across Salem district.' },
  Tirunelveli: { districts: ['Tirunelveli'], desc: 'Serving Tirunelveli and nearby areas.' },
  Vellore: { districts: ['Vellore'], desc: 'Verified technicians in Vellore district.' },
  Erode: { districts: ['Erode'], desc: 'Home maintenance services in Erode.' },
  Dindigul: { districts: ['Dindigul'], desc: 'Quality home services in Dindigul.' },
  Thanjavur: { districts: ['Thanjavur'], desc: 'Serving the Thanjavur delta region.' },
}

export function CitiesPage() {
  const [query, setQuery] = useState('')
  const filtered = SERVICE_CITIES.filter((c) => c.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">Cities We Serve</h1>
        <p className="mt-3 text-lg text-gray-600">
          VATTAMS operates across major cities in Tamil Nadu. Find service availability in your area.
        </p>
      </div>

      {/* Search */}
      <div className="mx-auto mt-8 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <Input
            className="pl-10"
            placeholder="Search by city name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Cities Grid */}
      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((city) => {
          const info = cityInfo[city] || { districts: [city], desc: 'Home services available in this area.' }
          return (
            <Card key={city} className="transition-shadow hover:shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">{city}</h3>
                </div>
                <p className="mt-2 text-sm text-gray-600">{info.desc}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {info.districts.map((d) => (
                    <span key={d} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{d}</span>
                  ))}
                </div>
                <Link to="/register/customer" className="mt-4 inline-block">
                  <Button size="sm" variant="outline">Book Now <ArrowRight className="ml-2 h-3 w-3" /></Button>
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="mt-12 text-center">
          <p className="text-gray-600">No cities found matching "{query}".</p>
          <p className="mt-2 text-sm text-gray-500">We're expanding quickly — contact us to request your city.</p>
          <Link to="/contact" className="mt-4 inline-block">
            <Button variant="outline">Request Your City</Button>
          </Link>
        </div>
      )}

      <div className="mt-12 rounded-lg bg-blue-50 p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Don't see your city?</h2>
        <p className="mt-2 text-gray-600">We're expanding across Tamil Nadu. Let us know where you need us.</p>
        <Link to="/contact" className="mt-4 inline-block"><Button>Get in Touch</Button></Link>
      </div>
    </div>
  )
}
