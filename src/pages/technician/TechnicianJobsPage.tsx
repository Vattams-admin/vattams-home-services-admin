import { useEffect, useRef, useState } from 'react'
import { Calendar, Camera, Loader2, MapPin, Upload } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Booking, BookingStatus, Profile } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { createNotification } from '@/lib/notifications'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { BOOKING_STATUS_COLORS, BOOKING_STATUS_FLOW, formatCurrency, formatDate } from '@/lib/utils'

type Tab = 'all' | 'pending' | 'active' | 'completed' | 'cancelled'
const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]
const ACTIVE_STATUSES: BookingStatus[] = ['accepted', 'on_the_way', 'work_started']

export function TechnicianJobsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [customers, setCustomers] = useState<Record<string, Profile>>({})
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('all')
  const [busy, setBusy] = useState<string | null>(null)
  const [photoBooking, setPhotoBooking] = useState<Booking | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!profile?.id) return
    let mounted = true
    ;(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('technician_id', profile.id)
        .order('created_at', { ascending: false })
      if (!mounted) return
      const all = (data ?? []) as Booking[]
      setBookings(all)
      const cIds = [...new Set(all.map((b) => b.customer_id))]
      if (cIds.length) {
        const { data: cd } = await supabase.from('profiles').select('*').in('id', cIds)
        const map: Record<string, Profile> = {}
        ;(cd ?? []).forEach((c) => { map[c.id] = c as Profile })
        if (mounted) setCustomers(map)
      }
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [profile?.id])

  const updateStatus = async (b: Booking, status: BookingStatus, label: string) => {
    setBusy(b.id)
    try {
      const { error } = await supabase.from('bookings').update({ status }).eq('id', b.id)
      if (error) throw error
      setBookings((prev) => prev.map((x) => (x.id === b.id ? { ...x, status } : x)))
      await createNotification(
        b.customer_id, 'Booking Update', `Your booking ${b.booking_number} is now: ${label}.`,
        'booking_update', b.id,
      )
      toast({ title: `Job ${label}`, variant: 'success' })
    } catch (err) {
      toast({ title: 'Update failed', description: (err as Error).message, variant: 'error' })
    } finally {
      setBusy(null)
    }
  }

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length || !photoBooking) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop()
        const path = `${photoBooking.id}/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('booking-photos').upload(path, file)
        let url = path
        if (upErr) {
          url = file.name
        } else {
          const { data: pub } = supabase.storage.from('booking-photos').getPublicUrl(path)
          url = pub.publicUrl
        }
        await supabase.from('booking_photos').insert({
          booking_id: photoBooking.id,
          photo_url: url,
          photo_type: 'after',
        })
      }
      toast({ title: 'Photos uploaded', variant: 'success' })
      setPhotoBooking(null)
      if (fileRef.current) fileRef.current.value = ''
    } catch (err) {
      toast({ title: 'Upload failed', description: (err as Error).message, variant: 'error' })
    } finally {
      setUploading(false)
    }
  }

  const filtered = bookings.filter((b) => {
    if (tab === 'pending') return b.status === 'assigned'
    if (tab === 'active') return ACTIVE_STATUSES.includes(b.status)
    if (tab === 'completed') return b.status === 'completed'
    if (tab === 'cancelled') return b.status === 'cancelled' || b.status === 'rejected'
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <Button key={t.key} variant={tab === t.key ? 'default' : 'outline'} size="sm" onClick={() => setTab(t.key)}>
            {t.label}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <Calendar className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-500">No jobs in this category.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => {
            const cust = customers[b.customer_id]
            return (
              <Card key={b.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{b.service_name}</p>
                        <Badge className={BOOKING_STATUS_COLORS[b.status]}>
                          {BOOKING_STATUS_FLOW[b.status] ?? b.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">{b.booking_number}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatDate(b.scheduled_date)} {b.scheduled_time ?? ''}</span>
                        {b.city && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {b.city}</span>}
                        {cust && <span>Customer: {cust.name}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-start gap-2 sm:items-end">
                      <span className="text-lg font-bold text-gray-900">{formatCurrency(b.amount)}</span>
                      <div className="flex flex-wrap gap-2">
                        {b.status === 'assigned' && (
                          <>
                            <Button size="sm" disabled={busy === b.id} onClick={() => updateStatus(b, 'accepted', 'Accepted')}>Accept</Button>
                            <Button size="sm" variant="destructive" disabled={busy === b.id} onClick={() => updateStatus(b, 'rejected', 'Rejected')}>Reject</Button>
                          </>
                        )}
                        {b.status === 'accepted' && (
                          <Button size="sm" disabled={busy === b.id} onClick={() => updateStatus(b, 'on_the_way', 'On The Way')}>Start Job</Button>
                        )}
                        {b.status === 'on_the_way' && (
                          <Button size="sm" disabled={busy === b.id} onClick={() => updateStatus(b, 'work_started', 'Work Started')}>Start Work</Button>
                        )}
                        {b.status === 'work_started' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => setPhotoBooking(b)}>
                              <Camera className="mr-1 h-3.5 w-3.5" /> Upload Photos
                            </Button>
                            <Button size="sm" variant="success" disabled={busy === b.id} onClick={() => updateStatus(b, 'completed', 'Completed')}>Complete</Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={!!photoBooking} onClose={() => setPhotoBooking(null)} title="Upload Job Photos">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Upload before/after photos for booking {photoBooking?.booking_number}.
          </p>
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
            <Upload className="mx-auto mb-2 h-8 w-8 text-gray-400" />
            <input ref={fileRef} type="file" multiple accept="image/*" onChange={(e) => handleUpload(e.target.files)} className="hidden" id="photo-input" />
            <label htmlFor="photo-input" className="cursor-pointer text-sm font-medium text-blue-600 hover:underline">
              Click to select photos
            </label>
          </div>
          <Button className="w-full" disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {uploading ? 'Uploading...' : 'Select & Upload'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
