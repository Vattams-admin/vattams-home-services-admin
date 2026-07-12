import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Phone, MessageCircle, Mail, Menu, X } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { useI18n } from '@/lib/i18n'
import {
  PRIMARY_PHONE_DISPLAY,
  SUPPORT_PHONE_DISPLAY,
  PRIMARY_PHONE,
  SUPPORT_PHONE,
  telLink,
  whatsappSupportLink,
} from '@/lib/constants'

const navLinks = [
  { to: '/', key: 'nav.home' },
  { to: '/services', key: 'nav.services' },
  { to: '/pricing', key: 'nav.pricing' },
  { to: '/cities', key: 'nav.cities' },
  { to: '/blog', key: 'nav.blog' },
  { to: '/about', key: 'nav.about' },
  { to: '/contact', key: 'nav.contact' },
  { to: '/faq', key: 'nav.faq' },
]

const navClass = (isActive: boolean) =>
  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
  }`

export function PublicLayout() {
  const { session, signOut } = useAuth()
  const { t } = useI18n()
  const [mobileOpen, setMobileOpen] = useState(false)

  const dashboardPath = '/dashboard'

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link to="/"><Logo /></Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) => navClass(isActive)}
              >
                {t(l.key)}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {session ? (
              <>
                <Button asChild variant="outline" size="sm">
                  <Link to={dashboardPath}>{t('nav.dashboard')}</Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => signOut()}>
                  {t('nav.logout')}
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">{t('nav.login')}</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/register">{t('nav.register')}</Link>
                </Button>
              </>
            )}
          </div>

          <button
            className="md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t bg-white md:hidden">
            <nav className="flex flex-col px-4 py-2">
              {navLinks.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === '/'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => navClass(isActive)}
              >
                {t(l.key)}
              </NavLink>
              ))}
              <div className="mt-2 flex gap-2 border-t pt-2">
                {session ? (
                  <>
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link to={dashboardPath} onClick={() => setMobileOpen(false)}>
                        {t('nav.dashboard')}
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => { signOut(); setMobileOpen(false) }}
                    >
                      {t('nav.logout')}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link to="/login" onClick={() => setMobileOpen(false)}>
                        {t('nav.login')}
                      </Link>
                    </Button>
                    <Button asChild size="sm" className="flex-1">
                      <Link to="/register" onClick={() => setMobileOpen(false)}>
                        {t('nav.register')}
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1"><Outlet /></main>

      <footer className="border-t bg-gray-900 text-gray-300">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
          <div>
            <div className="mb-3"><Logo /></div>
            <p className="text-sm text-gray-400">
              VATTAMS Home Services — Professional home service providers across Tamil Nadu.
            </p>
          </div>
          <div>
            <h4 className="mb-3 font-semibold text-white">Services</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/services" className="hover:text-white">All Services</Link></li>
              <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
              <li><Link to="/cities" className="hover:text-white">Service Cities</Link></li>
              <li><Link to="/blog" className="hover:text-white">Blog</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-semibold text-white">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-white">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
              <li><Link to="/faq" className="hover:text-white">FAQ</Link></li>
              <li><Link to="/login" className="hover:text-white">Login</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-semibold text-white">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li><a href={telLink(PRIMARY_PHONE)} className="flex items-center gap-2 hover:text-white"><Phone className="h-4 w-4" /> {PRIMARY_PHONE_DISPLAY}</a></li>
              <li><a href={telLink(SUPPORT_PHONE)} className="flex items-center gap-2 hover:text-white"><Phone className="h-4 w-4" /> {SUPPORT_PHONE_DISPLAY}</a></li>
              <li><a href={whatsappSupportLink('Hello VATTAMS, I need help with a service.')} className="flex items-center gap-2 hover:text-white"><MessageCircle className="h-4 w-4" /> WhatsApp Support</a></li>
              <li><a href="mailto:support@vattams.com" className="flex items-center gap-2 hover:text-white"><Mail className="h-4 w-4" /> support@vattams.com</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 py-4 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} VATTAMS Home Services. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
