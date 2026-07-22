import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useSuperAdminAuth } from '@/lib/super-admin-auth'
import { LoadingScreen } from '@/components/LoadingScreen'

export function SuperAdminProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useSuperAdminAuth()
  const location = useLocation()
  if (loading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/admin/login" state={{ from: location }} replace />
  return <>{children}</>
}
