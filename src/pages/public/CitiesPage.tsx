import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, MapPin, CircleCheck as CheckCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { SERVICE_CITIES } from '@/lib/constants'

const cityInfo: Record<string, { district: string; services: number; areas: string[] }> = {
  Chennai: { district: 'Chennai', services: 8, areas: ['T. Nagar', 'Anna Nagar', 'Velachery', 'Adyar'] },
  Coimbatore: { district: 'Coimbatore', services: 8, areas: ['RS Puram', 'Gandhipuram', 'Singanallur', 'Saravanampatti'] },
  Madurai: { district: 'Madurai', services: 8, areas: ['KK Nagar', 'Anna Nagar', 'Bypass Road', 'Thallakulam'] },
  Tiruchirappalli: { district: 'Tiruchirappalli', services: 8, areas: ['Srirangam', 'Thillai Nagar', 'Cantonment', 'K.K. Nagar'] },
  Salem: { district: 'Salem', services: 8, areas: ['Hasthampatti', 'Fairlands', 'Alagapuram', 'Four Roads'] },
  Tirunelveli: { district: 'Tirunelveli', services: 8, areas: ['Palayamkottai', 'Town', 'Vannarpettai', 'Thatchanallur'] },
  Vellore: { district: 'Vellore', services: 8, areas: ['Sathuvacheri', 'Bagayam', 'Kangeyam Road', 'Gandhi Nagar'] },
  Erode: { district: 'Erode', services: 8, areas: ['PS Park', 'Perundurai Road', 'Brough Road', 'Modakurichi'] },
  Dindigul: { district: 'Dindigul', services: 8, areas: ['Nagar', 'Begampur', 'Palani Road', 'Vadamadurai'] },
  Thanjavur: { district: 'Thanjavur', services: 8, areas: ['Medical Center', 'Vadakku Veli', 'Azhinur', 'Karunanidhi Nagar'] },
}

export function CitiesPage() {
  const [query, setQuery] = useState('')

  const filtered = SERVICE_CITIES.filter((c) => c.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">Cities We Serve</h1>
          <p className="mx-auto mt-3 max-w-2xl text-gray-600">
            VATTAMS provides professional home services across major cities in Tamil Nadu.
            Find your city and book a service today.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your city..."
              className="pl-10"
            />
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((city) => {
            const info = cityInfo[city]
            return (
              <Card key={city} className="transition-shadow hover:shadow-md">
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                      <MapPin className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{city}</h3>
                      <p className="text-xs text-gray-500">{info.district} District</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>{info.services} services available</span>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-500">Popular areas:</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {info.areas.map((a) => (
                        <span key={a} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{a}</span>
                      ))}
                    </div>
                  </div>
                  <Link to="/register/customer" className="mt-4 block">
                    <Button variant="outline" className="w-full">
                      Book in {city} <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="mt-12 text-center text-gray-500">
            <p>No cities found matching &quot;{query}&quot;.</p>
            <p className="mt-1 text-sm">We are expanding rapidly — check back soon!</p>
          </div>
        )}

        <div className="mt-12 rounded-lg bg-blue-50 p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900">Don&apos;t see your city?</h2>
          <p className="mt-2 text-gray-600">We&apos;re expanding across Tamil Nadu. Let us know where you need us.</p>
          <Link to="/contact" className="mt-4 inline-block">
            <Button>Request Your City</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
