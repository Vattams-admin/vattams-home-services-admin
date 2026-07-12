import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile, UserRole } from '@/lib/supabase'

type AuthContextType = {
  session: Session | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<Profile>
  signUp: (email: string, password: string, fullName: string, mobile: string, role: UserRole) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    if (error) return null
    return data as Profile | null
  }

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      setSession(session)
      if (session?.user) {
        fetchProfile(session.user.id).then((p) => {
          if (mounted) { setProfile(p); setLoading(false) }
        })
      } else {
        setLoading(false)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      if (event === 'SIGNED_OUT') {
        setSession(null)
        setProfile(null)
        setLoading(false)
      } else if (event === 'TOKEN_REFRESHED' && session) {
        setSession(session)
      }
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string): Promise<Profile> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    if (!data.user) throw new Error('Login failed: no user returned')
    const p = await fetchProfile(data.user.id)
    if (!p) throw new Error('Profile not found. Please contact support.')
    setSession(data.session)
    setProfile(p)
    setLoading(false)
    return p
  }

  const signUp = async (email: string, password: string, fullName: string, mobile: string, role: UserRole) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, mobile, role } },
    })
    if (error) throw new Error(error.message)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setSession(null)
  }

  const refreshProfile = async () => {
    if (session?.user) {
      const p = await fetchProfile(session.user.id)
      setProfile(p)
    }
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
