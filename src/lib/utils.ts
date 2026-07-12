import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { BookingStatus } from '@/lib/supabase'

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
export function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

export const BOOKING_STATUS_FLOW: BookingStatus[] = [
  'created', 'confirmed', 'assigned', 'accepted', 'on_the_way', 'arrived', 'work_started', 'completed',
]

export const BOOKING_STATUS_COLORS: Record<string, string> = {
  created: 'bg-blue-100 text-blue-700', confirmed: 'bg-cyan-100 text-cyan-700',
  assigned: 'bg-amber-100 text-amber-700', accepted: 'bg-indigo-100 text-indigo-700',
  on_the_way: 'bg-purple-100 text-purple-700', arrived: 'bg-violet-100 text-violet-700',
  work_started: 'bg-orange-100 text-orange-700', completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export const VERIFICATION_STATUS_COLORS: Record<string, string> = {
  pending_registration: 'bg-gray-100 text-gray-700',
  fee_pending: 'bg-amber-100 text-amber-700',
  under_review: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  suspended: 'bg-red-100 text-red-700',
}

export const VERIFICATION_STATUS_LABELS: Record<string, string> = {
  pending_registration: 'Pending Registration',
  fee_pending: 'Verification Fee Pending',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  suspended: 'Suspended',
}

export function sanitizeInput(input: string) { return input.replace(/[<>]/g, '').trim() }
