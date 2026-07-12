import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ClipboardList, MapPin, Wallet, User, Bell, LogOut,
  Menu, X, Users, Wrench, CreditCard, BarChart3, Settings, Calendar,
} from 'lucide-react'
import { Logo } from '@/components/Logo'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard }

const adminNav: NavItem[] = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/bookings', label: 'Bookings', icon: ClipboardList },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/technicians', label: 'Technicians', icon: Wrench },
  { to: '/admin/service-areas', label: 'Service Areas', icon: MapPin },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { to: '/admin/notifications', label: 'Notifications', icon: Bell },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

const technicianNav: NavItem[] = [
  { to: '/technician/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/technician/jobs', label: 'My Jobs', icon: ClipboardList },
  { to: '/technician/areas', label: 'Working Areas', icon: MapPin },
  { to: '/technician/earnings', label: 'Earnings', icon: Wallet },
  { to: '/technician/notifications', label: 'Notifications', icon: Bell },
  { to: '/technician/profile', label: 'Profile', icon: User },
]

const customerNav: NavItem[] = [
  { to: '/customer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/customer/book', label: 'Book Service', icon: Calendar },
  { to: '/customer/bookings', label: 'My Bookings', icon: ClipboardList },
  { to: '/customer/payments', label: 'Payments', icon: CreditCard },
  { to: '/customer/notifications', label: 'Notifications', icon: Bell },
  { to: '/customer/profile', label: 'Profile', icon: User },
]

export function DashboardLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [unread, setUnread] = useState(0)

  const nav =
    profile?.role === 'admin' || profile?.role === 'super_admin'
      ? adminNav
      : profile?.role === 'technician'
        ? technicianNav
        : customerNav

  useEffect(() => {
    if (!profile?.id) return
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('is_read', false)
      .then(({ count }) => setUnread(count ?? 0))
  }, [profile?.id])

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 transform border-r bg-white transition-transform md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link to="/"><Logo size="sm" /></Link>
          <button className="md:hidden" onClick={() => setMobileOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-1 p-3">
          {nav.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                  )
                }
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                {item.label === 'Notifications' && unread > 0 && (
                  <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>

        <div className="absolute inset-x-0 bottom-0 border-t p-3">
          <div className="mb-2 truncate px-2 text-sm">
            <p className="font-medium text-gray-900">{profile?.name || profile?.email}</p>
            <p className="text-xs capitalize text-gray-500">{profile?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main content */}
      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-white px-4 md:hidden">
          <button onClick={() => setMobileOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
          <Link to="/"><Logo size="sm" /></Link>
        </header>

        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
