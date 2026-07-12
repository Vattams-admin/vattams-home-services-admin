import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, MapPin, FileText, Tag } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { LoadingScreen } from '@/components/LoadingScreen'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sanitizeInput } from '@/lib/utils'
import { TAMIL_NADU_DISTRICTS, SERVICE_CITIES } from '@/lib/constants'
import { createNotification, createAuditLog } from '@/lib/notifications'

type ServiceCat = { id: string; name: string; base_price: number }

export function BookingPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [services, setServices] = useState<ServiceCat[]>([])

  const [form, setForm] = useState({
    service_name: '', service_category_id: '', scheduled_date: '', scheduled_time: '',
    address: '', city: '', district: '', pincode: '', customer_notes: '', amount: '',
  })

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.from('service_categories').select('id, name, base_price').eq('is_active', true).order('sort_order')
      if (mounted) { setServices((data || []) as ServiceCat[]); setLoading(false) }
    })()
    return () => { mounted = false }
  }, [])

  if (loading) return <LoadingScreen />

  const update = (k: string, v: string) => setForm({ ...form, [k]: v })

  const onServiceChange = (name: string) => {
    const svc = services.find((s) => s.name === name)
    setForm({ ...form, service_name: name, service_category_id: svc?.id || '', amount: svc ? String(svc.base_price) : '' })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSubmitting(true)
    const payload = {
      customer_id: profile.id,
      service_name: form.service_name,
      service_category_id: form.service_category_id || null,
      scheduled_date: form.scheduled_date || null,
      scheduled_time: form.scheduled_time || null,
      address: sanitizeInput(form.address),
      city: sanitizeInput(form.city),
      district: form.district,
      pincode: form.pincode,
      customer_notes: sanitizeInput(form.customer_notes),
      amount: Number(form.amount) || 0,
      status: 'created',
    }
    const { data, error } = await supabase.from('bookings').insert(payload).select().single()
    if (error) { toast(error.message, 'error'); setSubmitting(false); return }
    const booking = data as { id: string; booking_number: string }
    await createNotification(profile.id, 'Booking Created', `Your booking ${booking.booking_number} for ${form.service_name} has been created successfully.`, 'booking')
    await createAuditLog(profile.id, 'booking_created', 'booking', booking.id, `Customer created booking ${booking.booking_number}`)
    toast('Booking created successfully!', 'success')
    navigate('/customer/bookings')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Book a Service</h1>
        <p className="text-sm text-gray-600">Fill in the details below to schedule your service</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Service Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="service">Service Type</Label>
              <Select id="service" required value={form.service_name} onChange={(e) => onServiceChange(e.target.value)}>
                <option value="">Select a service</option>
                {services.map((s) => <option key={s.id} value={s.name}>{s.name} (from ₹{s.base_price})</option>)}
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="date">Scheduled Date</Label>
                <Input id="date" type="date" required value={form.scheduled_date} onChange={(e) => update('scheduled_date', e.target.value)} min={new Date().toISOString().split('T')[0]} />
              </div>
              <div>
                <Label htmlFor="time">Preferred Time</Label>
                <Select id="time" value={form.scheduled_time} onChange={(e) => update('scheduled_time', e.target.value)}>
                  <option value="">Any time</option>
                  <option value="09:00-12:00">Morning (9 AM - 12 PM)</option>
                  <option value="12:00-15:00">Afternoon (12 PM - 3 PM)</option>
                  <option value="15:00-18:00">Evening (3 PM - 6 PM)</option>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" required rows={2} value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="House no, Street, Landmark..." />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="city">City</Label>
                <Select id="city" required value={form.city} onChange={(e) => update('city', e.target.value)}>
                  <option value="">Select city</option>
                  {SERVICE_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
              <div>
                <Label htmlFor="district">District</Label>
                <Select id="district" required value={form.district} onChange={(e) => update('district', e.target.value)}>
                  <option value="">Select district</option>
                  {TAMIL_NADU_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </Select>
              </div>
              <div>
                <Label htmlFor="pincode">Pincode</Label>
                <Input id="pincode" required value={form.pincode} onChange={(e) => update('pincode', e.target.value)} placeholder="600001" maxLength={6} pattern="[0-9]{6}" />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Description / Notes</Label>
              <Textarea id="notes" rows={3} value={form.customer_notes} onChange={(e) => update('customer_notes', e.target.value)} placeholder="Describe the issue or service needed..." />
            </div>

            <div>
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input id="amount" type="number" required value={form.amount} onChange={(e) => update('amount', e.target.value)} min="0" />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? 'Creating booking...' : 'Create Booking'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/customer/bookings')}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
