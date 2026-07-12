import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/App'
import { I18nProvider } from '@/lib/i18n'
import { ToastProvider } from '@/hooks/use-toast'
import '@/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </I18nProvider>
  </StrictMode>,
)
