import type { ReactNode } from 'react'
import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastVariant = 'success' | 'error' | 'warning' | 'info'
type Toast = { id: string; title: string; variant: ToastVariant }

const ToastContext = createContext<{ toast: (title: string, variant?: ToastVariant) => void }>({} as { toast: (title: string, variant?: ToastVariant) => void })

const icons = { success: CheckCircle, error: XCircle, warning: AlertCircle, info: Info }
const colors = {
  success: 'bg-green-50 text-green-800 border-green-200', error: 'bg-red-50 text-red-800 border-red-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200', info: 'bg-blue-50 text-blue-800 border-blue-200',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const toast = useCallback((title: string, variant: ToastVariant = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t, { id, title, variant }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000)
  }, [])
  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => { const Icon = icons[t.variant]; return (
          <div key={t.id} className={cn('flex items-center gap-3 rounded-lg border px-4 py-3 shadow-md', colors[t.variant])}>
            <Icon className="h-5 w-5 flex-shrink-0" /><span className="text-sm font-medium">{t.title}</span>
            <button onClick={() => setToasts((toasts) => toasts.filter((x) => x.id !== t.id))}><X className="h-4 w-4" /></button>
          </div>
        )})}
      </div>
    </ToastContext.Provider>
  )
}
export function useToast() { return useContext(ToastContext) }
