import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { UserPlus, Clock, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { sanitizeInput } from '@/lib/utils'
import { TAMIL_NADU_DISTRICTS, VERIFICATION_FEE, REFUND_ELIGIBLE_JOBS } from '@/lib/constants'

export function RegisterPage() {
  const { role } = useParams<{ role: string }>()
  const isTechnician = role === 'technician'
  const { signUp } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', mobile: '', password: '',
    skills: '', experience: '', city: '', district: '', bio: '',
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const extra = isTechnician
      ? {
          skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
          experience: sanitizeInput(form.experience),
          city: sanitizeInput(form.city),
          district: form.district,
          bio: sanitizeInput(form.bio),
        }
      : {}
    const { error } = await signUp(form.email.trim(), form.password, sanitizeInput(form.name), form.mobile.replace(/[^0-9]/g, ''), isTechnician ? 'technician' : 'customer', extra)
    setLoading(false)
    if (error) { toast(error, 'error'); return }
    if (isTechnician) {
      toast('Registration submitted! Complete verification to proceed.', 'success')
    } else {
      toast('Account created! Please log in.', 'success')
    }
    navigate('/login', { replace: true })
  }

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" /> Register as {isTechnician ? 'Technician' : 'Customer'}</CardTitle>
        </CardHeader>
        <CardContent>
          {isTechnician && (
            <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <p className="flex items-center gap-1 font-medium"><Clock className="h-4 w-4" /> Pending Approval</p>
              <p className="mt-1">Technician accounts require admin approval after a one-time verification fee of ₹{VERIFICATION_FEE}.</p>
              <p className="mt-1 flex items-center gap-1"><CreditCard className="h-4 w-4" /> The fee is refundable after completing {REFUND_ELIGIBLE_JOBS} jobs.</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label htmlFor="name">Full Name</Label><Input id="name" required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Your full name" /></div>
            <div><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" /></div>
            <div><Label htmlFor="mobile">Mobile</Label><Input id="mobile" type="tel" required value={form.mobile} onChange={(e) => set('mobile', e.target.value)} placeholder="9876543210" /></div>
            <div><Label htmlFor="password">Password</Label><Input id="password" type="password" required minLength={6} value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Min 6 characters" /></div>
            {isTechnician && (
              <>
                <div><Label htmlFor="skills">Skills (comma-separated)</Label><Input id="skills" required value={form.skills} onChange={(e) => set('skills', e.target.value)} placeholder="AC Service, Plumbing, Electrical" /></div>
                <div><Label htmlFor="experience">Experience</Label><Input id="experience" required value={form.experience} onChange={(e) => set('experience', e.target.value)} placeholder="5 years" /></div>
                <div><Label htmlFor="city">City</Label><Input id="city" required value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Chennai" /></div>
                <div><Label htmlFor="district">District</Label><Select id="district" required value={form.district} onChange={(e) => set('district', e.target.value)}><option value="">Select district</option>{TAMIL_NADU_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}</Select></div>
                <div><Label htmlFor="bio">Bio</Label><Textarea id="bio" rows={3} value={form.bio} onChange={(e) => set('bio', e.target.value)} placeholder="Brief description of your expertise" /></div>
              </>
            )}
            <Button type="submit" disabled={loading} className="w-full">{loading ? 'Creating account...' : 'Create Account'}</Button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-600">
            Already have an account? <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700">Login</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
