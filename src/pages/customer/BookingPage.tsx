import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wrench, MapPin, Calendar, Clock, FileText, Loader as Loader2, Check, ChevronRight, ChevronLeft, IndianRupee } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { cn, formatCurrency } from '@/lib/utils'
import { SERVICE_CATEGORIES, SERVICE_CITIES, TAMIL_NADU_DISTRICTS } from '@/lib/constants'

const STEPS = ['Service', 'Details', 'Schedule', 'Review']

const CATEGORY_BASE_PRICES: Record<string, number> = {
  'AC Service': 499,
  'Washing Machine': 399,
  Refrigerator: 399,
  Plumbing: 299,
  Electrical: 299,
  'General Repair': 249,
  CCTV: 599,
  'Pest Control': 699,
}

const TIME_SLOTS = [
  '08:00 AM - 10:00 AM',
  '10:00 AM - 12:00 PM',
  '12:00 PM - 02:00 PM',
  '02:00 PM - 04:00 PM',
  '04:00 PM - 06:00 PM',
  '06:00 PM - 08:00 PM',
]

export default function BookingPage() {
  const { profile, session } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const [category, setCategory] = useState('')
  const [serviceName, setServiceName] = useState('')
  const [address, setAddress] = useState(profile?.address || '')
  const [city, setCity] = useState(profile?.city || '')
  const [district, setDistrict] = useState(profile?.district || '')
  const [pincode, setPincode] = useState(profile?.pincode || '')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [notes, setNotes] = useState('')

  const userId = profile?.id || session?.user?.id
  const estimatedPrice = category ? CATEGORY_BASE_PRICES[category] || 299 : 0

  const today = new Date().toISOString().split('T')[0]

  const canProceed = (): boolean => {
    switch (step) {
      case 0:
        return !!category && !!serviceName
      case 1:
        return !!address && !!city && !!district && !!pincode && pincode.length === 6
      case 2:
        return !!scheduledDate && !!scheduledTime
      default:
        return true
    }
  }

  const handleNext = () => {
    if (!canProceed()) {
      toast.warning('Please fill in all required fields')
      return
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const handleBack = () => setStep((s) => Math.max(s - 1, 0))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!userId) {
      toast.error('Authentication required', 'Please log in to book a service.')
      return
    }

    setSubmitting(true)
    try {
      const bookingNumber = `VH${Date.now().toString().slice(-8)}`
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          booking_number: bookingNumber,
          customer_id: userId,
          service_name: serviceName,
          service_category_id: category,
          status: 'created',
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime,
          address,
          city,
          district,
          pincode,
          customer_notes: notes || null,
          amount: estimatedPrice,
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Booking created!', `Your booking ${bookingNumber} has been placed.`)
      navigate('/dashboard/bookings')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create booking.'
      toast.error('Booking failed', message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Book a Service</h1>
        <p className="mt-1 text-sm text-slate-500">Complete the steps below to book your home service.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
                  i < step && 'border-blue-600 bg-blue-600 text-white',
                  i === step && 'border-blue-600 bg-white text-blue-600',
                  i > step && 'border-slate-200 bg-white text-slate-400',
                )}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  'mt-1 hidden text-xs font-medium sm:block',
                  i <= step ? 'text-slate-900' : 'text-slate-400',
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('mx-2 h-0.5 flex-1', i < step ? 'bg-blue-600' : 'bg-slate-200')} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{STEPS[step]}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 0: Service Selection */}
            {step === 0 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="category">Service Category *</Label>
                  <Select
                    id="category"
                    value={category}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
                      setCategory(e.target.value)
                      setServiceName('')
                    }}
                  >
                    <option value="">Select a category</option>
                    {SERVICE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat} (from {formatCurrency(CATEGORY_BASE_PRICES[cat] || 299)})
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serviceName">Service Name / Description *</Label>
                  <Input
                    id="serviceName"
                    placeholder="e.g., AC Not cooling, Washing machine drum noise..."
                    value={serviceName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setServiceName(e.target.value)}
                  />
                </div>
                {category && (
                  <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-3">
                    <IndianRupee className="h-5 w-5 text-blue-600" />
                    <span className="text-sm text-blue-800">
                      Estimated starting price: <strong>{formatCurrency(estimatedPrice)}</strong>
                    </span>
                  </div>
                )}
              </>
            )}

            {/* Step 1: Address Details */}
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address *</Label>
                  <Textarea
                    id="address"
                    placeholder="Door no, Street name, Area..."
                    value={address}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setAddress(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Select id="city" value={city} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setCity(e.target.value)}>
                      <option value="">Select city</option>
                      {SERVICE_CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="district">District *</Label>
                    <Select id="district" value={district} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setDistrict(e.target.value)}>
                      <option value="">Select district</option>
                      {TAMIL_NADU_DISTRICTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode *</Label>
                  <Input
                    id="pincode"
                    placeholder="6-digit pincode"
                    value={pincode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                  />
                </div>
              </>
            )}

            {/* Step 2: Schedule */}
            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="date">Preferred Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    min={today}
                    value={scheduledDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setScheduledDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preferred Time Slot *</Label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {TIME_SLOTS.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setScheduledTime(slot)}
                        className={cn(
                          'rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                          scheduledTime === slot
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                        )}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Describe the issue in detail..."
                    value={notes}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <>
                <div className="space-y-3">
                  <div className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Wrench className="h-4 w-4" /> Service
                    </div>
                    <p className="mt-1 font-semibold text-slate-900">{serviceName}</p>
                    <Badge className="mt-1">{category}</Badge>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <MapPin className="h-4 w-4" /> Address
                    </div>
                    <p className="mt-1 text-sm text-slate-700">{address}</p>
                    <p className="text-sm text-slate-700">
                      {city}, {district} - {pincode}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Calendar className="h-4 w-4" /> Schedule
                    </div>
                    <p className="mt-1 text-sm text-slate-700">
                      {scheduledDate} · {scheduledTime}
                    </p>
                  </div>
                  {notes && (
                    <div className="rounded-lg border border-slate-200 p-4">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <FileText className="h-4 w-4" /> Notes
                      </div>
                      <p className="mt-1 text-sm text-slate-700">{notes}</p>
                    </div>
                  )}
                  <div className="rounded-lg bg-blue-50 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-800">Estimated Price</span>
                      <span className="text-2xl font-bold text-blue-900">
                        {formatCurrency(estimatedPrice)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-blue-600">
                      Final price may vary based on actual work performed.
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="mt-4 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={step === 0 || submitting}
          >
            <ChevronLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={handleNext}>
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" /> Creating...
                </>
              ) : (
                <>
                  <Check className="mr-1 h-4 w-4" /> Confirm Booking
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
