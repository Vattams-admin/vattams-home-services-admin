import { useEffect, useState, useCallback } from 'react'
import { Bell, Send, Loader as Loader2, Search, Users, Megaphone, CircleCheck as CheckCircle2, Clock, Mail } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/ui/modal'
import { type Notification, type Profile } from '@/lib/supabase'
import { cn, formatDate, formatDateTime } from '@/lib/utils'
import { adminApi } from '@/lib/admin-api'
import { useToast } from '@/hooks/use-toast'

type RecipientType = 'all' | 'customers' | 'technicians' | 'specific'

export default function AdminNotificationsPage() {
  const toast = useToast()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false)
  const [sending, setSending] = useState(false)

  // Send notification form
  const [recipientType, setRecipientType] = useState<RecipientType>('all')
  const [specificUserId, setSpecificUserId] = useState('')
  const [users, setUsers] = useState<Profile[]>([])
  const [notifTitle, setNotifTitle] = useState('')
  const [notifMessage, setNotifMessage] = useState('')
  const [notifType, setNotifType] = useState('info')

  // Broadcast form
  const [broadcastTitle, setBroadcastTitle] = useState('')
  const [broadcastMessage, setBroadcastMessage] = useState('')

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch admin's own sent notifications (we track via audit logs)
      const { data } = await adminApi.getNotifications()

      let result = (data as Notification[]) || []

      if (search.trim()) {
        const q = search.toLowerCase()
        result = result.filter(
          (n) =>
            n.title?.toLowerCase().includes(q) ||
            n.message?.toLowerCase().includes(q),
        )
      }

      setNotifications(result)
    } catch {
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [search, toast])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  async function loadUsers() {
    try {
      const { data } = await adminApi.getProfilesMinimal()
      setUsers((data as Profile[]) || [])
    } catch {
      // ignore
    }
  }

  function openSendModal() {
    setRecipientType('all')
    setSpecificUserId('')
    setNotifTitle('')
    setNotifMessage('')
    setNotifType('info')
    loadUsers()
    setSendModalOpen(true)
  }

  function openBroadcastModal() {
    setBroadcastTitle('')
    setBroadcastMessage('')
    setBroadcastModalOpen(true)
  }

  async function sendNotification() {
    if (!notifTitle.trim() || !notifMessage.trim()) {
      toast.warning('Please enter title and message')
      return
    }

    if (recipientType === 'specific' && !specificUserId) {
      toast.warning('Please select a user')
      return
    }

    setSending(true)
    try {
      let userIds: string[] = []

      if (recipientType === 'specific') {
        userIds = [specificUserId]
      } else {
        const { data } = await adminApi.getNotificationRecipients(recipientType)
        userIds = (data?.map((u: any) => u.id) as string[]) || []
      }

      if (userIds.length === 0) {
        toast.warning('No recipients found')
        setSending(false)
        return
      }

      if (recipientType === 'specific') {
        await adminApi.createNotification({
          user_id: userIds[0],
          title: notifTitle.trim(),
          message: notifMessage.trim(),
          type: notifType,
        })
      } else {
        // Insert notifications in batches
        const batchSize = 100
        for (let i = 0; i < userIds.length; i += batchSize) {
          const batch = userIds.slice(i, i + batchSize)
          await adminApi.sendNotifications(
            batch.map((userId) => ({
              user_id: userId,
              title: notifTitle.trim(),
              message: notifMessage.trim(),
              type: notifType,
            })),
          )
        }
      }

      await adminApi.createAuditLog(
        'Admin',
        'send_notification',
        'notification',
        null,
        `Sent notification "${notifTitle.trim()}" to ${userIds.length} user(s) (${recipientType})`,
      )

      toast.success(
        `Notification sent to ${userIds.length} user(s) successfully`,
      )
      setSendModalOpen(false)
      setNotifTitle('')
      setNotifMessage('')
      await loadNotifications()
    } catch {
      toast.error('Failed to send notification')
    } finally {
      setSending(false)
    }
  }

  async function sendBroadcast() {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      toast.warning('Please enter title and message')
      return
    }

    setSending(true)
    try {
      const { data } = await adminApi.getNotificationRecipients('broadcast')

      const userIds = (data?.map((u: any) => u.id) as string[]) || []

      if (userIds.length === 0) {
        toast.warning('No users found')
        setSending(false)
        return
      }

      const batchSize = 100
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize)
        await adminApi.sendNotifications(
          batch.map((userId) => ({
            user_id: userId,
            title: broadcastTitle.trim(),
            message: broadcastMessage.trim(),
            type: 'broadcast',
          })),
        )
      }

      await adminApi.createAuditLog(
        'Admin',
        'broadcast_notification',
        'notification',
        null,
        `Broadcast "${broadcastTitle.trim()}" to ${userIds.length} users`,
      )

      toast.success(`Broadcast sent to ${userIds.length} users successfully`)
      setBroadcastModalOpen(false)
      setBroadcastTitle('')
      setBroadcastMessage('')
      await loadNotifications()
    } catch {
      toast.error('Failed to send broadcast')
    } finally {
      setSending(false)
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">
            Send and manage platform notifications
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openBroadcastModal}>
            <Megaphone className="mr-1 h-4 w-4" /> Broadcast
          </Button>
          <Button onClick={openSendModal}>
            <Send className="mr-1 h-4 w-4" /> Send Notification
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
              <Bell className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Sent</p>
              <p className="text-2xl font-bold text-slate-900">
                {notifications.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-50">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Read</p>
              <p className="text-2xl font-bold text-slate-900">
                {notifications.filter((n) => n.is_read).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Unread</p>
              <p className="text-2xl font-bold text-slate-900">
                {notifications.filter((n) => !n.is_read).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search notifications..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Sent Notifications</CardTitle>
          <Badge color="gray">{notifications.length} total</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Bell className="h-12 w-12 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-500">
                No notifications sent yet
              </p>
              <Button onClick={openSendModal} className="mt-3" size="sm">
                <Send className="mr-1 h-4 w-4" /> Send First Notification
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.slice(0, 50).map((notif) => (
                <div
                  key={notif.id}
                  className="flex items-start justify-between p-4 hover:bg-slate-50"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg',
                        notif.type === 'broadcast'
                          ? 'bg-purple-50'
                          : notif.type === 'verification'
                            ? 'bg-blue-50'
                            : notif.type === 'booking'
                              ? 'bg-green-50'
                              : notif.type === 'reminder'
                                ? 'bg-amber-50'
                                : 'bg-slate-50',
                      )}
                    >
                      {notif.type === 'broadcast' ? (
                        <Megaphone className="h-5 w-5 text-purple-600" />
                      ) : (
                        <Bell className="h-5 w-5 text-slate-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">
                          {notif.title}
                        </p>
                        {notif.type === 'broadcast' && (
                          <Badge color="purple">Broadcast</Badge>
                        )}
                        <Badge
                          color={notif.is_read ? 'green' : 'amber'}
                        >
                          {notif.is_read ? 'Read' : 'Unread'}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        {notif.message}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {formatDateTime(notif.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send Notification Modal */}
      {sendModalOpen && (
        <Modal
          title="Send Notification"
          onClose={() => setSendModalOpen(false)}
          className="max-w-xl"
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Recipient Type</Label>
              <Select
                value={recipientType}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                  setRecipientType(e.target.value as RecipientType)
                }
              >
                <option value="all">All Users</option>
                <option value="customers">All Customers</option>
                <option value="technicians">All Approved Technicians</option>
                <option value="specific">Specific User</option>
              </Select>
            </div>

            {recipientType === 'specific' && (
              <div className="space-y-1.5">
                <Label>Select User</Label>
                <Select
                  value={specificUserId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setSpecificUserId(e.target.value)}
                >
                  <option value="">Select a user...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role}) - {u.mobile}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Notification Type</Label>
              <Select
                value={notifType}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setNotifType(e.target.value)}
              >
                <option value="info">Info</option>
                <option value="booking">Booking</option>
                <option value="verification">Verification</option>
                <option value="reminder">Reminder</option>
                <option value="promotion">Promotion</option>
                <option value="alert">Alert</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                placeholder="Notification title..."
                value={notifTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setNotifTitle(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Message</Label>
              <Textarea
                placeholder="Notification message..."
                value={notifMessage}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setNotifMessage(e.target.value)}
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-slate-400">
                {notifMessage.length}/500 characters
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setSendModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={sendNotification} loading={sending}>
                <Send className="mr-1 h-4 w-4" /> Send
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Broadcast Modal */}
      {broadcastModalOpen && (
        <Modal
          title="Broadcast to All Users"
          onClose={() => setBroadcastModalOpen(false)}
          className="max-w-xl"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg bg-purple-50 p-4">
              <Megaphone className="h-5 w-5 shrink-0 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-purple-900">
                  Broadcast Notification
                </p>
                <p className="mt-1 text-xs text-purple-700">
                  This will send a notification to ALL users on the platform
                  (customers, technicians, and admins).
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Broadcast Title</Label>
              <Input
                placeholder="e.g., Important Announcement"
                value={broadcastTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setBroadcastTitle(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Broadcast Message</Label>
              <Textarea
                placeholder="Type your broadcast message here..."
                value={broadcastMessage}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setBroadcastMessage(e.target.value)}
                rows={5}
                maxLength={500}
              />
              <p className="text-xs text-slate-400">
                {broadcastMessage.length}/500 characters
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setBroadcastModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={sendBroadcast}
                loading={sending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Megaphone className="mr-1 h-4 w-4" /> Broadcast Now
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
