import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ShieldCheck, Loader2, AlertCircle } from 'lucide-react'
import { useAdminAuth } from '@/lib/admin-auth'

export default function AdminPinLogin() {
  const navigate = useNavigate()
  const { isAuthenticated, loading, login } = useAdminAuth()
  const [email, setEmail] = useState('admin@vattams.net')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && isAuthenticated) navigate('/admin', { replace: true })
  }, [isAuthenticated, loading, navigate])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    if (!email || !password) {
      setError('Please enter email and password.')
      return
    }
    setSubmitting(true)
    const { error: loginError } = await login(email, password)
    if (loginError) {
      setError(loginError)
      setSubmitting(false)
    } else {
      navigate('/admin', { replace: true })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
            <ShieldCheck className="h-8 w-8 text-blue-400" />
          </div>
          <img src="/vattams.svg" alt="VATTAMS" className="mb-2 h-8 w-8" />
          <h1 className="text-xl font-bold text-white">VATTAMS Admin</h1>
          <p className="mt-1 text-sm text-slate-400">Enter your credentials to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@vattams.net"
              required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 backdrop-blur focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                autoFocus
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 pr-12 text-white placeholder-slate-500 backdrop-blur focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-all hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Logging in...
              </>
            ) : (
              <>
                <ShieldCheck className="h-5 w-5" />
                Login to Dashboard
              </>
            )}
          </button>
        </form>

        <button
          onClick={() => navigate('/')}
          className="mt-8 w-full text-center text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          Back to home
        </button>
      </div>
    </div>
  )
}
