import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile, UserRole } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'

type AuthContextType = {
  session: Session | null; profile: Profile | null; loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, name: string, mobile: string, role: UserRole, extra?: Record<string, unknown>) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return
      setSession(session)
      if (session) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
        if (mounted) setProfile(data as Profile)
      }
      if (mounted) setLoading(false)
    })()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) { (async () => { const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle(); setProfile(data as Profile) })() }
      else { setProfile(null) }
    })
    return () => { mounted = false; subscription.unsubscribe() }
  }, [])

  const refreshProfile = async () => {
    if (!session) return
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
    setProfile(data as Profile)
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message || null }
  }

  const signUp = async (email: string, password: string, name: string, mobile: string, role: UserRole, extra?: Record<string, unknown>) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: error.message }
    if (data.user) {
      const verificationStatus = role === 'technician' ? 'pending_registration' : 'approved'
      const status = role === 'technician' ? 'pending' : 'active'
      await supabase.from('profiles').insert({ id: data.user.id, email, name, mobile, role, status, verification_status: verificationStatus, ...extra })
    }
    return { error: null }
  }

  const signOut = async () => { await supabase.auth.signOut(); setProfile(null); setSession(null) }

  return <AuthContext.Provider value={{ session, profile, loading, signIn, signUp, signOut, refreshProfile }}>{children}</AuthContext.Provider>
}

export function useAuth() { return useContext(AuthContext) }
