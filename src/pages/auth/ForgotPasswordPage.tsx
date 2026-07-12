import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import type { FormEvent } from 'react'

export function ForgotPasswordPage() {
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })
    setLoading(false)
    if (error) {
      toast(error.message, 'error')
      return
    }
    setSent(true)
    toast('Password reset link sent to your email!', 'success')
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Forgot Password</CardTitle>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center">
              <p className="mb-4 text-gray-600">
                We've sent a password reset link to <span className="font-semibold text-gray-900">{email}</span>.
                Please check your inbox and follow the instructions to reset your password.
              </p>
              <Link to="/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <p className="mb-6 text-sm text-gray-600">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="pl-10" />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Sending...' : <><Send className="mr-2 h-4 w-4" /> Send Reset Link</>}
                </Button>
              </form>
              <div className="mt-4 text-center text-sm">
                <Link to="/login" className="text-gray-500 hover:text-blue-600">
                  <span className="inline-flex items-center"><ArrowLeft className="mr-1 h-3 w-3" /> Back to Login</span>
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
