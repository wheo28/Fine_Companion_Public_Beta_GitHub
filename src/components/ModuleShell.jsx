import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { ArrowRight, Sun } from './Icons'

export default function ModuleShell({ contentKey }) {
  const { t } = useLanguage()
  const c = t.shell[contentKey]

  return (
    <main className="page page__reading module">
      <div className="module__inner">
        <span className="module__sun" aria-hidden="true"><Sun size={30} /></span>
        <p className="sign sign--amber">{c.eyebrow}</p>
        <h1 className="serif module__title">{c.title}</h1>
        <p className="module__body">{c.body}</p>
        <p className="module__chip">{t.shell.soonLabel}</p>
        <Link to="/" className="backlink module__back">
          <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} />
          {t.shell.back}
        </Link>
      </div>
    </main>
  )
}
