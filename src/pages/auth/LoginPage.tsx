import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'

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
      setLoading(false)
      toast(error, 'error')
      return
    }
    toast('Welcome back!', 'success')
    // Redirect based on role
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle()
        const role = (data as { role?: string } | null)?.role
        const path = role === 'admin' || role === 'super_admin' ? '/admin/dashboard' : role === 'technician' ? '/technician/dashboard' : '/customer/dashboard'
        navigate(path, { replace: true })
        return
      }
    } catch { /* fall through */ }
    setLoading(false)
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><LogIn className="h-5 w-5" /> Login to VATTAMS</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-4 space-y-2 text-center text-sm">
            <Link to="/forgot-password" className="block text-blue-600 hover:text-blue-700">Forgot password?</Link>
            <div className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register/customer" className="font-medium text-blue-600 hover:text-blue-700">Register as Customer</Link>
              {' · '}
              <Link to="/register/technician" className="font-medium text-blue-600 hover:text-blue-700">Technician</Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
