import { useEffect, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { publicBeta } from '../i18n/publicBeta'
import { readClearedMarker, readClearedLang, stripClearedParam } from '../lib/clearData'

// One-time, non-blocking confirmation shown after data removal. The marker (and
// the language the user was using) are read once from the URL query — set by
// ClearDataControl before the reload — then stripped from the URL via
// history.replaceState so a refresh never re-shows it. Nothing is stored in
// localStorage. Rendered as role="status" with aria-live="polite" so screen
// readers announce it. Because clearing also removes the stored language
// preference, the carried language ensures the confirmation appears in the
// language the user was using at the moment of clearing.
export default function ClearDataStatus() {
  const { t, lang } = useLanguage()
  const [state, setState] = useState(null) // { marker, lang }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const marker = readClearedMarker(window.location.search)
    if (!marker) return
    const carriedLang = readClearedLang(window.location.search)
    setState({ marker, lang: carriedLang })
    try {
      const cleaned = stripClearedParam(window.location.search)
      const newUrl = window.location.pathname + cleaned + window.location.hash
      window.history.replaceState(null, '', newUrl)
    } catch {
      /* history unavailable — the message still shows once for this load */
    }
  }, [])

  if (!state) return null
  const copy = (publicBeta[state.lang] || null)?.clearData || t.pub.clearData
  const message = state.marker === 'removed' ? copy.done : copy.nothing

  return (
    <div className="cleardata-status" role="status" aria-live="polite">
      <div className="cleardata-status__inner">
        <span className="cleardata-status__text">{message}</span>
        <button
          type="button"
          className="cleardata-status__dismiss"
          onClick={() => setState(null)}
          aria-label={copy.dismiss}
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </div>
  )
}
