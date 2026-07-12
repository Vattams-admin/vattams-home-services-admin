import { createContext, useContext, useState, type ReactNode } from 'react'

type Lang = 'en' | 'ta'

type I18nContextType = {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

const translations: Record<string, Record<Lang, string>> = {
  'nav.home': { en: 'Home', ta: 'முகப்பு' },
  'nav.services': { en: 'Services', ta: 'சேவைகள்' },
  'nav.pricing': { en: 'Pricing', ta: 'விலை' },
  'nav.cities': { en: 'Cities', ta: 'நகரங்கள்' },
  'nav.blog': { en: 'Blog', ta: 'வலைப்பதிவு' },
  'nav.about': { en: 'About', ta: 'எங்களைப் பற்றி' },
  'nav.contact': { en: 'Contact', ta: 'தொடர்பு' },
  'nav.faq': { en: 'FAQ', ta: 'கேள்விகள்' },
  'nav.login': { en: 'Login', ta: 'உள்நுழை' },
  'nav.register': { en: 'Register', ta: 'பதிவு' },
  'nav.dashboard': { en: 'Dashboard', ta: 'டாஷ்போர்டு' },
  'nav.logout': { en: 'Logout', ta: 'வெளியேறு' },
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en')
  const t = (key: string) => translations[key]?.[lang] ?? key
  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
