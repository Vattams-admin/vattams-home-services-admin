import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Search, ArrowRight, CircleCheck as CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { SERVICE_CITIES } from '@/lib/constants'

const cityInfo: Record<string, { districts: string[]; services: string[] }> = {
  Chennai: { districts: ['Chennai', 'Kancheepuram', 'Chengalpattu'], services: ['AC Service', 'Washing Machine', 'Refrigerator', 'Plumbing', 'Electrical', 'CCTV', 'Pest Control'] },
  Coimbatore: { districts: ['Coimbatore'], services: ['AC Service', 'Washing Machine', 'Refrigerator', 'Plumbing', 'Electrical'] },
  Madurai: { districts: ['Madurai'], services: ['AC Service', 'Washing Machine', 'Plumbing', 'Electrical', 'Pest Control'] },
  Tiruchirappalli: { districts: ['Tiruchirappalli'], services: ['AC Service', 'Washing Machine', 'Refrigerator', 'Plumbing', 'Electrical'] },
  Salem: { districts: ['Salem'], services: ['AC Service', 'Washing Machine', 'Plumbing', 'Electrical'] },
  Tirunelveli: { districts: ['Tirunelveli'], services: ['AC Service', 'Washing Machine', 'Plumbing', 'Electrical'] },
  Vellore: { districts: ['Vellore', 'Ranipet'], services: ['AC Service', 'Washing Machine', 'Refrigerator', 'Plumbing', 'Electrical'] },
  Erode: { districts: ['Erode'], services: ['AC Service', 'Washing Machine', 'Plumbing', 'Electrical'] },
  Dindigul: { districts: ['Dindigul'], services: ['AC Service', 'Washing Machine', 'Plumbing', 'Electrical'] },
  Thanjavur: { districts: ['Thanjavur'], services: ['AC Service', 'Washing Machine', 'Refrigerator', 'Plumbing', 'Electrical'] },
}

export function CitiesPage() {
  const [search, setSearch] = useState('')

  const filtered = SERVICE_CITIES.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">Cities We Serve</h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-gray-600">
            VATTAMS Home Services is available across major cities in Tamil Nadu.
            Find your city and book a service today.
          </p>
        </div>

        {/* Search */}
        <div className="mx-auto mt-8 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Search your city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Cities Grid */}
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((city) => {
            const info = cityInfo[city] || { districts: [city], services: ['AC Service', 'Plumbing', 'Electrical'] }
            return (
              <Card key={city} className="transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-50 p-3">
                      <MapPin className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{city}</h3>
                      <p className="text-sm text-gray-500">
                        {info.districts.join(', ')} {info.districts.length > 1 ? 'Districts' : 'District'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Available Services</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {info.services.map((s) => (
                        <span key={s} className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                          <CheckCircle className="h-3 w-3" /> {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link to="/register/customer" className="mt-6 block">
                    <Button className="w-full" variant="outline">
                      Book in {city} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="mt-12 text-center">
            <p className="text-gray-600">
              No cities found matching "{search}". We're expanding fast — check back soon!
            </p>
          </div>
        )}

        {/* Not in your city? */}
        <div className="mt-12 rounded-lg bg-blue-50 p-6 text-center">
          <p className="text-gray-600">
            Don't see your city? <Link to="/contact" className="font-medium text-blue-600 hover:text-blue-700">Contact us</Link> to request service in your area.
          </p>
        </div>
      </div>
    </div>
  )
}
