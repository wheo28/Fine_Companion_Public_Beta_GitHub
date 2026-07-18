import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { translations } from './translations'
import { publicBeta } from './publicBeta'

const STORAGE_KEY = 'fine-companion.lang'
const DEFAULT_LANG = 'en'

const LanguageContext = createContext(null)

function readInitialLang() {
  if (typeof window === 'undefined') return DEFAULT_LANG
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored && translations[stored]) return stored
  } catch {
    /* localStorage unavailable — fall through to default */
  }
  return DEFAULT_LANG
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(readInitialLang)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      /* ignore persistence failures (e.g. private mode) */
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang
      const title = translations[lang]?.meta?.title
      if (title) document.title = title
    }
  }, [lang])

  const toggle = useCallback(() => {
    setLang((current) => (current === 'en' ? 'ko' : 'en'))
  }, [])

  const value = {
    lang,
    setLang,
    toggle,
    t: { ...translations[lang], pub: publicBeta[lang] },
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return ctx
}
