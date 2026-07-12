import { useEffect, useState, useCallback } from 'react'
import { Users, Eye, Loader as Loader2, Search, Phone, Mail, MapPin, CalendarCheck, IndianRupee, X, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input, Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/ui/modal'
import { useAuth } from '@/lib/auth'
import {
  supabase,
  type Profile,
  type Booking,
  type Invoice,
  type CustomerNote,
} from '@/lib/supabase'
import { cn, formatDate, formatCurrency, BOOKING_STATUS_COLORS } from '@/lib/utils'
import { createAuditLog } from '@/lib/notifications'
import { useToast } from '@/hooks/use-toast'

type CustomerWithStats = Profile & {
  bookingCount?: number
  totalSpent?: number
}

export default function AdminCustomersPage() {
  const { profile } = useAuth()
  const toast = useToast()

  const [customers, setCustomers] = useState<CustomerWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerWithStats | null>(null)
  const [customerBookings, setCustomerBookings] = useState<Booking[]>([])
  const [customerInvoices, setCustomerInvoices] = useState<Invoice[]>([])
  const [customerNotes, setCustomerNotes] = useState<CustomerNote[]>([])
  const [modalLoading, setModalLoading] = useState(false)

  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [noteLoading, setNoteLoading] = useState(false)

  const loadCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'customer')
        .order('created_at', { ascending: false })

      if (error) throw error

      let result = (data as Profile[]) || []

      // Fetch booking counts and spending
      const { data: stats } = await supabase
        .from('bookings')
        .select('customer_id, amount, status')

      const { data: invoiceStats } = await supabase
        .from('invoices')
        .select('customer_id, amount, status')
        .eq('status', 'paid')

      const bookingMap = new Map<string, { count: number; spent: number }>()
      ;(stats || []).forEach((b: { customer_id: string; amount: number }) => {
        const cur = bookingMap.get(b.customer_id) || { count: 0, spent: 0 }
        cur.count += 1
        bookingMap.set(b.customer_id, cur)
      })
      ;(invoiceStats || []).forEach(
        (inv: { customer_id: string; amount: number }) => {
          const cur = bookingMap.get(inv.customer_id) || { count: 0, spent: 0 }
          cur.spent += Number(inv.amount)
          bookingMap.set(inv.customer_id, cur)
        },
      )

      result = result.map((c) => ({
        ...c,
        bookingCount: bookingMap.get(c.id)?.count || 0,
        totalSpent: bookingMap.get(c.id)?.spent || 0,
      }))

      if (search.trim()) {
        const q = search.toLowerCase()
        result = result.filter(
          (c) =>
            c.name?.toLowerCase().includes(q) ||
            c.mobile?.includes(q) ||
            c.email?.toLowerCase().includes(q) ||
            c.city?.toLowerCase().includes(q),
        )
      }

      setCustomers(result)
    } catch {
      toast.error('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }, [search, toast])

  useEffect(() => {
    loadCustomers()
  }, [loadCustomers])

  async function viewCustomer(customer: CustomerWithStats) {
    setSelectedCustomer(customer)
    setModalLoading(true)
    try {
      const [bookingsRes, invoicesRes, notesRes] = await Promise.all([
        supabase
          .from('bookings')
          .select('*')
          .eq('customer_id', customer.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('invoices')
          .select('*')
          .eq('customer_id', customer.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('customer_notes')
          .select('*')
          .eq('customer_id', customer.id)
          .order('created_at', { ascending: false }),
      ])

      setCustomerBookings((bookingsRes.data as Booking[]) || [])
      setCustomerInvoices((invoicesRes.data as Invoice[]) || [])
      setCustomerNotes((notesRes.data as CustomerNote[]) || [])
    } catch {
      toast.error('Failed to load customer details')
    } finally {
      setModalLoading(false)
    }
  }

  async function addNote() {
    if (!selectedCustomer || !noteText.trim()) {
      toast.warning('Please enter a note')
      return
    }
    setNoteLoading(true)
    try {
      const { error } = await supabase.from('customer_notes').insert({
        customer_id: selectedCustomer.id,
        admin_id: profile?.id || '',
        note: noteText.trim(),
      })
      if (error) throw error

      await createAuditLog(
        profile?.id || '',
        'add_customer_note',
        'customer',
        selectedCustomer.id,
        `Added note for ${selectedCustomer.name}`,
      )

      toast.success('Note added successfully')
      setNoteText('')
      setNoteModalOpen(false)

      // Refresh notes
      const { data } = await supabase
        .from('customer_notes')
        .select('*')
        .eq('customer_id', selectedCustomer.id)
        .order('created_at', { ascending: false })
      setCustomerNotes((data as CustomerNote[]) || [])
    } catch {
      toast.error('Failed to add note')
    } finally {
      setNoteLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
        <p className="mt-1 text-sm text-slate-500">
          View and manage customer accounts
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search by name, mobile, email, city..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Customers Table */}
      {customers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-12 w-12 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-500">
              No customers found
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Bookings
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Total Spent
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Joined
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {customer.name}
                        </div>
                        {customer.full_name && (
                          <div className="text-xs text-slate-500">
                            {customer.full_name}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-700">{customer.mobile}</div>
                        <div className="text-xs text-slate-500">
                          {customer.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {customer.city || 'N/A'}
                        {customer.district ? `, ${customer.district}` : ''}
                      </td>
                      <td className="px-4 py-3">
                        <Badge color="blue">
                          {customer.bookingCount || 0}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {formatCurrency(customer.totalSpent || 0)}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatDate(customer.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewCustomer(customer)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <Modal
          title="Customer Details"
          onClose={() => setSelectedCustomer(null)}
          className="max-w-3xl"
        >
          {modalLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="space-y-5">
              {/* Profile Header */}
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
                  <Users className="h-8 w-8 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {selectedCustomer.name}
                  </h3>
                  <div className="mt-1 flex flex-wrap gap-3 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      {selectedCustomer.mobile}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      {selectedCustomer.email}
                    </span>
                    {selectedCustomer.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {selectedCustomer.city}
                        {selectedCustomer.district
                          ? `, ${selectedCustomer.district}`
                          : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-200 p-3 text-center">
                  <CalendarCheck className="mx-auto h-5 w-5 text-blue-600" />
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {selectedCustomer.bookingCount || 0}
                  </p>
                  <p className="text-xs text-slate-500">Total Bookings</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3 text-center">
                  <IndianRupee className="mx-auto h-5 w-5 text-green-600" />
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {formatCurrency(selectedCustomer.totalSpent || 0)}
                  </p>
                  <p className="text-xs text-slate-500">Total Spent</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3 text-center">
                  <CalendarCheck className="mx-auto h-5 w-5 text-amber-600" />
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {customerBookings.filter(
                      (b) => b.status === 'completed',
                    ).length}
                  </p>
                  <p className="text-xs text-slate-500">Completed</p>
                </div>
              </div>

              {/* Address */}
              {selectedCustomer.address && (
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Address
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {selectedCustomer.address}
                    {selectedCustomer.pincode && ` - ${selectedCustomer.pincode}`}
                  </p>
                </div>
              )}

              {/* Booking History */}
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-700">
                    Booking History
                  </p>
                  <Badge color="gray">{customerBookings.length} total</Badge>
                </div>
                {customerBookings.length === 0 ? (
                  <div className="mt-2 flex items-center justify-center rounded-lg border border-dashed border-slate-300 py-8 text-sm text-slate-500">
                    No bookings yet
                  </div>
                ) : (
                  <div className="mt-2 max-h-48 space-y-2 overflow-y-auto">
                    {customerBookings.slice(0, 10).map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {booking.booking_number}
                          </p>
                          <p className="text-xs text-slate-500">
                            {booking.service_name} · {formatDate(booking.scheduled_date)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-900">
                            {formatCurrency(booking.amount)}
                          </span>
                          <Badge
                            className={cn(
                              'capitalize',
                              BOOKING_STATUS_COLORS[booking.status] ||
                                'bg-gray-100 text-gray-700',
                            )}
                          >
                            {booking.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Invoices */}
              {customerInvoices.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Payment History
                  </p>
                  <div className="mt-2 max-h-32 space-y-2 overflow-y-auto">
                    {customerInvoices.slice(0, 5).map((inv) => (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {inv.invoice_number}
                          </p>
                          <p className="text-xs text-slate-500">
                            {inv.service_name} · {formatDate(inv.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-900">
                            {formatCurrency(inv.amount)}
                          </span>
                          <Badge
                            color={inv.status === 'paid' ? 'green' : 'amber'}
                          >
                            {inv.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-700">
                    Admin Notes
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setNoteModalOpen(true)}
                  >
                    <Plus className="mr-1 h-3 w-3" /> Add Note
                  </Button>
                </div>
                {customerNotes.length === 0 ? (
                  <div className="mt-2 flex items-center justify-center rounded-lg border border-dashed border-slate-300 py-6 text-sm text-slate-500">
                    No notes yet
                  </div>
                ) : (
                  <div className="mt-2 space-y-2">
                    {customerNotes.map((note) => (
                      <div
                        key={note.id}
                        className="rounded-lg bg-slate-50 p-3"
                      >
                        <p className="text-sm text-slate-700">{note.note}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {formatDate(note.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Add Note Modal */}
      {noteModalOpen && selectedCustomer && (
        <Modal title="Add Note" onClose={() => setNoteModalOpen(false)}>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Add a note for{' '}
              <span className="font-semibold text-slate-900">
                {selectedCustomer.name}
              </span>
            </p>
            <div className="space-y-1.5">
              <Label>Note</Label>
              <Textarea
                placeholder="Enter your note..."
                value={noteText}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setNoteText(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNoteModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addNote} loading={noteLoading}>
                Add Note
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
