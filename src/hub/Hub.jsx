import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { hubContent } from './hubContent'
import { topicsContent } from '../topics/topicsContent'
import { daysSinceCheckin } from '../lib/progress'
import { ArrowRight, Sun } from '../components/Icons'

function Chevron({ open }) {
  return (
    <svg className={`concern__chev${open ? ' is-open' : ''}`} width="20" height="20"
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

/**
 * The Companion Hub. The Hero welcomes; then the front door becomes a quiet
 * question — "What would you like help with today?" — answered by a few
 * feelings in the visitor's own voice. Choose a feeling, and it opens to the
 * specific worries within. Recognition, not navigation. One small step at a time.
 */

/**
 * The First Click — clicking a situation opens a small conversation, not a menu.
 * Recognition → a tiny guess → a deliberate pause (so "is that true about me?"
 * lands before the reveal) → one small discovery → a conversational invitation
 * into the existing experience. It should feel like "we started looking together."
 */
function FirstClick({ door, tc, consideringLabel, showAllLabel }) {
  const [phase, setPhase] = useState('ask') // ask | considering | revealed
  const [guess, setGuess] = useState(null)
  const [skipped, setSkipped] = useState(false)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])

  const choose = (i) => {
    if (phase !== 'ask') return
    setGuess(i)
    setPhase('considering')
    timer.current = setTimeout(() => setPhase('revealed'), 1100)
  }
  const showAll = () => { setSkipped(true); setPhase('revealed') }

  return (
    <div className="fc">
      <p className="fc__recognition">{door.recognition}</p>

      <div className="fc__guess">
        <p className="serif fc__q">{door.guess.question}</p>
        <div className="fc__choices" role="group" aria-label={door.guess.question}>
          {door.guess.choices.map((label, i) => (
            <button
              key={i}
              type="button"
              className={`fc__choice${guess === i ? ' is-chosen' : ''}`}
              aria-pressed={guess === i}
              disabled={phase !== 'ask'}
              onClick={() => choose(i)}
            >
              {label}
            </button>
          ))}
        </div>
        {phase === 'ask' && showAllLabel && (
          <button type="button" className="fc__showall" onClick={showAll}>{showAllLabel}</button>
        )}
      </div>

      {phase === 'considering' && (
        <p className="fc__considering">
          <span className="fc__dots" aria-hidden="true"><span /><span /><span /></span>
          <span className="fc__considering-word">{consideringLabel}</span>
        </p>
      )}

      {phase === 'revealed' && (
        <div className="fc__reveal" aria-live="polite">
          {!skipped && <p className="fc__discovery rise">{door.discovery}</p>}
          {!skipped && <p className="fc__invitation rise">{door.invitation}</p>}
          <div className="fc__ways rise">
            {door.ids ? (
              door.ids.map((id) => {
                const t = tc.topics[id]
                if (!t) return null
                return (
                  <Link key={id} to={`/explore/${id}`} className="fc__way">
                    <span className="fc__way-text">{t.title}</span>
                    <ArrowRight size={16} />
                  </Link>
                )
              })
            ) : (
              <Link to="/checkup" className="fc__way fc__way--primary">
                <span className="fc__way-text">{door.wayLabel}</span>
                <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Hub() {
  const { lang } = useLanguage()
  const h = hubContent[lang]
  const hero = h.hero
  const c = h.concerns
  const tc = topicsContent[lang]
  const [checkinDays] = useState(() => daysSinceCheckin())
  const [openDoor, setOpenDoor] = useState(null)
  const checkedInRecently = checkinDays !== null && checkinDays < 25

  return (
    <main className="hub">
      {/* ========================= HERO — the emotional front door ========================= */}
      <section className="hero">
        <div className="hero__inner wrap">
          <div className="hero__welcome">
            <p className="sign sign--amber hero__kicker rise rise-1">{hero.welcome}</p>
            <h1 className="serif hero__headline rise rise-1">{hero.headline}</h1>
            <p className="hero__body rise rise-2">{hero.body}</p>
            {hero.scrollCue && (
              <button
                type="button"
                className="hero__cue rise rise-3"
                onClick={() => document.querySelector('.concerns')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              >
                {hero.scrollCue}
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6" /></svg>
              </button>
            )}
          </div>

          {/* A dawn over a gentle path of small steps — the journey, felt, not explained */}
          <div className="hero__scene rise rise-2" aria-hidden="true">
            <svg className="hero__art" viewBox="0 0 460 360" fill="none" xmlns="http://www.w3.org/2000/svg" role="img">
              <defs>
                <radialGradient id="fineSun" cx="50%" cy="42%" r="62%">
                  <stop offset="0%" stopColor="#f0d69b" />
                  <stop offset="64%" stopColor="#d29a3e" />
                  <stop offset="100%" stopColor="#b1741f" />
                </radialGradient>
                <radialGradient id="fineHalo" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#e6c689" stopOpacity="0.55" />
                  <stop offset="70%" stopColor="#e6c689" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* warm halo */}
              <circle cx="300" cy="214" r="170" fill="url(#fineHalo)" />

              {/* soft rays */}
              <g stroke="#c1802c" strokeWidth="3" strokeLinecap="round" opacity="0.42">
                <line x1="300" y1="104" x2="300" y2="72" />
                <line x1="232" y1="120" x2="214" y2="94" />
                <line x1="368" y1="120" x2="386" y2="94" />
                <line x1="190" y1="176" x2="160" y2="162" />
                <line x1="410" y1="176" x2="440" y2="162" />
              </g>

              {/* the sun, rising over the path */}
              <circle cx="300" cy="214" r="70" fill="url(#fineSun)" />

              {/* a gentle path of small steps toward the light */}
              <path
                d="M40 316 C 120 314, 168 300, 214 280 S 288 244, 300 216"
                stroke="#9c6417" strokeWidth="2.4" strokeLinecap="round"
                strokeDasharray="0.5 13" opacity="0.75"
              />
              <g fill="#efe7d6" stroke="#9c6417" strokeWidth="2.2">
                <circle cx="66" cy="314" r="6.5" />
                <circle cx="150" cy="298" r="6.5" />
                <circle cx="226" cy="272" r="6.5" />
              </g>
            </svg>
          </div>
        </div>
      </section>

      {/* ============ CONCERNS — the question, answered in the visitor's own voice ============ */}
      <section className="concerns wrap" aria-labelledby="concerns-q">
        <header className="concerns__head">
          <h2 id="concerns-q" className="serif concerns__q">{c.question}</h2>
          <p className="concerns__lead">{c.lead}</p>
          <p className="sign concerns__hint">{c.hint}</p>
        </header>

        <ul className="ways">
          {[...c.doors, { ...c.unsure, unsure: true }].map((door, i) => {
            const open = openDoor === i
            return (
              <li key={i} className={`way${door.unsure ? ' way--unsure' : ''}${open ? ' is-open' : ''}`}>
                <button
                  type="button"
                  className="way__head"
                  aria-expanded={open}
                  onClick={() => setOpenDoor(open ? null : i)}
                >
                  <span className="way__text">
                    <span className="serif way__feeling">{door.feeling}</span>
                    <span className="way__reply">{door.reply}</span>
                  </span>
                  <Chevron open={open} />
                </button>

                {open && <FirstClick door={door} tc={tc} consideringLabel={c.considering} showAllLabel={c.showAll} />}
              </li>
            )
          })}
        </ul>
      </section>

      {/* ---------- Planning — a clear, discoverable door to My plans ---------- */}
      <section className="hub-plan wrap" aria-labelledby="hub-plan-title">
        <div className="hub-plan__inner">
          <p className="sign sign--amber">{h.planning.eyebrow}</p>
          <h2 id="hub-plan-title" className="serif hub-plan__title">{h.planning.title}</h2>
          <p className="hub-plan__body">{h.planning.body}</p>
          <Link to="/plans" className="btn btn--primary hub-plan__cta">
            {h.planning.cta}<ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ---------- The promise — a quiet closing inscription, and a way to return ---------- */}
      <section className="room inscription">
        <div className="wrap inscription__inner">
          <span className="inscription__sun" aria-hidden="true"><Sun size={26} /></span>
          <p className="serif inscription__text">{h.trust}</p>
          <Link to="/checkin" className="inscription__return">
            {checkedInRecently ? h.checkin.comeBackNote : h.strip.checkinNudge}
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </main>
  )
}
