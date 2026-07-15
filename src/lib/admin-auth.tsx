import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

const STORAGE_KEY = 'vattams_admin_session'
const ADMIN_EMAIL = 'admin@vattams.net'

type AdminSession = { token: string; expiresAt: number }
type AdminAuthContextType = {
  isAuthenticated: boolean
  loading: boolean
  login: (pin: string) => Promise<{ error: string | null }>
  logout: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)
export { AdminAuthContext }

function getStoredSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as AdminSession
    if (session.expiresAt - 60 <= Math.floor(Date.now() / 1000)) {
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
      if (!pin || pin.length < 6) {
        return { error: 'PIN must be at least 6 digits' }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: pin,
      })

      if (error) {
        const msg = error.message || ''
        if (msg.includes('Invalid login credentials')) {
          return { error: 'Invalid PIN. Please try again.' }
        }
        return { error: msg }
      }

      if (!data.session) {
        return { error: 'Authentication failed. Please try again.' }
      }

      const expiresAt = Math.floor((data.session.expires_at || Date.now() / 1000 + 3600))
      const newSession = {
        token: data.session.access_token,
        expiresAt,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession))
      setSession(newSession)
      return { error: null }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to connect. Please try again.'
      return { error: message }
    }
  }

  async function logout() {
    try {
      await supabase.auth.signOut()
    } catch {
      // ignore
    }
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
