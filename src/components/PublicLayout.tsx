import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { Phone, MessageCircle, Mail, CirclePlay as PlayCircle, Menu, X } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { Logo } from '@/components/Logo'
import { PRIMARY_PHONE, SUPPORT_PHONE, WHATSAPP_NUMBER, YOUTUBE_URL, YOUTUBE_CHANNEL, telLink, whatsappSupportLink } from '@/lib/constants'

export function PublicLayout() {
  const { profile, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const navLinks = [
    { to: '/', label: 'Home' }, { to: '/services', label: 'Services' }, { to: '/pricing', label: 'Pricing' },
    { to: '/cities', label: 'Cities' }, { to: '/about', label: 'About' }, { to: '/faq', label: 'FAQ' },
    { to: '/blog', label: 'Blog' }, { to: '/contact', label: 'Contact' },
  ]
  const dashboardPath = profile
    ? profile.role === 'admin' || profile.role === 'super_admin' ? '/admin/dashboard'
      : profile.role === 'technician' ? '/technician/dashboard' : '/customer/dashboard'
    : null

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2"><Logo className="h-8 w-8" /><span className="text-xl font-bold text-gray-900">VATTAMS</span></Link>
          <div className="hidden items-center gap-6 md:flex">
            {navLinks.map((l) => <Link key={l.to} to={l.to} className="text-sm font-medium text-gray-600 hover:text-blue-600">{l.label}</Link>)}
          </div>
          <div className="hidden items-center gap-3 md:flex">
            {profile ? (<><Link to={dashboardPath!} className="text-sm font-medium text-blue-600 hover:text-blue-700">Dashboard</Link><button onClick={signOut} className="text-sm text-gray-600 hover:text-gray-900">Logout</button></>)
              : (<><Link to="/login" className="text-sm font-medium text-gray-600 hover:text-blue-600">Login</Link><Link to="/register/customer" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Get Started</Link></>)}
          </div>
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}</button>
        </nav>
        {menuOpen && (
          <div className="border-t border-gray-200 bg-white px-4 py-4 md:hidden">
            <div className="flex flex-col gap-3">
              {navLinks.map((l) => <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)} className="text-sm font-medium text-gray-600 hover:text-blue-600">{l.label}</Link>)}
              {profile ? (<><Link to={dashboardPath!} onClick={() => setMenuOpen(false)} className="text-sm font-medium text-blue-600">Dashboard</Link><button onClick={() => { signOut(); setMenuOpen(false) }} className="text-sm text-gray-600">Logout</button></>)
                : (<><Link to="/login" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-gray-600">Login</Link><Link to="/register/customer" onClick={() => setMenuOpen(false)} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white">Get Started</Link></>)}
            </div>
          </div>
        )}
      </header>
      <main className="flex-1"><Outlet /></main>
      <footer className="bg-gray-900 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
          <div><div className="mb-4 flex items-center gap-2"><Logo className="h-8 w-8" /><span className="text-xl font-bold">VATTAMS</span></div><p className="text-sm text-gray-400">Professional home services across Tamil Nadu.</p></div>
          <div><h3 className="mb-3 text-sm font-semibold">Quick Links</h3><ul className="space-y-2 text-sm text-gray-400"><li><Link to="/services" className="hover:text-white">Services</Link></li><li><Link to="/pricing" className="hover:text-white">Pricing</Link></li><li><Link to="/cities" className="hover:text-white">Cities</Link></li><li><Link to="/about" className="hover:text-white">About Us</Link></li></ul></div>
          <div><h3 className="mb-3 text-sm font-semibold">Support</h3><ul className="space-y-2 text-sm text-gray-400"><li><Link to="/faq" className="hover:text-white">FAQ</Link></li><li><Link to="/contact" className="hover:text-white">Contact</Link></li><li><Link to="/blog" className="hover:text-white">Blog</Link></li></ul></div>
          <div><h3 className="mb-3 text-sm font-semibold">Contact</h3><ul className="space-y-2 text-sm text-gray-400"><li><a href={telLink(PRIMARY_PHONE)} className="flex items-center gap-2 hover:text-white"><Phone className="h-4 w-4" />{PRIMARY_PHONE}</a></li><li><a href={whatsappSupportLink('Hello VATTAMS')} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-white"><MessageCircle className="h-4 w-4" />WhatsApp</a></li><li><a href={YOUTUBE_URL} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-white"><PlayCircle className="h-4 w-4" />YouTube {YOUTUBE_CHANNEL}</a></li></ul></div>
        </div>
        <div className="border-t border-gray-800 py-4 text-center text-sm text-gray-500"><p>&copy; {new Date().getFullYear()} VATTAMS Home Services. All rights reserved.</p></div>
      </footer>
    </div>
  )
}
