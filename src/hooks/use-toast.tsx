import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

type Toast = { id: number; title: string; description?: string; variant?: 'default' | 'success' | 'error' | 'destructive' | 'warning' }
type ToastContextType = { toast: (t: Omit<Toast, 'id'>) => void }
const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { ...t, id }])
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4000)
  }, [])
  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className={`rounded-lg border p-4 shadow-lg max-w-sm ${t.variant === 'success' ? 'bg-green-50 border-green-200' : t.variant === 'error' || t.variant === 'destructive' ? 'bg-red-50 border-red-200' : t.variant === 'warning' ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'}`}>
            <p className="font-medium text-sm text-gray-900">{t.title}</p>
            {t.description && <p className="text-sm text-gray-600 mt-1">{t.description}</p>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
