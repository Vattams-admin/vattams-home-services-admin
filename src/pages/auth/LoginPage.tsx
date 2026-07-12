import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader as Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { sanitizeInput } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

export function LoginPage() {
  const { signIn } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await signIn(email.trim(), password)
    if (error) {
      toast(error, 'error')
      setLoading(false)
      return
    }
    toast('Login successful!', 'success')
    // Redirect based on role — fetch profile to determine
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle()
      const role = data?.role
      if (role === 'admin' || role === 'super_admin') navigate('/admin/dashboard')
      else if (role === 'technician') navigate('/technician/dashboard')
      else navigate('/customer/dashboard')
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Welcome Back</CardTitle>
          <p className="text-center text-sm text-gray-500">Sign in to your VATTAMS account</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email}
                onChange={(e) => setEmail(sanitizeInput(e.target.value))}
                placeholder="you@example.com" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : 'Sign In'}
            </Button>
          </form>
          <div className="mt-4 space-y-2 text-center text-sm">
            <Link to="/forgot-password" className="text-blue-600 hover:text-blue-700">
              Forgot password?
            </Link>
            <p className="text-gray-500">
              Don&apos;t have an account?{' '}
              <Link to="/register/customer" className="text-blue-600 hover:text-blue-700">Register as Customer</Link>
              {' / '}
              <Link to="/register/technician" className="text-blue-600 hover:text-blue-700">Technician</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
