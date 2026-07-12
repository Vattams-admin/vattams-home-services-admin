import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile, Booking } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { createNotification, createAuditLog } from '@/lib/notifications'
import { cn, formatDate, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { LoadingScreen } from '@/components/LoadingScreen'
import { Search, Eye, Ban, Power } from 'lucide-react'

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
      if (mounted) { setCustomers((data || []) as Profile[]); setLoading(false) }
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
    setCustBookings((data || []) as Booking[])
  }

  const toggleStatus = async (c: Profile) => {
    setActionLoading(true)
    const newStatus = c.status === 'active' ? 'suspended' : 'active'
    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', c.id)
    if (error) { toast('Failed to update status', 'error'); setActionLoading(false); return }
    await createNotification(c.id, newStatus === 'suspended' ? 'Account Suspended' : 'Account Activated', newStatus === 'suspended' ? 'Your account has been suspended.' : 'Your account has been reactivated.', newStatus === 'suspended' ? 'warning' : 'success')
    if (profile) await createAuditLog(profile.id, newStatus === 'suspended' ? 'suspend_customer' : 'activate_customer', 'profile', c.id, `${newStatus === 'suspended' ? 'Suspended' : 'Activated'} customer ${c.name}`)
    toast(`Customer ${newStatus === 'suspended' ? 'suspended' : 'activated'}`, 'success')
    setCustomers((cs) => cs.map((x) => x.id === c.id ? { ...x, status: newStatus } : x))
    if (viewCust?.id === c.id) setViewCust({ ...c, status: newStatus })
    setActionLoading(false)
  }

  if (loading) return <LoadingScreen message="Loading customers..." />

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Customers</h1><p className="text-gray-600">Manage customer accounts</p></div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input className="pl-10" placeholder="Search by name, email, or mobile..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? <p className="py-8 text-center text-gray-500 sm:col-span-3">No customers found.</p> : filtered.map((c) => (
          <Card key={c.id}><CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-900">{c.name}</p>
                <Badge color={c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>{c.status || 'active'}</Badge>
              </div>
              <p className="text-sm text-gray-500">{c.email}</p>
              <p className="text-sm text-gray-500">{c.mobile}</p>
              <p className="text-sm text-gray-500">{c.city || 'N/A'}</p>
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={() => viewDetails(c)}><Eye className="mr-1 h-4 w-4" />Details</Button>
                <Button size="sm" variant={c.status === 'active' ? 'danger' : 'primary'} onClick={() => toggleStatus(c)} disabled={actionLoading}>
                  {c.status === 'active' ? <><Ban className="mr-1 h-4 w-4" />Suspend</> : <><Power className="mr-1 h-4 w-4" />Activate</>}
                </Button>
              </div>
            </div>
          </CardContent></Card>
        ))}
      </div>

      <Modal open={!!viewCust} onClose={() => setViewCust(null)} title="Customer Details" className="max-w-2xl">
        {viewCust && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><Label>Name</Label><p className="font-medium">{viewCust.name}</p></div>
              <div><Label>Email</Label><p className="font-medium">{viewCust.email}</p></div>
              <div><Label>Mobile</Label><p className="font-medium">{viewCust.mobile}</p></div>
              <div><Label>City</Label><p className="font-medium">{viewCust.city || 'N/A'}</p></div>
              <div><Label>District</Label><p className="font-medium">{viewCust.district || 'N/A'}</p></div>
              <div><Label>Status</Label><Badge color={viewCust.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>{viewCust.status || 'active'}</Badge></div>
              {viewCust.address && <div className="col-span-2"><Label>Address</Label><p className="font-medium">{viewCust.address}</p></div>}
            </div>
            <div>
              <h4 className="mb-2 font-medium text-gray-900">Booking History ({custBookings.length})</h4>
              {custBookings.length === 0 ? <p className="text-sm text-gray-500">No bookings yet.</p> : (
                <div className="max-h-60 space-y-2 overflow-y-auto">
                  {custBookings.map((b) => (
                    <div key={b.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-2 text-sm">
                      <div><p className="font-medium">{b.service_name}</p><p className="text-xs text-gray-500">#{b.booking_number} · {formatDate(b.scheduled_date)}</p></div>
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
