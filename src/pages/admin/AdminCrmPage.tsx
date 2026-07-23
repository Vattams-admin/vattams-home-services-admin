import { useEffect, useState, useCallback } from 'react'
import { StickyNote, CalendarClock, TriangleAlert as AlertTriangle, Bell, Loader as Loader2, Plus, Search, User, Clock, CircleCheck as CheckCircle2, Circle as XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/ui/modal'
import {
  type Profile,
  type CustomerNote,
  type CustomerFollowup,
  type CustomerComplaint,
  type ServiceReminder,
} from '@/lib/supabase'
import { cn, formatDate } from '@/lib/utils'
import { adminApi } from '@/lib/admin-api'
import { useToast } from '@/hooks/use-toast'

type Tab = 'notes' | 'followups' | 'complaints' | 'reminders'

type NoteWithCustomer = CustomerNote & {
  customer?: Pick<Profile, 'id' | 'name' | 'mobile'>
}
type FollowupWithCustomer = CustomerFollowup & {
  customer?: Pick<Profile, 'id' | 'name' | 'mobile'>
}
type ComplaintWithCustomer = CustomerComplaint & {
  customer?: Pick<Profile, 'id' | 'name' | 'mobile'>
}
type ReminderWithCustomer = ServiceReminder & {
  customer?: Pick<Profile, 'id' | 'name' | 'mobile'>
}

export default function AdminCrmPage() {
  const toast = useToast()

  const [activeTab, setActiveTab] = useState<Tab>('notes')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [notes, setNotes] = useState<NoteWithCustomer[]>([])
  const [followups, setFollowups] = useState<FollowupWithCustomer[]>([])
  const [complaints, setComplaints] = useState<ComplaintWithCustomer[]>([])
  const [reminders, setReminders] = useState<ReminderWithCustomer[]>([])

  const [customers, setCustomers] = useState<Profile[]>([])

  // Modal states
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [followupModalOpen, setFollowupModalOpen] = useState(false)
  const [reminderModalOpen, setReminderModalOpen] = useState(false)
  const [complaintModalOpen, setComplaintModalOpen] = useState(false)

  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [noteText, setNoteText] = useState('')
  const [followupDate, setFollowupDate] = useState('')
  const [followupReason, setFollowupReason] = useState('')
  const [reminderService, setReminderService] = useState('')
  const [reminderDate, setReminderDate] = useState('')
  const [reminderType, setReminderType] = useState('service_due')
  const [complaintType, setComplaintType] = useState('service_quality')
  const [complaintDesc, setComplaintDesc] = useState('')
  const [complaintCustomerId, setComplaintCustomerId] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [notesRes, followupsRes, complaintsRes, remindersRes, customersRes] =
        await Promise.all([
          adminApi.getCrmNotes(),
          adminApi.getCrmFollowups(),
          adminApi.getCrmComplaints(),
          adminApi.getCrmReminders(),
          adminApi.getProfilesMinimal('customer'),
        ])

      setNotes((notesRes.data as NoteWithCustomer[]) || [])
      setFollowups((followupsRes.data as FollowupWithCustomer[]) || [])
      setComplaints((complaintsRes.data as ComplaintWithCustomer[]) || [])
      setReminders((remindersRes.data as ReminderWithCustomer[]) || [])
      setCustomers((customersRes.data as Profile[]) || [])
    } catch {
      toast.error('Failed to load CRM data')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function addNote() {
    if (!selectedCustomerId || !noteText.trim()) {
      toast.warning('Please select a customer and enter a note')
      return
    }
    setActionLoading(true)
    try {
      await adminApi.createCustomerNote({
        customer_id: selectedCustomerId,
        admin_id: null,
        note: noteText.trim(),
      })

      await adminApi.createAuditLog(
        'Admin',
        'add_customer_note',
        'customer_note',
        selectedCustomerId,
        `Added note for customer`,
      )

      toast.success('Note added successfully')
      setNoteModalOpen(false)
      setNoteText('')
      setSelectedCustomerId('')
      await loadData()
    } catch {
      toast.error('Failed to add note')
    } finally {
      setActionLoading(false)
    }
  }

  async function addFollowup() {
    if (!selectedCustomerId || !followupDate || !followupReason.trim()) {
      toast.warning('Please fill all fields')
      return
    }
    setActionLoading(true)
    try {
      await adminApi.createCustomerFollowup({
        customer_id: selectedCustomerId,
        admin_id: null,
        scheduled_date: followupDate,
        reason: followupReason.trim(),
        status: 'pending',
      })

      await adminApi.createAuditLog(
        'Admin',
        'schedule_followup',
        'customer_followup',
        selectedCustomerId,
        `Scheduled followup for ${followupDate}`,
      )

      toast.success('Follow-up scheduled successfully')
      setFollowupModalOpen(false)
      setFollowupDate('')
      setFollowupReason('')
      setSelectedCustomerId('')
      await loadData()
    } catch {
      toast.error('Failed to schedule follow-up')
    } finally {
      setActionLoading(false)
    }
  }

  async function addReminder() {
    if (!selectedCustomerId || !reminderService || !reminderDate) {
      toast.warning('Please fill all fields')
      return
    }
    setActionLoading(true)
    try {
      await adminApi.createServiceReminder({
        customer_id: selectedCustomerId,
        service_name: reminderService,
        due_date: reminderDate,
        reminder_type: reminderType,
        status: 'pending',
      })

      await adminApi.createNotification({
        user_id: selectedCustomerId,
        title: 'Service Reminder',
        message: `Your ${reminderService} is due on ${formatDate(reminderDate)}. Book now to avoid inconvenience.`,
        type: 'reminder',
      })

      toast.success('Reminder created successfully')
      setReminderModalOpen(false)
      setReminderService('')
      setReminderDate('')
      setSelectedCustomerId('')
      await loadData()
    } catch {
      toast.error('Failed to create reminder')
    } finally {
      setActionLoading(false)
    }
  }

  async function addComplaint() {
    if (!complaintCustomerId || !complaintDesc.trim()) {
      toast.warning('Please fill all fields')
      return
    }
    setActionLoading(true)
    try {
      await adminApi.createCustomerComplaint({
        customer_id: complaintCustomerId,
        complaint_type: complaintType,
        description: complaintDesc.trim(),
        status: 'open',
      })

      await adminApi.createAuditLog(
        'Admin',
        'log_complaint',
        'customer_complaint',
        complaintCustomerId,
        `Logged complaint: ${complaintType}`,
      )

      toast.success('Complaint logged successfully')
      setComplaintModalOpen(false)
      setComplaintDesc('')
      setComplaintCustomerId('')
      await loadData()
    } catch {
      toast.error('Failed to log complaint')
    } finally {
      setActionLoading(false)
    }
  }

  async function updateFollowupStatus(
    id: string,
    status: string,
  ) {
    try {
      await adminApi.updateFollowupStatus(id, status)
      toast.success('Follow-up updated')
      await loadData()
    } catch {
      toast.error('Failed to update follow-up')
    }
  }

  async function updateComplaintStatus(
    id: string,
    status: string,
  ) {
    try {
      await adminApi.updateComplaintStatus(id, status)
      toast.success('Complaint updated')
      await loadData()
    } catch {
      toast.error('Failed to update complaint')
    }
  }

  const tabs: { key: Tab; label: string; icon: typeof StickyNote; count: number }[] = [
    { key: 'notes', label: 'Notes', icon: StickyNote, count: notes.length },
    { key: 'followups', label: 'Follow-ups', icon: CalendarClock, count: followups.length },
    { key: 'complaints', label: 'Complaints', icon: AlertTriangle, count: complaints.length },
    { key: 'reminders', label: 'Service Reminders', icon: Bell, count: reminders.length },
  ]

  const filteredNotes = search
    ? notes.filter(
        (n) =>
          n.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
          n.note?.toLowerCase().includes(search.toLowerCase()),
      )
    : notes
  const filteredFollowups = search
    ? followups.filter(
        (f) =>
          f.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
          f.reason?.toLowerCase().includes(search.toLowerCase()),
      )
    : followups
  const filteredComplaints = search
    ? complaints.filter(
        (c) =>
          c.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
          c.description?.toLowerCase().includes(search.toLowerCase()),
      )
    : complaints
  const filteredReminders = search
    ? reminders.filter(
        (r) =>
          r.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
          r.service_name?.toLowerCase().includes(search.toLowerCase()),
      )
    : reminders

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">CRM Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage customer relationships, notes, follow-ups, and complaints
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                activeTab === tab.key
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50',
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              <span
                className={cn(
                  'ml-1 rounded-full px-2 py-0.5 text-xs',
                  activeTab === tab.key
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-600',
                )}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Search & Add */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {activeTab === 'notes' && (
          <Button onClick={() => setNoteModalOpen(true)}>
            <Plus className="mr-1 h-4 w-4" /> Add Note
          </Button>
        )}
        {activeTab === 'followups' && (
          <Button onClick={() => setFollowupModalOpen(true)}>
            <Plus className="mr-1 h-4 w-4" /> Schedule Follow-up
          </Button>
        )}
        {activeTab === 'complaints' && (
          <Button onClick={() => setComplaintModalOpen(true)}>
            <Plus className="mr-1 h-4 w-4" /> Log Complaint
          </Button>
        )}
        {activeTab === 'reminders' && (
          <Button onClick={() => setReminderModalOpen(true)}>
            <Plus className="mr-1 h-4 w-4" /> Create Reminder
          </Button>
        )}
      </div>

      {/* Content */}
      {activeTab === 'notes' && (
        <div className="space-y-3">
          {filteredNotes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <StickyNote className="h-12 w-12 text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-500">
                  No notes yet
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredNotes.map((note) => (
              <Card key={note.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {note.customer?.name || 'Unknown Customer'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {note.customer?.mobile} · {formatDate(note.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-700">{note.note}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'followups' && (
        <div className="space-y-3">
          {filteredFollowups.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <CalendarClock className="h-12 w-12 text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-500">
                  No follow-ups scheduled
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredFollowups.map((followup) => (
              <Card key={followup.id}>
                <CardContent className="flex items-start justify-between p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                      <CalendarClock className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {followup.customer?.name || 'Unknown Customer'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {followup.customer?.mobile}
                      </p>
                      <p className="mt-2 text-sm text-slate-700">
                        {followup.reason}
                      </p>
                      {followup.notes && (
                        <p className="mt-1 text-xs text-slate-500">
                          Notes: {followup.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="h-3 w-3" />
                      {formatDate(followup.scheduled_date)}
                    </div>
                    <Badge
                      color={
                        followup.status === 'completed'
                          ? 'green'
                          : followup.status === 'cancelled'
                            ? 'red'
                            : 'amber'
                      }
                    >
                      {followup.status}
                    </Badge>
                    {followup.status === 'pending' && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() =>
                            updateFollowupStatus(followup.id, 'completed')
                          }
                        >
                          <CheckCircle2 className="mr-1 h-3 w-3" /> Complete
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-red-600"
                          onClick={() =>
                            updateFollowupStatus(followup.id, 'cancelled')
                          }
                        >
                          <XCircle className="mr-1 h-3 w-3" /> Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'complaints' && (
        <div className="space-y-3">
          {filteredComplaints.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <AlertTriangle className="h-12 w-12 text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-500">
                  No complaints logged
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredComplaints.map((complaint) => (
              <Card key={complaint.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {complaint.customer?.name || 'Unknown Customer'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {complaint.customer?.mobile} ·{' '}
                          {formatDate(complaint.created_at)}
                        </p>
                        <Badge className="mt-2" color="gray">
                          {complaint.complaint_type.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </div>
                    <Badge
                      color={
                        complaint.status === 'resolved'
                          ? 'green'
                          : complaint.status === 'rejected'
                            ? 'red'
                            : 'amber'
                      }
                    >
                      {complaint.status}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm text-slate-700">
                    {complaint.description}
                  </p>
                  {complaint.resolution && (
                    <div className="mt-2 rounded-lg bg-green-50 p-3">
                      <p className="text-xs font-medium text-green-700">
                        Resolution
                      </p>
                      <p className="text-sm text-green-600">
                        {complaint.resolution}
                      </p>
                    </div>
                  )}
                  {complaint.status === 'open' && (
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() =>
                          updateComplaintStatus(complaint.id, 'resolved')
                        }
                      >
                        Mark Resolved
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-red-600"
                        onClick={() =>
                          updateComplaintStatus(complaint.id, 'rejected')
                        }
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'reminders' && (
        <div className="space-y-3">
          {filteredReminders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Bell className="h-12 w-12 text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-500">
                  No reminders set
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredReminders.map((reminder) => (
              <Card key={reminder.id}>
                <CardContent className="flex items-start justify-between p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                      <Bell className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {reminder.customer?.name || 'Unknown Customer'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {reminder.customer?.mobile}
                      </p>
                      <p className="mt-2 text-sm text-slate-700">
                        {reminder.service_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        Type: {reminder.reminder_type.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="h-3 w-3" />
                      Due: {formatDate(reminder.due_date)}
                    </div>
                    <Badge
                      color={
                        reminder.status === 'sent'
                          ? 'green'
                          : reminder.status === 'cancelled'
                            ? 'red'
                            : 'amber'
                      }
                    >
                      {reminder.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Add Note Modal */}
      {noteModalOpen && (
        <Modal title="Add Customer Note" onClose={() => setNoteModalOpen(false)}>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Customer</Label>
              <Select
                value={selectedCustomerId}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setSelectedCustomerId(e.target.value)}
              >
                <option value="">Select a customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.mobile})
                  </option>
                ))}
              </Select>
            </div>
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
              <Button onClick={addNote} loading={actionLoading}>
                Add Note
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Schedule Follow-up Modal */}
      {followupModalOpen && (
        <Modal
          title="Schedule Follow-up"
          onClose={() => setFollowupModalOpen(false)}
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Customer</Label>
              <Select
                value={selectedCustomerId}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setSelectedCustomerId(e.target.value)}
              >
                <option value="">Select a customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.mobile})
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Scheduled Date</Label>
              <Input
                type="date"
                value={followupDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFollowupDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Reason</Label>
              <Textarea
                placeholder="Reason for follow-up..."
                value={followupReason}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFollowupReason(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setFollowupModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={addFollowup} loading={actionLoading}>
                Schedule
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Reminder Modal */}
      {reminderModalOpen && (
        <Modal
          title="Create Service Reminder"
          onClose={() => setReminderModalOpen(false)}
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Customer</Label>
              <Select
                value={selectedCustomerId}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setSelectedCustomerId(e.target.value)}
              >
                <option value="">Select a customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.mobile})
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Service Name</Label>
              <Input
                placeholder="e.g., AC Service, Plumbing..."
                value={reminderService}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setReminderService(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Reminder Type</Label>
              <Select
                value={reminderType}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setReminderType(e.target.value)}
              >
                <option value="service_due">Service Due</option>
                <option value="warranty_expiry">Warranty Expiry</option>
                <option value="amc_renewal">AMC Renewal</option>
                <option value="follow_up">Follow Up</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={reminderDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setReminderDate(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setReminderModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={addReminder} loading={actionLoading}>
                Create Reminder
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Log Complaint Modal */}
      {complaintModalOpen && (
        <Modal title="Log Complaint" onClose={() => setComplaintModalOpen(false)}>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Customer</Label>
              <Select
                value={complaintCustomerId}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setComplaintCustomerId(e.target.value)}
              >
                <option value="">Select a customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.mobile})
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Complaint Type</Label>
              <Select
                value={complaintType}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setComplaintType(e.target.value)}
              >
                <option value="service_quality">Service Quality</option>
                <option value="technician_behavior">Technician Behavior</option>
                <option value="delay">Delay in Service</option>
                <option value="billing">Billing Issue</option>
                <option value="damage">Property Damage</option>
                <option value="other">Other</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe the complaint..."
                value={complaintDesc}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setComplaintDesc(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setComplaintModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={addComplaint} loading={actionLoading}>
                Log Complaint
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
