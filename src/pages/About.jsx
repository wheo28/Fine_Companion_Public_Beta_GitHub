import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { ArrowRight } from '../components/Icons'

export default function About() {
  const { t } = useLanguage()
  const a = t.pub.about

  return (
    <main className="page page__reading pubpage">
      <div className="pubpage__inner">
        <p className="sign sign--amber">{t.pub.betaLabel}</p>
        <h1 className="serif pubpage__title">{a.title}</h1>
        <p className="pubpage__tag">{a.tag}</p>

        <section className="pubpage__section" aria-labelledby="about-what">
          <h2 id="about-what" className="pubpage__h2">{a.whatTitle}</h2>
          {a.what.map((p, i) => <p key={i} className="pubpage__p">{p}</p>)}
        </section>

        <section className="pubpage__section" aria-labelledby="about-scope">
          <h2 id="about-scope" className="pubpage__h2">{a.scopeTitle}</h2>
          <ul className="pubpage__list">
            {a.scope.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
          <p className="pubpage__p pubpage__muted">{a.scopeNote}</p>
        </section>

        <section className="pubpage__section" aria-labelledby="about-affil">
          <h2 id="about-affil" className="pubpage__h2">{a.affiliationTitle}</h2>
          <p className="pubpage__p">{a.affiliation}</p>
        </section>

        <section className="pubpage__section" aria-labelledby="about-adv">
          <h2 id="about-adv" className="pubpage__h2">{a.notAdviceTitle}</h2>
          <p className="pubpage__p">{a.notAdvice}</p>
          <p className="pubpage__p">
            <Link className="pubpage__link" to="/privacy">{a.privacyLink}</Link>
          </p>
        </section>

        <Link to="/" className="backlink pubpage__back">
          <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} />
          {t.shell.back}
        </Link>
      </div>
    </main>
  )
}
