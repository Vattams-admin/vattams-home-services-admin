import { Link } from 'react-router-dom';
import {
  ShieldCheck, Clock, BadgeIndianRupee, Headphones, ArrowRight,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSEO } from '@/lib/seo';
import { whatsappBookingLink, telLink, PRIMARY_PHONE } from '@/lib/constants';
import { MessageCircle, Phone } from 'lucide-react';

const services = [
  { name: 'AC Service', desc: 'AC repair, installation & servicing' },
  { name: 'Deep Cleaning', desc: 'Home & kitchen deep cleaning' },
  { name: 'Plumbing', desc: 'Leaks, fittings & installations' },
  { name: 'Electrical', desc: 'Wiring, repairs & installations' },
  { name: 'Painting', desc: 'Interior & exterior painting' },
  { name: 'Pest Control', desc: 'Termite & general pest control' },
];

const features = [
  { icon: ShieldCheck, title: 'Verified Technicians', desc: 'Background-checked & skilled pros' },
  { icon: Clock, title: 'On-Time Service', desc: 'Punctual and reliable visits' },
  { icon: BadgeIndianRupee, title: 'Transparent Pricing', desc: 'No hidden charges, upfront quotes' },
  { icon: Headphones, title: '24/7 Support', desc: 'Round-the-clock customer care' },
];

export function HomePage() {
  const { t } = useI18n();
  useSEO({ title: 'VATTAMS Home Services — Trusted Home Services Across Tamil Nadu', description: 'Book trusted home services in minutes — AC repair, deep cleaning, plumbing, electrical & more. Verified technicians, transparent pricing.' });

  return (
    <div className="space-y-16 pb-16">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center">
          <Logo size="lg" className="mb-6 justify-center text-white [&_span]:text-white" />
          <h1 className="text-4xl font-bold md:text-5xl">{t('home.hero_title')}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-blue-100">{t('home.hero_subtitle')}</p>
          <Button asChild size="lg" variant="secondary" className="mt-8 bg-white text-blue-700 hover:bg-blue-50">
            <Link to="/register/customer">{t('home.book_now')} <ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" variant="secondary" className="bg-white text-green-700 hover:bg-green-50">
              <a href={whatsappBookingLink('Hello VATTAMS, I would like to book a service.')} target="_blank" rel="noopener"><MessageCircle className="mr-2 h-5 w-5" /> WhatsApp Booking</a>
            </Button>
            <Button asChild size="lg" variant="secondary" className="bg-white text-blue-700 hover:bg-blue-50">
              <a href={telLink(PRIMARY_PHONE)}><Phone className="mr-2 h-5 w-5" /> Call Now</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="mx-auto max-w-7xl px-4">
        <h2 className="mb-8 text-center text-3xl font-bold">{t('home.our_services')}</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map(({ name, desc }) => (
            <Card key={name} className="transition-shadow hover:shadow-md">
              <CardContent className="flex flex-col items-center p-6 text-center">
                <h3 className="text-lg font-semibold">{name}</h3>
                <p className="mt-2 text-sm text-gray-600">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button asChild variant="outline"><Link to="/services">{t('home.view_all')} <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </div>
      </section>

      {/* Why Choose */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-8 text-center text-3xl font-bold">{t('home.why_choose')}</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600">
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="rounded-2xl bg-blue-600 px-8 py-12 text-center text-white">
          <h2 className="text-3xl font-bold">Ready to book your service?</h2>
          <p className="mt-2 text-blue-100">Get started in minutes with VATTAMS Home Services</p>
          <Button asChild size="lg" className="mt-6 bg-white text-blue-700 hover:bg-blue-50">
            <Link to="/register/customer">{t('home.book_now')} <ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
