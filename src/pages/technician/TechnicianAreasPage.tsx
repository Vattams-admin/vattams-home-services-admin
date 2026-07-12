import { useEffect, useState } from 'react';
import { supabase, type TechnicianWorkingArea } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Loader as Loader2, MapPin, Plus, Trash2 } from 'lucide-react';

export function TechnicianAreasPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [areas, setAreas] = useState<TechnicianWorkingArea[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [radius, setRadius] = useState('5');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    (async () => {
      try {
        const [{ data: areaData, error: areaErr }, { data: distData, error: distErr }] = await Promise.all([
          supabase.from('technician_working_areas').select('*').eq('technician_id', profile.id),
          supabase.from('service_areas').select('district'),
        ]);
        if (areaErr) throw areaErr;
        if (distErr) throw distErr;
        setAreas(areaData ?? []);
        const unique = [...new Set((distData ?? []).map((d: { district: string }) => d.district).filter(Boolean))].sort();
        setDistricts(unique);
      } catch {
        toast({ title: 'Failed to load areas', variant: 'error' });
      } finally {
        setLoading(false);
      }
    })();
  }, [profile?.id]);

  const addArea = async () => {
    if (!selectedDistrict || !radius) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('technician_working_areas').insert({ technician_id: profile!.id, district: selectedDistrict, service_radius_km: Number(radius) })
        .select().single();
      if (error) throw error;
      setAreas((prev) => [...prev, data]);
      setSelectedDistrict('');
      setRadius('5');
      toast({ title: 'Working area added', variant: 'success' });
    } catch {
      toast({ title: 'Failed to add area', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const removeArea = async (id: string) => {
    try {
      await supabase.from('technician_working_areas').delete().eq('id', id);
      setAreas((prev) => prev.filter((a) => a.id !== id));
      toast({ title: 'Area removed', variant: 'success' });
    } catch {
      toast({ title: 'Failed to remove area', variant: 'error' });
    }
  };

  const updateRadius = async (id: string, newRadius: number) => {
    try {
      await supabase.from('technician_working_areas').update({ service_radius_km: newRadius }).eq('id', id);
      setAreas((prev) => prev.map((a) => (a.id === id ? { ...a, service_radius_km: newRadius } : a)));
      toast({ title: 'Radius updated', variant: 'success' });
    } catch {
      toast({ title: 'Failed to update radius', variant: 'error' });
    }
  };

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Working Areas</h1>

      <Card className="mb-6">
        <CardHeader><CardTitle>Add New Area</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label>District</Label>
            <Select value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)}>
              <option value="">Select district</option>
              {districts.map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>
          </div>
          <div className="w-full sm:w-32">
            <Label>Radius (km)</Label>
            <Input type="number" min="1" value={radius} onChange={(e) => setRadius(e.target.value)} />
          </div>
          <Button onClick={addArea} disabled={saving || !selectedDistrict}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Add
          </Button>
        </CardContent>
      </Card>

      {areas.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-12">
          <MapPin className="h-10 w-10 text-gray-400" />
          <p className="text-gray-500">No working areas added yet</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {areas.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-semibold">{a.district}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>Radius:</span>
                      <Input type="number" min="1" className="h-7 w-20" value={a.service_radius_km}
                        onChange={(e) => updateRadius(a.id, Number(e.target.value))} />
                      <span>km</span>
                    </div>
                  </div>
                </div>
                <Button size="icon" variant="destructive" onClick={() => removeArea(a.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
