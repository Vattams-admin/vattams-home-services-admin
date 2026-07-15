import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

const STORAGE_KEY = 'vattams_admin_session'
const TOKEN_EXPIRY_BUFFER = 60

type AdminSession = { token: string; expiresAt: number }
type AdminAuthContextType = {
  isAuthenticated: boolean
  loading: boolean
  login: (pin: string) => Promise<{ error: string | null }>
  logout: () => void
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)
export { AdminAuthContext }

function getStoredSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as AdminSession
    if (session.expiresAt - TOKEN_EXPIRY_BUFFER <= Math.floor(Date.now() / 1000)) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return session
  } catch {
    return null
  }
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { setSession(getStoredSession()); setLoading(false) }, [])

  async function login(pin: string) {
    try {
      const { data, error } = await supabase.rpc('verify_admin_pin_and_login', {
        input_pin: pin,
      })
      if (error) {
        return { error: error.message || 'Invalid PIN' }
      }
      const result = data as { token?: string; expiresAt?: number; error?: string }
      if (result.error) {
        return { error: result.error }
      }
      if (!result.token || !result.expiresAt) {
        return { error: 'Invalid PIN' }
      }
      const newSession = { token: result.token, expiresAt: result.expiresAt }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession))
      setSession(newSession)
      return { error: null }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to connect. Please try again.'
      return { error: message }
    }
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY)
    setSession(null)
  }

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated: !!session, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return ctx
}
