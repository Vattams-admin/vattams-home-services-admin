import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'

type Tab = 'customer' | 'technician' | 'admin'

const tabs: { key: Tab; label: string }[] = [
  { key: 'customer', label: 'Customer' },
  { key: 'technician', label: 'Technician' },
  { key: 'admin', label: 'Admin' },
]

export function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const { toast } = useToast()
  const [tab, setTab] = useState<Tab>('customer')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const profile = await signIn(email, password)
      toast({ title: 'Welcome back!', variant: 'success' })
      const role = profile.role
      if (role === 'admin' || role === 'super_admin') navigate('/admin')
      else if (role === 'technician') navigate('/technician')
      else navigate('/customer')
    } catch (err) {
      toast({
        title: 'Login failed',
        description: err instanceof Error ? err.message : 'Invalid credentials',
        variant: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link to="/"><Logo size="lg" /></Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Tabs */}
            <div className="mb-6 grid grid-cols-3 gap-1 rounded-lg bg-gray-100 p-1">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`rounded-md py-2 text-sm font-medium transition-colors ${
                    tab === t.key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="pl-9"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : `Sign In as ${tabs.find((t) => t.key === tab)?.label}`}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              <Link to="/forgot-password" className="text-blue-600 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="mt-4 text-center text-sm text-gray-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 hover:underline">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
