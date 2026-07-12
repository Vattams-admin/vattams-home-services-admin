import { useEffect, useState, useCallback } from 'react'
import {
  CalendarCheck,
  Eye,
  Loader2,
  Search,
  Filter,
  User,
  MapPin,
  IndianRupee,
  Clock,
  X,
  CheckCircle2,
  Phone,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/ui/modal'
import { useAuth } from '@/lib/auth'
import {
  supabase,
  type Booking,
  type Profile,
  type Invoice,
} from '@/lib/supabase'
import {
  cn,
  formatDate,
  formatCurrency,
  BOOKING_STATUS_COLORS,
} from '@/lib/utils'
import { createNotification, createAuditLog } from '@/lib/notifications'
import { useToast } from '@/hooks/use-toast'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'created', label: 'Created' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'on_the_way', label: 'On the Way' },
  { value: 'arrived', label: 'Arrived' },
  { value: 'work_started', label: 'Work Started' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

type BookingWithDetails = Booking & {
  customer?: Pick<Profile, 'id' | 'name' | 'mobile'>
  technician?: Pick<Profile, 'id' | 'name' | 'mobile'> | null
  invoice?: Pick<Invoice, 'id' | 'invoice_number' | 'status'> | null
}

export default function AdminBookingsPage() {
  const { profile } = useAuth()
  const toast = useToast()

  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [techFilter, setTechFilter] = useState('all')

  const [technicians, setTechnicians] = useState<Profile[]>([])

  const [selectedBooking, setSelectedBooking] =
    useState<BookingWithDetails | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [assignTechId, setAssignTechId] = useState('')
  const [assignLoading, setAssignLoading] = useState(false)
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false)

  const loadBookings = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('bookings')
        .select(
          '*, customer:profiles!bookings_customer_id_fkey(id, name, mobile), technician:profiles!bookings_technician_id_fkey(id, name, mobile)',
        )
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }
      if (dateFilter) {
        query = query.eq('scheduled_date', dateFilter)
      }
      if (techFilter !== 'all') {
        if (techFilter === 'unassigned') {
          query = query.is('technician_id', null)
        } else {
          query = query.eq('technician_id', techFilter)
        }
      }

      const { data, error } = await query
      if (error) throw error

      let result = (data as BookingWithDetails[]) || []

      if (search.trim()) {
        const q = search.toLowerCase()
        result = result.filter(
          (b) =>
            b.booking_number?.toLowerCase().includes(q) ||
            b.service_name?.toLowerCase().includes(q) ||
            b.customer?.name?.toLowerCase().includes(q) ||
            b.city?.toLowerCase().includes(q),
        )
      }

      setBookings(result)
    } catch {
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, dateFilter, techFilter, search, toast])

  useEffect(() => {
    async function loadTechnicians() {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, mobile')
        .eq('role', 'technician')
        .eq('verification_status', 'approved')
        .order('name', { ascending: true })
      setTechnicians((data as Profile[]) || [])
    }
    loadTechnicians()
  }, [])

  useEffect(() => {
    loadBookings()
  }, [loadBookings])

  async function viewBooking(booking: BookingWithDetails) {
    setSelectedBooking(booking)
    setModalLoading(true)
    try {
      const { data: invoice } = await supabase
        .from('invoices')
        .select('id, invoice_number, status')
        .eq('booking_id', booking.id)
        .maybeSingle()

      setSelectedBooking({ ...booking, invoice: invoice || null })
    } catch {
      // ignore
    } finally {
      setModalLoading(false)
    }
  }

  function openAssignModal(booking: BookingWithDetails) {
    setSelectedBooking(booking)
    setAssignTechId(booking.technician_id || '')
    setAssignModalOpen(true)
  }

  async function assignTechnician() {
    if (!selectedBooking || !assignTechId) {
      toast.warning('Please select a technician')
      return
    }

    setAssignLoading(true)
    try {
      const newStatus =
        selectedBooking.status === 'created' ||
        selectedBooking.status === 'confirmed'
          ? 'assigned'
          : selectedBooking.status

      const { error } = await supabase
        .from('bookings')
        .update({ technician_id: assignTechId, status: newStatus })
        .eq('id', selectedBooking.id)

      if (error) throw error

      const tech = technicians.find((t) => t.id === assignTechId)

      await createNotification(
        assignTechId,
        'New Job Assigned',
        `You have been assigned to booking ${selectedBooking.booking_number} for ${selectedBooking.service_name}.`,
        'booking',
      )
      await createNotification(
        selectedBooking.customer_id,
        'Technician Assigned',
        `A technician${tech ? ` (${tech.name})` : ''} has been assigned to your booking ${selectedBooking.booking_number}.`,
        'booking',
      )
      await createAuditLog(
        profile?.id || '',
        'assign_technician',
        'booking',
        selectedBooking.id,
        `Assigned technician ${tech?.name || assignTechId} to booking ${selectedBooking.booking_number}`,
      )

      toast.success('Technician assigned successfully')
      setAssignModalOpen(false)
      await loadBookings()
      setSelectedBooking(null)
    } catch {
      toast.error('Failed to assign technician')
    } finally {
      setAssignLoading(false)
    }
  }

  async function updateStatus(newStatus: string) {
    if (!selectedBooking) return

    setStatusUpdateLoading(true)
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', selectedBooking.id)

      if (error) throw error

      await createNotification(
        selectedBooking.customer_id,
        'Booking Status Updated',
        `Your booking ${selectedBooking.booking_number} status has been updated to: ${newStatus.replace(/_/g, ' ')}.`,
        'booking',
      )
      await createAuditLog(
        profile?.id || '',
        'update_booking_status',
        'booking',
        selectedBooking.id,
        `Updated booking ${selectedBooking.booking_number} status to ${newStatus}`,
      )

      toast.success('Status updated successfully')
      setSelectedBooking({ ...selectedBooking, status: newStatus as Booking['status'] })
      await loadBookings()
    } catch {
      toast.error('Failed to update status')
    } finally {
      setStatusUpdateLoading(false)
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
        <h1 className="text-2xl font-bold text-slate-900">All Bookings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage and track all platform bookings
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-end">
          <div className="flex-1 space-y-1.5">
            <Label>Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by booking no, service, customer, city..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-1.5 lg:w-48">
            <Label>
              <span className="flex items-center gap-1">
                <Filter className="h-3 w-3" /> Status
              </span>
            </Label>
            <Select
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setStatusFilter(e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5 lg:w-40">
            <Label>Date</Label>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setDateFilter(e.target.value)}
            />
          </div>
          <div className="space-y-1.5 lg:w-56">
            <Label>Technician</Label>
            <Select
              value={techFilter}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setTechFilter(e.target.value)}
            >
              <option value="all">All Technicians</option>
              <option value="unassigned">Unassigned</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      {bookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarCheck className="h-12 w-12 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-500">
              No bookings found
            </p>
            <p className="text-xs text-slate-400">
              Try adjusting your filters.
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
                      Booking
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Service
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Technician
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {booking.booking_number}
                        </div>
                        <div className="text-xs text-slate-500">
                          {booking.city}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-900">
                          {booking.customer?.name || 'N/A'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {booking.customer?.mobile || ''}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {booking.service_name}
                      </td>
                      <td className="px-4 py-3">
                        {booking.technician ? (
                          <div>
                            <div className="text-slate-900">
                              {booking.technician.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {booking.technician.mobile}
                            </div>
                          </div>
                        ) : (
                          <Badge color="amber">Unassigned</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatDate(booking.scheduled_date)}
                        {booking.scheduled_time && (
                          <div className="text-xs text-slate-500">
                            {booking.scheduled_time}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {formatCurrency(booking.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={cn(
                            'capitalize',
                            BOOKING_STATUS_COLORS[booking.status] ||
                              'bg-gray-100 text-gray-700',
                          )}
                        >
                          {booking.status.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewBooking(booking)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {!booking.technician_id &&
                            booking.status !== 'cancelled' &&
                            booking.status !== 'completed' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openAssignModal(booking)}
                              >
                                Assign
                              </Button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && !assignModalOpen && (
        <Modal
          title="Booking Details"
          onClose={() => setSelectedBooking(null)}
          className="max-w-2xl"
        >
          {modalLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="space-y-5">
              {/* Booking Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {selectedBooking.booking_number}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {selectedBooking.service_name}
                  </p>
                </div>
                <Badge
                  className={cn(
                    'capitalize',
                    BOOKING_STATUS_COLORS[selectedBooking.status] ||
                      'bg-gray-100 text-gray-700',
                  )}
                >
                  {selectedBooking.status.replace(/_/g, ' ')}
                </Badge>
              </div>

              {/* Customer & Technician Info */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
                    Customer
                  </p>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-900">
                      {selectedBooking.customer?.name || 'N/A'}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600">
                      {selectedBooking.customer?.mobile || 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
                    Technician
                  </p>
                  {selectedBooking.technician ? (
                    <>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-900">
                          {selectedBooking.technician.name}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-slate-600">
                          {selectedBooking.technician.mobile}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <X className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-500">
                        Not assigned
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Service Details */}
              <div className="space-y-3 rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="h-4 w-4 text-slate-400" /> Scheduled
                  </span>
                  <span className="text-sm font-medium text-slate-900">
                    {formatDate(selectedBooking.scheduled_date)}
                    {selectedBooking.scheduled_time &&
                      ` · ${selectedBooking.scheduled_time}`}
                  </span>
                </div>
                <div className="flex items-start justify-between">
                  <span className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="h-4 w-4 text-slate-400" /> Address
                  </span>
                  <span className="text-right text-sm text-slate-900">
                    {selectedBooking.address}
                    <br />
                    {selectedBooking.city}, {selectedBooking.district} -{' '}
                    {selectedBooking.pincode}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-slate-600">
                    <IndianRupee className="h-4 w-4 text-slate-400" /> Amount
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {formatCurrency(selectedBooking.amount)}
                  </span>
                </div>
                {selectedBooking.invoice && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Invoice</span>
                    <Badge
                      color={
                        selectedBooking.invoice.status === 'paid'
                          ? 'green'
                          : 'amber'
                      }
                    >
                      {selectedBooking.invoice.invoice_number} ·{' '}
                      {selectedBooking.invoice.status}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Customer Notes */}
              {selectedBooking.customer_notes && (
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Customer Notes
                  </p>
                  <p className="mt-1 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                    {selectedBooking.customer_notes}
                  </p>
                </div>
              )}

              {/* Cancel Info */}
              {selectedBooking.status === 'cancelled' && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-medium text-red-800">
                    Cancelled by: {selectedBooking.cancelled_by || 'Unknown'}
                  </p>
                  {selectedBooking.cancel_reason && (
                    <p className="mt-1 text-sm text-red-700">
                      Reason: {selectedBooking.cancel_reason}
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
                {!selectedBooking.technician_id &&
                  selectedBooking.status !== 'cancelled' &&
                  selectedBooking.status !== 'completed' && (
                    <Button onClick={() => openAssignModal(selectedBooking)}>
                      Assign Technician
                    </Button>
                  )}
                {selectedBooking.status !== 'completed' &&
                  selectedBooking.status !== 'cancelled' && (
                    <>
                      <Button
                        onClick={() => updateStatus('confirmed')}
                        disabled={statusUpdateLoading}
                        variant="outline"
                      >
                        Mark Confirmed
                      </Button>
                      <Button
                        onClick={() => updateStatus('completed')}
                        disabled={statusUpdateLoading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="mr-1 h-4 w-4" /> Mark
                        Completed
                      </Button>
                      <Button
                        onClick={() => updateStatus('cancelled')}
                        disabled={statusUpdateLoading}
                        variant="danger"
                      >
                        Cancel Booking
                      </Button>
                    </>
                  )}
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Assign Technician Modal */}
      {assignModalOpen && selectedBooking && (
        <Modal
          title="Assign Technician"
          onClose={() => setAssignModalOpen(false)}
        >
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-600">
                Select a technician to assign to booking{' '}
                <span className="font-semibold text-slate-900">
                  {selectedBooking.booking_number}
                </span>{' '}
                for{' '}
                <span className="font-semibold text-slate-900">
                  {selectedBooking.service_name}
                </span>
                .
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Technician</Label>
              <Select
                value={assignTechId}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setAssignTechId(e.target.value)}
              >
                <option value="">Select a technician...</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.mobile})
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setAssignModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={assignTechnician}
                loading={assignLoading}
                disabled={!assignTechId}
              >
                Assign
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
