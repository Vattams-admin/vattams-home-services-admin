import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, type Booking } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { statusLabel, statusColor } from '@/lib/bookingStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Briefcase, CircleCheck as CheckCircle, IndianRupee, ClipboardList, Loader as Loader2, MapPin } from 'lucide-react';

export function TechnicianDashboardPage() {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [availableCount, setAvailableCount] = useState(0);
  const [assigned, setAssigned] = useState<Booking[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    (async () => {
      try {
        const [{ count: avail }, { data: assignedJobs }, { count: done }] = await Promise.all([
          supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'created'),
          supabase.from('bookings').select('*').eq('technician_id', profile.id).order('created_at', { ascending: false }).limit(5),
          supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('technician_id', profile.id).eq('status', 'completed'),
        ]);
        setAvailableCount(avail ?? 0);
        setAssigned(assignedJobs ?? []);
        setCompletedCount(done ?? 0);
        const { data: pays } = await supabase.from('payments').select('amount').eq('technician_id', profile.id).eq('status', 'paid');
        setEarnings((pays ?? []).reduce((s, p) => s + Number(p.amount), 0));
      } catch (e) {
        toast({ title: 'Failed to load dashboard', variant: 'error' });
      } finally {
        setLoading(false);
      }
    })();
  }, [profile?.id]);

  const toggleAvailability = async (checked: boolean) => {
    setToggling(true);
    try {
      await supabase.from('profiles').update({ is_available: checked }).eq('id', profile!.id);
      await refreshProfile();
      toast({ title: checked ? 'You are now available' : 'You are now unavailable', variant: 'success' });
    } catch {
      toast({ title: 'Failed to update availability', variant: 'error' });
    } finally {
      setToggling(false);
    }
  };

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  const stats = [
    { label: 'Available Jobs', value: availableCount, icon: ClipboardList, color: 'text-blue-600' },
    { label: 'Assigned Jobs', value: assigned.length, icon: Briefcase, color: 'text-orange-600' },
    { label: 'Completed', value: completedCount, icon: CheckCircle, color: 'text-green-600' },
    { label: 'Earnings', value: `₹${earnings.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'text-purple-600' },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Technician Dashboard</h1>
          <p className="text-gray-500">Welcome back, {profile?.full_name}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Available</span>
          <Switch checked={!!profile?.is_available} onCheckedChange={toggleAvailability} disabled={toggling} />
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-sm text-gray-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent Assigned Jobs</h2>
        <Button asChild><Link to="/technician/jobs">View Jobs</Link></Button>
      </div>

      {assigned.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-12">
          <Briefcase className="h-10 w-10 text-gray-400" />
          <p className="text-gray-500">No jobs assigned yet</p>
          <Button asChild><Link to="/technician/jobs">Browse Jobs</Link></Button>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {assigned.map((b) => (
            <Card key={b.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold">{b.service_name}</p>
                  <p className="flex items-center gap-1 text-sm text-gray-500"><MapPin className="h-3 w-3" />{b.address}</p>
                </div>
                <Badge className={statusColor(b.status)}>{statusLabel(b.status)}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
