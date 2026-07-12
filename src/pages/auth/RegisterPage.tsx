import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { SERVICE_AREAS } from '@/lib/constants'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'

export function RegisterPage() {
  const { role = 'customer' } = useParams<{ role: string }>()
  const isTechnician = role === 'technician'
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    fullName: '', email: '', mobile: '', password: '', confirmPassword: '',
    address: '', city: '', district: '', pincode: '',
    experience: '', skills: '', bio: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'error' })
      return
    }
    setLoading(true)
    try {
      await signUp(form.email, form.password, form.fullName, form.mobile, isTechnician ? 'technician' : 'customer')
      const { data: userData } = await supabase.auth.getUser()
      if (userData.user) {
        const skillsArray = form.skills ? form.skills.split(',').map((s) => s.trim()).filter(Boolean) : []
        await supabase.from('profiles').upsert({
          id: userData.user.id,
          email: form.email,
          full_name: form.fullName,
          mobile: form.mobile,
          role: isTechnician ? 'technician' : 'customer',
          address: form.address || null,
          city: form.city || null,
          district: form.district || null,
          pincode: form.pincode || null,
          experience: isTechnician ? form.experience || null : null,
          skills: isTechnician ? skillsArray : null,
          bio: isTechnician ? form.bio || null : null,
          status: isTechnician ? 'pending' : 'active',
        })
      }
      toast({ title: 'Account created successfully!', variant: 'success' })
      navigate('/login')
    } catch (err) {
      toast({
        title: 'Registration failed',
        description: err instanceof Error ? err.message : 'Please try again',
        variant: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-6 text-center">
          <Link to="/"><Logo size="lg" /></Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              Register as {isTechnician ? 'Technician' : 'Customer'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" name="fullName" value={form.fullName} onChange={handleChange} required />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
                </div>
                <div>
                  <Label htmlFor="mobile">Mobile</Label>
                  <Input id="mobile" name="mobile" value={form.mobile} onChange={handleChange} required placeholder="+91 98765 43210" />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" value={form.password} onChange={handleChange} required minLength={6} />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input id="confirmPassword" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" name="address" value={form.address} onChange={handleChange} rows={2} />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Select id="city" name="city" value={form.city} onChange={handleChange}>
                    <option value="">Select city</option>
                    {SERVICE_AREAS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="district">District</Label>
                  <Input id="district" name="district" value={form.district} onChange={handleChange} />
                </div>
                <div>
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input id="pincode" name="pincode" value={form.pincode} onChange={handleChange} />
                </div>
              </div>
              {isTechnician && (
                <div className="space-y-4 rounded-lg bg-blue-50 p-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="experience">Experience (years)</Label>
                      <Input id="experience" name="experience" value={form.experience} onChange={handleChange} placeholder="5" />
                    </div>
                    <div>
                      <Label htmlFor="skills">Skills (comma-separated)</Label>
                      <Input id="skills" name="skills" value={form.skills} onChange={handleChange} placeholder="AC repair, Plumbing" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea id="bio" name="bio" value={form.bio} onChange={handleChange} rows={3} placeholder="Tell us about your experience..." />
                  </div>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
