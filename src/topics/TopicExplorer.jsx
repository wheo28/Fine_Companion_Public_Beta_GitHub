import { useState } from 'react'
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { topicsContent } from './topicsContent'
import { markExplored } from '../lib/progress'
import {
  ArrowRight, Compass, Sun, Check, Coins, Umbrella, Clock,
  GraduationCap, Scroll, Receipt, TrendingUp, Heart, Scale,
} from '../components/Icons'

const ICONS = { Coins, Umbrella, Clock, GraduationCap, Scroll, Receipt, TrendingUp, Heart, Scale }

function Beat({ ui, beat }) {
  if (beat.kind === 'myth') {
    return (
      <div className="beat beat--myth">
        <p className="sign beat__label">{ui.beatLabels.myth}</p>
        <div className="myth">
          <div className="myth__row myth__row--myth">
            <span className="myth__tag">{ui.mythLabel}</span>
            <p>{beat.myth}</p>
          </div>
          <div className="myth__row myth__row--truth">
            <span className="myth__tag"><Check size={12} /> {ui.truthLabel}</span>
            <p>{beat.truth}</p>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="beat">
      <p className="sign beat__label">{ui.beatLabels[beat.kind]}</p>
      {beat.title && <h2 className="serif beat__title">{beat.title}</h2>}
      <p className="beat__body">{beat.body}</p>
    </div>
  )
}

export default function TopicExplorer() {
  const { topicId } = useParams()
  const { lang } = useLanguage()
  const navigate = useNavigate()
  const data = topicsContent[lang]
  const topic = data.topics[topicId]
  const ui = data.ui
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)

  if (!topic) return <Navigate to="/" replace />

  const Icon = ICONS[topic.icon] || Compass
  const pages = ['intro', ...topic.beats.map((_, i) => `beat-${i}`), 'takeaway']
  const total = pages.length
  const current = pages[step]

  const go = (dir) => { setStep((s) => Math.min(total - 1, Math.max(0, s + dir))); window.scrollTo({ top: 0 }) }
  const finish = () => { markExplored(topicId); setDone(true); window.scrollTo({ top: 0 }) }

  if (done) {
    return (
      <main className="page page__reading">
        <div className="done rise rise-1">
          <span className="done__sun" aria-hidden="true"><Sun size={30} /></span>
          <p className="done__added"><Check size={13} /> {ui.addedNote}</p>
          <h1 className="serif done__title">{ui.doneTitle}</h1>
          <p className="done__body">{ui.doneBody}</p>

          <div className="done__recap">
            <span className="done__recap-label">{ui.learnedLabel}</span>
            <p className="done__recap-title">{topic.takeaway.title}</p>
            <div className="done__recap-step">
              <span className="done__recap-step-label">{ui.stepLabel}</span>
              <p>{topic.takeaway.step}</p>
            </div>
          </div>

          <div className="done__actions">
            {topicId === 'cashflow' && ui.planBridge && <Link to="/plan/cashflow" className="btn btn--primary" onClick={() => markExplored('cashflow')}>{ui.planBridge.label}</Link>}
            {topicId === 'education' && ui.goalBridge && <Link to="/plan/goal?type=education" className="btn btn--primary" onClick={() => markExplored('education')}>{ui.goalBridge.label}</Link>}
            {topicId === 'retirement' && ui.retirementBridge && <Link to="/plan/retirement" className="btn btn--primary" onClick={() => markExplored('retirement')}>{ui.retirementBridge.label}</Link>}
            {topicId === 'insurance' && ui.insuranceBridge && <Link to="/plan/insurance" className="btn btn--primary" onClick={() => markExplored('insurance')}>{ui.insuranceBridge.label}</Link>}
            <Link to="/" className="btn btn--primary">{ui.backToHub}</Link>
            <Link to="/roadmap" className="btn btn--ghost"><Compass size={17} />{lang === 'ko' ? '로드맵 보기' : 'See your path'}</Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="page page__reading">
      <div className="reading__top">
        <Link to="/" className="backlink">
          <ArrowRight size={15} style={{ transform: 'rotate(180deg)' }} />{ui.backToHub}
        </Link>
        <span className="reading__count">{step + 1} {ui.of} {total}</span>
      </div>
      <div className="reading__leaves" aria-hidden="true">
        {pages.map((p, i) => (
          <span key={p} className={`rleaf${i < step ? ' is-on' : ''}${i === step ? ' is-cur' : ''}`} />
        ))}
      </div>

      <div className="reading__panel" key={current}>
        {current === 'intro' && (
          <div className="reading-intro">
            <span className="reading-intro__sun" aria-hidden="true"><Icon size={28} /></span>
            <p className="sign sign--amber">{ui.introEyebrow}</p>
            <h1 className="serif reading-intro__title">{topic.title}</h1>
            <p className="reading-intro__lead">{topic.tagline}</p>
            <div className="reframe">
              <div className="reframe__row reframe__row--from">
                <span className="reframe__label">{ui.instead}</span>
                <p>{topic.reframe.from}</p>
              </div>
              <div className="reframe__arrow" aria-hidden="true"><ArrowRight size={20} style={{ transform: 'rotate(90deg)' }} /></div>
              <div className="reframe__row reframe__row--to">
                <span className="reframe__label">{ui.understand}</span>
                <p>{topic.reframe.to}</p>
              </div>
            </div>
          </div>
        )}

        {current && current.startsWith('beat-') && (
          <Beat ui={ui} beat={topic.beats[Number(current.split('-')[1])]} />
        )}

        {current === 'takeaway' && (
          <div className="takeaway">
            <span className="takeaway__sun" aria-hidden="true"><Sun size={24} /></span>
            <p className="sign takeaway__label">{ui.takeawayLabel}</p>
            <h2 className="serif takeaway__title">{topic.takeaway.title}</h2>
            <div className="takeaway__step">
              <span className="takeaway__step-label">{ui.stepLabel}</span>
              <p>{topic.takeaway.step}</p>
            </div>
            {topic.curiosity && (
              <p className="takeaway__curiosity">
                <span className="sign">{ui.curiosityLead}</span>{' '}
                <Link to={`/learning#q-${topic.curiosity.entryId}`} className="takeaway__curiosity-link" onClick={() => markExplored(topicId)}>
                  {topic.curiosity.question}<ArrowRight size={14} />
                </Link>
              </p>
            )}
          </div>
        )}
      </div>

      <div className="reading__nav">
        <button type="button" className="btn btn--ghost" onClick={() => (step === 0 ? navigate('/') : go(-1))}>{ui.prev}</button>
        {current === 'takeaway' ? (
          <button type="button" className="btn btn--primary" onClick={finish}>{ui.finish}<Check size={17} /></button>
        ) : (
          <button type="button" className="btn btn--primary" onClick={() => go(1)}>{step === 0 ? ui.start : ui.next}<ArrowRight size={17} /></button>
        )}
      </div>
    </main>
  )
}
