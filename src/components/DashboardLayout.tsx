import { useState } from 'react'
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Wrench, CalendarCheck, MapPin, CreditCard, BarChart3, Settings, Bell, Ticket, FileText, Gift, Megaphone, Bot, Building2, Mail, File as FileEdit, Star, TrendingUp, LogOut, Menu, X, User, Wallet, Briefcase, MapPinned, DollarSign } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useSuperAdminAuth } from '@/lib/super-admin-auth'
import { cn } from '@/lib/utils'

const adminNav = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard }, { to: '/admin/verification', label: 'Verification', icon: User },
  { to: '/admin/bookings', label: 'Bookings', icon: CalendarCheck }, { to: '/admin/crm', label: 'CRM', icon: Users },
  { to: '/admin/customers', label: 'Customers', icon: Users }, { to: '/admin/technicians', label: 'Technicians', icon: Wrench },
  { to: '/admin/service-areas', label: 'Service Areas', icon: MapPin }, { to: '/admin/payments', label: 'Payments', icon: CreditCard },
  { to: '/admin/revenue', label: 'Revenue', icon: DollarSign }, { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { to: '/admin/settings', label: 'Settings', icon: Settings }, { to: '/admin/notifications', label: 'Notifications', icon: Bell },
  { to: '/admin/coupons', label: 'Coupons', icon: Ticket }, { to: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
  { to: '/admin/referrals', label: 'Referrals', icon: Gift }, { to: '/admin/marketing', label: 'Marketing', icon: Megaphone },
  { to: '/admin/ai-assistant', label: 'AI Assistant', icon: Bot }, { to: '/admin/google-business', label: 'Google Business', icon: Building2 },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 }, { to: '/admin/email-marketing', label: 'Email Marketing', icon: Mail },
  { to: '/admin/blog', label: 'Blog CMS', icon: FileEdit }, { to: '/admin/reviews', label: 'Reviews', icon: Star },
  { to: '/admin/marketing-dashboard', label: 'Marketing Dashboard', icon: TrendingUp },
]

const technicianNav = [
  { to: '/technician', label: 'Dashboard', icon: LayoutDashboard }, { to: '/technician/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/technician/wallet', label: 'Wallet', icon: Wallet }, { to: '/technician/areas', label: 'Service Areas', icon: MapPinned },
  { to: '/technician/earnings', label: 'Earnings', icon: DollarSign }, { to: '/technician/profile', label: 'Profile', icon: User },
  { to: '/technician/notifications', label: 'Notifications', icon: Bell }, { to: '/technician/referrals', label: 'Referrals', icon: Gift },
]

const customerNav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }, { to: '/dashboard/bookings', label: 'Bookings', icon: CalendarCheck },
  { to: '/dashboard/tracking', label: 'Tracking', icon: MapPin }, { to: '/dashboard/payments', label: 'Payments', icon: CreditCard },
  { to: '/dashboard/profile', label: 'Profile', icon: User }, { to: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { to: '/dashboard/referrals', label: 'Referrals', icon: Gift }, { to: '/dashboard/ai-assistant', label: 'AI Assistant', icon: Bot },
]

export function DashboardLayout() {
  const auth = useAuth()
  const superAdminAuth = useSuperAdminAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const isAdminArea = location.pathname.startsWith('/admin')
  const role = isAdminArea ? 'admin' : auth.profile?.role === 'super_admin' ? 'admin' : auth.profile?.role
  const nav = role === 'admin' ? adminNav : role === 'technician' ? technicianNav : customerNav
  const displayName = isAdminArea ? 'Super Admin' : auth.profile?.name || 'User'

  const handleSignOut = () => {
    if (isAdminArea) {
      superAdminAuth.logout()
      navigate('/admin/login', { replace: true })
    } else {
      auth.signOut()
      navigate('/')
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className={cn('fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 bg-white transition-transform lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
          <Link to="/" className="flex items-center gap-2"><img src="/vattams.svg" alt="VATTAMS" className="h-7 w-7" /><span className="font-bold text-slate-900">VATTAMS</span></Link>
          <button className="lg:hidden" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          {nav.map(item => (
            <Link key={item.to} to={item.to} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 [&.active]:bg-blue-50 [&.active]:text-blue-700" onClick={() => setOpen(false)}>
              <item.icon className="h-4 w-4" /> {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-3">
          <button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-700"><LogOut className="h-4 w-4" /> Sign Out</button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}
      <div className="flex-1 lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4">
          <button className="lg:hidden" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700">{displayName}</span>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 capitalize">{role}</span>
          </div>
        </header>
        <main className="p-4 lg:p-6"><Outlet /></main>
      </div>
    </div>
  )
}
