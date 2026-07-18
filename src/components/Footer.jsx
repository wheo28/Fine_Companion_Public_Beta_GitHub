import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import LanguageToggle from './LanguageToggle'
import { Horizon } from './Icons'

export default function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <span className="nav__mark" aria-hidden="true">
            <Horizon size={30} />
          </span>
          <div>
            <p className="footer__name">{t.nav.brand}</p>
            <p className="footer__mission">{t.footer.mission}</p>
          </div>
        </div>

        <nav className="footer__col" aria-label={t.footer.colExplore}>
          <p className="footer__col-title">{t.footer.colExplore}</p>
          <Link to="/roadmap">{t.footer.links.roadmap}</Link>
          <Link to="/checkup">{t.footer.links.checkup}</Link>
          <Link to="/learning">{t.footer.links.learning}</Link>
        </nav>

        <nav className="footer__col" aria-label={t.pub.footer.publicTitle}>
          <p className="footer__col-title">{t.pub.footer.publicTitle}</p>
          <Link to="/about">{t.pub.footer.about}</Link>
          <Link to="/privacy">{t.pub.footer.privacy}</Link>
          <Link to="/learning">{t.pub.footer.learning}</Link>
          <Link to="/plans">{t.pub.footer.myPlans}</Link>
          <Link to="/roadmap">{t.pub.footer.roadmap}</Link>
          <Link to="/privacy" className="footer__cleardata">{t.pub.footer.clearData}</Link>
        </nav>

        <nav className="footer__col" aria-label={t.footer.colTrust}>
          <p className="footer__col-title">{t.footer.colTrust}</p>
          <Link to="/learning">{t.footer.links.promise}</Link>
          <div className="footer__lang">
            <span className="footer__lang-label">{t.footer.lang}</span>
            <LanguageToggle onForest />
          </div>
        </nav>
      </div>

      <div className="footer__note">
        <p className="footer__note-title">{t.footer.disclaimerTitle}</p>
        <p>{t.footer.disclaimer}</p>
      </div>

      <div className="footer__base">
        <p>{t.footer.rights}</p>
        <span className="footer__beta" aria-label={t.pub.footer.betaLabel}>{t.pub.release}</span>
      </div>
    </footer>
  )
}
