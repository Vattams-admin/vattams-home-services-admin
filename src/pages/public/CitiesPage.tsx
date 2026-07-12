import { Link } from 'react-router-dom'
import { MapPin, ArrowRight, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SERVICE_AREAS, PRIMARY_PHONE_DISPLAY, telLink, PRIMARY_PHONE } from '@/lib/constants'

export function CitiesPage() {
  return (
    <div>
      <section className="bg-gradient-to-br from-blue-700 to-blue-800 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h1 className="text-4xl font-bold">Cities We Serve</h1>
          <p className="mt-2 text-blue-100">
            Available across {SERVICE_AREAS.length} cities in Tamil Nadu — and expanding
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICE_AREAS.map((city) => (
            <Card key={city} className="transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                  <MapPin className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{city}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Professional home services available in {city} and nearby areas.
                </p>
                <Button asChild size="sm" className="mt-4 w-full">
                  <Link to="/register/customer">Book Service <ArrowRight className="ml-1 h-3 w-3" /></Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 rounded-xl bg-blue-50 p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-900">Don't see your city?</h3>
          <p className="mt-1 text-gray-600">We're expanding fast. Call us to check availability in your area.</p>
          <Button asChild className="mt-4">
            <a href={telLink(PRIMARY_PHONE)}><Phone className="mr-2 h-4 w-4" /> {PRIMARY_PHONE_DISPLAY}</a>
          </Button>
        </div>
      </section>
    </div>
  )
}
