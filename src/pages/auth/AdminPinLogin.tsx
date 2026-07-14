import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Delete, ShieldCheck, Loader2 } from 'lucide-react'
import { useAdminAuth } from '@/lib/admin-auth'

const PIN_LENGTH = 6

export default function AdminPinLogin() {
  const navigate = useNavigate()
  const { isAuthenticated, loading, login } = useAdminAuth()
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && isAuthenticated) navigate('/admin', { replace: true })
  }, [isAuthenticated, loading, navigate])

  const submitPin = useCallback(
    async (fullPin: string) => {
      setSubmitting(true)
      setError(null)
      const { error: loginError } = await login(fullPin)
      setSubmitting(false)
      if (loginError) { setError(loginError); setPin('') }
      else navigate('/admin', { replace: true })
    },
    [login, navigate],
  )

  useEffect(() => {
    if (pin.length === PIN_LENGTH && !submitting) submitPin(pin)
  }, [pin, submitting, submitPin])

  const handleDigit = (digit: string) => {
    if (pin.length >= PIN_LENGTH || submitting) return
    setError(null)
    setPin(pin + digit)
  }

  const handleDelete = () => {
    if (submitting) return
    setError(null)
    setPin(pin.slice(0, -1))
  }

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="w-full max-w-xs">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
            <ShieldCheck className="h-8 w-8 text-blue-400" />
          </div>
          <img src="/vattams.svg" alt="VATTAMS" className="mb-2 h-8 w-8" />
          <h1 className="text-xl font-bold text-white">VATTAMS Admin</h1>
          <p className="mt-1 text-sm text-slate-400">Enter your 6-digit PIN</p>
        </div>

        <div className="mb-6 flex justify-center gap-3">
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <div
              key={i}
              className={`h-4 w-4 rounded-full transition-all duration-200 ${
                i < pin.length ? 'bg-blue-400 scale-110' : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        <div className="mb-6 h-6 text-center">
          {error && <p className="text-sm font-medium text-red-400 animate-pulse">{error}</p>}
          {submitting && (
            <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {keys.map((k) => (
            <button
              key={k}
              onClick={() => handleDigit(k)}
              disabled={submitting}
              className="flex h-16 items-center justify-center rounded-2xl bg-white/5 text-2xl font-semibold text-white backdrop-blur transition-all duration-150 hover:bg-white/15 active:scale-95 disabled:opacity-40 border border-white/5"
            >
              {k}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleDigit('0')}
            disabled={submitting}
            className="flex h-16 items-center justify-center rounded-2xl bg-white/5 text-2xl font-semibold text-white backdrop-blur transition-all duration-150 hover:bg-white/15 active:scale-95 disabled:opacity-40 border border-white/5"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            disabled={submitting || pin.length === 0}
            className="flex h-16 items-center justify-center rounded-2xl text-white/60 transition-all duration-150 hover:bg-white/10 active:scale-95 disabled:opacity-20"
          >
            <Delete className="h-6 w-6" />
          </button>
        </div>

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
