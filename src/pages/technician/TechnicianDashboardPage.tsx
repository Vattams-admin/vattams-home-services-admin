import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Wrench, CheckCircle, TrendingUp, Power, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Booking, TechnicianWallet } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/LoadingScreen'
import { formatCurrency, formatDate, BOOKING_STATUS_COLORS, VERIFICATION_STATUS_COLORS, VERIFICATION_STATUS_LABELS } from '@/lib/utils'
import { createAuditLog } from '@/lib/notifications'

export function TechnicianDashboardPage() {
  const { profile, refreshProfile } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [wallet, setWallet] = useState<TechnicianWallet | null>(null)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!profile) return
      const { data: bks } = await supabase.from('bookings').select('*').eq('technician_id', profile.id).order('created_at', { ascending: false })
      const { data: w } = await supabase.from('technician_wallets').select('*').eq('technician_id', profile.id).maybeSingle()
      if (mounted) { setBookings((bks as Booking[]) || []); setWallet(w as TechnicianWallet); setLoading(false) }
    })()
    return () => { mounted = false }
  }, [profile])

  const toggleAvailability = async () => {
    if (!profile) return
    setToggling(true)
    const newVal = !profile.is_available
    const { error } = await supabase.from('profiles').update({ is_available: newVal }).eq('id', profile.id)
    setToggling(false)
    if (error) { toast('Failed to update status', 'error'); return }
    await refreshProfile()
    await createAuditLog(profile.id, 'availability_toggle', 'profile', profile.id, `Set to ${newVal ? 'available' : 'unavailable'}`)
    toast(`You are now ${newVal ? 'available' : 'unavailable'}`, 'success')
  }

  if (loading) return <LoadingScreen message="Loading dashboard..." />

  const active = bookings.filter((b) => !['completed', 'cancelled'].includes(b.status)).length
  const completed = bookings.filter((b) => b.status === 'completed').length
  const earnings = wallet?.total_earnings || 0

  const statCards = [
    { label: 'Active Jobs', value: active, icon: Wrench, color: 'text-blue-600 bg-blue-50' },
    { label: 'Completed Jobs', value: completed, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
    { label: 'Total Earnings', value: formatCurrency(earnings), icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {profile?.name}!</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge color={VERIFICATION_STATUS_COLORS[profile?.verification_status || 'pending_registration']}>{VERIFICATION_STATUS_LABELS[profile?.verification_status || 'pending_registration']}</Badge>
          </div>
        </div>
        <Button onClick={toggleAvailability} disabled={toggling} variant={profile?.is_available ? 'primary' : 'outline'}>
          <Power className="mr-2 h-4 w-4" /> {toggling ? 'Updating...' : profile?.is_available ? 'Available' : 'Unavailable'}
        </Button>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {statCards.map((s) => { const Icon = s.icon; return (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`rounded-lg p-3 ${s.color}`}><Icon className="h-6 w-6" /></div>
              <div><p className="text-sm text-gray-600">{s.label}</p><p className="text-xl font-bold text-gray-900">{s.value}</p></div>
            </CardContent>
          </Card>
        )})}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Jobs</CardTitle>
          <Link to="/technician/jobs" className="text-sm font-medium text-blue-600 hover:underline">View All</Link>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <p className="py-8 text-center text-gray-500">No jobs assigned yet.</p>
          ) : (
            <div className="space-y-3">
              {bookings.slice(0, 5).map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">{b.service_name}</p>
                    <p className="text-sm text-gray-500">#{b.booking_number} • {formatDate(b.scheduled_date)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(b.amount)}</span>
                    <Badge color={BOOKING_STATUS_COLORS[b.status]}>{b.status.replace(/_/g, ' ')}</Badge>
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
