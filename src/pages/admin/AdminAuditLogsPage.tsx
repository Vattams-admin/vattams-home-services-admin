import { useEffect, useState } from 'react'
import { Search, ScrollText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { AuditLog, Profile } from '@/lib/supabase'
import { cn, formatDateTime } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/LoadingScreen'

export function AdminAuditLogsPage() {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<(AuditLog & { user: Profile | null })[]>([])
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.from('audit_logs').select('*, user:user_id(*)').order('created_at', { ascending: false }).limit(100)
      if (!mounted) return
      setLogs((data || []) as (AuditLog & { user: Profile | null })[])
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  const actions = Array.from(new Set(logs.map((l) => l.action)))

  const filtered = logs.filter((l) => {
    if (actionFilter && l.action !== actionFilter) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return l.action.toLowerCase().includes(q) || l.entity_type.toLowerCase().includes(q) || (l.details || '').toLowerCase().includes(q) || (l.entity_id || '').toLowerCase().includes(q)
  })

  if (loading) return <LoadingScreen message="Loading audit logs..." />

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1><p className="text-sm text-gray-500">System activity history (last 100 entries)</p></div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input className="pl-9" placeholder="Search by action, entity, or details..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="">All Actions</option>
          {actions.map((a) => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-12">
          <ScrollText className="h-12 w-12 text-gray-300" />
          <p className="text-gray-500">No audit logs found.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((l) => (
            <Card key={l.id}>
              <CardContent className="py-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge color="bg-blue-100 text-blue-700">{l.action.replace(/_/g, ' ')}</Badge>
                      <Badge color="bg-gray-100 text-gray-700">{l.entity_type}</Badge>
                      {l.entity_id && <span className="font-mono text-xs text-gray-400">ID: {l.entity_id.slice(0, 8)}...</span>}
                    </div>
                    {l.details && <p className="mt-1 text-sm text-gray-600">{l.details}</p>}
                    <p className="mt-1 text-xs text-gray-400">
                      {l.user?.name || 'Unknown'} • {formatDateTime(l.created_at)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
