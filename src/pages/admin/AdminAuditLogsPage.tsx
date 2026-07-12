import { useEffect, useState, useCallback } from 'react'
import { ScrollText, Loader as Loader2, Search, User, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase, type AuditLog, type Profile } from '@/lib/supabase'
import { formatDateTime } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

const ACTION_COLORS: Record<string, string> = {
  create: 'green',
  update: 'blue',
  delete: 'red',
  toggle: 'amber',
  login: 'cyan',
  logout: 'gray',
  approve: 'green',
  reject: 'red',
  assign: 'indigo',
}

export default function AdminAuditLogsPage() {
  const toast = useToast()

  const [logs, setLogs] = useState<AuditLog[]>([])
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [userFilter, setUserFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')

  const loadLogs = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500)

      if (actionFilter !== 'all') {
        query = query.ilike('action', `${actionFilter}%`)
      }
      if (userFilter !== 'all') {
        query = query.eq('user_id', userFilter)
      }
      if (dateFilter) {
        query = query.gte('created_at', `${dateFilter}T00:00:00`)
        query = query.lte('created_at', `${dateFilter}T23:59:59`)
      }

      const { data, error } = await query
      if (error) throw error

      let result = (data as AuditLog[]) || []

      if (search.trim()) {
        const q = search.toLowerCase()
        result = result.filter(
          (l) =>
            l.action?.toLowerCase().includes(q) ||
            l.entity_type?.toLowerCase().includes(q) ||
            l.details?.toLowerCase().includes(q) ||
            l.entity_id?.toLowerCase().includes(q),
        )
      }

      setLogs(result)
    } catch {
      toast.error('Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }, [actionFilter, userFilter, dateFilter, search, toast])

  useEffect(() => {
    async function loadUsers() {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .order('name', { ascending: true })
        if (data) setUsers(data as Profile[])
      } catch {}
    }
    loadUsers()
  }, [])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  function getUserName(userId: string | null): string {
    if (!userId) return 'System'
    const user = users.find((u) => u.id === userId)
    return user ? user.name : 'Unknown User'
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
        <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
        <p className="mt-1 text-sm text-slate-500">
          Read-only record of all admin actions and system events
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <ScrollText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Logs</p>
              <p className="text-xl font-bold text-slate-900">{logs.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Create Actions</p>
              <p className="text-xl font-bold text-slate-900">
                {logs.filter((l) => l.action?.startsWith('create')).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
              <FileText className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Update Actions</p>
              <p className="text-xl font-bold text-slate-900">
                {logs.filter((l) => l.action?.startsWith('update')).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
              <FileText className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Delete Actions</p>
              <p className="text-xl font-bold text-slate-900">
                {logs.filter((l) => l.action?.startsWith('delete')).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-end">
          <div className="flex-1 space-y-1.5">
            <Label>Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by action, entity, or details..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-1.5 lg:w-48">
            <Label>Action Type</Label>
            <Select
              value={actionFilter}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setActionFilter(e.target.value)}
            >
              <option value="all">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="toggle">Toggle</option>
              <option value="approve">Approve</option>
              <option value="reject">Reject</option>
              <option value="assign">Assign</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
            </Select>
          </div>
          <div className="space-y-1.5 lg:w-48">
            <Label>User</Label>
            <Select
              value={userFilter}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setUserFilter(e.target.value)}
            >
              <option value="all">All Users</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5 lg:w-44">
            <Label>Date</Label>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setDateFilter(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      {logs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ScrollText className="h-12 w-12 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-500">
              No audit logs found
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
                      Action
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Entity
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      User
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Details
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => {
                    const actionType = log.action?.split('_')[0] || 'other'
                    return (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <Badge
                            color={
                              (ACTION_COLORS[actionType] as any) || 'gray'
                            }
                          >
                            {log.action?.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">
                            {log.entity_type || '-'}
                          </div>
                          {log.entity_id && (
                            <div className="text-xs text-slate-400">
                              ID: {log.entity_id.slice(0, 8)}...
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100">
                              <User className="h-3.5 w-3.5 text-slate-500" />
                            </div>
                            <span className="text-slate-700">
                              {getUserName(log.user_id)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {log.details || '-'}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {formatDateTime(log.created_at)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
