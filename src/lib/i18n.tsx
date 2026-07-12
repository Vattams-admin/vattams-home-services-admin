import { createContext, useContext, useState, type ReactNode } from 'react'

type Lang = 'EN' | 'TA'
type I18nContextType = { lang: Lang; setLang: (l: Lang) => void; t: (key: string) => string }

const translations: Record<Lang, Record<string, string>> = {
  EN: { 'nav.home': 'Home', 'nav.services': 'Services', 'nav.pricing': 'Pricing', 'nav.about': 'About', 'nav.contact': 'Contact', 'nav.cities': 'Cities', 'nav.faq': 'FAQ', 'nav.blog': 'Blog', 'nav.login': 'Login', 'nav.register': 'Register', 'nav.dashboard': 'Dashboard', 'nav.logout': 'Logout', 'btn.bookNow': 'Book Now', 'btn.getStarted': 'Get Started', 'hero.title': 'Professional Home Services at Your Doorstep', 'hero.subtitle': 'AC service, washing machine repair, plumbing, electrical and more across Tamil Nadu' },
  TA: { 'nav.home': 'முகப்பு', 'nav.services': 'சேவைகள்', 'nav.pricing': 'விலை', 'nav.about': 'எங்களைப் பற்றி', 'nav.contact': 'தொடர்பு', 'nav.cities': 'நகரங்கள்', 'nav.faq': 'கேள்விகள்', 'nav.blog': 'வலைப்பதிவு', 'nav.login': 'உள்நுழை', 'nav.register': 'பதிவு', 'nav.dashboard': 'டாஷ்போர்டு', 'nav.logout': 'வெளியேறு', 'btn.bookNow': 'இப்போது முன்பதிவு', 'btn.getStarted': 'தொடங்குங்கள்', 'hero.title': 'உங்கள் வாசலில் தொழில்முறை வீட்டு சேவைகள்', 'hero.subtitle': 'ஏசி சர்வீஸ், வாஷிங் மெஷின், பிளம்பிங், எலக்ட்ரிக்கல் மற்றும் பல' },
}

const I18nContext = createContext<I18nContextType>({} as I18nContextType)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('EN')
  const t = (key: string) => translations[lang][key] || translations.EN[key] || key
  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>
}

export function useI18n() { return useContext(I18nContext) }
