import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Clock, XCircle, Ban, CreditCard, FileSearch } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { LoadingScreen } from '@/components/LoadingScreen'
import { VERIFICATION_STATUS_LABELS } from '@/lib/utils'
import type { UserRole } from '@/lib/supabase'

type Props = { allowedRoles: UserRole[]; children: ReactNode }

function StatusScreen({ icon: Icon, title, message }: { icon: typeof Clock; title: string; message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="rounded-full bg-amber-100 p-5"><Icon className="h-10 w-10 text-amber-600" /></div>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <p className="max-w-md text-gray-600">{message}</p>
      <a href="/" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Back to Home</a>
    </div>
  )
}

export function ProtectedRoute({ allowedRoles, children }: Props) {
  const { session, profile, loading } = useAuth()
  const location = useLocation()
  if (loading) return <LoadingScreen message="Checking your session..." />
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />
  if (profile) {
    const role = profile.role === 'super_admin' ? 'admin' : profile.role
    if (!allowedRoles.includes(role) && !allowedRoles.includes(profile.role)) return <Navigate to="/" replace />
    if (role === 'technician') {
      const vs = profile.verification_status || 'pending_registration'
      if (vs !== 'approved') {
        if (vs === 'pending_registration') return <StatusScreen icon={Clock} title="Registration Received" message="Your technician registration has been received. Please complete the verification fee payment to proceed." />
        if (vs === 'fee_pending') return <StatusScreen icon={CreditCard} title="Verification Fee Pending" message="Please complete the ₹50 Verification & Activation Fee payment to proceed with your application." />
        if (vs === 'under_review') return <StatusScreen icon={FileSearch} title="Account Under Verification" message="Your account is under verification. Please wait for admin approval. This usually takes 1-2 business days." />
        if (vs === 'rejected') return <StatusScreen icon={XCircle} title="Application Rejected" message={profile.rejection_reason || 'Your technician application was not approved. Please contact support for more information.'} />
        if (vs === 'suspended') return <StatusScreen icon={Ban} title="Account Suspended" message="Your account has been suspended. Please contact support to resolve this issue." />
        return <StatusScreen icon={Clock} title={VERIFICATION_STATUS_LABELS[vs] || 'Pending'} message="Please wait for admin approval." />
      }
    }
    if (role === 'customer' && profile.status === 'suspended') return <StatusScreen icon={Ban} title="Account Suspended" message="Your account has been suspended. Please contact support to resolve this issue." />
  }
  return <>{children}</>
}

export function RoleDashboardRedirect() {
  const { profile, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!profile) return <Navigate to="/login" replace />
  const path = profile.role === 'admin' || profile.role === 'super_admin' ? '/admin/dashboard' : profile.role === 'technician' ? '/technician/dashboard' : '/customer/dashboard'
  return <Navigate to={path} replace />
}
