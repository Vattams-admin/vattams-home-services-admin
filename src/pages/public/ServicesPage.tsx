import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, ArrowRight, Phone } from 'lucide-react'
import { supabase, type ServiceCategory } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PRIMARY_PHONE_DISPLAY, telLink, PRIMARY_PHONE } from '@/lib/constants'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Wind: (p) => <span className="text-2xl">💨</span>,
  Sparkles: (p) => <span className="text-2xl">✨</span>,
  Snowflake: (p) => <span className="text-2xl">❄️</span>,
  WashingMachine: (p) => <span className="text-2xl">🧺</span>,
  Droplets: (p) => <span className="text-2xl">💧</span>,
  Zap: (p) => <span className="text-2xl">⚡</span>,
  Wrench: (p) => <span className="text-2xl">🔧</span>,
  Cctv: (p) => <span className="text-2xl">📷</span>,
}

export function ServicesPage() {
  const [services, setServices] = useState<ServiceCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('service_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data, error }) => {
        if (!error && data) setServices(data as ServiceCategory[])
        setLoading(false)
      })
  }, [])

  return (
    <div>
      <section className="bg-gradient-to-br from-blue-700 to-blue-800 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h1 className="text-4xl font-bold">Our Services</h1>
          <p className="mt-2 text-blue-100">Professional home services at affordable prices</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : services.length === 0 ? (
          <p className="py-20 text-center text-gray-500">No services available at the moment. Please check back soon.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => {
              const Icon = iconMap[s.icon]
              return (
                <Card key={s.id} className="flex flex-col transition-shadow hover:shadow-md">
                  <CardContent className="flex flex-1 flex-col p-6">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-blue-50">
                      {Icon ? <Icon className="h-7 w-7 text-blue-600" /> : <span className="text-2xl">🛠️</span>}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{s.name}</h3>
                    {s.name_ta && <p className="text-sm text-gray-400">{s.name_ta}</p>}
                    {s.description && <p className="mt-2 flex-1 text-sm text-gray-600">{s.description}</p>}
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-lg font-bold text-blue-600">₹{s.base_price}</span>
                      <Button asChild size="sm">
                        <Link to="/register/customer">Book Now <ArrowRight className="ml-1 h-3 w-3" /></Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        <div className="mt-12 rounded-xl bg-blue-50 p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-900">Need help choosing a service?</h3>
          <p className="mt-1 text-gray-600">Call us and our team will guide you.</p>
          <Button asChild className="mt-4">
            <a href={telLink(PRIMARY_PHONE)}><Phone className="mr-2 h-4 w-4" /> {PRIMARY_PHONE_DISPLAY}</a>
          </Button>
        </div>
      </section>
    </div>
  )
}
