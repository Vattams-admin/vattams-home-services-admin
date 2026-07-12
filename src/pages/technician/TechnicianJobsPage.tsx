import { useEffect, useState } from 'react';
import { supabase, type Booking, type BookingStatus } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { statusLabel, statusColor } from '@/lib/bookingStatus';
import { createNotification } from '@/lib/notifications';
import { updateTechnicianLocation, openInGoogleMaps, getCurrentPosition } from '@/lib/maps';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader as Loader2, MapPin, Navigation, User, Phone, Calendar } from 'lucide-react';

const NEXT_STATUSES: { status: BookingStatus; label: string }[] = [
  { status: 'accepted', label: 'Accept' },
  { status: 'on_the_way', label: 'Start Travel' },
  { status: 'arrived', label: 'Arrive' },
  { status: 'started', label: 'Start Job' },
  { status: 'completed', label: 'Complete' },
];

export function TechnicianJobsPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.id) return;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('bookings').select('*').eq('technician_id', profile.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setBookings(data ?? []);
      } catch {
        toast({ title: 'Failed to load jobs', variant: 'error' });
      } finally {
        setLoading(false);
      }
    })();
  }, [profile?.id]);

  const updateStatus = async (booking: Booking, nextStatus: BookingStatus) => {
    setUpdating(booking.id);
    try {
      const { error } = await supabase.from('bookings').update({ status: nextStatus }).eq('id', booking.id);
      if (error) throw error;
      setBookings((prev) => prev.map((b) => (b.id === booking.id ? { ...b, status: nextStatus } : b)));

      if (nextStatus === 'on_the_way') {
        const pos = await getCurrentPosition();
        await updateTechnicianLocation(profile!.id, pos.lat, pos.lng, booking.id);
      }
      if (nextStatus === 'completed') {
        await createNotification(booking.customer_id, 'Job Completed', `Your booking ${booking.booking_number} has been completed.`, 'booking', booking.id);
      }
      toast({ title: `Status updated to ${statusLabel(nextStatus)}`, variant: 'success' });
    } catch {
      toast({ title: 'Failed to update status', variant: 'error' });
    } finally {
      setUpdating(null);
    }
  };

  const getNextStatus = (current: BookingStatus) => {
    const idx = NEXT_STATUSES.findIndex((s) => s.status === current);
    return idx >= 0 && idx < NEXT_STATUSES.length - 1 ? NEXT_STATUSES[idx + 1] : null;
  };

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">My Jobs</h1>
      {bookings.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-12">
          <Calendar className="h-10 w-10 text-gray-400" />
          <p className="text-gray-500">No jobs assigned to you yet</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const next = getNextStatus(b.status);
            return (
              <Card key={b.id}>
                <CardContent className="p-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{b.service_name}</p>
                      <p className="text-sm text-gray-400">#{b.booking_number}</p>
                    </div>
                    <Badge className={statusColor(b.status)}>{statusLabel(b.status)}</Badge>
                  </div>
                  <div className="mb-3 space-y-1 text-sm text-gray-600">
                    <p className="flex items-center gap-2"><User className="h-4 w-4" />{b.customer?.full_name}</p>
                    <p className="flex items-center gap-2"><Phone className="h-4 w-4" />{b.customer?.mobile}</p>
                    <p className="flex items-center gap-2"><Calendar className="h-4 w-4" />{b.scheduled_date ? new Date(b.scheduled_date).toLocaleString('en-IN') : '-'}</p>
                    <p className="flex items-center gap-2"><MapPin className="h-4 w-4" />{b.address}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {next && (
                      <Button size="sm" onClick={() => updateStatus(b, next.status)} disabled={updating === b.id}>
                        {updating === b.id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}{next.label}
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => openInGoogleMaps(b.lat ?? null, b.lng ?? null)}>
                      <Navigation className="mr-1 h-4 w-4" />Navigate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
