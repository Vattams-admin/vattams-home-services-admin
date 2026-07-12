import { type ReactNode } from 'react'
import { Loader as Loader2, TriangleAlert as AlertTriangle, Chrome as Home } from 'lucide-react'
import { Link } from 'react-router-dom'

export function LoadingScreen() {
  return <div className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
}
export function ErrorPage({ message }: { message?: string }) {
  return <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50"><AlertTriangle className="h-12 w-12 text-red-500" /><h1 className="text-xl font-semibold text-slate-900">Something went wrong</h1><p className="text-slate-600">{message || 'An unexpected error occurred.'}</p><Link to="/" className="text-blue-600 hover:underline">Go home</Link></div>
}
export function NotFoundPage() {
  return <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50"><h1 className="text-6xl font-bold text-slate-300">404</h1><p className="text-slate-600">Page not found</p><Link to="/" className="inline-flex items-center gap-2 text-blue-600 hover:underline"><Home className="h-4 w-4" /> Go home</Link></div>
}
export function PageLoader({ children }: { children: ReactNode }) {
  return <div className="flex h-96 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
}
