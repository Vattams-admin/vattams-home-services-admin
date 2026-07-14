import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAdminAuth } from '@/lib/admin-auth'
import { LoadingScreen } from '@/components/LoadingScreen'

export function AdminProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAdminAuth()
  const location = useLocation()
  if (loading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/admin/login" state={{ from: location }} replace />
  return <>{children}</>
}
