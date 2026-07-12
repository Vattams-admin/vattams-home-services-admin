import { useEffect, useState } from 'react'
import { Search, Eye, StickyNote, CalendarClock, AlertCircle, Bell, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Profile, Booking, CustomerNote, CustomerFollowup, CustomerComplaint, ServiceReminder, AmcRenewal, Review, Invoice } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { createNotification, createAuditLog } from '@/lib/notifications'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input, Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { LoadingScreen } from '@/components/LoadingScreen'
import { formatCurrency, formatDate, formatDateTime, BOOKING_STATUS_COLORS } from '@/lib/utils'

export function AdminCrmPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState<Profile[]>([])
  const [search, setSearch] = useState('')
  const [selCust, setSelCust] = useState<Profile | null>(null)
  const [timeline, setTimeline] = useState<{ date: string; type: string; text: string }[]>([])
  const [noteModal, setNoteModal] = useState<Profile | null>(null)
  const [followupModal, setFollowupModal] = useState<Profile | null>(null)
  const [reminderModal, setReminderModal] = useState<Profile | null>(null)
  const [amcModal, setAmcModal] = useState<Profile | null>(null)
  const [complaints, setComplaints] = useState<CustomerComplaint[]>([])
  const [reminders, setReminders] = useState<ServiceReminder[]>([])
  const [amcs, setAmcs] = useState<AmcRenewal[]>([])
  const [noteText, setNoteText] = useState('')
  const [fupDate, setFupDate] = useState(''); const [fupReason, setFupReason] = useState('')
  const [rmService, setRmService] = useState(''); const [rmDate, setRmDate] = useState(''); const [rmType, setRmType] = useState('reminder')
  const [amcService, setAmcService] = useState(''); const [amcStart, setAmcStart] = useState(''); const [amcEnd, setAmcEnd] = useState(''); const [amcAmount, setAmcAmount] = useState('')
  const [stats, setStats] = useState<Record<string, { bookings: number; completed: number; spent: number; complaints: number; rating: number; ltv: number }>>({})
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: custs } = await supabase.from('profiles').select('*').eq('role', 'customer').order('created_at', { ascending: false })
      const cArr = (custs as Profile[]) || []
      const sMap: Record<string, { bookings: number; completed: number; spent: number; complaints: number; rating: number; ltv: number }> = {}
      const { data: bks } = await supabase.from('bookings').select('*')
      const { data: invs } = await supabase.from('invoices').select('*')
      const { data: rvs } = await supabase.from('reviews').select('*')
      const { data: cps } = await supabase.from('customer_complaints').select('*')
      ;(bks as Booking[] || []).forEach((b) => {
        if (!sMap[b.customer_id]) sMap[b.customer_id] = { bookings: 0, completed: 0, spent: 0, complaints: 0, rating: 0, ltv: 0 }
        sMap[b.customer_id].bookings++
        if (b.status === 'completed') sMap[b.customer_id].completed++
      })
      ;(invs as Invoice[] || []).forEach((i) => {
        if (!sMap[i.customer_id]) sMap[i.customer_id] = { bookings: 0, completed: 0, spent: 0, complaints: 0, rating: 0, ltv: 0 }
        sMap[i.customer_id].spent += i.amount; sMap[i.customer_id].ltv += i.amount
      })
      ;(rvs as Review[] || []).forEach((r) => {
        if (!sMap[r.customer_id]) sMap[r.customer_id] = { bookings: 0, completed: 0, spent: 0, complaints: 0, rating: 0, ltv: 0 }
        sMap[r.customer_id].rating += r.rating
      })
      ;(cps as CustomerComplaint[] || []).forEach((c) => {
        if (!sMap[c.customer_id]) sMap[c.customer_id] = { bookings: 0, completed: 0, spent: 0, complaints: 0, rating: 0, ltv: 0 }
        sMap[c.customer_id].complaints++
      })
      if (mounted) { setCustomers(cArr); setStats(sMap); setLoading(false) }
    })()
    return () => { mounted = false }
  }, [])

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase()
    return !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.mobile.includes(q)
  })

  const viewTimeline = async (c: Profile) => {
    setSelCust(c)
    const [bk, nt, fu, cp, rv] = await Promise.all([
      supabase.from('bookings').select('*').eq('customer_id', c.id).order('created_at', { ascending: false }),
      supabase.from('customer_notes').select('*').eq('customer_id', c.id).order('created_at', { ascending: false }),
      supabase.from('customer_followups').select('*').eq('customer_id', c.id).order('created_at', { ascending: false }),
      supabase.from('customer_complaints').select('*').eq('customer_id', c.id).order('created_at', { ascending: false }),
      supabase.from('reviews').select('*').eq('customer_id', c.id).order('created_at', { ascending: false }),
    ])
    const items: { date: string; type: string; text: string }[] = []
    ;(bk.data as Booking[] || []).forEach((b) => items.push({ date: b.created_at, type: 'Booking', text: `${b.service_name} - ${b.status}` }))
    ;(nt.data as CustomerNote[] || []).forEach((n) => items.push({ date: n.created_at, type: 'Note', text: n.note }))
    ;(fu.data as CustomerFollowup[] || []).forEach((f) => items.push({ date: f.created_at, type: 'Follow-up', text: f.reason }))
    ;(cp.data as CustomerComplaint[] || []).forEach((c) => items.push({ date: c.created_at, type: 'Complaint', text: c.description }))
    ;(rv.data as Review[] || []).forEach((r) => items.push({ date: r.created_at, type: 'Review', text: `${r.rating}★ ${r.review_text}` }))
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    setTimeline(items)
  }

  const viewComplaints = async (c: Profile) => { setSelCust(c); const { data } = await supabase.from('customer_complaints').select('*').eq('customer_id', c.id).order('created_at', { ascending: false }); setComplaints((data as CustomerComplaint[]) || []) }
  const viewReminders = async (c: Profile) => { setSelCust(c); const { data } = await supabase.from('service_reminders').select('*').eq('customer_id', c.id).order('created_at', { ascending: false }); setReminders((data as ServiceReminder[]) || []) }
  const viewAmcs = async (c: Profile) => { setSelCust(c); const { data } = await supabase.from('amc_renewals').select('*').eq('customer_id', c.id).order('created_at', { ascending: false }); setAmcs((data as AmcRenewal[]) || []) }

  const saveNote = async () => {
    if (!noteModal || !profile || !noteText.trim()) return
    setActionLoading(true)
    const { error } = await supabase.from('customer_notes').insert({ customer_id: noteModal.id, admin_id: profile.id, note: noteText })
    setActionLoading(false)
    if (error) { toast('Failed to add note', 'error'); return }
    await createAuditLog(profile.id, 'note_add', 'customer', noteModal.id, `Note added for ${noteModal.name}`)
    toast('Note added', 'success'); setNoteModal(null); setNoteText('')
  }
  const saveFollowup = async () => {
    if (!followupModal || !profile || !fupDate || !fupReason.trim()) return
    setActionLoading(true)
    const { error } = await supabase.from('customer_followups').insert({ customer_id: followupModal.id, admin_id: profile.id, scheduled_date: fupDate, reason: fupReason, status: 'pending' })
    setActionLoading(false)
    if (error) { toast('Failed to schedule follow-up', 'error'); return }
    await createAuditLog(profile.id, 'followup_add', 'customer', followupModal.id, `Follow-up scheduled for ${followupModal.name}`)
    toast('Follow-up scheduled', 'success'); setFollowupModal(null); setFupDate(''); setFupReason('')
  }
  const saveReminder = async () => {
    if (!reminderModal || !rmService || !rmDate) return
    setActionLoading(true)
    const { error } = await supabase.from('service_reminders').insert({ customer_id: reminderModal.id, service_name: rmService, due_date: rmDate, reminder_type: rmType, status: 'pending' })
    setActionLoading(false)
    if (error) { toast('Failed to add reminder', 'error'); return }
    await createNotification(reminderModal.id, 'Service Reminder', `Reminder for ${rmService} on ${formatDate(rmDate)}`, 'info')
    toast('Reminder added', 'success'); setReminderModal(null); setRmService(''); setRmDate(''); setRmType('reminder')
  }
  const saveAmc = async () => {
    if (!amcModal || !amcService || !amcStart || !amcEnd || !amcAmount) return
    setActionLoading(true)
    const { error } = await supabase.from('amc_renewals').insert({ customer_id: amcModal.id, service_name: amcService, contract_start: amcStart, contract_end: amcEnd, amount: parseFloat(amcAmount), status: 'active' })
    setActionLoading(false)
    if (error) { toast('Failed to add AMC renewal', 'error'); return }
    toast('AMC renewal added', 'success'); setAmcModal(null); setAmcService(''); setAmcStart(''); setAmcEnd(''); setAmcAmount('')
  }

  if (loading) return <LoadingScreen message="Loading CRM..." />

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">CRM Module</h1>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input className="pl-10" placeholder="Search by name, email, or mobile..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="space-y-3">
        {filtered.map((c) => {
          const s = stats[c.id] || { bookings: 0, completed: 0, spent: 0, complaints: 0, rating: 0, ltv: 0 }
          return (
            <Card key={c.id}>
              <CardContent className="p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{c.name}</p>
                    <p className="text-sm text-gray-500">{c.email} • {c.mobile}</p>
                    <p className="text-sm text-gray-500">{c.city || 'N/A'}, {c.district || 'N/A'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3 lg:grid-cols-6">
                    <div><p className="text-gray-500">Bookings</p><p className="font-bold">{s.bookings}</p></div>
                    <div><p className="text-gray-500">Completed</p><p className="font-bold">{s.completed}</p></div>
                    <div><p className="text-gray-500">Spent</p><p className="font-bold">{formatCurrency(s.spent)}</p></div>
                    <div><p className="text-gray-500">Complaints</p><p className="font-bold">{s.complaints}</p></div>
                    <div><p className="text-gray-500">CSAT</p><p className="font-bold">{s.rating > 0 ? `${(s.rating / s.bookings).toFixed(1)}★` : 'N/A'}</p></div>
                    <div><p className="text-gray-500">LTV</p><p className="font-bold">{formatCurrency(s.ltv)}</p></div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => viewTimeline(c)}><Eye className="mr-1 h-3.5 w-3.5" /> Timeline</Button>
                  <Button size="sm" variant="outline" onClick={() => setNoteModal(c)}><StickyNote className="mr-1 h-3.5 w-3.5" /> Add Note</Button>
                  <Button size="sm" variant="outline" onClick={() => setFollowupModal(c)}><CalendarClock className="mr-1 h-3.5 w-3.5" /> Follow-up</Button>
                  <Button size="sm" variant="outline" onClick={() => viewComplaints(c)}><AlertCircle className="mr-1 h-3.5 w-3.5" /> Complaints</Button>
                  <Button size="sm" variant="outline" onClick={() => viewReminders(c)}><Bell className="mr-1 h-3.5 w-3.5" /> Reminders</Button>
                  <Button size="sm" variant="outline" onClick={() => viewAmcs(c)}><RefreshCw className="mr-1 h-3.5 w-3.5" /> AMC</Button>
                  <Button size="sm" variant="outline" onClick={() => setReminderModal(c)}><Bell className="mr-1 h-3.5 w-3.5" /> Add Reminder</Button>
                  <Button size="sm" variant="outline" onClick={() => setAmcModal(c)}><RefreshCw className="mr-1 h-3.5 w-3.5" /> Add AMC</Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {filtered.length === 0 && <p className="py-8 text-center text-gray-500">No customers found.</p>}
      </div>

      <Modal open={!!selCust} onClose={() => setSelCust(null)} title="Customer Timeline" className="max-w-2xl">
        <div className="space-y-2">
          {timeline.length === 0 ? <p className="text-center text-gray-500">No activity yet.</p> : timeline.map((t, i) => (
            <div key={i} className="flex gap-3 rounded-lg border border-gray-100 p-3">
              <Badge color="bg-blue-100 text-blue-700">{t.type}</Badge>
              <div className="flex-1"><p className="text-sm text-gray-700">{t.text}</p><p className="text-xs text-gray-400">{formatDateTime(t.date)}</p></div>
            </div>
          ))}
        </div>
      </Modal>

      <Modal open={!!noteModal} onClose={() => { setNoteModal(null); setNoteText('') }} title="Add Note">
        <div className="space-y-4">
          <div><Label htmlFor="note">Note</Label><Textarea id="note" value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={3} placeholder="Enter note..." /></div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => { setNoteModal(null); setNoteText('') }}>Cancel</Button><Button onClick={saveNote} disabled={actionLoading || !noteText.trim()}>Save</Button></div>
        </div>
      </Modal>

      <Modal open={!!followupModal} onClose={() => { setFollowupModal(null); setFupDate(''); setFupReason('') }} title="Schedule Follow-up">
        <div className="space-y-4">
          <div><Label htmlFor="fdate">Date</Label><Input id="fdate" type="date" value={fupDate} onChange={(e) => setFupDate(e.target.value)} /></div>
          <div><Label htmlFor="freason">Reason</Label><Textarea id="freason" value={fupReason} onChange={(e) => setFupReason(e.target.value)} rows={2} placeholder="Enter reason..." /></div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => { setFollowupModal(null); setFupDate(''); setFupReason('') }}>Cancel</Button><Button onClick={saveFollowup} disabled={actionLoading || !fupDate || !fupReason.trim()}>Schedule</Button></div>
        </div>
      </Modal>

      <Modal open={!!reminderModal} onClose={() => { setReminderModal(null); setRmService(''); setRmDate(''); setRmType('reminder') }} title="Add Service Reminder">
        <div className="space-y-4">
          <div><Label htmlFor="rmservice">Service Name</Label><Input id="rmservice" value={rmService} onChange={(e) => setRmService(e.target.value)} placeholder="e.g. AC Service" /></div>
          <div><Label htmlFor="rmdate">Due Date</Label><Input id="rmdate" type="date" value={rmDate} onChange={(e) => setRmDate(e.target.value)} /></div>
          <div><Label htmlFor="rmtype">Type</Label><Input id="rmtype" value={rmType} onChange={(e) => setRmType(e.target.value)} placeholder="reminder" /></div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => { setReminderModal(null); setRmService(''); setRmDate(''); setRmType('reminder') }}>Cancel</Button><Button onClick={saveReminder} disabled={actionLoading || !rmService || !rmDate}>Add</Button></div>
        </div>
      </Modal>

      <Modal open={!!amcModal} onClose={() => { setAmcModal(null); setAmcService(''); setAmcStart(''); setAmcEnd(''); setAmcAmount('') }} title="Add AMC Renewal">
        <div className="space-y-4">
          <div><Label htmlFor="amservice">Service Name</Label><Input id="amservice" value={amcService} onChange={(e) => setAmcService(e.target.value)} placeholder="e.g. AC AMC" /></div>
          <div><Label htmlFor="amstart">Contract Start</Label><Input id="amstart" type="date" value={amcStart} onChange={(e) => setAmcStart(e.target.value)} /></div>
          <div><Label htmlFor="amend">Contract End</Label><Input id="amend" type="date" value={amcEnd} onChange={(e) => setAmcEnd(e.target.value)} /></div>
          <div><Label htmlFor="amamount">Amount</Label><Input id="amamount" type="number" value={amcAmount} onChange={(e) => setAmcAmount(e.target.value)} placeholder="0" /></div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => { setAmcModal(null); setAmcService(''); setAmcStart(''); setAmcEnd(''); setAmcAmount('') }}>Cancel</Button><Button onClick={saveAmc} disabled={actionLoading || !amcService || !amcStart || !amcEnd || !amcAmount}>Add</Button></div>
        </div>
      </Modal>
    </div>
  )
}
