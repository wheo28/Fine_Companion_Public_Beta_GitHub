import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { plansContent } from './plansContent'
import { getPlan, removePlan, getDebtPlan, removeDebtPlan, getEmergencyPlan, removeEmergencyPlan, getGoalPlan, removeGoalPlan, getRetirementPlan, removeRetirementPlan, getInsurancePlan, removeInsurancePlan } from '../lib/progress'
import { validateStoredPlan, planStatus, canEditPlan, readAssessedCashflow, roundPlanAmount, formatPlanAmount, LEVERS } from '../plan/cashflowPlanLogic.js'
import { validateStoredDebtPlan, formatMonths, formatPlanAmount as fmtDebtAmount } from '../plan/debtPlanLogic.js'
import { validateStoredEmergencyPlan, emergencyPlanStatus, canEditEmergency, readAssessedEmergency, formatMonths1, formatPlanAmount as fmtEmAmount } from '../plan/emergencyPlanLogic.js'
import { validateStoredGoalPlan, formatPercent, formatPlanAmount as fmtGoalAmount } from '../plan/goalPlanLogic.js'
import { validateStoredRetirementPlan, formatPercent as fmtRetPct, formatPlanAmount as fmtRetAmount } from '../plan/retirementPlanLogic.js'
import { validateStoredInsurancePlan, formatPercent as fmtInsPct, formatPlanAmount as fmtInsAmount } from '../plan/insurancePlanLogic.js'
import { planContent } from '../plan/planContent'
import { debtContent } from '../plan/debtContent'
import { ArrowRight, Sun } from '../components/Icons'

function CashFlowCard({ c, pl, plan, status, editEligible, onRemove }) {
  const negative = roundPlanAmount(plan.scenarioRoom) < 0
  const changedKeys = LEVERS.filter((k) => Object.prototype.hasOwnProperty.call(plan.changes, k))
  return (
    <section className="plans-card" aria-label={c.card.title}>
      <p className="plans-card__tag">{c.card.chosenByYou}</p>
      <h3 className="serif plans-card__title">{c.card.title}</h3>
      <p className="plans-card__source">{plan.baselineSource === 'planning' ? c.card.sourcePlanning : c.card.sourceCheckup}</p>
      <p className="plans-card__sub">{c.card.changedHeading}</p>
      <ul className="plans-card__changes">
        {changedKeys.map((k) => (
          <li key={k} className="plans-card__change">
            <span className="plans-card__k">{pl.leverLabels[k]}</span>
            <span className="plans-card__v">{formatPlanAmount(plan.baseline[k], plan.currency)}{' \u2192 '}{formatPlanAmount(plan.changes[k], plan.currency)}</span>
          </li>
        ))}
      </ul>
      <div className="plans-card__totals">
        <p className="plans-card__line plans-card__line--main">{negative ? c.card.gapLine : c.card.roomLine}: {formatPlanAmount(Math.abs(plan.scenarioRoom), plan.currency)}</p>
        <p className="plans-card__line">{c.card.totalChange}: {formatPlanAmount(plan.change, plan.currency)}</p>
      </div>
      {plan.baselineSource === 'checkup' && (
        <p className={`plans-card__status plans-card__status--${status === 'fresh' ? 'fresh' : 'stale'}`}>{status === 'fresh' ? c.card.fresh : c.card.stale}</p>
      )}
      <div className="plans-card__actions">
        <Link className="btn btn--soft" to="/plan/cashflow?mode=review">{c.card.review}</Link>
        {editEligible && <Link className="btn btn--soft" to="/plan/cashflow?mode=edit">{c.card.edit}</Link>}
        <Link className="btn btn--soft" to="/roadmap">{c.card.openRoadmap}</Link>
        {!editEligible && plan.baselineSource === 'checkup' && <Link className="btn btn--soft" to="/checkup">{c.card.checkupPath}</Link>}
        <button type="button" className="btn btn--quiet" onClick={onRemove}>{c.card.remove}</button>
      </div>
    </section>
  )
}

function DebtCard({ dc, dur, plan, lang, onRemove }) {
  const interestDiff = plan.scenario.totalInterest - plan.current.totalInterest
  return (
    <section className="plans-card" aria-label={dc.title}>
      <p className="plans-card__tag">{dc.chosenByYou}</p>
      <h3 className="serif plans-card__title">{dc.title}</h3>
      <ul className="plans-card__changes">
        <li className="plans-card__change"><span className="plans-card__k">{dc.balance}</span><span className="plans-card__v">{fmtDebtAmount(plan.balance, plan.currency)}</span></li>
        <li className="plans-card__change"><span className="plans-card__k">{dc.currentPayment}</span><span className="plans-card__v">{fmtDebtAmount(plan.currentPayment, plan.currency)}</span></li>
        <li className="plans-card__change"><span className="plans-card__k">{dc.plannedPayment}</span><span className="plans-card__v">{fmtDebtAmount(plan.scenarioPayment, plan.currency)}</span></li>
      </ul>
      <div className="plans-card__totals">
        <p className="plans-card__line">{dc.currentPayoff}: {formatMonths(plan.current.months, dur, lang)}</p>
        <p className="plans-card__line plans-card__line--main">{dc.plannedPayoff}: {formatMonths(plan.scenario.months, dur, lang)}</p>
        <p className="plans-card__line">{dc.interestChange}: {interestDiff === 0 ? fmtDebtAmount(0, plan.currency) : `${interestDiff > 0 ? '+' : '-'}${fmtDebtAmount(Math.abs(interestDiff), plan.currency)}`}</p>
      </div>
      <div className="plans-card__actions">
        <Link className="btn btn--soft" to="/plan/debt?mode=review">{dc.review}</Link>
        <Link className="btn btn--soft" to="/plan/debt?mode=edit">{dc.edit}</Link>
        <Link className="btn btn--soft" to="/roadmap">{dc.openRoadmap}</Link>
        <button type="button" className="btn btn--quiet" onClick={onRemove}>{dc.remove}</button>
      </div>
    </section>
  )
}

function EmergencyCard({ ec, plan, status, editEligible, onRemove }) {
  const chg = plan.est.scenMonths - plan.est.curMonths
  return (
    <section className="plans-card" aria-label={ec.title}>
      <p className="plans-card__tag">{ec.chosenByYou}</p>
      <h3 className="serif plans-card__title">{ec.title}</h3>
      <p className="plans-card__source">{plan.source === 'planning' ? ec.sourcePlanning : ec.sourceCheckup}</p>
      <ul className="plans-card__changes">
        <li className="plans-card__change"><span className="plans-card__k">{ec.accessible}</span><span className="plans-card__v">{fmtEmAmount(plan.baseline.accessible, plan.currency)}{' \u2192 '}{fmtEmAmount(plan.scenario.accessible, plan.currency)}</span></li>
        <li className="plans-card__change"><span className="plans-card__k">{ec.mustPays}</span><span className="plans-card__v">{fmtEmAmount(plan.baseline.mustPays, plan.currency)}{' \u2192 '}{fmtEmAmount(plan.scenario.mustPays, plan.currency)}</span></li>
      </ul>
      <div className="plans-card__totals">
        <p className="plans-card__line plans-card__line--main">{ec.months}: {formatMonths1(plan.est.curMonths)}{' \u2192 '}{formatMonths1(plan.est.scenMonths)} {ec.monthsUnit}</p>
        <p className="plans-card__line">{ec.changeInMonths}: {chg > 0 ? '+' : ''}{formatMonths1(chg)}</p>
      </div>
      {plan.source === 'checkup' && status === 'fresh' && (
        <p className="plans-card__status plans-card__status--fresh">{ec.fresh}</p>
      )}
      {plan.source === 'checkup' && (status === 'stale' || status === 'no-picture') && (
        <p className="plans-card__status plans-card__status--stale">{ec.stale}</p>
      )}
      <div className="plans-card__actions">
        <Link className="btn btn--soft" to="/plan/emergency?mode=review">{ec.review}</Link>
        {editEligible && <Link className="btn btn--soft" to="/plan/emergency?mode=edit">{ec.edit}</Link>}
        <Link className="btn btn--soft" to="/roadmap">{ec.openRoadmap}</Link>
        {!editEligible && plan.source === 'checkup' && <Link className="btn btn--soft" to="/checkup">{ec.checkupPath}</Link>}
        <button type="button" className="btn btn--quiet" onClick={onRemove}>{ec.remove}</button>
      </div>
    </section>
  )
}

function GoalCard({ gc, plan, onRemove }) {
  // Same goal-name convention as the Roadmap: Education label for an education
  // goal, the user's custom name otherwise.
  const name = plan.goalType === 'education' ? gc.educationName : plan.goalName
  const gap = plan.est.planGap
  const gapLabel = gap > 0 ? gc.remainingGap : gap < 0 ? gc.aboveTarget : gc.exactly
  return (
    <section className="plans-card" aria-label={name}>
      <p className="plans-card__tag">{gc.chosenByYou}</p>
      <h3 className="serif plans-card__title">{name}</h3>
      <ul className="plans-card__changes">
        <li className="plans-card__change"><span className="plans-card__k">{gc.target}</span><span className="plans-card__v">{fmtGoalAmount(plan.target, plan.currency)}</span></li>
        <li className="plans-card__change"><span className="plans-card__k">{gc.months}</span><span className="plans-card__v">{plan.months}</span></li>
        <li className="plans-card__change"><span className="plans-card__k">{gc.setAside}</span><span className="plans-card__v">{fmtGoalAmount(plan.setAside, plan.currency)}</span></li>
        <li className="plans-card__change"><span className="plans-card__k">{gc.contribution}</span><span className="plans-card__v">{fmtGoalAmount(plan.plannedContribution, plan.currency)}</span></li>
      </ul>
      <div className="plans-card__totals">
        <p className="plans-card__line plans-card__line--main">{gc.projected}: {fmtGoalAmount(plan.est.planProjected, plan.currency)}</p>
        <p className="plans-card__line">{gapLabel}: {fmtGoalAmount(Math.abs(gap), plan.currency)}</p>
        <p className="plans-card__line">{gc.progress}: {formatPercent(plan.est.planProgress)}</p>
        {plan.returnAssumptionEnabled && plan.annualReturn !== 0 && <p className="plans-card__line">{gc.annualAssumption}: {formatPercent(plan.annualReturn)}</p>}
      </div>
      <div className="plans-card__actions">
        <Link className="btn btn--soft" to="/plan/goal?mode=review">{gc.review}</Link>
        <Link className="btn btn--soft" to="/plan/goal?mode=edit">{gc.edit}</Link>
        <Link className="btn btn--soft" to="/roadmap">{gc.openRoadmap}</Link>
        <button type="button" className="btn btn--quiet" onClick={onRemove}>{gc.remove}</button>
      </div>
    </section>
  )
}

function RetirementCard({ rc, plan, onRemove }) {
  return (
    <section className="plans-card" aria-label={rc.title}>
      <p className="plans-card__tag">{rc.chosenByYou}</p>
      <h3 className="serif plans-card__title">{rc.title}</h3>
      <ul className="plans-card__changes">
        <li className="plans-card__change"><span className="plans-card__k">{rc.balance}</span><span className="plans-card__v">{fmtRetAmount(plan.currentBalance, plan.currency)}</span></li>
        <li className="plans-card__change"><span className="plans-card__k">{rc.years}</span><span className="plans-card__v">{plan.years}</span></li>
        <li className="plans-card__change"><span className="plans-card__k">{rc.contribution}</span><span className="plans-card__v">{fmtRetAmount(plan.plannedContribution, plan.currency)}</span></li>
        <li className="plans-card__change"><span className="plans-card__k">{rc.annualReturn}</span><span className="plans-card__v">{fmtRetPct(plan.annualReturn)}</span></li>
      </ul>
      <div className="plans-card__totals">
        <p className="plans-card__line plans-card__line--main">{rc.projected}: {fmtRetAmount(plan.est.planProjected, plan.currency)}</p>
        <p className="plans-card__line">{rc.totalContrib}: {fmtRetAmount(plan.est.planTotalContrib, plan.currency)}</p>
        <p className="plans-card__line">{rc.growth}: {fmtRetAmount(plan.est.planGrowth, plan.currency)}</p>
        {plan.employerActive && <p className="plans-card__line">{rc.employer}: {fmtRetAmount(plan.employerMonthlyContribution, plan.currency)}</p>}
        {plan.changeActive && <p className="plans-card__line">{rc.contribChange}: {fmtRetPct(plan.annualContributionChange)}</p>}
        {plan.inflationActive && <p className="plans-card__line">{rc.inflation}: {fmtRetPct(plan.annualInflation)}</p>}
        {plan.inflationActive && <p className="plans-card__line">{rc.inToday}: {fmtRetAmount(plan.est.planPurchasingPower, plan.currency)}</p>}
      </div>
      <div className="plans-card__actions">
        <Link className="btn btn--soft" to="/plan/retirement?mode=review">{rc.review}</Link>
        <Link className="btn btn--soft" to="/plan/retirement?mode=edit">{rc.edit}</Link>
        <Link className="btn btn--soft" to="/roadmap">{rc.openRoadmap}</Link>
        <button type="button" className="btn btn--quiet" onClick={onRemove}>{rc.remove}</button>
      </div>
    </section>
  )
}

function InsuranceCard({ ic, plan, onRemove }) {
  const bucketLabel = ic[plan.explored.bucket]
  return (
    <section className="plans-card" aria-label={ic.title}>
      <p className="plans-card__tag">{ic.chosenByYou}</p>
      <h3 className="serif plans-card__title">{ic.title}</h3>
      <ul className="plans-card__changes">
        <li className="plans-card__change"><span className="plans-card__k">{ic.responsibilities}</span><span className="plans-card__v">{fmtInsAmount(plan.est.responsibilities, plan.currency)}</span></li>
        <li className="plans-card__change"><span className="plans-card__k">{ic.currentCoverage}</span><span className="plans-card__v">{fmtInsAmount(plan.currentCoverage, plan.currency)}</span></li>
        <li className="plans-card__change"><span className="plans-card__k">{ic.exploredCoverage}</span><span className="plans-card__v">{fmtInsAmount(plan.exploredCoverage, plan.currency)}</span></li>
        <li className="plans-card__change"><span className="plans-card__k">{ic.other}</span><span className="plans-card__v">{fmtInsAmount(plan.otherResources, plan.currency)}</span></li>
      </ul>
      <div className="plans-card__totals">
        <p className="plans-card__line plans-card__line--main">{bucketLabel}: {fmtInsAmount(Math.abs(plan.explored.diff), plan.currency)}</p>
        <p className="plans-card__line">{ic.share}: {fmtInsPct(plan.explored.share)}</p>
      </div>
      <div className="plans-card__actions">
        <Link className="btn btn--soft" to="/plan/insurance?mode=review">{ic.review}</Link>
        <Link className="btn btn--soft" to="/plan/insurance?mode=edit">{ic.edit}</Link>
        <Link className="btn btn--soft" to="/roadmap">{ic.openRoadmap}</Link>
        <button type="button" className="btn btn--quiet" onClick={onRemove}>{ic.remove}</button>
      </div>
    </section>
  )
}

function ToolBlock({ tool, startPath, hasPlan, noneYet, children }) {
  return (
    <section className="plans-tool" aria-label={tool.name}>
      <div className="plans-tool__head">
        <h2 className="serif plans-tool__name">{tool.name}</h2>
        <p className="plans-tool__desc">{tool.desc}</p>
      </div>
      {hasPlan ? children : <p className="plans-tool__none">{noneYet}</p>}
      <Link className="btn btn--primary plans-tool__start" to={startPath}>
        {hasPlan ? tool.startAnother : tool.start}<ArrowRight size={16} />
      </Link>
    </section>
  )
}

export default function PlansHome() {
  const { lang } = useLanguage()
  const c = plansContent[lang]
  const pl = planContent[lang]
  const dc = c.debtCard
  const dur = debtContent[lang].duration
  const assessed = useMemo(() => readAssessedCashflow(), [])
  const assessedEm = useMemo(() => readAssessedEmergency(), [])
  const [plan, setPlan] = useState(() => validateStoredPlan(getPlan()))
  const [debtPlan, setDebtPlan] = useState(() => validateStoredDebtPlan(getDebtPlan()))
  const [emPlan, setEmPlan] = useState(() => validateStoredEmergencyPlan(getEmergencyPlan()))
  const [goalPlan, setGoalPlan] = useState(() => validateStoredGoalPlan(getGoalPlan()))
  const [retPlan, setRetPlan] = useState(() => validateStoredRetirementPlan(getRetirementPlan()))
  const [insPlan, setInsPlan] = useState(() => validateStoredInsurancePlan(getInsurancePlan()))
  const status = plan ? planStatus(plan, assessed) : null
  const editEligible = plan ? canEditPlan(plan, assessed) : false
  const emStatus = emPlan ? emergencyPlanStatus(emPlan, assessedEm) : null
  const emEditEligible = emPlan ? canEditEmergency(emPlan, assessedEm) : false
  const ec = c.emergencyCard
  const gc = c.goalCard
  const rc = c.retirementCard
  const ic = c.insuranceCard
  const headingRef = useRef(null)

  function handleRemoveCashflow() { removePlan(); setPlan(null); requestAnimationFrame(() => headingRef.current?.focus()) }
  function handleRemoveDebt() { removeDebtPlan(); setDebtPlan(null); requestAnimationFrame(() => headingRef.current?.focus()) }
  function handleRemoveEmergency() { removeEmergencyPlan(); setEmPlan(null); requestAnimationFrame(() => headingRef.current?.focus()) }
  function handleRemoveGoal() { removeGoalPlan(); setGoalPlan(null); requestAnimationFrame(() => headingRef.current?.focus()) }
  function handleRemoveRetirement() { removeRetirementPlan(); setRetPlan(null); requestAnimationFrame(() => headingRef.current?.focus()) }
  function handleRemoveInsurance() { removeInsurancePlan(); setInsPlan(null); requestAnimationFrame(() => headingRef.current?.focus()) }

  return (
    <main className="page page__reading plans">
      <header className="plans__head">
        <span className="plans__sun" aria-hidden="true"><Sun size={28} /></span>
        <p className="sign sign--amber">{c.eyebrow}</p>
        <h1 className="serif plans__title" tabIndex={-1} ref={headingRef}>{c.title}</h1>
        <p className="plans__intro">{c.intro}</p>
      </header>

      <div className="plans-tools">
        <ToolBlock tool={c.tools.cashflow} startPath="/plan/cashflow" hasPlan={!!plan} noneYet={c.noneYet}>
          {plan && <CashFlowCard c={c} pl={pl} plan={plan} status={status} editEligible={editEligible} onRemove={handleRemoveCashflow} />}
        </ToolBlock>

        <ToolBlock tool={c.tools.debt} startPath="/plan/debt" hasPlan={!!debtPlan} noneYet={c.noneYet}>
          {debtPlan && <DebtCard dc={dc} dur={dur} plan={debtPlan} lang={lang} onRemove={handleRemoveDebt} />}
        </ToolBlock>

        <ToolBlock tool={c.tools.emergency} startPath="/plan/emergency" hasPlan={!!emPlan} noneYet={c.noneYet}>
          {emPlan && <EmergencyCard ec={ec} plan={emPlan} status={emStatus} editEligible={emEditEligible} onRemove={handleRemoveEmergency} />}
        </ToolBlock>

        <ToolBlock tool={c.tools.goal} startPath="/plan/goal" hasPlan={!!goalPlan} noneYet={c.noneYet}>
          {goalPlan && <GoalCard gc={gc} plan={goalPlan} onRemove={handleRemoveGoal} />}
        </ToolBlock>

        <ToolBlock tool={c.tools.retirement} startPath="/plan/retirement" hasPlan={!!retPlan} noneYet={c.noneYet}>
          {retPlan && <RetirementCard rc={rc} plan={retPlan} onRemove={handleRemoveRetirement} />}
        </ToolBlock>

        <ToolBlock tool={c.tools.insurance} startPath="/plan/insurance" hasPlan={!!insPlan} noneYet={c.noneYet}>
          {insPlan && <InsuranceCard ic={ic} plan={insPlan} onRemove={handleRemoveInsurance} />}
        </ToolBlock>
      </div>

      <div className="plans__actions">
        <Link className="btn btn--quiet" to="/roadmap">{c.backToRoadmap}</Link>
      </div>
    </main>
  )
}
