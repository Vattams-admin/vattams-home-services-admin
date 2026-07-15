import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase, type Profile, type UserRole } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'

type AuthContextType = {
  session: Session | null; profile: Profile | null; loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, mobile: string, name: string, role: UserRole) => Promise<{ error: string | null }>
  signOut: () => Promise<void>; refreshProfile: () => Promise<void>
}
const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) { loadProfile(session.user.id).finally(() => setLoading(false)) } else { setLoading(false) }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        setLoading(true)
        ;(async () => { await loadProfile(session.user.id); setLoading(false) })()
      } else { setProfile(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (data) setProfile(data as Profile)
  }

  async function signIn(email: string, password: string) {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (!error) return { error: null }
      const msg = error.message || ''
      if (msg.includes('Email not confirmed')) {
        return { error: 'Email not confirmed. Please check your inbox or contact support at 8189800757.' }
      }
      if (msg.includes('Invalid login credentials')) {
        return { error: 'Invalid email or password. Please try again.' }
      }
      return { error: msg }
    } catch {
      return { error: 'Unable to connect. Please check your internet connection and try again.' }
    }
  }

  async function signUp(email: string, password: string, mobile: string, name: string, role: UserRole) {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      const res = await fetch(`${supabaseUrl}/functions/v1/customer-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${anonKey}`,
          apikey: anonKey,
        },
        body: JSON.stringify({ email, password, mobile, name, role }),
      })
      const data = await res.json()
      if (!res.ok) return { error: data.error || 'Failed to create account' }
      return { error: null }
    } catch {
      return { error: 'Unable to connect. Please check your internet connection and try again.' }
    }
  }

  async function signOut() { await supabase.auth.signOut(); setProfile(null); setSession(null) }
  async function refreshProfile() { if (session?.user) await loadProfile(session.user.id) }

  return <AuthContext.Provider value={{ session, profile, loading, signIn, signUp, signOut, refreshProfile }}>{children}</AuthContext.Provider>
}
export function useAuth() { const ctx = useContext(AuthContext); if (!ctx) throw new Error('useAuth must be used within AuthProvider'); return ctx }
