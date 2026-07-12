import { useEffect, useState, useMemo } from 'react'
import {
  Wrench,
  Calendar,
  Clock,
  MapPin,
  Loader2,
  Search,
  Filter,
  Check,
  X,
  ArrowRight,
  User,
  FileText,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useAuth } from '@/lib/auth'
import { supabase, type Booking, type Profile } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { cn, formatDate, BOOKING_STATUS_COLORS } from '@/lib/utils'

const STATUS_FILTERS = [
  { value: 'all', label: 'All Jobs' },
  { value: 'pending', label: 'Pending Assignment' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const ACTIVE_STATUSES = ['accepted', 'on_the_way', 'arrived', 'work_started']

// The technician-controlled status flow
const STATUS_FLOW: { current: string; next: string; label: string }[] = [
  { current: 'accepted', next: 'on_the_way', label: 'Start Travel' },
  { current: 'on_the_way', next: 'arrived', label: 'Mark Arrived' },
  { current: 'arrived', next: 'work_started', label: 'Start Work' },
  { current: 'work_started', next: 'completed', label: 'Complete Job' },
]

const STATUS_LABELS: Record<string, string> = {
  accepted: 'Accepted',
  on_the_way: 'On the Way',
  arrived: 'Arrived',
  work_started: 'Work Started',
  completed: 'Completed',
}

export default function TechnicianJobsPage() {
  const { profile, session } = useAuth()
  const toast = useToast()

  const [jobs, setJobs] = useState<Booking[]>([])
  const [customers, setCustomers] = useState<Record<string, Profile>>({})
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [rejectingJob, setRejectingJob] = useState<Booking | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const userId = profile?.id || session?.user?.id

  const loadJobs = async () => {
    if (!userId) return
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('technician_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      const allJobs = (data as Booking[]) || []
      setJobs(allJobs)

      // Fetch customer profiles
      const customerIds = Array.from(
        new Set(allJobs.map((b) => b.customer_id).filter(Boolean) as string[]),
      )
      if (customerIds.length > 0) {
        const { data: custData } = await supabase
          .from('profiles')
          .select('*')
          .in('id', customerIds)
        if (custData) {
          const map: Record<string, Profile> = {}
          ;(custData as Profile[]).forEach((c) => {
            map[c.id] = c
          })
          setCustomers(map)
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadJobs()
  }, [userId])

  const handleAccept = async (job: Booking) => {
    setUpdatingId(job.id)
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', job.id)
      if (error) throw error
      setJobs((prev) =>
        prev.map((b) => (b.id === job.id ? { ...b, status: 'accepted' } : b)),
      )
      toast.success('Job accepted', `Job #${job.booking_number} has been accepted.`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to accept job.'
      toast.error('Accept failed', message)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleReject = async () => {
    if (!rejectingJob) return
    setUpdatingId(rejectingJob.id)
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'assigned',
          technician_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', rejectingJob.id)
      if (error) throw error
      setJobs((prev) => prev.filter((b) => b.id !== rejectingJob.id))
      toast.success('Job rejected', `Job #${rejectingJob.booking_number} has been reassigned.`)
      setRejectingJob(null)
      setRejectReason('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reject job.'
      toast.error('Reject failed', message)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleAdvanceStatus = async (job: Booking) => {
    const step = STATUS_FLOW.find((s) => s.current === job.status)
    if (!step) return
    setUpdatingId(job.id)
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: step.next, updated_at: new Date().toISOString() })
        .eq('id', job.id)
      if (error) throw error
      setJobs((prev) =>
        prev.map((b) => (b.id === job.id ? { ...b, status: step.next as Booking['status'] } : b)),
      )
      toast.success('Status updated', `Job marked as ${STATUS_LABELS[step.next] || step.next}.`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update status.'
      toast.error('Update failed', message)
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredJobs = useMemo(() => {
    return jobs.filter((b) => {
      const matchesSearch =
        !search ||
        b.service_name.toLowerCase().includes(search.toLowerCase()) ||
        b.booking_number.toLowerCase().includes(search.toLowerCase()) ||
        b.city.toLowerCase().includes(search.toLowerCase())
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'pending' && b.status === 'assigned') ||
        (statusFilter === 'active' && ACTIVE_STATUSES.includes(b.status)) ||
        (statusFilter === 'completed' && b.status === 'completed') ||
        (statusFilter === 'cancelled' && b.status === 'cancelled')
      return matchesSearch && matchesStatus
    })
  }, [jobs, search, statusFilter])

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
        <h1 className="text-2xl font-bold text-slate-900">My Jobs</h1>
        <p className="mt-1 text-sm text-slate-500">View, accept, and manage your assigned jobs.</p>
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
            <Select value={statusFilter} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setStatusFilter(e.target.value)} className="w-44">
              {STATUS_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Wrench className="h-12 w-12 text-slate-300" />
            <p className="mt-3 text-lg font-medium text-slate-700">
              {jobs.length === 0 ? 'No jobs assigned' : 'No jobs match your filters'}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {jobs.length === 0
                ? 'New job assignments will appear here.'
                : 'Try adjusting your search or filter.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job) => {
            const customer = job.customer_id ? customers[job.customer_id] : null
            const nextStep = STATUS_FLOW.find((s) => s.current === job.status)
            const isPending = job.status === 'assigned'
            const isCompleted = job.status === 'completed'
            const isCancelled = job.status === 'cancelled'
            const isActive = ACTIVE_STATUSES.includes(job.status)

            return (
              <Card key={job.id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                          <Wrench className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900">{job.service_name}</p>
                            <Badge
                              className={cn(
                                'capitalize',
                                BOOKING_STATUS_COLORS[job.status] || 'bg-gray-100 text-gray-700',
                              )}
                            >
                              {job.status.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500">#{job.booking_number}</p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> {formatDate(job.scheduled_date)}
                            </span>
                            {job.scheduled_time && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {job.scheduled_time}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {job.address}, {job.city}, {job.district}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Amount</p>
                        <p className="text-lg font-bold text-slate-900">
                          {new Intl.NumberFormat('en-IN', {
                            style: 'currency',
                            currency: 'INR',
                            maximumFractionDigits: 0,
                          }).format(Number(job.amount))}
                        </p>
                      </div>
                    </div>

                    {/* Customer info */}
                    {customer && (
                      <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        <User className="h-3 w-3 text-slate-400" />
                        <span className="font-medium">{customer.name}</span>
                        {customer.mobile && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span>+91 {customer.mobile}</span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Customer notes */}
                    {job.customer_notes && (
                      <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        <FileText className="h-3 w-3 shrink-0 text-amber-500" />
                        <span>{job.customer_notes}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                      {isPending && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleAccept(job)}
                            disabled={updatingId === job.id}
                          >
                            {updatingId === job.id ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="mr-1 h-3 w-3" />
                            )}
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => setRejectingJob(job)}
                            disabled={updatingId === job.id}
                          >
                            <X className="mr-1 h-3 w-3" />
                            Reject
                          </Button>
                        </>
                      )}
                      {isActive && nextStep && (
                        <Button
                          size="sm"
                          onClick={() => handleAdvanceStatus(job)}
                          disabled={updatingId === job.id}
                        >
                          {updatingId === job.id ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : (
                            <ArrowRight className="mr-1 h-3 w-3" />
                          )}
                          {nextStep.label}
                        </Button>
                      )}
                      {isCompleted && (
                        <Badge color="green" className="px-3 py-1">
                          <Check className="mr-1 h-3 w-3" /> Completed
                        </Badge>
                      )}
                      {isCancelled && (
                        <Badge color="red" className="px-3 py-1">
                          Cancelled
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {rejectingJob && (
        <Modal title="Reject Job" onClose={() => { setRejectingJob(null); setRejectReason('') }}>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Are you sure you want to reject job <span className="font-semibold">#{rejectingJob.booking_number}</span> ({rejectingJob.service_name})? The job will be reassigned to another technician.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Reason (optional)</label>
              <Textarea
                value={rejectReason}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setRejectReason(e.target.value)}
                placeholder="Reason for rejecting this job..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setRejectingJob(null); setRejectReason('') }}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleReject} disabled={updatingId === rejectingJob.id}>
                {updatingId === rejectingJob.id ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <X className="mr-1 h-4 w-4" />
                )}
                Confirm Reject
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
