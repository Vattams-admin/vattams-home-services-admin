import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { ServiceCategory } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { createNotification } from '@/lib/notifications'
import { SERVICE_AREAS } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function BookingPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    service_category_id: '',
    scheduled_date: '',
    scheduled_time: '',
    address: '',
    city: '',
    pincode: '',
    customer_notes: '',
  })

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data } = await supabase
        .from('service_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      if (mounted) { setCategories((data ?? []) as ServiceCategory[]); setLoading(false) }
    })()
    return () => { mounted = false }
  }, [])

  const selectedCategory = categories.find((c) => c.id === form.service_category_id)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.id || !selectedCategory) return
    setSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          customer_id: profile.id,
          service_category_id: selectedCategory.id,
          service_name: selectedCategory.name,
          amount: selectedCategory.base_price,
          scheduled_date: form.scheduled_date,
          scheduled_time: form.scheduled_time,
          address: form.address,
          city: form.city,
          pincode: form.pincode,
          customer_notes: form.customer_notes,
          status: 'created',
        })
        .select()
        .single()
      if (error) throw error

      // Notify admins
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['admin', 'super_admin'])
      await Promise.all(
        (admins ?? []).map((a) =>
          createNotification(
            a.id,
            'New Booking Created',
            `New booking ${data.booking_number} for ${selectedCategory.name} by ${profile.name}.`,
            'new_booking',
            data.id,
          ),
        ),
      )

      toast({ title: 'Booking created!', description: 'We will confirm your booking shortly.', variant: 'success' })
      navigate('/customer/bookings')
    } catch (err) {
      toast({ title: 'Failed to create booking', description: (err as Error).message, variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Book a Service</h1>
      <Card>
        <CardHeader><CardTitle>Service Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="service">Service Category</Label>
              <Select
                id="service"
                required
                value={form.service_category_id}
                onChange={(e) => setForm({ ...form, service_category_id: e.target.value })}
              >
                <option value="">Select a service</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — ₹{c.base_price}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" required value={form.scheduled_date}
                  onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="time">Time</Label>
                <Input id="time" type="time" required value={form.scheduled_time}
                  onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" required rows={2} value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Full service address" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="city">City</Label>
                <Select id="city" required value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}>
                  <option value="">Select city</option>
                  {SERVICE_AREAS.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pincode">Pincode</Label>
                <Input id="pincode" required value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                  placeholder="6-digit pincode" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea id="notes" rows={3} value={form.customer_notes}
                onChange={(e) => setForm({ ...form, customer_notes: e.target.value })}
                placeholder="Any special instructions..." />
            </div>

            {selectedCategory && (
              <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
                Estimated amount: <span className="font-semibold">₹{selectedCategory.base_price}</span>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? 'Creating...' : 'Confirm Booking'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
