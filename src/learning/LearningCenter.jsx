import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { learningContent } from './learningContent'
import { Check, Compass, ArrowRight } from '../components/Icons'

/**
 * The Learning Center — a projection of the Question Inventory.
 * Each entry renders itself according to the SHAPE its question naturally chose
 * (discovery / story / experiment / reflection / example / myth). No sections,
 * no categories, no sources — a browsable field of questions, museum-like.
 */
function Entry({ e, ui, focused }) {
  const revealShape =
    e.shape === 'myth' ||
    e.shape === 'experiment' ||
    ((e.shape === 'discovery' || e.shape === 'story') && e.door === 'question')
  const [open, setOpen] = useState(focused || !revealShape)
  const [moreOpen, setMoreOpen] = useState(false)
  const c = e.content

  const doorway =
    e.door === 'discovery' ? <p className="serif lc-entry__statement">{e.open}</p> :
    e.door === 'story' ? <p className="serif lc-entry__opener">{e.open}</p> :
    <p className="serif lc-entry__q">{e.open}</p>

  return (
    <article id={`q-${e.id}`} className={`lc-entry lc-entry--${e.shape}`}>
      {doorway}

      {/* — the invitation (only for shapes that reveal) — */}
      {!open && e.shape === 'myth' && (
        <>
          <span className="lc-tag lc-tag--myth lc-guess__prompt">{ui.mythPrompt}</span>
          <div className="lc-guess">
            <button type="button" className="lc-guess__btn" onClick={() => setOpen(true)}>{ui.guessYes}</button>
            <button type="button" className="lc-guess__btn" onClick={() => setOpen(true)}>{ui.guessNo}</button>
          </div>
        </>
      )}
      {!open && e.shape === 'experiment' && (
        <>
          <span className="lc-tag lc-tag--myth lc-guess__prompt">{ui.guessPrompt}</span>
          <div className="lc-guess">
            {c.guess.choices.map((ch, i) => (
              <button type="button" key={i} className="lc-guess__btn" onClick={() => setOpen(true)}>{ch}</button>
            ))}
          </div>
        </>
      )}
      {!open && (e.shape === 'discovery' || e.shape === 'story') && e.door === 'question' && (
        <button type="button" className="lc-reveal-btn" onClick={() => setOpen(true)}>
          <ArrowRight size={13} /> {ui.reveal}
        </button>
      )}

      {/* — the unfold (revealed, or shown directly for still exhibits) — */}
      {open && e.shape === 'myth' && (
        <div className="lc-truth rise">
          <span className="lc-tag lc-tag--truth"><Check size={12} /> {ui.truthLabel}</span>
          <p>{c.truth}</p>
        </div>
      )}
      {open && e.shape === 'experiment' && (
        <div className="lc-unfold rise"><p className="lc-lead">{c.reveal}</p></div>
      )}
      {open && e.shape === 'discovery' && e.door === 'question' && (
        <div className="lc-unfold rise">
          <p className="lc-lead">{c.discovery}</p>
          <p className="lc-soft">{c.understanding}</p>
        </div>
      )}
      {e.shape === 'discovery' && e.door === 'discovery' && (
        <p className="lc-soft lc-statement__u">{c.understanding}</p>
      )}
      {open && e.shape === 'story' && e.door === 'question' && (
        <div className="lc-story rise">
          <p className="lc-story__text">{c.story}</p>
          <p className="lc-soft">{c.understanding}</p>
        </div>
      )}
      {e.shape === 'story' && e.door === 'story' && (
        <div className="lc-story">
          <p className="lc-story__text">{c.story}</p>
          <p className="lc-soft">{c.understanding}</p>
        </div>
      )}
      {e.shape === 'reflection' && (
        <div className="lc-reflect">
          <p className="lc-reflect__prompt">{c.prompt}</p>
          <p className="lc-reflect__line">{c.line}</p>
        </div>
      )}
      {e.shape === 'example' && (
        <div className="lc-example">
          <p className="lc-example__eg">{c.example}</p>
          <p className="lc-soft">{c.understanding}</p>
        </div>
      )}

      {/* — optional beats — */}
      {open && e.notice && (
        <p className="lc-notice"><span className="lc-notice__label">{ui.noticeLabel}</span>{e.notice}</p>
      )}
      {open && e.more && (
        moreOpen
          ? <p className="lc-more__text rise">{e.more}</p>
          : <button type="button" className="lc-more" onClick={() => setMoreOpen(true)}>{ui.more}</button>
      )}
    </article>
  )
}

export default function LearningCenter() {
  const { lang } = useLanguage()
  const c = learningContent[lang]
  const focusHash = typeof window !== 'undefined' ? window.location.hash : ''

  return (
    <main className="page page__reading">
      <header className="lc-head rise rise-1">
        <p className="sign sign--amber">{c.header.eyebrow}</p>
        <h1 className="serif lc-head__title">{c.header.title}</h1>
        <p className="lc-head__sub">{c.header.sub}</p>
      </header>

      <section className="lc-inventory" aria-label={c.header.title}>
        {c.entries.map((e) => (<Entry key={e.id} e={e} ui={c.ui} focused={focusHash === `#q-${e.id}`} />))}
      </section>

      <div className="lc-foot">
        <Link to="/" className="btn btn--ghost"><ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} />{lang === 'ko' ? '허브로 돌아가기' : 'Back to the Hub'}</Link>
        <Link to="/roadmap" className="btn btn--primary"><Compass size={17} />{lang === 'ko' ? '내 로드맵 보기' : 'See your roadmap'}</Link>
      </div>
    </main>
  )
}
