import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile, Booking } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { createNotification, createAuditLog } from '@/lib/notifications'
import { cn, formatDate, formatCurrency, BOOKING_STATUS_COLORS } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { LoadingScreen } from '@/components/LoadingScreen'
import { Search, Eye, Ban, CircleCheck as CheckCircle } from 'lucide-react'

export function AdminCustomersPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState<Profile[]>([])
  const [search, setSearch] = useState('')
  const [viewCustomer, setViewCustomer] = useState<Profile | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.from('profiles').select('*').eq('role', 'customer').order('created_at', { ascending: false })
      if (mounted) { setCustomers((data || []) as Profile[]); setLoading(false) }
    })()
    return () => { mounted = false }
  }, [])

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase()
    return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.mobile || '').includes(q)
  })

  const viewDetails = async (c: Profile) => {
    setViewCustomer(c)
    const { data } = await supabase.from('bookings').select('*').eq('customer_id', c.id).order('created_at', { ascending: false })
    setBookings((data || []) as Booking[])
  }

  const toggleStatus = async (c: Profile) => {
    const newStatus = c.status === 'active' ? 'suspended' : 'active'
    await supabase.from('profiles').update({ status: newStatus }).eq('id', c.id)
    await createNotification(c.id, newStatus === 'suspended' ? 'Account Suspended' : 'Account Activated', newStatus === 'suspended' ? 'Your account has been suspended.' : 'Your account has been activated.', newStatus === 'suspended' ? 'error' : 'success')
    await createAuditLog(profile?.id || '', `${newStatus}_customer`, 'profile', c.id, `${newStatus} customer ${c.name}`)
    toast(`Customer ${newStatus}`, 'success')
    setCustomers((cs) => cs.map((x) => x.id === c.id ? { ...x, status: newStatus } : x))
  }

  if (loading) return <LoadingScreen message="Loading customers..." />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <Input className="pl-9" placeholder="Search by name, email, or mobile..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardHeader><CardTitle>Customers ({filtered.length})</CardTitle></CardHeader>
        <CardContent>
          {filtered.length === 0 ? <p className="text-gray-500 text-sm">No customers found.</p> : (
            <div className="space-y-2">
              {filtered.map((c) => (
                <div key={c.id} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{c.name}</p>
                    <p className="text-sm text-gray-500">{c.email} · {c.mobile}</p>
                    <p className="text-xs text-gray-400">City: {c.city || '-'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color={c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>{c.status || 'active'}</Badge>
                    <Button size="sm" variant="outline" onClick={() => viewDetails(c)}><Eye className="h-4 w-4" /></Button>
                    <Button size="sm" variant={c.status === 'active' ? 'danger' : 'primary'} onClick={() => toggleStatus(c)}>
                      {c.status === 'active' ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={!!viewCustomer} onClose={() => setViewCustomer(null)} title="Customer Details">
        {viewCustomer && (
          <div className="space-y-3">
            <div className="space-y-1.5 text-sm">
              <p><span className="font-medium">Name:</span> {viewCustomer.name}</p>
              <p><span className="font-medium">Email:</span> {viewCustomer.email}</p>
              <p><span className="font-medium">Mobile:</span> {viewCustomer.mobile}</p>
              <p><span className="font-medium">City:</span> {viewCustomer.city || '-'}</p>
              <p><span className="font-medium">Address:</span> {viewCustomer.address || '-'}</p>
              <p><span className="font-medium">Status:</span> <Badge color={viewCustomer.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>{viewCustomer.status}</Badge></p>
            </div>
            <div>
              <p className="mb-2 font-medium text-sm">Booking History ({bookings.length})</p>
              {bookings.length === 0 ? <p className="text-gray-500 text-sm">No bookings.</p> : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {bookings.map((b) => (
                    <div key={b.id} className="flex items-center justify-between rounded border p-2 text-sm">
                      <div><p className="font-medium">{b.booking_number}</p><p className="text-xs text-gray-500">{b.service_name} · {formatDate(b.scheduled_date)}</p></div>
                      <div className="flex items-center gap-2"><span className="text-xs">{formatCurrency(b.amount)}</span><Badge color={BOOKING_STATUS_COLORS[b.status]}>{b.status}</Badge></div>
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
