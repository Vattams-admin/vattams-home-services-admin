import { useEffect, useState, useMemo } from 'react'
import { Loader as Loader2, Eye, CircleCheck as CheckCircle, Circle as XCircle, Ban, Wrench } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { createNotification } from '@/lib/notifications'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn, formatDate } from '@/lib/utils'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'active', label: 'Active' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'suspended', label: 'Suspended' },
]

export function AdminTechniciansPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [techs, setTechs] = useState<Profile[]>([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [viewProfile, setViewProfile] = useState<Profile | null>(null)
  const [rejectTech, setRejectTech] = useState<Profile | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actioning, setActioning] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'technician')
        .order('created_at', { ascending: false })
      if (!mounted) return
      setTechs((data ?? []) as Profile[])
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return techs
    return techs.filter((t) => t.status === activeFilter)
  }, [techs, activeFilter])

  const updateStatus = async (tech: Profile, status: string, bio?: string) => {
    setActioning(true)
    try {
      const update: Record<string, unknown> = { status }
      if (bio !== undefined) update.bio = bio
      const { error } = await supabase.from('profiles').update(update).eq('id', tech.id)
      if (error) throw error
      setTechs((prev) => prev.map((t) => t.id === tech.id ? { ...t, ...update } as Profile : t))
      return true
    } catch (err) {
      toast({ title: 'Update failed', description: (err as Error).message, variant: 'error' })
      return false
    } finally {
      setActioning(false)
    }
  }

  const approve = async (tech: Profile) => {
    const ok = await updateStatus(tech, 'active')
    if (ok) {
      await createNotification(tech.id, 'Account Approved', 'Your technician account has been approved. You can now accept jobs.', 'technician_approved', tech.id)
      toast({ title: 'Technician approved', variant: 'success' })
    }
  }

  const confirmReject = async () => {
    if (!rejectTech || !rejectReason.trim()) return
    const ok = await updateStatus(rejectTech, 'rejected', rejectReason)
    if (ok) {
      await createNotification(rejectTech.id, 'Account Rejected', `Your technician application was rejected. Reason: ${rejectReason}`, 'technician_rejected', rejectTech.id)
      toast({ title: 'Technician rejected', variant: 'success' })
      setRejectTech(null)
      setRejectReason('')
    }
  }

  const suspend = async (tech: Profile) => {
    const ok = await updateStatus(tech, 'suspended')
    if (ok) {
      await createNotification(tech.id, 'Account Suspended', 'Your technician account has been suspended. Please contact support.', 'technician_suspended', tech.id)
      toast({ title: 'Technician suspended', variant: 'success' })
    }
  }

  const activate = async (tech: Profile) => {
    const ok = await updateStatus(tech, 'active')
    if (ok) {
      await createNotification(tech.id, 'Account Activated', 'Your technician account has been reactivated.', 'technician_activated', tech.id)
      toast({ title: 'Technician activated', variant: 'success' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const statusVariant = (s: string) => {
    if (s === 'active') return 'success'
    if (s === 'pending') return 'warning'
    if (s === 'rejected') return 'error'
    if (s === 'suspended') return 'destructive'
    return 'default'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Technicians</h1>
        <p className="text-sm text-gray-500">Approve, suspend, and manage technician accounts.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              activeFilter === f.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Wrench className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-500">No technicians found.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map((t) => (
                <div key={t.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{t.name}</p>
                      <Badge variant={statusVariant(t.status) as any} className="capitalize">{t.status}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">{t.email} · {t.mobile}</p>
                    <p className="text-xs text-gray-400">{t.city ?? '-'} · {t.experience ?? '-'} exp · Joined {formatDate(t.created_at)}</p>
                    {t.skills && t.skills.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {t.skills.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setViewProfile(t)}>
                      <Eye className="mr-1 h-4 w-4" /> View
                    </Button>
                    {t.status === 'pending' && (
                      <>
                        <Button variant="success" size="sm" onClick={() => approve(t)} disabled={actioning}>
                          <CheckCircle className="mr-1 h-4 w-4" /> Approve
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setRejectTech(t)}>
                          <XCircle className="mr-1 h-4 w-4" /> Reject
                        </Button>
                      </>
                    )}
                    {t.status === 'active' && (
                      <Button variant="destructive" size="sm" onClick={() => suspend(t)} disabled={actioning}>
                        <Ban className="mr-1 h-4 w-4" /> Suspend
                      </Button>
                    )}
                    {t.status === 'suspended' && (
                      <Button variant="success" size="sm" onClick={() => activate(t)} disabled={actioning}>
                        <CheckCircle className="mr-1 h-4 w-4" /> Activate
                      </Button>
                    )}
                    {t.status === 'rejected' && (
                      <Button variant="success" size="sm" onClick={() => approve(t)} disabled={actioning}>
                        <CheckCircle className="mr-1 h-4 w-4" /> Approve
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={!!viewProfile} onClose={() => setViewProfile(null)} title="Technician Profile">
        {viewProfile && (
          <div className="space-y-3 text-sm">
            <div><span className="font-medium text-gray-500">Name:</span> {viewProfile.name}</div>
            <div><span className="font-medium text-gray-500">Email:</span> {viewProfile.email}</div>
            <div><span className="font-medium text-gray-500">Mobile:</span> {viewProfile.mobile}</div>
            <div><span className="font-medium text-gray-500">City:</span> {viewProfile.city ?? '-'}</div>
            <div><span className="font-medium text-gray-500">District:</span> {viewProfile.district ?? '-'}</div>
            <div><span className="font-medium text-gray-500">Experience:</span> {viewProfile.experience ?? '-'}</div>
            <div><span className="font-medium text-gray-500">Bio:</span> {viewProfile.bio ?? '-'}</div>
            <div><span className="font-medium text-gray-500">Status:</span> <Badge variant={statusVariant(viewProfile.status) as any} className="capitalize">{viewProfile.status}</Badge></div>
            <div>
              <span className="font-medium text-gray-500">Skills:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {viewProfile.skills?.length ? viewProfile.skills.map((s) => <Badge key={s} variant="secondary">{s}</Badge>) : <span className="text-gray-400">None</span>}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!rejectTech} onClose={() => { setRejectTech(null); setRejectReason('') }} title="Reject Technician">
        <div className="space-y-4">
          <div>
            <Label>Rejection Reason</Label>
            <Textarea className="mt-1" rows={4} placeholder="Provide a reason for rejection..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setRejectTech(null); setRejectReason('') }}>Cancel</Button>
            <Button variant="destructive" onClick={confirmReject} disabled={actioning || !rejectReason.trim()}>
              {actioning ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              Confirm Reject
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
