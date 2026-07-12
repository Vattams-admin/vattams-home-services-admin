import { useEffect, useState, useMemo } from 'react'
import { Loader as Loader2, Eye, Search, Ban, CircleCheck as CheckCircle, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Profile, Booking } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import {
  cn, formatDate, formatDateTime, formatCurrency, BOOKING_STATUS_COLORS, BOOKING_STATUS_FLOW,
} from '@/lib/utils'

export function AdminCustomersPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState<Profile[]>([])
  const [search, setSearch] = useState('')
  const [viewCustomer, setViewCustomer] = useState<Profile | null>(null)
  const [custBookings, setCustBookings] = useState<Booking[]>([])
  const [actioning, setActioning] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'customer')
        .order('created_at', { ascending: false })
      if (!mounted) return
      setCustomers((data ?? []) as Profile[])
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return customers
    return customers.filter((c) =>
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.mobile?.toLowerCase().includes(q),
    )
  }, [customers, search])

  const openView = async (c: Profile) => {
    setViewCustomer(c)
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .eq('customer_id', c.id)
      .order('created_at', { ascending: false })
    setCustBookings((data ?? []) as Booking[])
  }

  const toggleStatus = async (c: Profile) => {
    setActioning(true)
    try {
      const next = c.status === 'suspended' ? 'active' : 'suspended'
      const { error } = await supabase.from('profiles').update({ status: next }).eq('id', c.id)
      if (error) throw error
      setCustomers((prev) => prev.map((x) => x.id === c.id ? { ...x, status: next } : x))
      toast({ title: next === 'suspended' ? 'Customer suspended' : 'Customer activated', variant: 'success' })
    } catch (err) {
      toast({ title: 'Update failed', description: (err as Error).message, variant: 'error' })
    } finally {
      setActioning(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <p className="text-sm text-gray-500">Manage customer accounts and view booking history.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          className="pl-10"
          placeholder="Search by name, email, or mobile..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-500">No customers found.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map((c) => (
                <div key={c.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{c.name}</p>
                      <Badge variant={c.status === 'active' ? 'success' : 'error'} className="capitalize">
                        {c.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">{c.email} · {c.mobile}</p>
                    <p className="text-xs text-gray-400">{c.city ?? '-'} · Joined {formatDate(c.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => openView(c)}>
                      <Eye className="mr-1 h-4 w-4" /> View
                    </Button>
                    <Button
                      variant={c.status === 'suspended' ? 'success' : 'destructive'}
                      size="sm"
                      onClick={() => toggleStatus(c)}
                      disabled={actioning}
                    >
                      {c.status === 'suspended' ? (
                        <><CheckCircle className="mr-1 h-4 w-4" /> Activate</>
                      ) : (
                        <><Ban className="mr-1 h-4 w-4" /> Suspend</>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={!!viewCustomer} onClose={() => { setViewCustomer(null); setCustBookings([]) }} title="Customer Details" className="max-w-2xl">
        {viewCustomer && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="font-medium text-gray-500">Name:</span> {viewCustomer.name}</div>
              <div><span className="font-medium text-gray-500">Email:</span> {viewCustomer.email}</div>
              <div><span className="font-medium text-gray-500">Mobile:</span> {viewCustomer.mobile}</div>
              <div><span className="font-medium text-gray-500">City:</span> {viewCustomer.city ?? '-'}</div>
              <div><span className="font-medium text-gray-500">District:</span> {viewCustomer.district ?? '-'}</div>
              <div><span className="font-medium text-gray-500">Status:</span> <Badge variant={viewCustomer.status === 'active' ? 'success' : 'error'} className="capitalize">{viewCustomer.status}</Badge></div>
              <div><span className="font-medium text-gray-500">Address:</span> {viewCustomer.address ?? '-'}</div>
              <div><span className="font-medium text-gray-500">Joined:</span> {formatDateTime(viewCustomer.created_at)}</div>
            </div>
            <div>
              <span className="font-medium text-gray-500">Booking History ({custBookings.length})</span>
              {custBookings.length === 0 ? (
                <p className="mt-1 text-gray-400">No bookings yet.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {custBookings.map((b) => (
                    <div key={b.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                      <div>
                        <p className="font-medium text-gray-900">{b.service_name}</p>
                        <p className="text-xs text-gray-500">{b.booking_number} · {formatDate(b.scheduled_date)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{formatCurrency(b.amount)}</span>
                        <Badge className={BOOKING_STATUS_COLORS[b.status]}>{BOOKING_STATUS_FLOW[b.status] ?? b.status}</Badge>
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
