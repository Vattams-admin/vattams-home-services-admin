import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Clock, MapPin, Wrench, Loader as Loader2, Search, Filter, Plus, ChevronRight, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input, Select } from '@/components/ui/input'
import { useAuth } from '@/lib/auth'
import { supabase, type Booking, type Profile } from '@/lib/supabase'
import { cn, formatDate, BOOKING_STATUS_COLORS } from '@/lib/utils'

const STATUS_FILTERS = [
  { value: 'all', label: 'All Bookings' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const ACTIVE_STATUSES = ['created', 'confirmed', 'assigned', 'accepted', 'on_the_way', 'arrived', 'work_started']

export default function CustomerBookingsPage() {
  const { profile, session } = useAuth()

  const [bookings, setBookings] = useState<Booking[]>([])
  const [technicians, setTechnicians] = useState<Record<string, Profile>>({})
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  const userId = profile?.id || session?.user?.id

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    async function load() {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('customer_id', userId)
          .order('created_at', { ascending: false })
        if (cancelled) return
        if (error) throw error
        const allBookings = (data as Booking[]) || []
        setBookings(allBookings)

        // Fetch technician profiles for assigned bookings
        const techIds = Array.from(
          new Set(allBookings.map((b) => b.technician_id).filter(Boolean) as string[]),
        )
        if (techIds.length > 0) {
          const { data: techData } = await supabase
            .from('profiles')
            .select('*')
            .in('id', techIds)
          if (techData) {
            const map: Record<string, Profile> = {}
            ;(techData as Profile[]).forEach((t) => {
              map[t.id] = t
            })
            setTechnicians(map)
          }
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [userId])

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesSearch =
        !search ||
        b.service_name.toLowerCase().includes(search.toLowerCase()) ||
        b.booking_number.toLowerCase().includes(search.toLowerCase()) ||
        b.city.toLowerCase().includes(search.toLowerCase())
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && ACTIVE_STATUSES.includes(b.status)) ||
        (statusFilter === 'completed' && b.status === 'completed') ||
        (statusFilter === 'cancelled' && b.status === 'cancelled')
      return matchesSearch && matchesStatus
    })
  }, [bookings, search, statusFilter])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Bookings</h1>
          <p className="mt-1 text-sm text-slate-500">View and track all your service bookings.</p>
        </div>
        <Link to="/dashboard/book">
          <Button>
            <Plus className="mr-1 h-4 w-4" /> Book a Service
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by service, booking no, or city..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <Select value={statusFilter} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setStatusFilter(e.target.value)} className="w-40">
              {STATUS_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="h-12 w-12 text-slate-300" />
            <p className="mt-3 text-lg font-medium text-slate-700">
              {bookings.length === 0 ? 'No bookings yet' : 'No bookings match your filters'}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {bookings.length === 0
                ? 'Book a service to get started.'
                : 'Try adjusting your search or filter.'}
            </p>
            {bookings.length === 0 && (
              <Link to="/dashboard/book">
                <Button className="mt-4">
                  <Plus className="mr-1 h-4 w-4" /> Book a Service
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((booking) => {
            const technician = booking.technician_id ? technicians[booking.technician_id] : null
            return (
              <Link key={booking.id} to="/dashboard/tracking">
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                          <Wrench className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900">{booking.service_name}</p>
                            <Badge
                              className={cn(
                                'capitalize',
                                BOOKING_STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-700',
                              )}
                            >
                              {booking.status.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500">#{booking.booking_number}</p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> {formatDate(booking.scheduled_date)}
                            </span>
                            {booking.scheduled_time && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {booking.scheduled_time}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {booking.city}, {booking.district}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Technician</p>
                          {technician ? (
                            <p className="flex items-center gap-1 text-sm font-medium text-slate-700">
                              <User className="h-3 w-3" /> {technician.name}
                            </p>
                          ) : (
                            <p className="text-sm text-slate-400">Not assigned</p>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
