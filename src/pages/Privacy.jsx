import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { ArrowRight } from '../components/Icons'
import ClearDataControl from '../components/ClearDataControl'

export default function Privacy() {
  const { t } = useLanguage()
  const p = t.pub.privacy

  return (
    <main className="page page__reading pubpage">
      <div className="pubpage__inner">
        <p className="sign sign--amber">{t.pub.betaLabel}</p>
        <h1 className="serif pubpage__title">{p.title}</h1>
        <p className="pubpage__tag">{p.tag}</p>

        <section className="pubpage__section" aria-labelledby="pv-data">
          <h2 id="pv-data" className="pubpage__h2">{p.dataTitle}</h2>
          <ul className="pubpage__list">
            {p.data.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </section>

        <section className="pubpage__section" aria-labelledby="pv-host">
          <h2 id="pv-host" className="pubpage__h2">{p.hostingTitle}</h2>
          <ul className="pubpage__list">
            {p.hosting.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </section>

        <section className="pubpage__section" aria-labelledby="pv-sens">
          <h2 id="pv-sens" className="pubpage__h2">{p.sensitiveTitle}</h2>
          <p className="pubpage__p">{p.sensitiveIntro}</p>
          <ul className="pubpage__list">
            {p.sensitive.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
          <p className="pubpage__p pubpage__muted">{p.sensitiveNote}</p>
        </section>

        <section className="pubpage__section" aria-labelledby="pv-adult">
          <h2 id="pv-adult" className="pubpage__h2">{p.adultsTitle}</h2>
          <p className="pubpage__p">{p.adults}</p>
        </section>

        <section className="pubpage__section" aria-labelledby="pv-fb">
          <h2 id="pv-fb" className="pubpage__h2">{p.feedbackTitle}</h2>
          <ul className="pubpage__list">
            {p.feedback.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </section>

        <section className="pubpage__section" aria-labelledby="pv-remove">
          <h2 id="pv-remove" className="pubpage__h2">{p.removeTitle}</h2>
          <p className="pubpage__p">{p.removeIntro}</p>
          <ClearDataControl />
        </section>

        <Link to="/" className="backlink pubpage__back">
          <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} />
          {t.shell.back}
        </Link>
      </div>
    </main>
  )
}
