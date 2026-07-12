import { useEffect, useState } from 'react'
import { Search, Eye, Power } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Profile, Booking } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { createNotification, createAuditLog } from '@/lib/notifications'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { LoadingScreen } from '@/components/LoadingScreen'
import { formatDate, formatCurrency, BOOKING_STATUS_COLORS } from '@/lib/utils'

export function AdminCustomersPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState<Profile[]>([])
  const [search, setSearch] = useState('')
  const [viewCust, setViewCust] = useState<Profile | null>(null)
  const [custBookings, setCustBookings] = useState<Booking[]>([])
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.from('profiles').select('*').eq('role', 'customer').order('created_at', { ascending: false })
      if (mounted) { setCustomers((data as Profile[]) || []); setLoading(false) }
    })()
    return () => { mounted = false }
  }, [])

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase()
    return !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.mobile.includes(q)
  })

  const viewDetails = async (c: Profile) => {
    setViewCust(c)
    const { data } = await supabase.from('bookings').select('*').eq('customer_id', c.id).order('created_at', { ascending: false })
    setCustBookings((data as Booking[]) || [])
  }

  const toggleStatus = async (c: Profile) => {
    setActionLoading(true)
    const newStatus = c.status === 'suspended' ? 'active' : 'suspended'
    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', c.id)
    setActionLoading(false)
    if (error) { toast('Failed to update status', 'error'); return }
    await createNotification(c.id, 'Account Status Updated', `Your account has been ${newStatus === 'active' ? 'activated' : 'suspended'}.`, newStatus === 'active' ? 'success' : 'error')
    if (profile) await createAuditLog(profile.id, 'customer_status_toggle', 'profile', c.id, `Set ${c.name} to ${newStatus}`)
    setCustomers((prev) => prev.map((x) => x.id === c.id ? { ...x, status: newStatus } : x))
    toast(`Customer ${newStatus === 'active' ? 'activated' : 'suspended'}`, 'success')
  }

  if (loading) return <LoadingScreen message="Loading customers..." />

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Customers</h1>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input className="pl-10" placeholder="Search by name, email, or mobile..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="space-y-3">
        {filtered.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{c.name}</p>
                  <Badge color={c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>{c.status || 'active'}</Badge>
                </div>
                <p className="text-sm text-gray-500">{c.email} • {c.mobile}</p>
                <p className="text-sm text-gray-500">{c.city || 'N/A'}, {c.district || 'N/A'}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => viewDetails(c)}><Eye className="mr-1 h-3.5 w-3.5" /> View Details</Button>
                <Button size="sm" variant={c.status === 'suspended' ? 'primary' : 'danger'} onClick={() => toggleStatus(c)} disabled={actionLoading}>
                  <Power className="mr-1 h-3.5 w-3.5" /> {c.status === 'suspended' ? 'Activate' : 'Suspend'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="py-8 text-center text-gray-500">No customers found.</p>}
      </div>

      <Modal open={!!viewCust} onClose={() => setViewCust(null)} title="Customer Details" className="max-w-2xl">
        {viewCust && (
          <div className="space-y-4">
            <div className="space-y-1">
              <p><span className="font-medium">Name:</span> {viewCust.name}</p>
              <p><span className="font-medium">Email:</span> {viewCust.email}</p>
              <p><span className="font-medium">Mobile:</span> {viewCust.mobile}</p>
              <p><span className="font-medium">City:</span> {viewCust.city || 'N/A'}</p>
              <p><span className="font-medium">District:</span> {viewCust.district || 'N/A'}</p>
              <p><span className="font-medium">Address:</span> {viewCust.address || 'N/A'}</p>
            </div>
            <div>
              <p className="mb-2 font-medium text-gray-900">Booking History ({custBookings.length})</p>
              {custBookings.length === 0 ? <p className="text-sm text-gray-500">No bookings yet.</p> : (
                <div className="space-y-2">
                  {custBookings.map((b) => (
                    <div key={b.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{b.service_name}</p>
                        <p className="text-xs text-gray-500">#{b.booking_number} • {formatDate(b.scheduled_date)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{formatCurrency(b.amount)}</span>
                        <Badge color={BOOKING_STATUS_COLORS[b.status]}>{b.status.replace(/_/g, ' ')}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
