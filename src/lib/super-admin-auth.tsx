import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'

const SUPER_ADMIN_USERNAME = 'Admin'
const SUPER_ADMIN_PASSWORD = 'Venki@admin&123'
const SUPER_ADMIN_ROLE = 'super-admin'
const STORAGE_KEY = 'vattams_super_admin_session'

type SuperAdminSession = {
  username: string
  role: string
  loginAt: number
}

type SuperAdminAuthContextType = {
  isAuthenticated: boolean
  loading: boolean
  login: (username: string, password: string) => Promise<{ error: string | null }>
  logout: () => void
}

const SuperAdminAuthContext = createContext<SuperAdminAuthContextType | undefined>(undefined)
export { SuperAdminAuthContext }

function readSession(): SuperAdminSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SuperAdminSession
    if (!parsed.username || !parsed.role || !parsed.loginAt) return null
    return parsed
  } catch {
    return null
  }
}

function writeSession(session: SuperAdminSession) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

function clearSession() {
  sessionStorage.removeItem(STORAGE_KEY)
}

export function SuperAdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const session = readSession()
    setIsAuthenticated(!!session)
    setLoading(false)
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    if (!username || !password) {
      return { error: 'Please enter both username and password.' }
    }
    if (username === SUPER_ADMIN_USERNAME && password === SUPER_ADMIN_PASSWORD) {
      writeSession({ username, role: SUPER_ADMIN_ROLE, loginAt: Date.now() })
      setIsAuthenticated(true)
      return { error: null }
    }
    return { error: 'Invalid Super Admin Username or Password.' }
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setIsAuthenticated(false)
  }, [])

  return (
    <SuperAdminAuthContext.Provider value={{ isAuthenticated, loading, login, logout }}>
      {children}
    </SuperAdminAuthContext.Provider>
  )
}

export function useSuperAdminAuth() {
  const ctx = useContext(SuperAdminAuthContext)
  if (!ctx) throw new Error('useSuperAdminAuth must be used within SuperAdminAuthProvider')
  return ctx
}
