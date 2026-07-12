import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'success' | 'warning'
type Size = 'default' | 'sm' | 'lg' | 'icon'

const variants: Record<Variant, string> = {
  default: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
  destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  outline: 'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
  ghost: 'text-gray-700 hover:bg-gray-100',
  link: 'text-blue-600 underline-offset-4 hover:underline',
  success: 'bg-green-600 text-white hover:bg-green-700 shadow-sm',
  warning: 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm',
}
const sizes: Record<Size, string> = {
  default: 'h-10 px-4 py-2 text-sm',
  sm: 'h-9 px-3 text-xs',
  lg: 'h-11 px-8 text-base',
  icon: 'h-10 w-10',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  asChild?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild, ...props }, ref) => {
    if (asChild && props.children) {
      return (
        <span className={cn('inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none', variants[variant], sizes[size], className)}>
          {props.children}
        </span>
      )
    }
    return (
      <button ref={ref} className={cn('inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none', variants[variant], sizes[size], className)} {...props} />
    )
  }
)
Button.displayName = 'Button'
