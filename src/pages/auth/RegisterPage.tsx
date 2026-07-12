import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { User, Mail, Lock, Phone, Wrench, Briefcase, MapPin, FileText, UserPlus, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { sanitizeInput } from '@/lib/utils'
import { TAMIL_NADU_DISTRICTS, VERIFICATION_FEE } from '@/lib/constants'
import type { FormEvent } from 'react'

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
    if (error) { toast(error, 'error'); return }
    if (isTechnician) {
      toast('Registration successful! Your account is pending approval. Please pay the verification fee to proceed.', 'success')
    } else {
      toast('Registration successful! Please login to continue.', 'success')
    }
    navigate('/login')
  }

  const set = (k: string, v: string) => setForm({ ...form, [k]: v })

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-center">
            Register as {isTechnician ? 'Technician' : 'Customer'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isTechnician && (
            <div className="mb-4 flex gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
              <Info className="h-5 w-5 flex-shrink-0" />
              <p>
                Technicians require admin approval. A one-time verification fee of ₹{VERIFICATION_FEE} applies after registration.
                The fee is refundable after completing 4 jobs.
              </p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input id="name" required value={form.name} onChange={(e) => set('name', sanitizeInput(e.target.value))} placeholder="Your full name" className="pl-10" />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input id="email" type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" className="pl-10" />
              </div>
            </div>
            <div>
              <Label htmlFor="mobile">Mobile Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input id="mobile" type="tel" required value={form.mobile} onChange={(e) => set('mobile', e.target.value)} placeholder="10-digit mobile number" className="pl-10" />
              </div>
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input id="password" type="password" required minLength={6} value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Min 6 characters" className="pl-10" />
              </div>
            </div>
            {isTechnician && (
              <>
                <div>
                  <Label htmlFor="skills">Skills (comma-separated)</Label>
                  <div className="relative">
                    <Wrench className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input id="skills" required value={form.skills} onChange={(e) => set('skills', e.target.value)} placeholder="AC Service, Plumbing, Electrical" className="pl-10" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="experience">Experience</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input id="experience" required value={form.experience} onChange={(e) => set('experience', e.target.value)} placeholder="e.g. 5 years" className="pl-10" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input id="city" required value={form.city} onChange={(e) => set('city', sanitizeInput(e.target.value))} placeholder="Your city" className="pl-10" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="district">District</Label>
                    <Select id="district" required value={form.district} onChange={(e) => set('district', e.target.value)}>
                      <option value="">Select district</option>
                      {TAMIL_NADU_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea id="bio" rows={3} value={form.bio} onChange={(e) => set('bio', sanitizeInput(e.target.value))} placeholder="Tell us about your experience and expertise" />
                </div>
              </>
            )}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Registering...' : <><UserPlus className="mr-2 h-4 w-4" /> Register</>}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:underline">Login here</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
