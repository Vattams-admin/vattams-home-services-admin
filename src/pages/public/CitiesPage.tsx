import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapPin, Search, ArrowRight, Phone, CircleCheck as CheckCircle2, Building2, Users, Navigation, Clock, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  TAMIL_NADU_DISTRICTS,
  SERVICE_CITIES,
  PRIMARY_PHONE,
  telLink,
} from '@/lib/constants'

const cityDetails: Record<string, { description: string; areas: string[] }> = {
  Chennai: {
    description: 'Serving all major areas including Velachery, Tambaram, Anna Nagar, T. Nagar, Adyar, OMR, and more.',
    areas: ['Velachery', 'Tambaram', 'Anna Nagar', 'T. Nagar', 'Adyar', 'OMR', 'Porur', 'Guindy'],
  },
  Coimbatore: {
    description: 'Covering RS Puram, Peelamedu, Gandhipuram, Singanallur, Saravanampatti, and surrounding areas.',
    areas: ['RS Puram', 'Peelamedu', 'Gandhipuram', 'Singanallur', 'Saravanampatti', 'Race Course'],
  },
  Madurai: {
    description: 'Serving Madurai city including KK Nagar, Anna Nagar, Tallakulam, Goripalayam, and more.',
    areas: ['KK Nagar', 'Anna Nagar', 'Tallakulam', 'Goripalayam', 'Thirunagar', 'Vilangudi'],
  },
  'Tiruchirappalli': {
    description: 'Available in Trichy city including Srirangam, Thillai Nagar, Cantonment, and Woraiyur.',
    areas: ['Srirangam', 'Thillai Nagar', 'Cantonment', 'Woraiyur', 'K.K. Nagar', 'T.V. Kovil'],
  },
  Salem: {
    description: 'Serving Salem city including Fairlands, Hasthampatti, Alagapuram, and nearby areas.',
    areas: ['Fairlands', 'Hasthampatti', 'Alagapuram', 'Kondalampatti', 'Suramangalam'],
  },
  'Tirunelveli': {
    description: 'Available in Tirunelveli city including Palayamkottai, Vannarpettai, and Junction areas.',
    areas: ['Palayamkottai', 'Vannarpettai', 'Junction', 'Thatchanallur', 'Petkulam'],
  },
  Vellore: {
    description: 'Covering Vellore city including Katpadi, Sathuvachari, and Bagayam areas.',
    areas: ['Katpadi', 'Sathuvachari', 'Bagayam', 'Allapuram', 'Fort'],
  },
  Erode: {
    description: 'Serving Erode city including PS Park, Thindal, and Perundurai areas.',
    areas: ['PS Park', 'Thindal', 'Perundurai', 'Modakurichi', 'Chithode'],
  },
  Dindigul: {
    description: 'Available in Dindigul city including Nagamalai, Begampur, and nearby areas.',
    areas: ['Nagamalai', 'Begampur', 'Vadipatti', 'Palani'],
  },
  Thanjavur: {
    description: 'Serving Thanjavur city including Medical College, Vallam, and nearby areas.',
    areas: ['Medical College', 'Vallam', 'Tiruchengodu', 'Papanasam'],
  },
}

const stats = [
  { label: 'Districts Covered', value: '36', icon: MapPin },
  { label: 'Cities Served', value: '10+', icon: Building2 },
  { label: 'Technicians', value: '500+', icon: Users },
  { label: 'Happy Customers', value: '10,000+', icon: CheckCircle2 },
]

export default function CitiesPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCities = SERVICE_CITIES.filter((city) =>
    city.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredDistricts = TAMIL_NADU_DISTRICTS.filter((district) =>
    district.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-4 border-white/20 bg-white/10 text-white">
              Service Areas
            </Badge>
            <h1 className="text-4xl font-bold sm:text-5xl">Cities We Serve</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-blue-100">
              VATTAMS is expanding across Tamil Nadu. Find out if we're available in your city and book a service today.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
                  <stat.icon className="h-7 w-7 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Search */}
      <section className="bg-slate-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search your city or district..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setSearchQuery(e.target.value)}
                className="pl-12"
              />
            </div>
            <p className="mt-3 text-center text-sm text-slate-500">
              {searchQuery
                ? `Found ${filteredCities.length} cities and ${filteredDistricts.length} districts matching "${searchQuery}"`
                : 'Search across 36 districts of Tamil Nadu'}
            </p>
          </div>
        </div>
      </section>

      {/* Major Cities */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <Badge color="blue" className="mb-3">Major Cities</Badge>
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Now Serving in 10+ Cities
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Our professional home services are available in these cities across Tamil Nadu.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {filteredCities.map((city) => {
              const details = cityDetails[city]
              return (
                <Card key={city} className="transition hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                          <MapPin className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-slate-900">{city}</h3>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge color="green" className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Available
                            </Badge>
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> 4.8
                            </span>
                          </div>
                        </div>
                      </div>
                      <Link to="/connect">
                        <Button size="sm">
                          Connect <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                    {details && (
                      <>
                        <p className="mb-4 text-sm text-slate-600">{details.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {details.areas.map((area) => (
                            <span
                              key={area}
                              className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                            >
                              {area}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* All Districts */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <Badge color="cyan" className="mb-3">Tamil Nadu Districts</Badge>
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Expanding Across All 36 Districts
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              We're working to bring our services to every district in Tamil Nadu. Check if your district is on the list.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {filteredDistricts.map((district) => {
              const isServiceCity = SERVICE_CITIES.includes(district)
              return (
                <div
                  key={district}
                  className={cn(
                    'flex items-center gap-2 rounded-xl border p-3 transition',
                    isServiceCity
                      ? 'border-green-200 bg-green-50 hover:shadow-md'
                      : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'
                  )}
                >
                  {isServiceCity ? (
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600" />
                  ) : (
                    <Navigation className="h-4 w-4 flex-shrink-0 text-slate-400" />
                  )}
                  <span
                    className={cn(
                      'text-sm font-medium',
                      isServiceCity ? 'text-green-900' : 'text-slate-700'
                    )}
                  >
                    {district}
                  </span>
                </div>
              )
            })}
          </div>
          {filteredDistricts.length === 0 && searchQuery && (
            <div className="py-12 text-center">
              <p className="text-lg text-slate-500">
                No districts found matching "{searchQuery}". Try a different search.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Coming Soon Banner */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Card className="overflow-hidden border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-8">
              <div className="flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-white">
                    <Clock className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Coming to Your City Soon!</h3>
                    <p className="mt-1 text-slate-600">
                      Don't see your city? We're expanding rapidly. Let us know where you need us.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <a href={telLink(PRIMARY_PHONE)}>
                    <Button variant="outline" className="w-full sm:w-auto">
                      <Phone className="mr-2 h-4 w-4" /> {PRIMARY_PHONE}
                    </Button>
                  </a>
                  <Link to="/contact">
                    <Button className="w-full sm:w-auto">
                      Request Your City <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold sm:text-4xl">Book a Service in Your City</h2>
          <p className="mt-4 text-lg text-blue-100">
            Professional home services are just a click away. Book now and get verified technicians at your doorstep.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/connect">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50">
                Connect <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/services">
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10"
              >
                View Services <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
