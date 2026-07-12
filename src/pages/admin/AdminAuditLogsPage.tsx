import { useEffect, useState } from 'react'
import { Search, Activity } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { AuditLog, Profile } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/LoadingScreen'
import { formatDateTime } from '@/lib/utils'

export function AdminAuditLogsPage() {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [entityFilter, setEntityFilter] = useState('')

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100)
      const { data: profs } = await supabase.from('profiles').select('*')
      const pMap: Record<string, Profile> = {}
      ;(profs as Profile[] || []).forEach((p) => { pMap[p.id] = p })
      if (mounted) { setLogs((data as AuditLog[]) || []); setProfiles(pMap); setLoading(false) }
    })()
    return () => { mounted = false }
  }, [])

  if (loading) return <LoadingScreen message="Loading audit logs..." />

  const actions = [...new Set(logs.map((l) => l.action))]
  const entities = [...new Set(logs.map((l) => l.entity_type))]

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase()
    const matchSearch = !q || (l.details || '').toLowerCase().includes(q) || (l.entity_id || '').toLowerCase().includes(q)
    const matchAction = !actionFilter || l.action === actionFilter
    const matchEntity = !entityFilter || l.entity_type === entityFilter
    return matchSearch && matchAction && matchEntity
  })

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Audit Logs</h1>

      <Card className="mb-4">
        <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input id="search" className="pl-10" placeholder="Search details..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="action">Filter by Action</Label>
            <Select id="action" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
              <option value="">All actions</option>
              {actions.map((a) => <option key={a} value={a}>{a}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="entity">Filter by Entity</Label>
            <Select id="entity" value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)}>
              <option value="">All entities</option>
              {entities.map((e) => <option key={e} value={e}>{e}</option>)}
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {filtered.map((l) => {
          const user = profiles[l.user_id]
          return (
            <Card key={l.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-blue-50 p-2"><Activity className="h-4 w-4 text-blue-600" /></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{l.action}</p>
                      <Badge color="bg-gray-50 text-gray-700">{l.entity_type}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{l.details || 'No details'}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {user?.name || 'Unknown user'} • {formatDateTime(l.created_at)}
                      {l.entity_id && ` • ID: ${l.entity_id.slice(0, 8)}...`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {filtered.length === 0 && <p className="py-8 text-center text-gray-500">No audit logs found.</p>}
      </div>

      <div className="mt-4 text-center">
        <Button variant="outline" onClick={() => { setSearch(''); setActionFilter(''); setEntityFilter('') }}>Clear Filters</Button>
      </div>
    </div>
  )
}
