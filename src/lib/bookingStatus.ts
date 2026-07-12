import type { BookingStatus } from '@/lib/supabase';

export const bookingStatuses: BookingStatus[] = ['created','assigned','accepted','on_the_way','arrived','started','completed','payment','invoice','closed','cancelled','rejected'];

export function statusLabel(status: BookingStatus): string {
  const labels: Record<BookingStatus, string> = {
    created:'Created', assigned:'Assigned', accepted:'Accepted', on_the_way:'On the Way', arrived:'Arrived',
    started:'Started', completed:'Completed', payment:'Payment', invoice:'Invoice', closed:'Closed', cancelled:'Cancelled', rejected:'Rejected',
  };
  return labels[status] ?? status;
}

export function statusColor(status: BookingStatus): string {
  const colors: Record<BookingStatus, string> = {
    created:'bg-blue-100 text-blue-700', assigned:'bg-indigo-100 text-indigo-700', accepted:'bg-cyan-100 text-cyan-700',
    on_the_way:'bg-purple-100 text-purple-700', arrived:'bg-amber-100 text-amber-700', started:'bg-orange-100 text-orange-700',
    completed:'bg-green-100 text-green-700', payment:'bg-teal-100 text-teal-700', invoice:'bg-emerald-100 text-emerald-700',
    closed:'bg-gray-100 text-gray-700', cancelled:'bg-red-100 text-red-700', rejected:'bg-rose-100 text-rose-700',
  };
  return colors[status] ?? 'bg-gray-100 text-gray-700';
}
