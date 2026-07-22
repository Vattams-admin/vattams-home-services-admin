import { type ReactNode, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { Menu, X, Facebook, Instagram, Linkedin, Twitter, Send, CirclePlay as PlayCircle, MessageCircle, Phone, Mail, MapPin } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { useI18n } from '@/lib/i18n'
import { CONTACT } from '@/lib/constants'

export function PublicLayout({ children }: { children?: ReactNode }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const navLinks = [
    { to: '/services', label: t('nav.services') }, { to: '/pricing', label: t('nav.pricing') },
    { to: '/cities', label: t('nav.cities') }, { to: '/about', label: t('nav.about') },
    { to: '/blog', label: t('nav.blog') }, { to: '/reviews', label: t('nav.reviews') },
    { to: '/faq', label: t('nav.faq') }, { to: '/contact', label: t('nav.contact') },
  ]
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Logo />
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map(l => <Link key={l.to} to={l.to} className="text-sm font-medium text-slate-600 hover:text-blue-600">{l.label}</Link>)}
          </nav>
          <div className="hidden lg:flex items-center gap-3">
            <Link to="/connect" className="text-sm font-medium text-slate-700 hover:text-blue-600">Connect</Link>
            <Link to="/admin/login" className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900">Admin</Link>
          </div>
          <button className="lg:hidden" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
        </div>
        {open && (
          <nav className="lg:hidden border-t border-slate-200 bg-white px-4 py-4">
            {navLinks.map(l => <Link key={l.to} to={l.to} className="block py-2 text-sm font-medium text-slate-600 hover:text-blue-600" onClick={() => setOpen(false)}>{l.label}</Link>)}
            <div className="mt-4 flex flex-col gap-3">
              <Link to="/connect" className="rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-medium" onClick={() => setOpen(false)}>Connect</Link>
              <Link to="/admin/login" className="rounded-lg bg-slate-800 px-4 py-2 text-center text-sm font-medium text-white" onClick={() => setOpen(false)}>Admin</Link>
            </div>
          </nav>
        )}
      </header>
      <main className="flex-1">{children || <Outlet />}</main>
      <footer className="border-t border-slate-200 bg-slate-900 text-slate-300">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div><Logo className="h-8 w-8" /><p className="mt-4 text-sm">VATTAMS Home Services - Professional home services across Tamil Nadu.</p></div>
            <div><h3 className="font-semibold text-white">Services</h3><ul className="mt-4 space-y-2 text-sm"><li><Link to="/services">All Services</Link></li><li><Link to="/pricing">Pricing</Link></li><li><Link to="/cities">Service Areas</Link></li></ul></div>
            <div><h3 className="font-semibold text-white">Company</h3><ul className="mt-4 space-y-2 text-sm"><li><Link to="/about">About Us</Link></li><li><Link to="/blog">Blog</Link></li><li><Link to="/contact">Contact</Link></li><li><Link to="/faq">FAQ</Link></li></ul></div>
            <div><h3 className="font-semibold text-white">Contact</h3><ul className="mt-4 space-y-2 text-sm">
              <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> {CONTACT.customerPhone}</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> info@vattams.net</li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Tamil Nadu, India</li>
            </ul>
            <div className="mt-4 flex gap-3">
              <a href={CONTACT.social.facebook} target="_blank" rel="noreferrer" className="hover:text-white"><Facebook className="h-5 w-5" /></a>
              <a href={CONTACT.social.instagram} target="_blank" rel="noreferrer" className="hover:text-white"><Instagram className="h-5 w-5" /></a>
              <a href={CONTACT.social.linkedin} target="_blank" rel="noreferrer" className="hover:text-white"><Linkedin className="h-5 w-5" /></a>
              <a href={CONTACT.social.twitter} target="_blank" rel="noreferrer" className="hover:text-white"><Twitter className="h-5 w-5" /></a>
              <a href={CONTACT.social.telegram} target="_blank" rel="noreferrer" className="hover:text-white"><Send className="h-5 w-5" /></a>
              <a href={CONTACT.social.youtube} target="_blank" rel="noreferrer" className="hover:text-white"><PlayCircle className="h-5 w-5" /></a>
              <a href={CONTACT.social.whatsapp} target="_blank" rel="noreferrer" className="hover:text-white"><MessageCircle className="h-5 w-5" /></a>
            </div></div>
          </div>
          <div className="mt-8 border-t border-slate-800 pt-8 text-center text-sm"><p>&copy; {new Date().getFullYear()} VATTAMS Home Services. {t('footer.rights')}</p></div>
        </div>
      </footer>
    </div>
  )
}
