import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import type { UserRole, VerificationStatus } from '@/lib/supabase'
import { LoadingScreen } from '@/components/LoadingScreen'
import { VERIFICATION_STATUS_LABELS } from '@/lib/utils'

export function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: UserRole[] }) {
  const { session, profile, loading } = useAuth()
  const location = useLocation()
  if (loading) return <LoadingScreen />
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />
  if (!profile) return <LoadingScreen />
  const role = profile.role === 'super_admin' ? 'admin' : profile.role
  if (roles && !roles.includes(role)) return <Navigate to="/dashboard" replace />

  if (role === 'technician') {
    const vs = profile.verification_status
    if (vs && vs !== 'approved') {
      const label = VERIFICATION_STATUS_LABELS[vs] || vs
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
          <div className="max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Verification Required</h2>
            <p className="mt-2 text-slate-600">Your account status: <span className="font-medium">{label}</span></p>
            <p className="mt-2 text-sm text-slate-500">Please complete the verification process to access the technician dashboard.</p>
          </div>
        </div>
      )
    }
  }
  return <>{children}</>
}
