import { useEffect, useState } from 'react';
import { MapPin, Loader as Loader2, Building2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const TN_DISTRICTS = [
  'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore',
  'Dharmapuri', 'Dindigul', 'Erode', 'Kallakurichi', 'Kancheepuram',
  'Kanyakumari', 'Karur', 'Krishnagiri', 'Madurai', 'Mayiladuthurai',
  'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai',
  'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga', 'Tenkasi',
  'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli',
  'Tirupathur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur',
  'Vellore', 'Viluppuram', 'Virudhunagar',
];

export function CitiesPage() {
  const [districts, setDistricts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const { data, error } = await supabase
          .from('service_areas')
          .select('district')
          .eq('is_active', true)
          .order('district', { ascending: true });
        if (error) throw error;
        const unique = [...new Set((data || []).map((d) => d.district))];
        setDistricts(unique.length > 0 ? unique : TN_DISTRICTS);
      } catch (err) {
        console.error('Failed to fetch districts:', err);
        setDistricts(TN_DISTRICTS);
      } finally {
        setLoading(false);
      }
    };
    fetchDistricts();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900">Cities We Serve</h1>
        <p className="mt-2 text-lg text-gray-600">
          VATTAMS is available across all {TN_DISTRICTS.length} districts of Tamil Nadu
        </p>
      </div>

      <div className="mb-8 flex items-center justify-center gap-2 text-sm text-gray-500">
        <MapPin className="h-5 w-5 text-blue-600" />
        <span>{districts.length} districts covered</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {districts.map((district) => (
          <Card key={district} className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-full bg-blue-50 p-2">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{district}</p>
                <p className="text-xs text-gray-500">Tamil Nadu</p>
              </div>
              <Badge variant="success">Active</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
