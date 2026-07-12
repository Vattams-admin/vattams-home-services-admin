import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Wrench, User, Phone, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingScreen } from '@/components/LoadingScreen'
import { sanitizeInput } from '@/lib/utils'
import { TAMIL_NADU_DISTRICTS, SERVICE_CITIES } from '@/lib/constants'
import { trackEvent, createNotification } from '@/lib/notifications'
import type { FormEvent } from 'react'

export function BookingPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    service_name: '', scheduled_date: '', scheduled_time: '', address: '',
    city: '', district: '', pincode: '', customer_notes: '', amount: '',
  })

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setLoading(true)
    const bookingNumber = `VAT${Date.now().toString().slice(-8)}`
    const { data, error } = await supabase.from('bookings').insert({
      booking_number: bookingNumber, customer_id: profile.id, service_name: form.service_name,
      scheduled_date: form.scheduled_date, scheduled_time: form.scheduled_time || null,
      address: form.address, city: form.city, district: form.district, pincode: form.pincode,
      customer_notes: form.customer_notes || null, amount: parseFloat(form.amount) || 0, status: 'created',
    }).select().single()
    setLoading(false)
    if (error) { toast('Failed to create booking', 'error'); return }
    await trackEvent('booking_create', 'engagement', { service: form.service_name, amount: form.amount })
    await createNotification(profile.id, 'Booking Created', `Your booking #${bookingNumber} has been created successfully. We'll assign a technician soon.`, 'booking')
    toast('Booking created successfully!', 'success')
    navigate('/customer/bookings')
  }

  if (!profile) return <LoadingScreen />

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader><CardTitle>Book a Service</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="service_name">Service Name</Label>
              <Select id="service_name" required value={form.service_name} onChange={(e) => set('service_name', e.target.value)}>
                <option value="">Select a service</option>
                {SERVICE_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="scheduled_date">Scheduled Date</Label>
                <Input id="scheduled_date" type="date" required value={form.scheduled_date} onChange={(e) => set('scheduled_date', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="scheduled_time">Scheduled Time</Label>
                <Input id="scheduled_time" type="time" value={form.scheduled_time} onChange={(e) => set('scheduled_time', e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" rows={2} required value={form.address} onChange={(e) => set('address', sanitizeInput(e.target.value))} placeholder="Full address" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" required value={form.city} onChange={(e) => set('city', sanitizeInput(e.target.value))} placeholder="Your city" />
              </div>
              <div>
                <Label htmlFor="district">District</Label>
                <Select id="district" required value={form.district} onChange={(e) => set('district', e.target.value)}>
                  <option value="">Select district</option>
                  {TAMIL_NADU_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="pincode">Pincode</Label>
                <Input id="pincode" required value={form.pincode} onChange={(e) => set('pincode', e.target.value.replace(/[^0-9]/g, ''))} placeholder="6-digit pincode" maxLength={6} />
              </div>
              <div>
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input id="amount" type="number" required value={form.amount} onChange={(e) => set('amount', e.target.value)} placeholder="0" min="0" />
              </div>
            </div>
            <div>
              <Label htmlFor="customer_notes">Notes (optional)</Label>
              <Textarea id="customer_notes" rows={2} value={form.customer_notes} onChange={(e) => set('customer_notes', sanitizeInput(e.target.value))} placeholder="Any special instructions" />
            </div>
            <Button type="submit" disabled={loading} className="w-full">{loading ? 'Creating booking...' : 'Create Booking'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
