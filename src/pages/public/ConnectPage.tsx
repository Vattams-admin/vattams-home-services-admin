import { Link } from 'react-router-dom'
import { User, Wrench, ArrowRight } from 'lucide-react'

export default function ConnectPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-8 flex flex-col items-center">
          <img src="/vattams.svg" alt="VATTAMS" className="mb-3 h-12 w-12" />
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Connect</h1>
          <p className="mt-2 text-sm text-slate-500">Choose how you want to sign in</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Link
            to="/login"
            className="group flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Customer Login</h2>
            <p className="text-center text-sm text-slate-500">Sign in to manage your bookings and services</p>
            <span className="mt-2 flex items-center gap-1 text-sm font-medium text-blue-600 group-hover:text-blue-700">
              Sign in <ArrowRight className="h-4 w-4" />
            </span>
          </Link>

          <Link
            to="/login?role=technician"
            className="group flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:border-orange-300 hover:shadow-md"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50">
              <Wrench className="h-8 w-8 text-orange-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Technician Login</h2>
            <p className="text-center text-sm text-slate-500">Sign in to manage your jobs and earnings</p>
            <span className="mt-2 flex items-center gap-1 text-sm font-medium text-orange-600 group-hover:text-orange-700">
              Sign in <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>

        <div className="mt-8 text-center">
          <Link to="/" className="text-sm text-slate-500 hover:text-slate-700">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
