import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, Users, Wrench, MapPin, CreditCard,
  BarChart3, Settings, Bell, Tag, History, ClipboardList, Home,
  Wallet, User, Menu, X, LogOut, FileText, BadgeCheck,
  UserCircle, Gift, Megaphone, Bot, Star, Mail, Globe,
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { Logo } from '@/components/Logo'
import { cn } from '@/lib/utils'

type NavItem = { to: string; label: string; icon: typeof Home }

const adminNav: NavItem[] = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/verification', label: 'Verification', icon: BadgeCheck },
  { to: '/admin/bookings', label: 'Bookings', icon: Calendar },
  { to: '/admin/crm', label: 'CRM', icon: UserCircle },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/technicians', label: 'Technicians', icon: Wrench },
  { to: '/admin/service-areas', label: 'Service Areas', icon: MapPin },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard },
  { to: '/admin/revenue', label: 'Revenue', icon: BarChart3 },
  { to: '/admin/reports', label: 'Reports', icon: FileText },
  { to: '/admin/coupons', label: 'Coupons & Offers', icon: Tag },
  { to: '/admin/referrals', label: 'Referrals', icon: Gift },
  { to: '/admin/marketing', label: 'Marketing', icon: Megaphone },
  { to: '/admin/marketing-dashboard', label: 'Marketing Dashboard', icon: BarChart3 },
  { to: '/admin/google-business', label: 'Google Business', icon: Globe },
  { to: '/admin/analytics', label: 'Analytics & Pixel', icon: BarChart3 },
  { to: '/admin/email-marketing', label: 'Email Marketing', icon: Mail },
  { to: '/admin/blog', label: 'Blog CMS', icon: FileText },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
  { to: '/admin/ai-assistant', label: 'AI Assistant', icon: Bot },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: History },
  { to: '/admin/notifications', label: 'Notifications', icon: Bell },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

const technicianNav: NavItem[] = [
  { to: '/technician/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/technician/jobs', label: 'Jobs', icon: ClipboardList },
  { to: '/technician/wallet', label: 'Wallet', icon: Wallet },
  { to: '/technician/areas', label: 'Areas', icon: MapPin },
  { to: '/technician/earnings', label: 'Earnings', icon: CreditCard },
  { to: '/technician/referrals', label: 'Referrals', icon: Gift },
  { to: '/technician/notifications', label: 'Notifications', icon: Bell },
  { to: '/technician/profile', label: 'Profile', icon: User },
]

const customerNav: NavItem[] = [
  { to: '/customer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/customer/booking', label: 'Book Service', icon: Calendar },
  { to: '/customer/bookings', label: 'My Bookings', icon: ClipboardList },
  { to: '/customer/payments', label: 'Payments', icon: CreditCard },
  { to: '/customer/referrals', label: 'Referrals', icon: Gift },
  { to: '/customer/ai-assistant', label: 'AI Assistant', icon: Bot },
  { to: '/customer/notifications', label: 'Notifications', icon: Bell },
  { to: '/customer/profile', label: 'Profile', icon: User },
]

export function DashboardLayout() {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!profile) return
    const load = async () => {
      const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', profile.id).eq('is_read', false)
      setUnreadCount(count || 0)
    }
    load()
    const ch = supabase.channel('notif-count').on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` }, load).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [profile])

  if (!profile) return null
  const role = profile.role === 'super_admin' ? 'admin' : profile.role
  const navItems = role === 'admin' ? adminNav : role === 'technician' ? technicianNav : customerNav

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className={cn('fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transition-transform md:translate-x-0', sidebarOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
          <Link to="/" className="flex items-center gap-2"><Logo className="h-7 w-7" /><span className="text-lg font-bold">VATTAMS</span></Link>
          <button className="md:hidden" onClick={() => setSidebarOpen(false)}><X className="h-5 w-5" /></button>
        </div>
        <nav className="overflow-y-auto px-3 py-4" style={{ maxHeight: 'calc(100vh - 12rem)' }}>
          {navItems.map((item) => {
            const Icon = item.icon; const active = location.pathname === item.to
            return (
              <Link key={item.to} to={item.to} onClick={() => setSidebarOpen(false)} className={cn('flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors mb-0.5', active ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white')}>
                <Icon className="h-5 w-5" /><span>{item.label}</span>
                {item.label === 'Notifications' && unreadCount > 0 && <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">{unreadCount}</span>}
              </Link>
            )
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-800 p-4">
          <div className="mb-2 flex items-center gap-2 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold">{profile.name?.[0]?.toUpperCase() || 'U'}</div>
            <div className="min-w-0"><p className="truncate text-sm font-medium">{profile.name}</p><p className="truncate text-xs text-gray-400">{profile.email}</p></div>
          </div>
          <button onClick={async () => { await signOut(); navigate('/') }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"><LogOut className="h-4 w-4" /> Logout</button>
        </div>
      </aside>
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />}
      <div className="flex-1 md:ml-64">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:px-6">
          <button className="md:hidden" onClick={() => setSidebarOpen(true)}><Menu className="h-6 w-6" /></button>
          <h1 className="text-lg font-semibold capitalize text-gray-900">{role} Panel</h1>
          <Link to="/" className="text-sm text-blue-600 hover:text-blue-700"><Home className="h-5 w-5" /></Link>
        </header>
        <main className="p-4 md:p-6"><Outlet /></main>
      </div>
    </div>
  )
}
