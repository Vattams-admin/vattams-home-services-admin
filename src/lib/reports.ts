import { supabase } from '@/lib/supabase';
import { downloadFile, toCSV, formatCurrency, formatDateTime } from '@/lib/utils';
import { generateReportPDF } from '@/lib/payments';
import type { Booking, Payment } from '@/lib/supabase';

export async function exportBookingsCSV(bookings: Booking[]) {
  const rows = bookings.map(b => ({
    'Booking Number': b.booking_number,
    'Service': b.service_name,
    'Status': b.status,
    'Date': b.scheduled_date || '-',
    'Time': b.scheduled_time || '-',
    'City': b.city || '-',
    'District': b.district || '-',
    'Amount': b.amount || 0,
    'Created': b.created_at,
  }));
  const csv = toCSV(rows as unknown as Record<string, unknown>[], Object.keys(rows[0] || {}));
  downloadFile(csv, `bookings-${Date.now()}.csv`, 'text/csv');
}

export async function exportPaymentsCSV(payments: Payment[]) {
  const rows = payments.map(p => ({
    'Payment Number': p.payment_number || '',
    'Booking': p.booking?.booking_number || '',
    'Service': p.booking?.service_name || '',
    'Amount': p.amount,
    'Status': p.status,
    'Method': p.method,
    'Date': p.created_at,
  }));
  const csv = toCSV(rows as unknown as Record<string, unknown>[], Object.keys(rows[0] || {}));
  downloadFile(csv, `payments-${Date.now()}.csv`, 'text/csv');
}

export function exportBookingsPDF(bookings: Booking[], summary?: { label: string; value: string }[]) {
  const headers = ['Booking #', 'Service', 'Status', 'Date', 'City', 'Amount'];
  const rows = bookings.map(b => [
    b.booking_number,
    b.service_name,
    b.status,
    b.scheduled_date || '-',
    b.city || '-',
    formatCurrency(b.amount),
  ]);
  generateReportPDF('Booking Report', headers, rows, summary);
}

export function exportRevenuePDF(payments: Payment[], summary?: { label: string; value: string }[]) {
  const headers = ['Payment #', 'Booking', 'Service', 'Amount', 'Status', 'Date'];
  const rows = payments.map(p => [
    p.payment_number || '-',
    p.booking?.booking_number || '-',
    p.booking?.service_name || '-',
    formatCurrency(p.amount),
    p.status,
    formatDateTime(p.created_at),
  ]);
  generateReportPDF('Revenue Report', headers, rows, summary);
}

export async function getBookingStats(): Promise<{ total: number; pending: number; completed: number; cancelled: number; revenue: number }> {
  try {
    const { data } = await supabase.from('bookings').select('status, amount');
    const stats = { total: 0, pending: 0, completed: 0, cancelled: 0, revenue: 0 };
    for (const b of data || []) {
      stats.total++;
      if (b.status === 'completed') { stats.completed++; stats.revenue += Number(b.amount) || 0; }
      else if (b.status === 'cancelled') stats.cancelled++;
      else stats.pending++;
    }
    return stats;
  } catch { return { total: 0, pending: 0, completed: 0, cancelled: 0, revenue: 0 }; }
}

export async function getRevenueStats(): Promise<{ totalRevenue: number; paidCount: number; pendingCount: number; failedCount: number }> {
  try {
    const { data } = await supabase.from('payments').select('amount, status');
    const stats = { totalRevenue: 0, paidCount: 0, pendingCount: 0, failedCount: 0 };
    for (const p of data || []) {
      if (p.status === 'paid') { stats.totalRevenue += Number(p.amount) || 0; stats.paidCount++; }
      else if (p.status === 'pending') stats.pendingCount++;
      else if (p.status === 'failed') stats.failedCount++;
    }
    return stats;
  } catch { return { totalRevenue: 0, paidCount: 0, pendingCount: 0, failedCount: 0 }; }
}

export async function getTechnicianEarnings(technicianId: string): Promise<{ total: number; completed: number; pending: number }> {
  try {
    const { data } = await supabase.from('bookings').select('amount, status').eq('technician_id', technicianId);
    const stats = { total: 0, completed: 0, pending: 0 };
    for (const b of data || []) {
      if (b.status === 'completed' || b.status === 'closed' || b.status === 'payment') { stats.total += Number(b.amount) || 0; stats.completed++; }
      else if (b.status !== 'cancelled' && b.status !== 'rejected') stats.pending++;
    }
    return stats;
  } catch { return { total: 0, completed: 0, pending: 0 }; }
}
