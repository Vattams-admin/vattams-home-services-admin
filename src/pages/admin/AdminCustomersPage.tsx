import { useEffect, useState } from 'react'
import { Eye, Search, Ban, CheckCircle } from 'lucide-react'
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

type CustomerWithBookings = Profile & { bookings: Booking[] }

export function AdminCustomersPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState<Profile[]>([])
  const [search, setSearch] = useState('')
  const [viewCustomer, setViewCustomer] = useState<CustomerWithBookings | null>(null)
  const [customerBookings, setCustomerBookings] = useState<Booking[]>([])
  const [actioning, setActioning] = useState(false)

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.from('profiles').select('*').eq('role', 'customer').order('created_at', { ascending: false })
      if (!mounted) return
      setCustomers((data || []) as Profile[])
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  const filtered = customers.filter((c) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.mobile || '').includes(q)
  })

  const viewDetails = async (c: Profile) => {
    setViewCustomer(c as CustomerWithBookings)
    setCustomerBookings([])
    const { data } = await supabase.from('bookings').select('*').eq('customer_id', c.id).order('created_at', { ascending: false })
    setCustomerBookings((data || []) as Booking[])
  }

  const toggleStatus = async (c: Profile) => {
    const newStatus = c.status === 'suspended' ? 'active' : 'suspended'
    setActioning(true)
    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', c.id)
    setActioning(false)
    if (error) { toast('Failed to update status', 'error'); return }
    await createNotification(c.id, newStatus === 'suspended' ? 'Account Suspended' : 'Account Activated', newStatus === 'suspended' ? 'Your account has been suspended.' : 'Your account has been reactivated.', newStatus === 'suspended' ? 'error' : 'success')
    if (profile) await createAuditLog(profile.id, newStatus === 'suspended' ? 'suspend_customer' : 'activate_customer', 'profile', c.id, `${newStatus === 'suspended' ? 'Suspended' : 'Activated'} customer ${c.name}`)
    toast(`Customer ${newStatus === 'suspended' ? 'suspended' : 'activated'}`, 'success')
    setCustomers((prev) => prev.map((x) => x.id === c.id ? { ...x, status: newStatus } : x))
    if (viewCustomer?.id === c.id) setViewCustomer({ ...viewCustomer, status: newStatus })
  }

  if (loading) return <LoadingScreen message="Loading customers..." />

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Customers</h1><p className="text-sm text-gray-500">Manage customer accounts</p></div>

      <div className="relative max-w-md">
    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
    <Input className="pl-9" placeholder="Search by name, email, or mobile..." value={search} onChange={(e) => setSearch(e.target.value)} />
  </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><p className="text-gray-500">No customers found.</p></CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-gray-900">{c.name}</p>
                      <Badge color={c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>{c.status || 'active'}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{c.email}</p>
                    <p className="text-sm text-gray-500">{c.mobile || '-'}</p>
                    <p className="text-xs text-gray-400">{c.city || '-'}</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => viewDetails(c)}><Eye className="mr-1 h-4 w-4" />View</Button>
                  <Button size="sm" variant={c.status === 'suspended' ? 'primary' : 'danger'} onClick={() => toggleStatus(c)} disabled={actioning}>
                    {c.status === 'suspended' ? <><CheckCircle className="mr-1 h-4 w-4" />Activate</> : <><Ban className="mr-1 h-4 w-4" />Suspend</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!viewCustomer} onClose={() => setViewCustomer(null)} title="Customer Details">
        {viewCustomer && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-gray-500">Name</p><p className="font-medium">{viewCustomer.name}</p></div>
              <div><p className="text-gray-500">Email</p><p className="font-medium">{viewCustomer.email}</p></div>
              <div><p className="text-gray-500">Mobile</p><p className="font-medium">{viewCustomer.mobile || '-'}</p></div>
              <div><p className="text-gray-500">City</p><p className="font-medium">{viewCustomer.city || '-'}</p></div>
              <div><p className="text-gray-500">District</p><p className="font-medium">{viewCustomer.district || '-'}</p></div>
              <div><p className="text-gray-500">Status</p><Badge color={viewCustomer.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>{viewCustomer.status || 'active'}</Badge></div>
              {viewCustomer.address && <div className="col-span-2"><p className="text-gray-500">Address</p><p className="font-medium">{viewCustomer.address}</p></div>}
            </div>
            <div className="border-t pt-4">
              <p className="mb-2 font-medium text-gray-900">Booking History ({customerBookings.length})</p>
              {customerBookings.length === 0 ? (
                <p className="text-sm text-gray-500">No bookings yet.</p>
              ) : (
                <div className="max-h-60 space-y-2 overflow-y-auto">
                  {customerBookings.map((b) => (
                    <div key={b.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-2 text-sm">
                      <div><span className="font-mono text-xs text-gray-400">#{b.booking_number}</span> {b.service_name} <Badge color={BOOKING_STATUS_COLORS[b.status]}>{b.status.replace(/_/g, ' ')}</Badge></div>
                      <span className="font-medium">{formatCurrency(b.amount)}</span>
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
