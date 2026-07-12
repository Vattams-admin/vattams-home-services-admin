import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import type { FormEvent } from 'react'

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
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      toast(error, 'error')
      return
    }
    toast('Welcome back! Redirecting to your dashboard...', 'success')
    // Redirect based on role — fetch profile after login
    const { supabase } = await import('@/lib/supabase')
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
      const role = profile?.role
      if (role === 'admin' || role === 'super_admin') navigate('/admin/dashboard')
      else if (role === 'technician') navigate('/technician/dashboard')
      else navigate('/customer/dashboard')
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Login to VATTAMS</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="pl-10" />
              </div>
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" className="pl-10" />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Logging in...' : <><LogIn className="mr-2 h-4 w-4" /> Login</>}
            </Button>
          </form>
          <div className="mt-4 space-y-2 text-center text-sm">
            <p className="text-gray-600">
              New to VATTAMS?{' '}
              <Link to="/register/customer" className="font-medium text-blue-600 hover:underline">Register as Customer</Link>
              {' | '}
              <Link to="/register/technician" className="font-medium text-blue-600 hover:underline">Register as Technician</Link>
            </p>
            <p>
              <Link to="/forgot-password" className="text-gray-500 hover:text-blue-600">Forgot your password?</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
