import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'

type AdminAuthContextType = {
  isAuthenticated: boolean
  loading: boolean
  session: Session | null
  login: (email: string, password: string) => Promise<{ error: string | null }>
  logout: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)
export { AdminAuthContext }

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      setSession(session)
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      if (!email || !password) {
        return { error: 'Please enter email and password.' }
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        const msg = error.message || ''
        if (msg.includes('Invalid login credentials')) {
          return { error: 'Invalid email or password. Please try again.' }
        }
        return { error: msg }
      }

      if (!data.session) {
        return { error: 'Authentication failed. Please try again.' }
      }

      setSession(data.session)
      return { error: null }
    } catch {
      return { error: 'Unable to connect. Please try again.' }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut()
    } catch {
      // ignore
    }
    setSession(null)
  }, [])

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated: !!session, loading, session, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return ctx
}
