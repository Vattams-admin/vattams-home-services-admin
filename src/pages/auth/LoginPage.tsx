import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'

export function LoginPage() {
  const { signIn } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await signIn(form.email, form.password)
    if (error) {
      toast(error, 'error')
      setLoading(false)
      return
    }
    toast('Login successful! Redirecting...', 'success')
    // Determine redirect based on profile role
    setTimeout(() => {
      // The AuthProvider will load the profile; redirect to dashboard
      // which will handle role-based routing
      navigate('/dashboard')
    }, 500)
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
            <LogIn className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="mt-2">Welcome Back</CardTitle>
          <p className="text-sm text-gray-600">Sign in to your VATTAMS account</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  required
                  className="pl-10"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  required
                  className="pl-10"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 space-y-2 text-center text-sm">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register/customer" className="font-medium text-blue-600 hover:text-blue-700">
                Register as Customer
              </Link>
            </p>
            <p className="text-gray-600">
              Are you a technician?{' '}
              <Link to="/register/technician" className="font-medium text-blue-600 hover:text-blue-700">
                Register as Technician
              </Link>
            </p>
            <p>
              <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-700">
                Forgot your password?
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
