import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import LanguageToggle from './LanguageToggle'
import { Horizon } from './Icons'

export default function NavBar() {
  const { t } = useLanguage()
  const { pathname } = useLocation()
  const [scrolled, setScrolled] = useState(false)
  // Avoid a second primary CTA to the checkup: hide it where the page already
  // offers one (the checkup itself, and the roadmap's own start/redo button).
  const showBegin = pathname !== '/checkup' && pathname !== '/roadmap'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`nav${scrolled ? ' nav--scrolled' : ''}`}>
      <div className="nav__inner">
        <Link to="/" className="nav__brand" aria-label={t.nav.brand}>
          <span className="nav__mark" aria-hidden="true">
            <Horizon size={26} />
          </span>
          <span className="nav__brand-text">
            <span className="nav__brand-name">{t.nav.brand}</span>
            <span className="nav__brand-tag">{t.nav.tagline}</span>
          </span>
        </Link>

        <nav className="nav__links" aria-label="Primary">
          <Link className="nav__link" to="/learning">{t.nav.learning}</Link>
          <Link className="nav__link" to="/plans">{t.nav.plans}</Link>
          <Link className="nav__link" to="/roadmap">{t.footer.links.roadmap}</Link>
        </nav>

        <div className="nav__actions">
          <LanguageToggle />
          {showBegin && <Link to="/checkup" className="btn btn--primary btn--sm">{t.nav.begin}</Link>}
        </div>
      </div>
    </header>
  )
}
