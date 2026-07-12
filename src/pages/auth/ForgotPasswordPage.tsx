import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Loader as Loader2, MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { sanitizeInput } from '@/lib/utils'

export function ForgotPasswordPage() {
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim())
    setLoading(false)
    if (error) {
      toast(error.message, 'error')
      return
    }
    setSent(true)
    toast('Password reset link sent to your email!', 'success')
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Forgot Password</CardTitle>
          <p className="text-center text-sm text-gray-500">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <MailCheck className="h-12 w-12 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">Check your email</p>
                <p className="mt-1 text-sm text-gray-600">
                  We&apos;ve sent a password reset link to <strong>{email}</strong>.
                  Please check your inbox and follow the instructions.
                </p>
              </div>
              <Link to="/login" className="mt-2">
                <Button variant="outline">Back to Login</Button>
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={email}
                    onChange={(e) => setEmail(sanitizeInput(e.target.value))}
                    placeholder="you@example.com" />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : 'Send Reset Link'}
                </Button>
              </form>
              <div className="mt-4 text-center text-sm text-gray-500">
                Remembered your password?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-700">Sign in</Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
