import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { AuditLog, Profile } from '@/lib/supabase'
import { cn, formatDateTime } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/LoadingScreen'
import { Search, ScrollText } from 'lucide-react'

export function AdminAuditLogsPage() {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})
  const [search, setSearch] = useState('')

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: lgs } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100)
      if (!mounted) return
      setLogs((lgs || []) as AuditLog[])
      const uIds = [...new Set((lgs || []).map((l) => l.user_id).filter(Boolean))]
      if (uIds.length > 0) {
        const { data: prs } = await supabase.from('profiles').select('*').in('id', uIds)
        if (mounted) setProfiles(Object.fromEntries(((prs || []) as Profile[]).map((p) => [p.id, p])))
      }
      if (mounted) setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase()
    return l.action.toLowerCase().includes(q) || l.entity_type.toLowerCase().includes(q) || (l.details || '').toLowerCase().includes(q)
  })

  if (loading) return <LoadingScreen message="Loading audit logs..." />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <Input className="pl-9" placeholder="Search by action, entity type, or details..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ScrollText className="h-5 w-5 text-blue-600" />Recent Activity ({filtered.length})</CardTitle></CardHeader>
        <CardContent>
          {filtered.length === 0 ? <p className="text-gray-500 text-sm">No audit logs found.</p> : (
            <div className="space-y-2 max-h-[70vh] overflow-y-auto">
              {filtered.map((l) => (
                <div key={l.id} className="flex flex-col gap-1 rounded-lg border p-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge color="bg-blue-100 text-blue-700">{l.action}</Badge>
                      <span className="text-xs text-gray-500">{l.entity_type}{l.entity_id ? ` · ${l.entity_id.slice(0, 8)}` : ''}</span>
                    </div>
                    {l.details && <p className="text-sm text-gray-600 mt-1">{l.details}</p>}
                    <p className="text-xs text-gray-400 mt-1">By: {profiles[l.user_id]?.name || 'System'} · {formatDateTime(l.created_at)}</p>
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
