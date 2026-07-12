import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Mail, Lock, User, Phone, UserPlus, Briefcase, MapPin, Award, FileText } from 'lucide-react'
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
          experience: form.experience,
          city: form.city,
          district: form.district,
          bio: form.bio,
        }
      : {}
    const { error } = await signUp(form.email, form.password, form.name, form.mobile, isTechnician ? 'technician' : 'customer', extra)
    setLoading(false)
    if (error) {
      toast(error, 'error')
      return
    }
    if (isTechnician) {
      toast('Registration successful! Your account is pending approval. Please pay the ₹50 verification fee to proceed.', 'success')
    } else {
      toast('Registration successful! Please log in to continue.', 'success')
    }
    navigate('/login')
  }

  const update = (k: string, v: string) => setForm({ ...form, [k]: v })

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
            <UserPlus className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="mt-2">
            Register as {isTechnician ? 'Technician' : 'Customer'}
          </CardTitle>
          <p className="text-sm text-gray-600">Create your VATTAMS account</p>
        </CardHeader>
        <CardContent>
          {isTechnician && (
            <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
              <p className="font-medium">Technician Registration</p>
              <p className="mt-1">
                After registration, your account will be pending approval. A one-time
                verification fee of ₹{VERIFICATION_FEE} is required before you can start
                accepting jobs. The fee is refundable after completing 4 jobs.
              </p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input id="name" required className="pl-10" value={form.name} onChange={(e) => update('name', sanitizeInput(e.target.value))} placeholder="Your full name" />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input id="email" type="email" required className="pl-10" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <Label htmlFor="mobile">Mobile Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input id="mobile" required className="pl-10" value={form.mobile} onChange={(e) => update('mobile', e.target.value)} placeholder="9876543210" />
              </div>
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input id="password" type="password" required minLength={6} className="pl-10" value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="••••••••" />
              </div>
            </div>

            {isTechnician && (
              <>
                <div>
                  <Label htmlFor="skills">Skills (comma-separated)</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input id="skills" required className="pl-10" value={form.skills} onChange={(e) => update('skills', e.target.value)} placeholder="AC Service, Washing Machine, Plumbing" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="experience">Experience (years)</Label>
                  <div className="relative">
                    <Award className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input id="experience" required className="pl-10" value={form.experience} onChange={(e) => update('experience', e.target.value)} placeholder="5" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input id="city" required className="pl-10" value={form.city} onChange={(e) => update('city', sanitizeInput(e.target.value))} placeholder="Chennai" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="district">District</Label>
                    <Select id="district" required value={form.district} onChange={(e) => update('district', e.target.value)}>
                      <option value="">Select district</option>
                      {TAMIL_NADU_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="bio">Bio / About You</Label>
                  <Textarea id="bio" required rows={3} value={form.bio} onChange={(e) => update('bio', sanitizeInput(e.target.value))} placeholder="Tell us about your experience and expertise..." />
                </div>
              </>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creating account...' : `Register as ${isTechnician ? 'Technician' : 'Customer'}`}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700">Sign in</Link>
          </div>
          <div className="mt-2 text-center text-sm text-gray-600">
            {isTechnician ? (
              <Link to="/register/customer" className="font-medium text-blue-600 hover:text-blue-700">Register as Customer instead</Link>
            ) : (
              <Link to="/register/technician" className="font-medium text-blue-600 hover:text-blue-700">Register as Technician instead</Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
