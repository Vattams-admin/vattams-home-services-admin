import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase, type Booking } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { formatCurrency, formatDate, toCSV, downloadFile } from '@/lib/utils';
import { generateReportPDF } from '@/lib/payments';
import { useSEO } from '@/lib/seo';
// useSEO is imported above; if module not found, inline a no-op

import { Download, FileText, TrendingUp } from 'lucide-react';

export function TechnicianEarningsPage() {
  useSEO({ title: 'Earnings | VATTAMS Home Services', description: 'View your completed jobs and total earnings.' });
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*, customer:profiles!bookings_customer_id_fkey(full_name, name, mobile)')
          .eq('technician_id', profile.id)
          .in('status', ['completed', 'closed', 'payment', 'invoice'])
          .order('updated_at', { ascending: false });
        if (error) throw error;
        setBookings((data || []) as Booking[]);
      } catch (err) { console.error('Failed to load earnings:', err); }
      finally { setLoading(false); }
    };
    load();
  }, [profile?.id]);

  const totalEarnings = bookings.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

  const handleExportCSV = () => {
    const rows = bookings.map(b => ({ 'Booking': b.booking_number, 'Service': b.service_name, 'Date': b.scheduled_date || '-', 'Amount': b.amount, 'Customer': b.customer?.full_name || '' }));
    downloadFile(toCSV(rows as unknown as Record<string, unknown>[], Object.keys(rows[0] || {})), `earnings-${Date.now()}.csv`, 'text/csv');
  };

  const handleExportPDF = () => {
    const headers = ['Booking #', 'Service', 'Date', 'Customer', 'Amount'];
    const rows = bookings.map(b => [b.booking_number, b.service_name, formatDate(b.scheduled_date), b.customer?.full_name || '-', formatCurrency(b.amount)]);
    generateReportPDF('Earnings Report', headers, rows, [{ label: 'Total Earnings', value: formatCurrency(totalEarnings) }, { label: 'Completed Jobs', value: String(bookings.length) }]);
  };

  if (loading) return <div className="flex h-64 items-center justify-center text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardContent className="p-6"><div className="flex items-center gap-3"><div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center"><TrendingUp className="h-6 w-6 text-green-600" /></div><div><p className="text-sm text-gray-500">Total Earnings</p><p className="text-2xl font-bold text-gray-900">{formatCurrency(totalEarnings)}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center gap-3"><div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center"><FileText className="h-6 w-6 text-blue-600" /></div><div><p className="text-sm text-gray-500">Completed Jobs</p><p className="text-2xl font-bold text-gray-900">{bookings.length}</p></div></div></CardContent></Card>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleExportCSV}><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
        <Button variant="outline" size="sm" onClick={handleExportPDF}><Download className="h-4 w-4 mr-1" /> Export PDF</Button>
      </div>
      {bookings.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-500">No completed jobs yet.</CardContent></Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>Completed Jobs</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Booking #</TableHead><TableHead>Service</TableHead><TableHead>Date</TableHead><TableHead>Customer</TableHead><TableHead>Amount</TableHead></TableRow></TableHeader>
              <TableBody>
                {bookings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.booking_number}</TableCell>
                    <TableCell>{b.service_name}</TableCell>
                    <TableCell>{formatDate(b.scheduled_date)}</TableCell>
                    <TableCell>{b.customer?.full_name || '-'}</TableCell>
                    <TableCell>{formatCurrency(b.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
