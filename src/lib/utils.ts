import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return '-'
  return timeStr
}

export function formatCurrency(amount: number | string | null | undefined): string {
  const val = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0)
  return `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

export const BOOKING_STATUS_FLOW: Record<string, string> = {
  created: 'Booking Created',
  confirmed: 'Confirmed',
  assigned: 'Technician Assigned',
  accepted: 'Technician Accepted',
  on_the_way: 'On The Way',
  work_started: 'Work Started',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
}

export const BOOKING_STATUS_COLORS: Record<string, string> = {
  created: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-indigo-100 text-indigo-700',
  assigned: 'bg-purple-100 text-purple-700',
  accepted: 'bg-cyan-100 text-cyan-700',
  on_the_way: 'bg-amber-100 text-amber-700',
  work_started: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  rejected: 'bg-rose-100 text-rose-700',
}
