import { createContext, useContext, useState, type ReactNode } from 'react'

type Lang = 'en' | 'ta'
type I18nContextType = { lang: Lang; t: (key: string) => string; setLang: (l: Lang) => void }
const I18nContext = createContext<I18nContextType | undefined>(undefined)

const translations: Record<Lang, Record<string, string>> = {
  en: {
    'nav.home': 'Home', 'nav.services': 'Services', 'nav.pricing': 'Pricing', 'nav.about': 'About', 'nav.contact': 'Contact', 'nav.cities': 'Cities', 'nav.faq': 'FAQ', 'nav.blog': 'Blog', 'nav.reviews': 'Reviews',
    'cta.bookNow': 'Book Now', 'cta.login': 'Login', 'cta.register': 'Register', 'cta.getStarted': 'Get Started',
    'hero.title': 'Professional Home Services in Tamil Nadu', 'hero.subtitle': 'Trained technicians, transparent pricing, and quality service at your doorstep.',
    'footer.rights': 'All rights reserved.',
  },
  ta: {
    'nav.home': 'முகப்பு', 'nav.services': 'சேவைகள்', 'nav.pricing': 'விலை', 'nav.about': 'எங்களை பற்றி', 'nav.contact': 'தொடர்பு', 'nav.cities': 'நகரங்கள்', 'nav.faq': 'கேள்வி பதில்', 'nav.blog': 'வலைப்பதிவு', 'nav.reviews': 'மதிப்புரைகள்',
    'cta.bookNow': 'இப்போது முன்பதிவு', 'cta.login': 'உள்நுழை', 'cta.register': 'பதிவு', 'cta.getStarted': 'தொடங்குங்கள்',
    'hero.title': 'தமிழ்நாட்டில் தொழில்முறை வீட்டு சேவைகள்', 'hero.subtitle': 'பயிற்சி பெற்ற தொழில்நுட்ப வல்லுநர்கள், வெளிப்படையான விலை, மற்றும் உங்கள் வாசலில் தரமான சேவை.',
    'footer.rights': 'அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.',
  },
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en')
  const t = (key: string) => translations[lang][key] || translations.en[key] || key
  return <I18nContext.Provider value={{ lang, t, setLang }}>{children}</I18nContext.Provider>
}
export function useI18n() { const ctx = useContext(I18nContext); if (!ctx) throw new Error('useI18n must be used within I18nProvider'); return ctx }
