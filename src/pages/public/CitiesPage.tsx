import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, MapPin, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SERVICE_CITIES } from '@/lib/constants'

const cityInfo: Record<string, string[]> = {
  Chennai: ['T. Nagar', 'Anna Nagar', 'Velachery', 'Adyar', 'OMR', 'Porur'],
  Coimbatore: ['RS Puram', 'Saibaba Colony', 'Peelamedu', 'Gandhipuram', 'Singanallur'],
  Madurai: ['KK Nagar', 'Anna Nagar', 'Bypass Road', 'Thallakulam', 'Tirupparankundram'],
  Tiruchirappalli: ['Srirangam', 'Thillai Nagar', 'Cantonment', 'K.K. Nagar', 'Woraiyur'],
  Salem: ['Fairlands', 'Hasthampatti', 'Four Roads', 'Seelanaickenpatti', 'Alagapuram'],
  Tirunelveli: ['Palayamkottai', 'Vannarpettai', 'Thatchenkulam', 'Nanguneri Road', 'Junction'],
  Vellore: ['Sathuvachari', 'Bagayam', 'Kangeyanellur', 'Gandhi Nagar', 'Arcot Road'],
  Erode: ['PSG', 'Perundurai Road', 'Sathy Road', 'B.P. Agraharam', 'Thindal'],
  Dindigul: ['Nagar', 'Begampur', 'Palani Road', 'Reddiyarchatram', 'Vadamadurai'],
  Thanjavur: ['Medical Center', 'Vadakku Vasal', 'Azhagiri Nagar', 'Karanthai', 'Tirukarugavur Road'],
}

export function CitiesPage() {
  const [search, setSearch] = useState('')

  const filtered = SERVICE_CITIES.filter((c) => c.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-10 text-center">
          <h1 className="mb-3 text-4xl font-bold text-gray-900">Cities We Serve</h1>
          <p className="mx-auto max-w-2xl text-gray-600">
            VATTAMS Home Services is available across Tamil Nadu. Find your city and book a service today.
          </p>
        </div>

        <div className="mx-auto mb-8 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search your city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <MapPin className="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <p className="text-lg text-gray-500">No cities found matching "{search}".</p>
            <p className="mt-2 text-sm text-gray-400">We're expanding fast — contact us to request your city!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((city) => (
              <Card key={city} className="transition-shadow hover:shadow-md">
                <CardContent className="pt-6">
                  <div className="mb-3 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-gray-900">{city}</h3>
                  </div>
                  <p className="mb-3 text-sm text-gray-600">
                    Professional home services available in {city} and surrounding areas.
                  </p>
                  <div className="mb-4">
                    <p className="mb-1 text-xs font-medium text-gray-500">Service Areas:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(cityInfo[city] || []).map((area) => (
                        <Badge key={area} color="bg-gray-100 text-gray-700">{area}</Badge>
                      ))}
                    </div>
                  </div>
                  <Link to="/register/customer">
                    <Button variant="outline" className="w-full">
                      Book Service in {city} <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-12 rounded-lg bg-blue-50 p-8 text-center">
          <h2 className="mb-2 text-2xl font-bold text-gray-900">Don't See Your City?</h2>
          <p className="mb-4 text-gray-600">We're expanding across Tamil Nadu. Let us know where you need us!</p>
          <Link to="/contact"><Button size="lg">Request Your City</Button></Link>
        </div>
      </div>
    </div>
  )
}
