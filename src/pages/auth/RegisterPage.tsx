import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Loader2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { sanitizeInput } from '@/lib/utils'
import { TAMIL_NADU_DISTRICTS, VERIFICATION_FEE } from '@/lib/constants'

export function RegisterPage() {
  const { role } = useParams<{ role: string }>()
  const isTechnician = role === 'technician'
  const { signUp } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '', email: '', mobile: '', password: '',
    skills: '', experience: '', city: '', district: '', bio: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const extra: Record<string, unknown> = {}
    if (isTechnician) {
      extra.skills = form.skills.split(',').map((s) => s.trim()).filter(Boolean)
      extra.experience = form.experience
      extra.city = form.city
      extra.district = form.district
      extra.bio = form.bio
    }
    const { error } = await signUp(
      form.email.trim(), form.password, form.name, form.mobile,
      isTechnician ? 'technician' : 'customer', extra,
    )
    setLoading(false)
    if (error) {
      toast(error, 'error')
      return
    }
    if (isTechnician) {
      toast('Registration successful! Your account is pending approval.', 'success')
      toast(`Please pay the ₹${VERIFICATION_FEE} verification fee to proceed.`, 'info')
    } else {
      toast('Registration successful! Please sign in.', 'success')
    }
    navigate('/login')
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            Register as {isTechnician ? 'Technician' : 'Customer'}
          </CardTitle>
          <p className="text-center text-sm text-gray-500">Create your VATTAMS account</p>
        </CardHeader>
        <CardContent>
          {isTechnician && (
            <div className="mb-4 flex gap-2 rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
              <Info className="h-5 w-5 flex-shrink-0" />
              <p>
                Technician accounts require admin approval and a ₹{VERIFICATION_FEE} verification fee.
                You can start receiving jobs after verification is complete.
              </p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" required value={form.name}
                onChange={(e) => setForm({ ...form, name: sanitizeInput(e.target.value) })}
                placeholder="Your full name" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: sanitizeInput(e.target.value) })}
                placeholder="you@example.com" />
            </div>
            <div>
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input id="mobile" type="tel" required value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: sanitizeInput(e.target.value) })}
                placeholder="10-digit mobile number" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required minLength={6} value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="At least 6 characters" />
            </div>
            {isTechnician && (
              <>
                <div>
                  <Label htmlFor="skills">Skills (comma-separated)</Label>
                  <Input id="skills" required value={form.skills}
                    onChange={(e) => setForm({ ...form, skills: sanitizeInput(e.target.value) })}
                    placeholder="AC Service, Washing Machine, Plumbing" />
                </div>
                <div>
                  <Label htmlFor="experience">Experience (years)</Label>
                  <Input id="experience" type="number" min="0" required value={form.experience}
                    onChange={(e) => setForm({ ...form, experience: sanitizeInput(e.target.value) })}
                    placeholder="e.g. 5" />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input id="city" required value={form.city}
                    onChange={(e) => setForm({ ...form, city: sanitizeInput(e.target.value) })}
                    placeholder="e.g. Chennai" />
                </div>
                <div>
                  <Label htmlFor="district">District</Label>
                  <Select id="district" required value={form.district}
                    onChange={(e) => setForm({ ...form, district: e.target.value })}>
                    <option value="">Select district</option>
                    {TAMIL_NADU_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea id="bio" rows={3} value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: sanitizeInput(e.target.value) })}
                    placeholder="Brief description of your experience and expertise" />
                </div>
              </>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account...</> : 'Register'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700">Sign in</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
