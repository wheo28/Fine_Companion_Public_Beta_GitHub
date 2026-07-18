import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { checkupContent } from './checkupContent'
import { formatCurrency } from './scoring'
import { ArrowRight, Sun, ShieldCheck, BookOpen, Check } from '../components/Icons'

function Fields({ c, item }) {
  return (
    <div className="snap-fields">
      <div className="snap-field"><span className="snap-field__label">{c.whatLabel}</span><p>{item.what}</p></div>
      <div className="snap-field"><span className="snap-field__label">{c.whyLabel}</span><p>{item.why}</p></div>
      <div className="snap-field snap-field--step"><span className="snap-field__label">{c.stepLabel}</span><p>{item.step}</p></div>
    </div>
  )
}

function SnapCard({ title, headline, value, caption, meter, band, note, recognition, children }) {
  return (
    <article className="snap-card">
      <p className="snap-card__title">{title}</p>
      <h3 className="snap-card__headline">{headline}</h3>
      {recognition && <p className="snap-card__recognition">{recognition}</p>}
      {value != null && (
        <p className="snap-card__value">{value}{caption && <span className="snap-card__caption">{caption}</span>}</p>
      )}
      {meter != null && (
        <div className="snap-meter" aria-hidden="true">
          <span className={`snap-meter__fill snap-meter__fill--${band}`} style={{ width: `${meter}%` }} />
        </div>
      )}
      {note && <p className="snap-card__note">{note}</p>}
      {children}
    </article>
  )
}

function DetailedBreakdown({ c, result }) {
  const s = c.snapshots
  const currency = result.currency
  const u = result.unknown || {}
  const cf = s.cashflow.states[result.cashflow.state]
  const em = s.emergency.states[result.emergency.state]
  const db = s.debt.states[result.debt.state]
  const ins = s.insurance.states[result.insurance.state]
  const ret = s.retirement.states[result.retirement.state]
  const st = s.stress.states[result.stress.band]
  const rk = s.risk.states[result.risk.band]

  return (
    <div className="snap-grid">
      {!u.cashflow && <SnapCard title={s.cashflow.title} headline={cf.headline} value={formatCurrency(result.cashflow.leftover, currency)} caption={s.cashflow.perMonth}><Fields c={c} item={cf} />{s.cashflow.planBridge && <p className="snap-card__bridge">{s.cashflow.planBridge.lead} <Link to="/plan/cashflow">{s.cashflow.planBridge.label}</Link></p>}</SnapCard>}
      {!u.emergency && <SnapCard title={s.emergency.title} headline={em.headline} recognition={s.emergency.recognition?.[result.emergency.state]} value={result.emergency.monthsDisplay} caption={s.emergency.unit}><Fields c={c} item={em} />{s.emergency.bridge && <p className="snap-card__bridge">{s.emergency.bridge.lead} <Link to="/learning#q-cushion-enough">{s.emergency.bridge.question}</Link></p>}</SnapCard>}
      {!u.debt && <SnapCard title={s.debt.title} headline={db.headline} value={`${result.debt.ratioPct}%`} caption={s.debt.ofIncome}><Fields c={c} item={db} /></SnapCard>}
      {!u.insurance && <SnapCard title={s.insurance.title} headline={ins.headline}><Fields c={c} item={ins} /></SnapCard>}
      {!u.retirement && <SnapCard title={s.retirement.title} headline={ret.headline}><Fields c={c} item={ret} /></SnapCard>}
      {!u.stress && <SnapCard title={s.stress.title} headline={st.headline} value={`${result.stress.score}`} caption={c.scoreOutOf} meter={result.stress.score} band={`stress-${result.stress.band}`}><Fields c={c} item={st} /></SnapCard>}
      {!u.risk && <SnapCard title={s.risk.title} headline={rk.headline} value={`${result.risk.score}`} caption={c.scoreOutOf} meter={result.risk.score} band="risk" note={s.risk.note}><Fields c={c} item={rk} /></SnapCard>}
    </div>
  )
}

function TrailRec({ rm, item }) {
  return (
    <div className="trailrec">
      <p className="trailrec__action">{item.action}</p>
      <p className="trailrec__beat"><span className="trailrec__beat-label">{rm.whyLabel}</span>{item.why}</p>
      <p className="trailrec__beat trailrec__beat--supports"><span className="trailrec__beat-label">{rm.supportsLabel}</span>{item.supports}</p>
    </div>
  )
}

/**
 * A meaning pause — the guide uncovers with a question and waits. The person
 * reflects before anything is said; only if they choose does the guide add one
 * quiet line. The guide's replies grow shorter through Results, then fall silent,
 * so by the end the person's own understanding carries more than the guide's voice.
 */
function MeaningPause({ item, revealLabel }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rx-meaning">
      <p className="serif rx-meaning__q">{item.q}</p>
      {item.a && !open && (
        <button type="button" className="rx-meaning__reveal" onClick={() => setOpen(true)}>
          {revealLabel}<ArrowRight size={14} />
        </button>
      )}
      {item.a && open && <p className="rx-meaning__a rise">{item.a}</p>}
    </div>
  )
}

export default function Results({ result, onRestart }) {
  const { lang } = useLanguage()
  const c = checkupContent[lang].results
  const story = c.story
  const rm = c.roadmap
  const n = result.narrative
  const [showDetails, setShowDetails] = useState(false)
  const [showRoadmap, setShowRoadmap] = useState(false)
  const priority = story.priorityCopy[n.priority]

  const stations = [
    { key: 'today', label: rm.horizons.today, recs: [rm.today[result.roadmap.today]] },
    { key: 'next30', label: rm.horizons.next30, recs: [rm.next30[result.roadmap.next30]] },
    { key: 'habits', label: rm.horizons.habits, recs: rm.habits },
    { key: 'sixTwelve', label: rm.horizons.sixTwelve, recs: [rm.sixTwelve[result.roadmap.sixTwelve]] },
  ]

  return (
    <div className="rx rise rise-1">
      {/* 1 — Thank you (a feeling, honoring the act of looking) */}
      <header className="rx-open">
        <span className="rx-open__sun" aria-hidden="true"><Sun size={30} /></span>
        <p className="sign sign--amber">{story.thanksEyebrow}</p>
        <h1 className="serif rx-open__title">{story.thanksTitle}</h1>
        <p className="rx-open__body">{story.thanksBody}</p>
      </header>

      {/* 2 — Where you are today */}
      <section className="rx-block" aria-label={story.todayLabel}>
        <p className="sign rx-label">{story.todayLabel}</p>
        {!result.unknown?.cashflow && story.cashflowRecognition?.[result.cashflow.state] && (
          <p className="rx-intro">{story.cashflowRecognition[result.cashflow.state]}</p>
        )}
        <p className="serif rx-today__summary">{story.todaySummaries[n.tone]}</p>
      </section>

      {/* 3 — Strengths, before any gap */}
      <section className="rx-block" aria-label={story.strengthsLabel}>
        <p className="sign rx-label">{story.strengthsLabel}</p>
        <p className="rx-intro">{story.strengthsIntro}</p>
        <ul className="rx-strengths__list">
          {n.strengths.map((key) => (
            <li className="rx-strength" key={key}>
              <span className="rx-strength__icon" aria-hidden="true"><Check size={16} /></span>
              <span>{story.strengthCopy[key]}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Meaning begins in strength — the guide uncovers, then waits */}
      {c.meaning && <MeaningPause item={c.meaning.strength} revealLabel={c.meaning.reveal} />}

      {/* 4 + 5 — One priority, in a room */}
      <section className="room rx-priority" aria-label={story.priorityLabel}>
        <div className="rx-priority__inner">
          <p className="sign sign--on-forest rx-priority__label">{story.priorityLabel}</p>
          <p className="rx-priority__intro">{story.priorityIntro}</p>
          <div className="rx-priority__plate">
            <span className="rx-priority__sun" aria-hidden="true"><Sun size={24} /></span>
            <h2 className="serif rx-priority__title">{priority.title}</h2>
            <p className="rx-priority__means">{priority.means}</p>
          </div>
        </div>
      </section>

      {/* The guide, quieter now — a shorter reply, if any */}
      {c.meaning && <MeaningPause item={c.meaning.priority} revealLabel={c.meaning.reveal} />}

      {/* How it connects + why a fresh look helps */}
      <section className="rx-connect" aria-label={story.connectLabel}>
        <div>
          <p className="sign rx-label">{story.connectLabel}</p>
          <p className="rx-connect__body">{story.connectBody}</p>
          {!result.unknown?.cashflow && result.cashflow.leftover > 0 && story.continuity && (
            <p className="rx-connect__body">{story.continuity}</p>
          )}
        </div>
        <div>
          <p className="sign rx-label">{story.revisitLabel}</p>
          <p className="rx-connect__body">{story.revisitBody}</p>
        </div>
      </section>

      {/* The guide falls silent — the meaning here is the person's own to name */}
      {c.meaning && (
        <div className="rx-meaning rx-meaning--close">
          <p className="serif rx-meaning__q">{c.meaning.close.q}</p>
        </div>
      )}

      {/* 7 — Numbers, disclosed on demand, last */}
      <section className="rx-details">
        <button type="button" className="rx-details__toggle" aria-expanded={showDetails} onClick={() => setShowDetails((v) => !v)}>
          {showDetails ? story.detailsHide : story.detailsShow}
          <ArrowRight size={16} className={showDetails ? 'rx-chev rx-chev--up' : 'rx-chev'} />
        </button>
        {showDetails && (
          <div className="rx-details__body">
            <p className="rx-intro">{story.detailsIntro}</p>
            <DetailedBreakdown c={c} result={result} />
          </div>
        )}
      </section>

      {/* Roadmap — the trail. On phones it opens on demand to keep Results calm;
          on larger screens it is always shown (the toggle is hidden by CSS). */}
      <div className="trail-section">
        <button
          type="button"
          className="trail-toggle"
          aria-expanded={showRoadmap}
          onClick={() => setShowRoadmap((v) => !v)}
        >
          {showRoadmap ? story.roadmapHide : story.roadmapShow}
          <ArrowRight size={16} className={showRoadmap ? 'rx-chev rx-chev--up' : 'rx-chev'} />
        </button>
        <div className={`trail-wrap${showRoadmap ? ' is-open' : ''}`}>
          <section className="trail" aria-label={rm.title}>
            <header className="trail__head">
              <p className="sign sign--amber">{rm.eyebrow}</p>
              <h2 className="serif trail__title">{rm.title}</h2>
              <p className="trail__sub">{rm.sub}</p>
            </header>

            {stations.map((st) => (
              <div className="trailstation" key={st.key}>
                <span className="trailstation__dot" aria-hidden="true"><Sun size={15} /></span>
                <p className="trailstation__label">{st.label}</p>
                {st.recs.map((rec, i) => (<TrailRec key={i} rm={rm} item={rec} />))}
              </div>
            ))}

            <div className="trailstation">
              <span className="trailstation__dot" aria-hidden="true"><Sun size={15} /></span>
              <div className="vision room">
                <p className="sign vision__label">{rm.horizons.longterm}</p>
                <p className="serif vision__text">{rm.longterm[result.roadmap.longterm]}</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="ck-disclaimer">
        <ShieldCheck size={16} />
        <p>{c.disclaimer}</p>
      </div>

      <div className="rx-actions">
        <button type="button" className="btn btn--primary" onClick={onRestart}>{c.restart}</button>
        <Link to="/learning" className="btn btn--ghost"><BookOpen size={17} />{c.learn}</Link>
        <Link to="/" className="btn btn--ghost">{c.home}</Link>
      </div>
    </div>
  )
}
