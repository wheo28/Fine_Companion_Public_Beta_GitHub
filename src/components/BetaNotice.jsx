import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'

// Calm, non-blocking public-beta notice. Shown once on the main entry (not on
// every result card). Dismissible for the session; the Public Beta label stays
// visible in the footer and on the About page regardless.
export default function BetaNotice() {
  const { t } = useLanguage()
  const n = t.pub.notice
  const [open, setOpen] = useState(true)
  if (!open) return null

  return (
    <aside className="beta-notice" role="note" aria-label={n.label}>
      <div className="beta-notice__inner">
        <span className="beta-notice__badge">{n.label}</span>
        <p className="beta-notice__text">
          {n.body} <Link className="beta-notice__link" to="/about">{n.more}</Link>
        </p>
        <button
          type="button"
          className="beta-notice__dismiss"
          onClick={() => setOpen(false)}
          aria-label={n.dismiss}
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </aside>
  )
}
