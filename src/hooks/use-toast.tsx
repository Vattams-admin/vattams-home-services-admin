import { createContext, useContext, useState, type ReactNode } from 'react'
import { CircleCheck as CheckCircle2, Circle as XCircle, CircleAlert as AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Variant = 'success' | 'error' | 'warning' | 'info'
interface Toast { id: string; title: string; message?: string; variant: Variant }
interface ToastContextType { toast: { success: (title: string, message?: string) => void; error: (title: string, message?: string) => void; warning: (title: string, message?: string) => void; info: (title: string, message?: string) => void } }

const ToastContext = createContext<ToastContextType | undefined>(undefined)
const icons = { success: CheckCircle2, error: XCircle, warning: AlertCircle, info: Info }
const styles: Record<Variant, string> = { success: 'border-green-200 bg-green-50 text-green-800', error: 'border-red-200 bg-red-50 text-red-800', warning: 'border-amber-200 bg-amber-50 text-amber-800', info: 'border-blue-200 bg-blue-50 text-blue-800' }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const remove = (id: string) => setToasts(t => t.filter(x => x.id !== id))
  const add = (variant: Variant, title: string, message?: string) => {
    const id = crypto.randomUUID(); setToasts(t => [...t, { id, title, message, variant }])
    setTimeout(() => remove(id), 5000)
  }
  const toast = { success: (t: string, m?: string) => add('success', t, m), error: (t: string, m?: string) => add('error', t, m), warning: (t: string, m?: string) => add('warning', t, m), info: (t: string, m?: string) => add('info', t, m) }
  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map(t => { const Icon = icons[t.variant]; return (
          <div key={t.id} className={cn('flex items-start gap-3 rounded-lg border p-4 shadow-lg max-w-sm', styles[t.variant])}>
            <Icon className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex-1"><p className="font-medium text-sm">{t.title}</p>{t.message && <p className="text-sm opacity-90 mt-1">{t.message}</p>}</div>
            <button onClick={() => remove(t.id)} className="shrink-0 opacity-60 hover:opacity-100"><X className="h-4 w-4" /></button>
          </div>
        )})}
      </div>
    </ToastContext.Provider>
  )
}
export function useToast() { const ctx = useContext(ToastContext); if (!ctx) throw new Error('useToast must be used within ToastProvider'); return ctx.toast }
