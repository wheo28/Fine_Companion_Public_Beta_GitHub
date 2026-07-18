import { useState, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { checkupContent } from '../checkup/checkupContent'
import { computeResults } from '../checkup/scoring'
import { roadmapContent } from './roadmapContent'
import { topicsContent } from '../topics/topicsContent'
import { getExplored, getPlan, removePlan, getDebtPlan, removeDebtPlan, getEmergencyPlan, removeEmergencyPlan, getGoalPlan, removeGoalPlan, getRetirementPlan, removeRetirementPlan, getInsurancePlan, removeInsurancePlan } from '../lib/progress'
import { validateStoredPlan, planStatus, canEditPlan, readAssessedCashflow, roundPlanAmount, formatPlanAmount } from '../plan/cashflowPlanLogic.js'
import { validateStoredDebtPlan, formatMonths, formatPlanAmount as fmtDebtAmount } from '../plan/debtPlanLogic.js'
import { validateStoredEmergencyPlan, emergencyPlanStatus, canEditEmergency, readAssessedEmergency, formatMonths1, formatPlanAmount as fmtEmAmount } from '../plan/emergencyPlanLogic.js'
import { validateStoredGoalPlan, formatPercent, formatPlanAmount as fmtGoalAmount } from '../plan/goalPlanLogic.js'
import { validateStoredRetirementPlan, formatPercent as fmtRetPct, formatPlanAmount as fmtRetAmount } from '../plan/retirementPlanLogic.js'
import { validateStoredInsurancePlan, formatPercent as fmtInsPct, formatPlanAmount as fmtInsAmount } from '../plan/insurancePlanLogic.js'
import { debtContent } from '../plan/debtContent'
import {
  Sun, ArrowRight, Compass, Lightbulb, BookOpen, Clock,
  Coins, Umbrella, GraduationCap, Scroll, Receipt, TrendingUp, Heart, Scale,
} from '../components/Icons'

const TOPIC_ICONS = { Coins, Umbrella, Clock, GraduationCap, Scroll, Receipt, TrendingUp, Heart, Scale }
const STORAGE_KEY = 'fine-companion.checkup.v1'

function readSaved() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && parsed.answers) return parsed
  } catch { /* ignore */ }
  return null
}

function formatDate(ts, lang) {
  if (!ts) return null
  try { return new Date(ts).toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }) }
  catch { return null }
}

function Rec({ rc, rec }) {
  return (
    <div className="trailrec">
      <p className="trailrec__action">{rec.action}</p>
      <p className="trailrec__beat"><span className="trailrec__beat-label">{rc.whyLabel}</span>{rec.why}</p>
      <div className="trailrec__learn">
        <Lightbulb size={16} aria-hidden="true" />
        <p><span className="trailrec__learn-label">{rc.learnLabel}</span>{rec.learn}</p>
      </div>
      {rec.revisit && (
        <p className="trailrec__revisit">
          <Clock size={13} /><span className="trailrec__revisit-label">{rc.revisitLabel}</span>{rec.revisit}
        </p>
      )}
    </div>
  )
}

function ExploredSection({ rc, items }) {
  if (!items.length) return null
  const ex = rc.explored
  return (
    <section className="explored" aria-label={ex.label}>
      <div className="explored__head">
        <p className="sign explored__label"><Lightbulb size={15} />{ex.label}</p>
        <p className="explored__sub">{ex.sub}</p>
      </div>
      <div className="explored__grid">
        {items.map((t) => {
          const Icon = TOPIC_ICONS[t.icon] || Compass
          return (
            <Link to={`/explore/${t.id}`} className="excard" key={t.id}>
              <p className="excard__topic"><span className="excard__icon" aria-hidden="true"><Icon size={16} /></span>{t.title}</p>
              <p className="excard__title">{t.takeaway.title}</p>
              <div className="excard__step">
                <span className="excard__step-label">{ex.stepLabel}</span>
                <p>{t.takeaway.step}</p>
              </div>
            </Link>
          )
        })}
      </div>
      <Link to="/" className="explored__more">{ex.exploreMore}<ArrowRight size={15} /></Link>
    </section>
  )
}

function EmptyState({ rc, planArea, headingRef }) {
  return (
    <main className="page page__reading">
      <div className="rm-empty rise rise-1">
        <span className="rm-empty__sun" aria-hidden="true"><Sun size={30} /></span>
        <p className="sign sign--amber">{rc.empty.eyebrow}</p>
        <h1 className="serif rm-empty__title" tabIndex={-1} ref={headingRef}>{rc.empty.title}</h1>
        <p className="rm-empty__body">{rc.empty.body}</p>
        <Link to="/checkup" className="btn btn--primary btn--lg" style={{ marginTop: '1.6rem' }}>{rc.empty.cta}<ArrowRight size={18} /></Link>
      </div>
      {planArea}
    </main>
  )
}

function ExploredOnly({ rc, items, planArea, headingRef }) {
  const ex = rc.explored
  return (
    <main className="page page__reading">
      <header className="rm-head rise rise-1">
        <p className="sign sign--amber">{ex.onlyEyebrow}</p>
        <h1 className="serif rm-head__title" tabIndex={-1} ref={headingRef}>{ex.onlyTitle}</h1>
        <p className="rm-head__intro">{ex.onlyBody}</p>
        <Link to="/checkup" className="btn btn--primary" style={{ marginTop: '1.4rem' }}>{ex.onlyCta}<ArrowRight size={17} /></Link>
      </header>
      {planArea}
      <ExploredSection rc={rc} items={items} />
    </main>
  )
}

// Adopted-plan card. Rendered from a validated plan in every Roadmap state
// (full, explored-only, or empty) so a saved plan stays visible and removable
// even without a current Checkup picture. Never reads raw getPlan output.
function RoadmapPlanArea({ plan, planState, editEligible, labels, onRemove }) {
  const negative = roundPlanAmount(plan.scenarioRoom) < 0
  const CF_LEVERS = ['income', 'essentials', 'nonEssentials', 'debt']
  const changedKeys = CF_LEVERS.filter((k) => Object.prototype.hasOwnProperty.call(plan.changes || {}, k))
  return (
    <section className="rm-plan rise rise-2" aria-label={labels.heading}>
      <p className="rm-plan__tag">{labels.chosenByYou}</p>
      <h2 className="serif rm-plan__title">{labels.heading}</h2>
      <p className="rm-plan__sub">{labels.changedHeading}</p>
      <ul className="rm-plan__changes">
        {changedKeys.map((k) => (
          <li key={k} className="rm-plan__change">
            {labels.leverLabels[k]}: {formatPlanAmount(plan.baseline[k], plan.currency)}{' \u2192 '}{formatPlanAmount(plan.changes[k], plan.currency)}
          </li>
        ))}
      </ul>
      <p className="rm-plan__line">{negative ? labels.gapLine : labels.roomLine}: {formatPlanAmount(Math.abs(plan.scenarioRoom), plan.currency)}</p>
      <p className="rm-plan__line">{labels.changeLine}: {formatPlanAmount(plan.change, plan.currency)}</p>
      {planState === 'stale' && <p className="rm-plan__stale">{labels.staleNote}</p>}
      <div className="rm-plan__actions">
        <Link className="btn btn--soft" to="/plan/cashflow?mode=review">{labels.review}</Link>
        {editEligible && <Link className="btn btn--soft" to="/plan/cashflow?mode=edit">{labels.edit}</Link>}
        <Link className="btn btn--soft" to="/plans">{labels.plansPath}</Link>
        <button type="button" className="btn btn--quiet" onClick={onRemove}>{labels.remove}</button>
        {!editEligible && plan.baselineSource === 'checkup' && <Link className="btn btn--quiet" to="/checkup">{labels.checkupPath}</Link>}
      </div>
    </section>
  )
}

function DebtRoadmapArea({ plan, labels, dur, lang, onRemove }) {
  const durChange = plan.scenario.months - plan.current.months
  const interestChange = plan.scenario.totalInterest - plan.current.totalInterest
  const durText = durChange === 0
    ? labels.noChange
    : `${formatMonths(plan.current.months, dur, lang)} \u2192 ${formatMonths(plan.scenario.months, dur, lang)}`
  return (
    <section className="rm-plan rise rise-2" aria-label={labels.heading}>
      <p className="rm-plan__tag">{labels.chosenByYou}</p>
      <h2 className="serif rm-plan__title">{labels.heading}</h2>
      <p className="rm-plan__line">{labels.currentPayment}: {fmtDebtAmount(plan.currentPayment, plan.currency)}</p>
      <p className="rm-plan__line">{labels.chosenPayment}: {fmtDebtAmount(plan.scenarioPayment, plan.currency)}</p>
      <p className="rm-plan__line">{labels.durationChange}: {durText}</p>
      <p className="rm-plan__line">{labels.interestChange}: {interestChange === 0 ? fmtDebtAmount(0, plan.currency) : `${interestChange > 0 ? '+' : '-'}${fmtDebtAmount(Math.abs(interestChange), plan.currency)}`}</p>
      <div className="rm-plan__actions">
        <Link className="btn btn--soft" to="/plan/debt?mode=review">{labels.review}</Link>
        <Link className="btn btn--soft" to="/plan/debt?mode=edit">{labels.edit}</Link>
        <Link className="btn btn--soft" to="/plans">{labels.plansPath}</Link>
        <button type="button" className="btn btn--quiet" onClick={onRemove}>{labels.remove}</button>
      </div>
    </section>
  )
}

function EmergencyRoadmapArea({ plan, labels, status, editEligible, onRemove }) {
  const chg = plan.est.scenMonths - plan.est.curMonths
  const showStale = plan.source === 'checkup' && (status === 'stale' || status === 'no-picture')
  return (
    <section className="rm-plan rise rise-2" aria-label={labels.heading}>
      <p className="rm-plan__tag">{labels.chosenByYou}</p>
      <h2 className="serif rm-plan__title">{labels.heading}</h2>
      {showStale && <p className="rm-plan__status">{labels.stale}</p>}
      <p className="rm-plan__line">{labels.accessible}: {fmtEmAmount(plan.baseline.accessible, plan.currency)}{' \u2192 '}{fmtEmAmount(plan.scenario.accessible, plan.currency)}</p>
      <p className="rm-plan__line">{labels.mustPays}: {fmtEmAmount(plan.baseline.mustPays, plan.currency)}{' \u2192 '}{fmtEmAmount(plan.scenario.mustPays, plan.currency)}</p>
      <p className="rm-plan__line">{labels.months}: {formatMonths1(plan.est.curMonths)}{' \u2192 '}{formatMonths1(plan.est.scenMonths)} {labels.monthsUnit}</p>
      <p className="rm-plan__line">{labels.changeInMonths}: {chg > 0 ? '+' : ''}{formatMonths1(chg)}</p>
      <div className="rm-plan__actions">
        <Link className="btn btn--soft" to="/plan/emergency?mode=review">{labels.review}</Link>
        {editEligible && <Link className="btn btn--soft" to="/plan/emergency?mode=edit">{labels.edit}</Link>}
        {!editEligible && plan.source === 'checkup' && <Link className="btn btn--soft" to="/checkup">{labels.checkupPath}</Link>}
        <Link className="btn btn--soft" to="/plans">{labels.plansPath}</Link>
        <button type="button" className="btn btn--quiet" onClick={onRemove}>{labels.remove}</button>
      </div>
    </section>
  )
}

function GoalRoadmapArea({ plan, labels, goalName, onRemove }) {
  const gap = plan.est.planGap
  const gapLabel = gap > 0 ? labels.remainingGap : gap < 0 ? labels.aboveTarget : labels.exactly
  return (
    <section className="rm-plan rise rise-2" aria-label={labels.heading}>
      <p className="rm-plan__tag">{labels.chosenByYou}</p>
      <h2 className="serif rm-plan__title">{goalName}</h2>
      <p className="rm-plan__line">{labels.target}: {fmtGoalAmount(plan.target, plan.currency)}</p>
      <p className="rm-plan__line">{labels.contribution}: {fmtGoalAmount(plan.plannedContribution, plan.currency)}</p>
      <p className="rm-plan__line">{labels.projected}: {fmtGoalAmount(plan.est.planProjected, plan.currency)}</p>
      <p className="rm-plan__line">{gapLabel}: {fmtGoalAmount(Math.abs(gap), plan.currency)}</p>
      <p className="rm-plan__line">{labels.progress}: {formatPercent(plan.est.planProgress)}</p>
      {plan.returnAssumptionEnabled && plan.annualReturn !== 0 && <p className="rm-plan__line">{labels.annualAssumption}: {formatPercent(plan.annualReturn)}</p>}
      <div className="rm-plan__actions">
        <Link className="btn btn--soft" to="/plan/goal?mode=review">{labels.review}</Link>
        <Link className="btn btn--soft" to="/plan/goal?mode=edit">{labels.edit}</Link>
        <Link className="btn btn--soft" to="/plans">{labels.plansPath}</Link>
        <button type="button" className="btn btn--quiet" onClick={onRemove}>{labels.remove}</button>
      </div>
    </section>
  )
}

function RetirementRoadmapArea({ plan, labels, onRemove }) {
  return (
    <section className="rm-plan rise rise-2" aria-label={labels.heading}>
      <p className="rm-plan__tag">{labels.chosenByYou}</p>
      <h2 className="serif rm-plan__title">{labels.heading}</h2>
      <p className="rm-plan__line">{labels.years}: {plan.years}</p>
      <p className="rm-plan__line">{labels.contribution}: {fmtRetAmount(plan.currentContribution, plan.currency)}{' \u2192 '}{fmtRetAmount(plan.plannedContribution, plan.currency)}</p>
      <p className="rm-plan__line">{labels.annualReturn}: {fmtRetPct(plan.annualReturn)}</p>
      <p className="rm-plan__line">{labels.projected}: {fmtRetAmount(plan.est.planProjected, plan.currency)}</p>
      <p className="rm-plan__line">{labels.balanceDiff}: {plan.balanceDiff > 0 ? '+' : ''}{fmtRetAmount(plan.balanceDiff, plan.currency)}</p>
      {plan.employerActive && <p className="rm-plan__line">{labels.employer}: {fmtRetAmount(plan.employerMonthlyContribution, plan.currency)}</p>}
      {plan.changeActive && <p className="rm-plan__line">{labels.contribChange}: {fmtRetPct(plan.annualContributionChange)}</p>}
      {plan.inflationActive && <p className="rm-plan__line">{labels.inflation}: {fmtRetPct(plan.annualInflation)}</p>}
      {plan.inflationActive && <p className="rm-plan__line">{labels.inToday}: {fmtRetAmount(plan.est.planPurchasingPower, plan.currency)}</p>}
      <div className="rm-plan__actions">
        <Link className="btn btn--soft" to="/plan/retirement?mode=review">{labels.review}</Link>
        <Link className="btn btn--soft" to="/plan/retirement?mode=edit">{labels.edit}</Link>
        <Link className="btn btn--soft" to="/plans">{labels.plansPath}</Link>
        <button type="button" className="btn btn--quiet" onClick={onRemove}>{labels.remove}</button>
      </div>
    </section>
  )
}

function InsuranceRoadmapArea({ plan, labels, onRemove }) {
  const bucketLabel = labels[plan.explored.bucket]
  return (
    <section className="rm-plan rise rise-2" aria-label={labels.heading}>
      <p className="rm-plan__tag">{labels.chosenByYou}</p>
      <h2 className="serif rm-plan__title">{labels.heading}</h2>
      <p className="rm-plan__line">{labels.responsibilities}: {fmtInsAmount(plan.est.responsibilities, plan.currency)}</p>
      <p className="rm-plan__line">{labels.coverage}: {fmtInsAmount(plan.currentCoverage, plan.currency)}{' \u2192 '}{fmtInsAmount(plan.exploredCoverage, plan.currency)}</p>
      <p className="rm-plan__line">{bucketLabel}: {fmtInsAmount(Math.abs(plan.explored.diff), plan.currency)}</p>
      <p className="rm-plan__line">{labels.share}: {fmtInsPct(plan.explored.share)}</p>
      <div className="rm-plan__actions">
        <Link className="btn btn--soft" to="/plan/insurance?mode=review">{labels.review}</Link>
        <Link className="btn btn--soft" to="/plan/insurance?mode=edit">{labels.edit}</Link>
        <Link className="btn btn--soft" to="/plans">{labels.plansPath}</Link>
        <button type="button" className="btn btn--quiet" onClick={onRemove}>{labels.remove}</button>
      </div>
    </section>
  )
}

export default function RoadmapView() {
  const { lang } = useLanguage()
  const rc = roadmapContent[lang]
  const base = checkupContent[lang].results.roadmap
  const tc = topicsContent[lang]
  const [saved] = useState(() => readSaved())
  const [exploredMap] = useState(() => getExplored())
  const [validatedPlan, setValidatedPlan] = useState(() => validateStoredPlan(getPlan()))
  const [validatedDebtPlan, setValidatedDebtPlan] = useState(() => validateStoredDebtPlan(getDebtPlan()))
  const [validatedEmPlan, setValidatedEmPlan] = useState(() => validateStoredEmergencyPlan(getEmergencyPlan()))
  const [validatedGoalPlan, setValidatedGoalPlan] = useState(() => validateStoredGoalPlan(getGoalPlan()))
  const [validatedRetPlan, setValidatedRetPlan] = useState(() => validateStoredRetirementPlan(getRetirementPlan()))
  const [validatedInsPlan, setValidatedInsPlan] = useState(() => validateStoredInsurancePlan(getInsurancePlan()))
  const planAssessed = useMemo(() => readAssessedCashflow(), [])
  const emAssessed = useMemo(() => readAssessedEmergency(), [])
  const planState = validatedPlan ? planStatus(validatedPlan, planAssessed) : 'none'
  const h = rc.header
  const dur = debtContent[lang].duration
  const headingRef = useRef(null)

  function handleRemovePlan() {
    removePlan()
    setValidatedPlan(null)
    // After the plan card disappears, move focus to a stable Roadmap heading.
    requestAnimationFrame(() => headingRef.current?.focus())
  }

  function handleRemoveDebtPlan() {
    removeDebtPlan()
    setValidatedDebtPlan(null)
    requestAnimationFrame(() => headingRef.current?.focus())
  }

  function handleRemoveEmPlan() {
    removeEmergencyPlan()
    setValidatedEmPlan(null)
    requestAnimationFrame(() => headingRef.current?.focus())
  }

  function handleRemoveGoalPlan() {
    removeGoalPlan()
    setValidatedGoalPlan(null)
    requestAnimationFrame(() => headingRef.current?.focus())
  }

  function handleRemoveRetPlan() {
    removeRetirementPlan()
    setValidatedRetPlan(null)
    requestAnimationFrame(() => headingRef.current?.focus())
  }

  function handleRemoveInsPlan() {
    removeInsurancePlan()
    setValidatedInsPlan(null)
    requestAnimationFrame(() => headingRef.current?.focus())
  }

  const goalName = validatedGoalPlan
    ? (validatedGoalPlan.goalType === 'education' ? (lang === 'ko' ? '교육' : 'Education') : validatedGoalPlan.goalName)
    : ''

  // Cash Flow, Debt, Emergency, Goal, Retirement, and Protection plans can all coexist.
  const planArea = (validatedPlan || validatedDebtPlan || validatedEmPlan || validatedGoalPlan || validatedRetPlan || validatedInsPlan) ? (
    <>
      {validatedPlan && (
        <RoadmapPlanArea
          plan={validatedPlan}
          planState={planState}
          editEligible={canEditPlan(validatedPlan, planAssessed)}
          labels={h.plan}
          onRemove={handleRemovePlan}
        />
      )}
      {validatedDebtPlan && (
        <DebtRoadmapArea
          plan={validatedDebtPlan}
          labels={h.debtPlan}
          dur={dur}
          lang={lang}
          onRemove={handleRemoveDebtPlan}
        />
      )}
      {validatedEmPlan && (
        <EmergencyRoadmapArea
          plan={validatedEmPlan}
          labels={h.emergencyPlan}
          status={emergencyPlanStatus(validatedEmPlan, emAssessed)}
          editEligible={canEditEmergency(validatedEmPlan, emAssessed)}
          onRemove={handleRemoveEmPlan}
        />
      )}
      {validatedGoalPlan && (
        <GoalRoadmapArea
          plan={validatedGoalPlan}
          labels={h.goalPlan}
          goalName={goalName}
          onRemove={handleRemoveGoalPlan}
        />
      )}
      {validatedRetPlan && (
        <RetirementRoadmapArea
          plan={validatedRetPlan}
          labels={h.retirementPlan}
          onRemove={handleRemoveRetPlan}
        />
      )}
      {validatedInsPlan && (
        <InsuranceRoadmapArea
          plan={validatedInsPlan}
          labels={h.insurancePlan}
          onRemove={handleRemoveInsPlan}
        />
      )}
    </>
  ) : null

  const exploredItems = tc.order.filter((id) => exploredMap[id]).map((id) => ({ id, ...tc.topics[id] }))

  if (!saved) {
    if (exploredItems.length) return <ExploredOnly rc={rc} items={exploredItems} planArea={planArea} headingRef={headingRef} />
    return <EmptyState rc={rc} planArea={planArea} headingRef={headingRef} />
  }

  const result = computeResults(saved.answers)
  const n = result.narrative
  const dateStr = formatDate(saved.ts, lang)

  const stations = [
    { key: 'today', label: rc.horizons.today.label, lead: rc.horizons.today.lead,
      recs: [{ ...base.today[result.roadmap.today], learn: rc.learn.today[result.roadmap.today], revisit: rc.revisit.today }] },
    { key: 'next30', label: rc.horizons.next30.label, lead: rc.horizons.next30.lead,
      recs: [{ ...base.next30[result.roadmap.next30], learn: rc.learn.next30[result.roadmap.next30], revisit: rc.revisit.next30 }] },
    { key: 'habits', label: rc.horizons.habits.label, lead: rc.horizons.habits.lead,
      recs: base.habits.map((hb, i) => ({ ...hb, learn: rc.habitsLearn[i], revisit: rc.revisit.habits })) },
    { key: 'sixTwelve', label: rc.horizons.sixTwelve.label, lead: rc.horizons.sixTwelve.lead,
      recs: [{ ...base.sixTwelve[result.roadmap.sixTwelve], learn: rc.learn.sixTwelve[result.roadmap.sixTwelve], revisit: rc.revisit.sixTwelve }] },
  ]

  const chips = [
    { label: h.chips.focus, value: h.focusLabel[n.priority] },
    { label: h.chips.emergency, value: result.unknown?.emergency ? '\u2014' : `${result.emergency.monthsDisplay} ${h.months}` },
    { label: h.chips.cashflow, value: h.cashflowStates[result.cashflow.state] },
    { label: h.chips.stress, value: h.stressBands[result.stress.band] },
  ]

  // A gentle, optional steering invitation for the non-deficit states — the short
  // state keeps its full priority station and is intentionally left out here.
  const cfSteer =
    !result.unknown?.cashflow && ['even', 'healthy', 'strong'].includes(result.cashflow.state)
      ? h.cashflowSteer[result.cashflow.state]
      : null

  return (
    <main className="page page__reading">
      <header className="rm-head rise rise-1">
        <p className="sign sign--amber">{h.eyebrow}</p>
        <h1 className="serif rm-head__title" tabIndex={-1} ref={headingRef}>{h.title}</h1>
        <p className="rm-head__intro">{h.intros[n.tone]}</p>
        <p className="rm-head__focus">{h.focusLinePrefix}<strong>{h.focusLabel[n.priority]}</strong>{h.focusLineSuffix}</p>

        <div className="rm-recap">
          <p className="rm-recap__label">{h.recapLabel}{dateStr ? ` · ${h.based} ${dateStr}` : ''}</p>
          <div className="rm-chips">
            {chips.map((chip) => (
              <span className="rm-chip" key={chip.label}>
                <span className="rm-chip__k">{chip.label}</span>
                <span className="rm-chip__v">{chip.value}</span>
              </span>
            ))}
          </div>
          {cfSteer && (
            <p className="rm-ongoing rm-steer"><Lightbulb size={14} />{h.cashflowSteer.label}: {cfSteer}</p>
          )}
          <p className="rm-ongoing"><Compass size={14} />{h.ongoing}</p>
        </div>
      </header>

      <div className="trail">
        {planArea}

        {stations.map((st) => (
          <div className="trailstation" key={st.key}>
            <span className="trailstation__dot" aria-hidden="true"><Sun size={15} /></span>
            <p className="trailstation__label">{st.label}</p>
            <p className="trailstation__lead">{st.lead}</p>
            {st.recs.map((rec, i) => (<Rec key={i} rc={rc} rec={rec} />))}
          </div>
        ))}

        <div className="trailstation">
          <span className="trailstation__dot" aria-hidden="true"><Sun size={15} /></span>
          <p className="trailstation__label">{rc.horizons.fiveYear.label}</p>
          <div className="vision room">
            <p className="sign vision__label">{rc.horizons.fiveYear.label}</p>
            <p className="vision__lead">{rc.horizons.fiveYear.lead}</p>
            <p className="serif vision__text">{rc.vision[result.roadmap.longterm]}</p>
            <div className="vision__learn">
              <Lightbulb size={16} aria-hidden="true" />
              <p><span className="vision__learn-label">{rc.learnLabel}</span>{rc.vision.learn}</p>
            </div>
          </div>
        </div>
      </div>

      <ExploredSection rc={rc} items={exploredItems} />

      <div className="rx-actions">
        <Link to="/checkup" className="btn btn--primary">{rc.actions.retake}</Link>
        <Link to="/learning" className="btn btn--ghost"><BookOpen size={17} />{rc.actions.learn}</Link>
        <Link to="/" className="btn btn--ghost">{rc.actions.home}</Link>
      </div>
    </main>
  )
}
