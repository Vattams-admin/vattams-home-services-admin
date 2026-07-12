import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Check, ArrowRight } from 'lucide-react'
import { supabase, type ServiceCategory } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const includedItems = [
  'Professional technician visit',
  'Quality spare parts (if needed)',
  '30-day service warranty',
  'Transparent pricing — no hidden charges',
  'Post-service cleanup',
  'Customer support assistance',
]

export function PricingPage() {
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
          <h1 className="text-4xl font-bold">Pricing</h1>
          <p className="mt-2 text-blue-100">Transparent and affordable pricing for every service</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : services.length === 0 ? (
          <p className="py-20 text-center text-gray-500">Pricing information will be available soon.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <Card key={s.id} className="flex flex-col transition-shadow hover:shadow-md">
                <CardContent className="flex flex-1 flex-col p-6">
                  <h3 className="text-xl font-semibold text-gray-900">{s.name}</h3>
                  {s.description && <p className="mt-1 text-sm text-gray-500">{s.description}</p>}
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-blue-600">₹{s.base_price}</span>
                    <span className="text-sm text-gray-500"> onwards</span>
                  </div>
                  <ul className="mt-6 flex-1 space-y-2">
                    {includedItems.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="mt-6 w-full">
                    <Link to="/register/customer">Book Now <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-12 rounded-xl bg-gray-50 p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-900">Custom requirements?</h3>
          <p className="mt-1 text-gray-600">Contact us for bulk bookings and customized service packages.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/contact">Contact Us <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
