import { Loader as Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'

export function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return <div className="flex min-h-screen flex-col items-center justify-center gap-4"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /><p className="text-gray-600">{message}</p></div>
}
export function ErrorPage({ message = 'Something went wrong' }: { message?: string }) {
  return <div className="flex min-h-screen flex-col items-center justify-center gap-4"><h1 className="text-4xl font-bold text-gray-900">Error</h1><p className="text-gray-600">{message}</p><Link to="/" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Back to Home</Link></div>
}
export function NotFoundPage() {
  return <div className="flex min-h-screen flex-col items-center justify-center gap-4"><h1 className="text-6xl font-bold text-gray-300">404</h1><p className="text-xl text-gray-600">Page not found</p><Link to="/" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Back to Home</Link></div>
}
