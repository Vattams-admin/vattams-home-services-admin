import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader as Loader2 } from 'lucide-react'
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
import { createNotification, createAuditLog } from '@/lib/notifications'

export function BookingPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    service_name: '', scheduled_date: '', scheduled_time: '',
    address: '', city: '', district: '', pincode: '', customer_notes: '', amount: '',
  })

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!profile) return
    const amount = parseFloat(form.amount)
    if (isNaN(amount) || amount <= 0) { toast('Please enter a valid amount', 'error'); return }
    setLoading(true)
    const bookingNumber = `BK${Date.now().toString().slice(-8)}`
    const { data, error } = await supabase.from('bookings').insert({
      booking_number: bookingNumber, customer_id: profile.id, service_name: sanitizeInput(form.service_name),
      status: 'created', scheduled_date: form.scheduled_date, scheduled_time: form.scheduled_time || null,
      address: sanitizeInput(form.address), city: sanitizeInput(form.city), district: form.district,
      pincode: sanitizeInput(form.pincode), customer_notes: sanitizeInput(form.customer_notes) || null, amount,
    }).select().single()
    setLoading(false)
    if (error) { toast(error.message, 'error'); return }
    toast('Booking created successfully!', 'success')
    await createNotification(profile.id, 'Booking Created', `Your booking ${bookingNumber} for ${form.service_name} has been created.`, 'booking')
    await createAuditLog(profile.id, 'booking_created', 'booking', data?.id || null, `Created booking ${bookingNumber}`)
    navigate('/customer/bookings')
  }

  if (!profile) return <LoadingScreen message="Loading..." />

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Book a Service</h1>
      <Card>
        <CardHeader><CardTitle>Service Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label htmlFor="service_name">Service Name *</Label><Input id="service_name" required value={form.service_name} onChange={(e) => set('service_name', e.target.value)} placeholder="e.g. AC Repair, Plumbing, Electrical" /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label htmlFor="scheduled_date">Scheduled Date *</Label><Input id="scheduled_date" type="date" required value={form.scheduled_date} onChange={(e) => set('scheduled_date', e.target.value)} /></div>
              <div><Label htmlFor="scheduled_time">Scheduled Time</Label><Input id="scheduled_time" type="time" value={form.scheduled_time} onChange={(e) => set('scheduled_time', e.target.value)} /></div>
            </div>
            <div><Label htmlFor="address">Address *</Label><Textarea id="address" required value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Complete address" rows={2} /></div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div><Label htmlFor="city">City *</Label><Select id="city" required value={form.city} onChange={(e) => set('city', e.target.value)}><option value="">Select city</option>{SERVICE_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}</Select></div>
              <div><Label htmlFor="district">District *</Label><Select id="district" required value={form.district} onChange={(e) => set('district', e.target.value)}><option value="">Select district</option>{TAMIL_NADU_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}</Select></div>
              <div><Label htmlFor="pincode">Pincode *</Label><Input id="pincode" required pattern="[0-9]{6}" value={form.pincode} onChange={(e) => set('pincode', e.target.value)} placeholder="6-digit pincode" /></div>
            </div>
            <div><Label htmlFor="customer_notes">Notes</Label><Textarea id="customer_notes" value={form.customer_notes} onChange={(e) => set('customer_notes', e.target.value)} placeholder="Describe the issue or any specific requirements" rows={3} /></div>
            <div><Label htmlFor="amount">Amount (₹) *</Label><Input id="amount" type="number" required min="1" step="1" value={form.amount} onChange={(e) => set('amount', e.target.value)} placeholder="Service amount" /></div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating booking...</> : 'Create Booking'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
