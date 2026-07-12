import { Navigate, useLocation } from 'react-router-dom'
import { Clock, XCircle, Ban } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import type { UserRole } from '@/lib/supabase'

type ProtectedRouteProps = {
  roles?: UserRole[]
  children: React.ReactNode
}

function FullScreen({ icon: Icon, title, message }: { icon: typeof Clock; title: string; message?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <Icon className="mb-4 h-14 w-14 text-gray-400" />
      <h1 className="mb-2 text-2xl font-bold text-gray-900">{title}</h1>
      {message && <p className="max-w-md text-gray-600">{message}</p>}
      <a href="/" className="mt-6 text-sm font-medium text-blue-600 hover:underline">
        Back to Home
      </a>
    </div>
  )
}

export function ProtectedRoute({ roles, children }: ProtectedRouteProps) {
  const { session, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400">Loading…</div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!profile) {
    return <FullScreen icon={Clock} title="Loading profile…" />
  }

  // Role check
  if (roles && roles.length > 0) {
    const allowed = roles.includes(profile.role) || (roles.includes('admin') && profile.role === 'super_admin')
    if (!allowed) {
      return <Navigate to="/login" replace />
    }
  }

  // Technician status checks
  if (profile.role === 'technician') {
    if (profile.status === 'pending') {
      return (
        <FullScreen
          icon={Clock}
          title="Account Under Verification"
          message="Your technician account is being reviewed by our team. You will be notified once approved. This usually takes 1-2 business days."
        />
      )
    }
    if (profile.status === 'rejected') {
      return (
        <FullScreen
          icon={XCircle}
          title="Application Rejected"
          message={profile.bio || 'Your technician application has been rejected. Please contact support for more information.'}
        />
      )
    }
    if (profile.status === 'suspended') {
      return (
        <FullScreen
          icon={Ban}
          title="Account Suspended"
          message="Your account has been suspended. Please contact support for assistance."
        />
      )
    }
  }

  // Customer status checks
  if (profile.role === 'customer' && profile.status === 'suspended') {
    return (
      <FullScreen
        icon={Ban}
        title="Account Suspended"
        message="Your account has been suspended. Please contact support for assistance."
      />
    )
  }

  return <>{children}</>
}

export function RoleDashboardRedirect() {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400">Loading…</div>
      </div>
    )
  }

  if (!session || !profile) {
    return <Navigate to="/login" replace />
  }

  const path =
    profile.role === 'admin' || profile.role === 'super_admin'
      ? '/admin/dashboard'
      : profile.role === 'technician'
        ? '/technician/dashboard'
        : '/customer/dashboard'

  return <Navigate to={path} replace />
}
