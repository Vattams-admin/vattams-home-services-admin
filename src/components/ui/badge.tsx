import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> { color?: string }
export function Badge({ className, color, ...props }: BadgeProps) {
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', color || 'bg-gray-100 text-gray-700', className)} {...props} />
}
