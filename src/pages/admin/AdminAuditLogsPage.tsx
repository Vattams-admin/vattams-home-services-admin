import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { AuditLog, Profile } from '@/lib/supabase'
import { cn, formatDateTime } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/LoadingScreen'
import { Search, History } from 'lucide-react'

export function AdminAuditLogsPage() {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<(AuditLog & { user_name?: string })[]>([])
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: logData } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100)
      if (!mounted) return
      const logList = (logData || []) as AuditLog[]
      const userIds = [...new Set(logList.map((l) => l.user_id))]
      const userMap: Record<string, Profile> = {}
      if (userIds.length > 0) {
        const { data: profs } = await supabase.from('profiles').select('*').in('id', userIds)
        ;(profs || []).forEach((p) => { userMap[(p as Profile).id] = p as Profile })
      }
      const enriched = logList.map((l) => ({ ...l, user_name: userMap[l.user_id]?.name || 'Unknown' }))
      if (mounted) { setLogs(enriched); setLoading(false) }
    })()
    return () => { mounted = false }
  }, [])

  if (loading) return <LoadingScreen message="Loading audit logs..." />

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase()
    const a = actionFilter.toLowerCase()
    const matchSearch = !q || l.action.toLowerCase().includes(q) || l.entity_type.toLowerCase().includes(q) || (l.details || '').toLowerCase().includes(q)
    const matchAction = !a || l.action.toLowerCase().includes(a)
    return matchSearch && matchAction
  })

  const uniqueActions = [...new Set(logs.map((l) => l.action))].sort()

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1><p className="text-gray-600">Track all admin actions ({logs.length} records)</p></div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input className="pl-10" placeholder="Search by action, entity, or details..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="actionFilter">Filter by Action</Label>
          <Input id="actionFilter" list="actions" placeholder="Filter by action..." value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} />
          <datalist id="actions">{uniqueActions.map((a) => <option key={a} value={a} />)}</datalist>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Activity History</CardTitle></CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <History className="h-12 w-12 text-gray-300" />
              <p className="text-gray-500">No audit logs found.</p>
            </div>
          ) : (
            <div className="max-h-[600px] space-y-2 overflow-y-auto">
              {filtered.map((l) => (
                <div key={l.id} className="flex flex-col gap-2 rounded-lg border border-gray-100 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge color="bg-blue-50 text-blue-700">{l.action}</Badge>
                      <Badge color="bg-gray-100 text-gray-700">{l.entity_type}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{l.details || 'No details'}</p>
                    <p className="text-xs text-gray-500">By {l.user_name} · {formatDateTime(l.created_at)}{l.entity_id ? ` · ID: ${l.entity_id.slice(0, 8)}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
