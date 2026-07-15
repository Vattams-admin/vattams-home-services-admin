import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

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
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      const res = await fetch(`${supabaseUrl}/functions/v1/admin-pin-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${anonKey}`,
          apikey: anonKey,
        },
        body: JSON.stringify({ pin }),
      })
      const data = await res.json()
      if (!res.ok) return { error: data.error || 'Invalid PIN' }
      const newSession = { token: data.token, expiresAt: data.expiresAt }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession))
      setSession(newSession)
      return { error: null }
    } catch {
      return { error: 'Unable to connect. Please check your internet connection and try again.' }
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
