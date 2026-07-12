import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader as Loader2, PackageSearch } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { supabase, type Service } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function ServicesPage() {
  useSEO({ title: 'Services | VATTAMS Home Services', description: 'Browse our wide range of home services across Tamil Nadu.' });
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data, error } = await supabase
          .from('service_categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });
        if (error) throw error;
        setServices(data as Service[]);
      } catch (err) {
        console.error('Failed to fetch services:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-gray-500">
        <PackageSearch className="mb-4 h-12 w-12" />
        <p className="text-lg">No services available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold text-gray-900">Our Services</h1>
      <p className="mb-8 text-gray-600">Browse our wide range of home services</p>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <Card key={service.id} className="flex flex-col transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="mb-2 flex items-center justify-between">
                <Badge variant="secondary">₹{service.base_price}+</Badge>
              </div>
              <CardTitle>{service.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              {service.description && (
                <p className="flex-1 text-sm text-gray-600">{service.description}</p>
              )}
              <Button asChild className="mt-4 w-full">
                <Link to="/register/customer">Book Now <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
