import { useEffect, useState, useCallback } from 'react'
import { Wrench, Eye, Loader as Loader2, Search, Filter, Phone, Mail, MapPin, Star, Award, IndianRupee, CalendarCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/ui/modal'
import {
  supabase,
  type Profile,
  type Booking,
  type Review,
  type TechnicianWallet,
} from '@/lib/supabase'
import {
  cn,
  formatDate,
  formatCurrency,
  BOOKING_STATUS_COLORS,
  VERIFICATION_STATUS_COLORS,
  VERIFICATION_STATUS_LABELS,
} from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

const STATUS_FILTERS = [
  { value: 'all', label: 'All Verification Statuses' },
  { value: 'pending_registration', label: 'Pending Registration' },
  { value: 'fee_pending', label: 'Fee Pending' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'suspended', label: 'Suspended' },
]

const AVAILABILITY_FILTERS = [
  { value: 'all', label: 'All Availability' },
  { value: 'available', label: 'Available' },
  { value: 'unavailable', label: 'Unavailable' },
]

type TechWithStats = Profile & {
  totalJobs?: number
  completedJobs?: number
  avgRating?: number
  totalEarnings?: number
}

export default function AdminTechniciansPage() {
  const toast = useToast()

  const [technicians, setTechnicians] = useState<TechWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [availabilityFilter, setAvailabilityFilter] = useState('all')

  const [selectedTech, setSelectedTech] = useState<TechWithStats | null>(null)
  const [techBookings, setTechBookings] = useState<Booking[]>([])
  const [techReviews, setTechReviews] = useState<Review[]>([])
  const [techWallet, setTechWallet] = useState<TechnicianWallet | null>(null)
  const [modalLoading, setModalLoading] = useState(false)

  const loadTechnicians = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('role', 'technician')
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('verification_status', statusFilter)
      }
      if (availabilityFilter === 'available') {
        query = query.eq('is_available', true)
      } else if (availabilityFilter === 'unavailable') {
        query = query.eq('is_available', false)
      }

      const { data, error } = await query
      if (error) throw error

      let result = (data as Profile[]) || []

      // Fetch stats
      const techIds = result.map((t) => t.id)
      if (techIds.length > 0) {
        const [bookingsRes, reviewsRes, walletsRes] = await Promise.all([
          supabase
            .from('bookings')
            .select('technician_id, status')
            .in('technician_id', techIds),
          supabase
            .from('reviews')
            .select('technician_id, rating')
            .in('technician_id', techIds),
          supabase
            .from('technician_wallets')
            .select('technician_id, total_earnings, total_jobs, completed_jobs')
            .in('technician_id', techIds),
        ])

        const bookingMap = new Map<string, { total: number; completed: number }>()
        ;(bookingsRes.data || []).forEach(
          (b: { technician_id: string; status: string }) => {
            const cur = bookingMap.get(b.technician_id) || {
              total: 0,
              completed: 0,
            }
            cur.total += 1
            if (b.status === 'completed') cur.completed += 1
            bookingMap.set(b.technician_id, cur)
          },
        )

        const reviewMap = new Map<string, { sum: number; count: number }>()
        ;(reviewsRes.data || []).forEach(
          (r: { technician_id: string; rating: number }) => {
            const cur = reviewMap.get(r.technician_id) || { sum: 0, count: 0 }
            cur.sum += Number(r.rating)
            cur.count += 1
            reviewMap.set(r.technician_id, cur)
          },
        )

        const walletMap = new Map<string, TechnicianWallet>()
        ;(walletsRes.data as TechnicianWallet[] || []).forEach((w) => {
          walletMap.set(w.technician_id, w)
        })

        result = result.map((t) => {
          const booking = bookingMap.get(t.id)
          const review = reviewMap.get(t.id)
          const wallet = walletMap.get(t.id)
          return {
            ...t,
            totalJobs: booking?.total || wallet?.total_jobs || 0,
            completedJobs:
              booking?.completed || wallet?.completed_jobs || 0,
            avgRating: review ? review.sum / review.count : 0,
            totalEarnings: wallet?.total_earnings || 0,
          }
        })
      }

      if (search.trim()) {
        const q = search.toLowerCase()
        result = result.filter(
          (t) =>
            t.name?.toLowerCase().includes(q) ||
            t.mobile?.includes(q) ||
            t.email?.toLowerCase().includes(q) ||
            t.city?.toLowerCase().includes(q) ||
            t.skills?.some((s) => s.toLowerCase().includes(q)),
        )
      }

      setTechnicians(result)
    } catch {
      toast.error('Failed to load technicians')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, availabilityFilter, search, toast])

  useEffect(() => {
    loadTechnicians()
  }, [loadTechnicians])

  async function viewTechnician(tech: TechWithStats) {
    setSelectedTech(tech)
    setModalLoading(true)
    try {
      const [bookingsRes, reviewsRes, walletRes] = await Promise.all([
        supabase
          .from('bookings')
          .select('*')
          .eq('technician_id', tech.id)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('reviews')
          .select('*')
          .eq('technician_id', tech.id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('technician_wallets')
          .select('*')
          .eq('technician_id', tech.id)
          .maybeSingle(),
      ])

      setTechBookings((bookingsRes.data as Booking[]) || [])
      setTechReviews((reviewsRes.data as Review[]) || [])
      setTechWallet((walletRes.data as TechnicianWallet) || null)
    } catch {
      toast.error('Failed to load technician details')
    } finally {
      setModalLoading(false)
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
        <h1 className="text-2xl font-bold text-slate-900">Technicians</h1>
        <p className="mt-1 text-sm text-slate-500">
          View and manage all technician accounts
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
                placeholder="Search by name, mobile, city, skill..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-1.5 lg:w-56">
            <Label>
              <span className="flex items-center gap-1">
                <Filter className="h-3 w-3" /> Verification Status
              </span>
            </Label>
            <Select
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
            >
              {STATUS_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5 lg:w-48">
            <Label>Availability</Label>
            <Select
              value={availabilityFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setAvailabilityFilter(e.target.value)}
            >
              {AVAILABILITY_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Technicians Table */}
      {technicians.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Wrench className="h-12 w-12 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-500">
              No technicians found
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
                      Technician
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Skills
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Jobs
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Rating
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Earnings
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
                  {technicians.map((tech) => (
                    <tr key={tech.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {tech.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {formatDate(tech.created_at)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-700">{tech.mobile}</div>
                        <div className="text-xs text-slate-500">
                          {tech.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {tech.city || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {tech.skills?.slice(0, 2).map((skill, i) => (
                            <Badge key={i} color="gray">
                              {skill}
                            </Badge>
                          )) || (
                            <span className="text-xs text-slate-400">N/A</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-900">
                          {tech.completedJobs || 0}
                        </div>
                        <div className="text-xs text-slate-500">
                          of {tech.totalJobs || 0}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {tech.avgRating ? (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            <span className="font-medium text-slate-900">
                              {tech.avgRating.toFixed(1)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {formatCurrency(tech.totalEarnings || 0)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <Badge
                            className={cn(
                              VERIFICATION_STATUS_COLORS[
                                tech.verification_status ||
                                  'pending_registration'
                              ] || 'bg-gray-100 text-gray-700',
                            )}
                          >
                            {VERIFICATION_STATUS_LABELS[
                              tech.verification_status ||
                                'pending_registration'
                            ] || 'Pending'}
                          </Badge>
                          <Badge
                            color={tech.is_available ? 'green' : 'gray'}
                          >
                            {tech.is_available ? 'Available' : 'Offline'}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewTechnician(tech)}
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

      {/* Technician Detail Modal */}
      {selectedTech && (
        <Modal
          title="Technician Details"
          onClose={() => setSelectedTech(null)}
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
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <Wrench className="h-8 w-8 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {selectedTech.name}
                  </h3>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <Badge
                      className={cn(
                        VERIFICATION_STATUS_COLORS[
                          selectedTech.verification_status ||
                            'pending_registration'
                        ] || 'bg-gray-100 text-gray-700',
                      )}
                    >
                      {VERIFICATION_STATUS_LABELS[
                        selectedTech.verification_status ||
                          'pending_registration'
                      ] || 'Pending'}
                    </Badge>
                    <Badge
                      color={selectedTech.is_available ? 'green' : 'gray'}
                    >
                      {selectedTech.is_available ? 'Available' : 'Offline'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-700">{selectedTech.mobile}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-700">{selectedTech.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-700">
                    {selectedTech.city || 'N/A'}
                    {selectedTech.district ? `, ${selectedTech.district}` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Award className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-700">
                    {selectedTech.experience || 'No experience listed'}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-lg border border-slate-200 p-3 text-center">
                  <CalendarCheck className="mx-auto h-5 w-5 text-blue-600" />
                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {selectedTech.totalJobs || 0}
                  </p>
                  <p className="text-xs text-slate-500">Total Jobs</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3 text-center">
                  <CalendarCheck className="mx-auto h-5 w-5 text-green-600" />
                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {selectedTech.completedJobs || 0}
                  </p>
                  <p className="text-xs text-slate-500">Completed</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3 text-center">
                  <Star className="mx-auto h-5 w-5 fill-amber-400 text-amber-400" />
                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {selectedTech.avgRating
                      ? selectedTech.avgRating.toFixed(1)
                      : 'N/A'}
                  </p>
                  <p className="text-xs text-slate-500">Rating</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3 text-center">
                  <IndianRupee className="mx-auto h-5 w-5 text-purple-600" />
                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {formatCurrency(selectedTech.totalEarnings || 0)}
                  </p>
                  <p className="text-xs text-slate-500">Earnings</p>
                </div>
              </div>

              {/* Skills */}
              {selectedTech.skills && selectedTech.skills.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-700">Skills</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedTech.skills.map((skill, i) => (
                      <Badge key={i} color="blue">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Bio */}
              {selectedTech.bio && (
                <div>
                  <p className="text-sm font-medium text-slate-700">Bio</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {selectedTech.bio}
                  </p>
                </div>
              )}

              {/* Wallet Info */}
              {techWallet && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-700">
                    Wallet Summary
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-slate-500">Balance</p>
                      <p className="text-sm font-medium text-slate-900">
                        {formatCurrency(techWallet.balance)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Pending Earnings</p>
                      <p className="text-sm font-medium text-slate-900">
                        {formatCurrency(techWallet.pending_earnings)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Fee Paid</p>
                      <p className="text-sm font-medium text-slate-900">
                        {techWallet.verification_fee_paid ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Jobs */}
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Recent Jobs
                </p>
                {techBookings.length === 0 ? (
                  <div className="mt-2 flex items-center justify-center rounded-lg border border-dashed border-slate-300 py-6 text-sm text-slate-500">
                    No jobs assigned yet
                  </div>
                ) : (
                  <div className="mt-2 max-h-48 space-y-2 overflow-y-auto">
                    {techBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {booking.booking_number}
                          </p>
                          <p className="text-xs text-slate-500">
                            {booking.service_name} ·{' '}
                            {formatDate(booking.scheduled_date)}
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

              {/* Reviews */}
              {techReviews.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Recent Reviews
                  </p>
                  <div className="mt-2 space-y-2">
                    {techReviews.map((review) => (
                      <div
                        key={review.id}
                        className="rounded-lg border border-slate-200 p-3"
                      >
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                'h-4 w-4',
                                i < review.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-300',
                              )}
                            />
                          ))}
                        </div>
                        <p className="mt-1 text-sm text-slate-700">
                          {review.review_text}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {formatDate(review.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}

