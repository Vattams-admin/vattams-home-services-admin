import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { sanitizeInput } from '@/lib/utils'
import { createNotification, createAuditLog } from '@/lib/notifications'
import { TAMIL_NADU_DISTRICTS } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingScreen } from '@/components/LoadingScreen'
import type { FormEvent } from 'react'

export function BookingPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [form, setForm] = useState({
    service_name: '', scheduled_date: '', scheduled_time: '', address: '',
    city: '', district: '', pincode: '', customer_notes: '', amount: '',
  })

  useEffect(() => {
    if (profile) {
      setForm((f) => ({
        ...f,
        address: profile.address || '', city: profile.city || '',
        district: profile.district || '', pincode: profile.pincode || '',
      }))
    }
    setPageLoading(false)
  }, [profile])

  const handleChange = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!profile) return
    if (!form.service_name || !form.scheduled_date || !form.address || !form.city || !form.district || !form.pincode) {
      toast('Please fill all required fields', 'warning'); return
    }
    setLoading(true)
    const amount = parseFloat(form.amount) || 0
    const { data, error } = await supabase.from('bookings').insert({
      customer_id: profile.id, service_name: sanitizeInput(form.service_name),
      scheduled_date: form.scheduled_date, scheduled_time: form.scheduled_time || null,
      address: sanitizeInput(form.address), city: sanitizeInput(form.city),
      district: form.district, pincode: sanitizeInput(form.pincode),
      customer_notes: form.customer_notes ? sanitizeInput(form.customer_notes) : null,
      amount, status: 'created',
    }).select().single()
    if (error) { toast('Failed to create booking', 'error'); setLoading(false); return }
    await createNotification(profile.id, 'Booking Created', `Your booking #${data.booking_number} for ${data.service_name} has been created.`)
    await createAuditLog(profile.id, 'booking_created', 'booking', data.id, `Created booking #${data.booking_number}`)
    toast('Booking created successfully!', 'success')
    setLoading(false)
    navigate('/customer/bookings')
  }

  if (pageLoading) return <LoadingScreen message="Loading..." />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Book a Service</h1>
      <Card className="max-w-2xl">
        <CardHeader><CardTitle>Service Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Service Name *</Label>
              <Input value={form.service_name} onChange={(e) => handleChange('service_name', e.target.value)} placeholder="e.g. AC Repair, Plumbing, Electrical" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Scheduled Date *</Label>
                <Input type="date" value={form.scheduled_date} onChange={(e) => handleChange('scheduled_date', e.target.value)} required />
              </div>
              <div>
                <Label>Scheduled Time</Label>
                <Input type="time" value={form.scheduled_time} onChange={(e) => handleChange('scheduled_time', e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Address *</Label>
              <Textarea value={form.address} onChange={(e) => handleChange('address', e.target.value)} placeholder="Full address" rows={2} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>City *</Label>
                <Input value={form.city} onChange={(e) => handleChange('city', e.target.value)} placeholder="City" required />
              </div>
              <div>
                <Label>District *</Label>
                <Select value={form.district} onChange={(e) => handleChange('district', e.target.value)} required>
                  <option value="">Select District</option>
                  {TAMIL_NADU_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Pincode *</Label>
                <Input value={form.pincode} onChange={(e) => handleChange('pincode', e.target.value)} placeholder="6-digit pincode" maxLength={6} required />
              </div>
              <div>
                <Label>Amount (₹)</Label>
                <Input type="number" min="0" value={form.amount} onChange={(e) => handleChange('amount', e.target.value)} placeholder="0" />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.customer_notes} onChange={(e) => handleChange('customer_notes', e.target.value)} placeholder="Any special instructions..." rows={3} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating Booking...' : 'Create Booking'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
