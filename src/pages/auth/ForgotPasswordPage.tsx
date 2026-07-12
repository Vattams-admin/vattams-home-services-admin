import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export function ForgotPasswordPage() {
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/login`,
    })
    setLoading(false)
    if (error) { toast(error.message, 'error'); return }
    setSent(true)
    toast('Password reset link sent to your email.', 'success')
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> Forgot Password</CardTitle>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                We've sent a password reset link to <span className="font-medium text-gray-900">{email}</span>.
                Check your inbox and follow the instructions to reset your password.
              </p>
              <Link to="/login"><Button variant="outline" className="w-full"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Login</Button></Link>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-gray-600">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
              <Link to="/login" className="mt-4 flex items-center justify-center gap-1 text-sm text-blue-600 hover:text-blue-700">
                <ArrowLeft className="h-4 w-4" /> Back to Login
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
