import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { goalContent } from './goalContent'
import { getGoalPlan, adoptGoalPlan } from '../lib/progress'
import {
  GOAL_SAFE_AMOUNT, MAX_GOAL_MONTHS, MAX_GOAL_NAME,
  MIN_GOAL_ANNUAL_RETURN, MAX_GOAL_ANNUAL_RETURN,
  computeGoal, canAdoptGoal, buildGoalPlan, validateStoredGoalPlan,
  isValidGoalName, formatPercent, formatPlanAmount,
} from './goalPlanLogic.js'

const MODES = ['explore', 'review', 'edit']
const MONEY_RE = /^\d+(\.\d+)?$/       // non-negative plain decimal, no sign
const MONTHS_RE = /^\d+$/              // positive whole digits only
const RETURN_RE = /^-?\d+(\.\d+)?$/    // optional leading minus only

function validateMoney(raw, currency) {
  const t = String(raw).trim()
  if (t === '') return { error: 'blank' }
  if (!MONEY_RE.test(t)) return { error: /^[+-]/.test(t) ? 'negative' : 'syntax' }
  const n = Number(t)
  if (n > GOAL_SAFE_AMOUNT) return { error: 'tooLarge' }
  const decimals = (t.split('.')[1] || '').length
  if (currency === 'krw' && decimals > 0) return { error: 'wholeKrw' }
  if (currency !== 'krw' && decimals > 2) return { error: 'decimalsUsd' }
  return { value: n }
}
function validateTarget(raw, currency) {
  const m = validateMoney(raw, currency)
  if (m.error) return m
  if (m.value <= 0) return { error: 'targetZero' }
  return m
}
function validateMonths(raw) {
  const t = String(raw).trim()
  if (t === '') return { error: 'blank' }
  if (MONTHS_RE.test(t)) {
    const n = Number(t)
    if (n < 1 || n > MAX_GOAL_MONTHS) return { error: 'monthsRange' }
    return { value: n }
  }
  if (RETURN_RE.test(t)) return { error: t.includes('.') ? 'monthsWhole' : 'monthsRange' }
  return { error: 'syntax' }
}
// Optional annual return: strict plain decimal, technical range [-50, 50], up to
// two decimals. No sign-only, no scientific/hex/commas/underscores.
function validateReturn(raw) {
  const t = String(raw).trim()
  if (t === '') return { error: 'blank' }
  if (!RETURN_RE.test(t)) return { error: 'syntax' }
  const decimals = (t.split('.')[1] || '').length
  if (decimals > 2) return { error: 'returnRange' }
  const n = Number(t)
  if (n < MIN_GOAL_ANNUAL_RETURN || n > MAX_GOAL_ANNUAL_RETURN) return { error: 'returnRange' }
  return { value: n }
}

// Focus-managing modal (same pattern as the other Planning tools; kept local).
function PlanModal({ label, onCancel, openerRef, children }) {
  const boxRef = useRef(null)
  useEffect(() => {
    const box = boxRef.current
    if (!box) return undefined
    const focusables = () =>
      Array.from(box.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
        .filter((el) => !el.disabled && el.offsetParent !== null)
    const primary = box.querySelector('.btn--primary') || focusables()[0]
    primary?.focus()
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); onCancel(); return }
      if (e.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) { e.preventDefault(); return }
      const first = items[0]; const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      const opener = openerRef && openerRef.current
      if (opener && typeof opener.focus === 'function' && document.contains(opener)) opener.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div className="plan-modal" role="dialog" aria-modal="true" aria-label={label}>
      <div className="plan-modal__box" ref={boxRef}>{children}</div>
    </div>
  )
}

// A single path's result line: projected, gap-or-above, progress.
function gapLabel(gap, t) {
  if (gap > 0) return t.compare.remainingGap
  if (gap < 0) return t.compare.aboveTarget
  return t.compare.exactly
}

export default function GoalPlan() {
  const { lang } = useLanguage()
  const t = goalContent[lang]
  const [params] = useSearchParams()

  const storedValidated = useMemo(() => validateStoredGoalPlan(getGoalPlan()), [])
  const rawMode = params.get('mode')
  const mode = MODES.includes(rawMode) ? rawMode : 'explore'
  const effectiveMode = (mode === 'review' && storedValidated) ? 'review'
    : (mode === 'edit' && storedValidated) ? 'edit' : 'explore'
  const isEdit = effectiveMode === 'edit'

  const preType = params.get('type') === 'education' ? 'education' : null
  const [goalType, setGoalType] = useState(() => {
    if (isEdit && storedValidated) return storedValidated.goalType
    return preType
  })
  const [goalName, setGoalName] = useState(() => (isEdit && storedValidated ? storedValidated.goalName : ''))
  const [planningCurrency, setPlanningCurrency] = useState(() => {
    if (isEdit && storedValidated) return storedValidated.currency
    return lang === 'ko' ? 'krw' : 'usd'
  })
  const currency = planningCurrency

  const initVals = () => {
    if (isEdit && storedValidated) {
      const s = storedValidated
      return {
        target: String(s.target), setAside: String(s.setAside), months: String(s.months),
        currentContribution: String(s.currentContribution), plannedContribution: String(s.plannedContribution),
      }
    }
    return { target: '', setAside: '', months: '', currentContribution: '', plannedContribution: '' }
  }
  const [vals, setVals] = useState(initVals)
  const [touched, setTouched] = useState({})
  const [stage, setStage] = useState('tool')

  // Optional annual-return assumption — off by default. In Edit, preload from
  // the stored plan and open the disclosure only if the stored plan is active.
  const [returnEnabled, setReturnEnabled] = useState(() => (isEdit && storedValidated ? storedValidated.returnAssumptionEnabled : false))
  const [returnRaw, setReturnRaw] = useState(() => (isEdit && storedValidated && storedValidated.returnAssumptionEnabled ? String(storedValidated.annualReturn) : ''))
  const [optionalOpen, setOptionalOpen] = useState(() => !!(isEdit && storedValidated && storedValidated.returnAssumptionEnabled))
  const returnInputRef = useRef(null)

  const firstRef = useRef(null)
  const doneRef = useRef(null)
  const openerRef = useRef(null)

  useEffect(() => {
    if (isEdit && storedValidated) {
      setGoalType(storedValidated.goalType); setGoalName(storedValidated.goalName)
      setPlanningCurrency(storedValidated.currency); setVals(initVals()); setTouched({}); setStage('tool')
      setReturnEnabled(storedValidated.returnAssumptionEnabled)
      setReturnRaw(storedValidated.returnAssumptionEnabled ? String(storedValidated.annualReturn) : '')
      setOptionalOpen(storedValidated.returnAssumptionEnabled)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, storedValidated])

  // ---------- Review mode ----------
  if (effectiveMode === 'review') {
    const p = storedValidated
    const name = p.goalType === 'education' ? t.type.educationName : p.goalName
    return (
      <main className="page page__reading plan">
        <header className="plan__head">
          <h1 className="serif plan__title">{t.review.heading}</h1>
          <p className="plan__note">{t.review.note}</p>
        </header>
        <section className="plan-card" aria-label={t.review.heading}>
          <p className="plan-card__tag">{name}</p>
          <ul className="plan-card__changes">
            <li className="plan-card__change"><span className="plan-card__k">{t.fields.target}</span><span className="plan-card__v">{formatPlanAmount(p.target, p.currency)}</span></li>
            <li className="plan-card__change"><span className="plan-card__k">{t.fields.setAside}</span><span className="plan-card__v">{formatPlanAmount(p.setAside, p.currency)}</span></li>
            <li className="plan-card__change"><span className="plan-card__k">{t.fields.months}</span><span className="plan-card__v">{p.months}</span></li>
            <li className="plan-card__change"><span className="plan-card__k">{t.compare.contribution}</span><span className="plan-card__v">{formatPlanAmount(p.currentContribution, p.currency)}{' \u2192 '}{formatPlanAmount(p.plannedContribution, p.currency)}</span></li>
          </ul>
          <div className="plan-card__totals">
            {p.returnActive
              ? <p className="plan-card__line">{t.optional.applied}: {formatPercent(p.effectiveAnnual)}</p>
              : <p className="plan-card__line">{t.optional.noneApplied}</p>}
            <p className="plan-card__line">{t.compare.current}: {formatPlanAmount(p.est.curProjected, p.currency)} · {gapLabel(p.est.curGap, t)} {formatPlanAmount(Math.abs(p.est.curGap), p.currency)} · {formatPercent(p.est.curProgress)}</p>
            <p className="plan-card__line plan-card__line--main">{t.compare.projected}: {formatPlanAmount(p.est.planProjected, p.currency)}</p>
            <p className="plan-card__line">{gapLabel(p.est.planGap, t)}: {formatPlanAmount(Math.abs(p.est.planGap), p.currency)}</p>
            <p className="plan-card__line">{t.compare.progress}: {formatPercent(p.est.planProgress)}</p>
            {p.returnActive && <p className="plan-card__line">{t.optional.estDiff}: {p.est.planEstDiff > 0 ? '+' : ''}{formatPlanAmount(p.est.planEstDiff, p.currency)}</p>}
          </div>
          <div className="goal-assume">
            <p className="goal-assume__head">{t.assumptionsHeading}</p>
            <ul className="goal-assume__list">{(p.returnActive ? t.assumptionsActive : t.assumptions).map((a, i) => <li key={i}>{a}</li>)}</ul>
          </div>
          {p.returnActive && <p className="goal-progress-explain">{t.optional.uncertainty}</p>}
          <p className="goal-progress-explain">{t.progressExplain}</p>
        </section>
        <div className="plan__actions">
          <Link className="btn btn--primary" to="/plan/goal?mode=edit">{t.review.edit}</Link>
          <Link className="btn btn--quiet" to="/plans">{t.review.backToPlans}</Link>
        </div>
      </main>
    )
  }

  // ---------- Explore / Edit ----------
  const parsed = {
    target: validateTarget(vals.target, currency),
    setAside: validateMoney(vals.setAside, currency),
    months: validateMonths(vals.months),
    currentContribution: validateMoney(vals.currentContribution, currency),
    plannedContribution: validateMoney(vals.plannedContribution, currency),
  }
  const nameValid = isValidGoalName(goalType || '', goalName)
  const typeChosen = goalType === 'education' || goalType === 'custom'

  const parsedReturn = returnEnabled ? validateReturn(returnRaw) : { value: 0 }
  const returnValid = 'value' in parsedReturn
  const allValid = typeChosen && nameValid && Object.values(parsed).every((r) => 'value' in r) && returnValid

  const nums = allValid ? {
    target: parsed.target.value, setAside: parsed.setAside.value, months: parsed.months.value,
    currentContribution: parsed.currentContribution.value, plannedContribution: parsed.plannedContribution.value, currency,
    returnAssumptionEnabled: returnEnabled, annualReturn: returnEnabled ? parsedReturn.value : 0,
  } : null
  const cmp = allValid ? computeGoal(nums) : null
  const ok = cmp && cmp.status === 'ok'
  const returnActive = ok && cmp.returnActive
  const contribChanged = allValid && nums.currentContribution !== nums.plannedContribution
  const alreadyCovered = ok && cmp.current.gap <= 0 && nums.setAside >= nums.target
  const canAdopt = allValid && ok && canAdoptGoal({ goalType, goalName, ...nums })

  const returnErr = (returnEnabled && touched.annualReturn && parsedReturn.error) ? t.errors[parsedReturn.error] : null
  const err = (k) => (touched[k] && parsed[k] && parsed[k].error) ? t.errors[parsed[k].error] : null
  function setVal(k, v) { setVals((s) => ({ ...s, [k]: v })); setTouched((tt) => ({ ...tt, [k]: true })) }
  function reset() {
    setVals(isEdit ? initVals() : { target: '', setAside: '', months: '', currentContribution: '', plannedContribution: '' })
    if (isEdit && storedValidated) {
      setReturnEnabled(storedValidated.returnAssumptionEnabled)
      setReturnRaw(storedValidated.returnAssumptionEnabled ? String(storedValidated.annualReturn) : '')
      setOptionalOpen(storedValidated.returnAssumptionEnabled)
    } else {
      setReturnEnabled(false); setReturnRaw(''); setOptionalOpen(false)
    }
    setTouched({}); setStage('tool')
    requestAnimationFrame(() => firstRef.current?.focus())
  }
  function onKeep(e) {
    if (!canAdopt) return
    openerRef.current = (e && e.currentTarget) || (typeof document !== 'undefined' ? document.activeElement : null)
    setStage('confirm')
  }
  function onConfirm() { if (storedValidated) setStage('replace'); else finishAdopt() }
  function finishAdopt() {
    openerRef.current = null
    adoptGoalPlan(buildGoalPlan({ goalType, goalName, currency, ...nums }))
    setStage('done')
    requestAnimationFrame(() => doneRef.current?.focus())
  }

  if (stage === 'done') {
    return (
      <main className="page page__reading plan">
        <div className="plan__done" tabIndex={-1} ref={doneRef} aria-live="polite">
          <p className="plan__done-note">{t.confirm.adopted}</p>
          <div className="plan__actions">
            <Link className="btn btn--primary" to="/plans">{t.review.backToPlans}</Link>
            <Link className="btn btn--quiet" to="/roadmap">{t.review.close}</Link>
          </div>
        </div>
      </main>
    )
  }

  const sym = currency === 'krw' ? '\u20a9' : '$'
  const moneyInput = (k, refFirst) => {
    const e = err(k)
    const eid = `goal-err-${k}`
    return (
      <label className="plan-num plan-num--stack" key={k}>
        <span className="plan-num__label">{t.fields[k]}</span>
        <span className="plan-num__field">
          <span className="plan-num__sym" aria-hidden="true">{sym}</span>
          <input
            ref={refFirst ? firstRef : undefined}
            className="plan-num__input" type="text" inputMode="decimal" value={vals[k]}
            onChange={(ev) => setVal(k, ev.target.value)}
            aria-label={t.fields[k]} aria-describedby={e ? eid : undefined} aria-invalid={e ? true : undefined}
          />
        </span>
        <span className="plan-num__help">{t.fieldHelp[k]}</span>
        {e && <span className="plan-num__error" id={eid} role="alert">{e}</span>}
      </label>
    )
  }
  const monthsInput = () => {
    const e = err('months')
    return (
      <label className="plan-num plan-num--stack">
        <span className="plan-num__label">{t.fields.months}</span>
        <span className="plan-num__field">
          <input className="plan-num__input" type="text" inputMode="numeric" value={vals.months}
            onChange={(ev) => setVal('months', ev.target.value)}
            aria-label={t.fields.months} aria-describedby={e ? 'goal-err-months' : undefined} aria-invalid={e ? true : undefined} />
        </span>
        <span className="plan-num__help">{t.fieldHelp.months}</span>
        {e && <span className="plan-num__error" id="goal-err-months" role="alert">{e}</span>}
      </label>
    )
  }

  const pathCard = (which) => {
    const path = cmp[which]
    const contribution = which === 'current' ? nums.currentContribution : nums.plannedContribution
    return (
      <div className={`goal-path${which === 'planned' ? ' goal-path--plan' : ''}`}>
        <p className="goal-path__label">{which === 'current' ? t.compare.current : t.compare.plan}</p>
        <p className="goal-path__row"><span>{t.compare.contribution}</span><span>{formatPlanAmount(contribution, currency)}</span></p>
        <p className="goal-path__row"><span>{t.compare.projected}</span><span>{formatPlanAmount(path.projected, currency)}</span></p>
        <p className="goal-path__row"><span>{gapLabel(path.gap, t)}</span><span>{formatPlanAmount(Math.abs(path.gap), currency)}</span></p>
        <p className="goal-path__row goal-path__row--pct"><span>{t.compare.progress}</span><span>{formatPercent(path.progress)}</span></p>
        {returnActive && (
          <p className="goal-path__row"><span>{t.optional.estDiff}</span><span>{path.estDiff > 0 ? '+' : ''}{formatPlanAmount(path.estDiff, currency)}</span></p>
        )}
      </div>
    )
  }

  return (
    <main className="page page__reading plan">
      <header className="plan__head">
        <h1 className="serif plan__title">{isEdit ? t.edit.heading : t.label}</h1>
        <p className="plan__note">{isEdit ? t.edit.note : t.purpose}</p>
      </header>

      <section className="goal-type" role="radiogroup" aria-label={t.type.heading}>
        <p className="goal-type__label">{t.type.heading}</p>
        <div className="goal-type__opts">
          <button type="button" role="radio" aria-checked={goalType === 'education'} className={`goal-type__opt${goalType === 'education' ? ' is-on' : ''}`} onClick={() => setGoalType('education')}>{t.type.education}</button>
          <button type="button" role="radio" aria-checked={goalType === 'custom'} className={`goal-type__opt${goalType === 'custom' ? ' is-on' : ''}`} onClick={() => setGoalType('custom')}>{t.type.custom}</button>
        </div>
        {goalType === 'custom' && (
          <label className="plan-num plan-num--stack goal-name">
            <span className="plan-num__label">{t.type.nameLabel}</span>
            <input className="plan-num__input" type="text" maxLength={MAX_GOAL_NAME} value={goalName}
              placeholder={t.type.namePlaceholder}
              onChange={(ev) => { setGoalName(ev.target.value); setTouched((tt) => ({ ...tt, goalName: true })) }}
              aria-label={t.type.nameLabel}
              aria-describedby={touched.goalName && !nameValid ? 'goal-err-name' : undefined}
              aria-invalid={touched.goalName && !nameValid ? true : undefined} />
            {touched.goalName && !nameValid && <span className="plan-num__error" id="goal-err-name" role="alert">{goalName.trim().length > MAX_GOAL_NAME ? t.errors.nameLong : t.errors.nameBlank}</span>}
          </label>
        )}
      </section>

      <section className="plan-entry" aria-label={t.label}>
        <div className="plan-cur" role="radiogroup" aria-label={t.currencyChoice.label}>
          <span className="plan-cur__label">{t.currencyChoice.label}</span>
          <div className="plan-cur__opts">
            {['usd', 'krw'].map((cur) => (
              <button key={cur} type="button" role="radio" aria-checked={planningCurrency === cur}
                className={`plan-cur__opt${planningCurrency === cur ? ' is-on' : ''}`}
                onClick={() => setPlanningCurrency(cur)}>{t.currencyChoice[cur]}</button>
            ))}
          </div>
        </div>
        {moneyInput('target', true)}
        {moneyInput('setAside', false)}
        {monthsInput()}
        {moneyInput('currentContribution', false)}
        {moneyInput('plannedContribution', false)}
      </section>

      <div className="goal-assume">
        <p className="goal-assume__head">{t.assumptionsHeading}</p>
        <ul className="goal-assume__list">{(returnActive ? t.assumptionsActive : t.assumptions).map((a, i) => <li key={i}>{a}</li>)}</ul>
      </div>

      <section className="goal-optional" aria-label={t.optional.heading}>
        <button type="button" className="goal-optional__toggle" aria-expanded={optionalOpen}
          onClick={() => setOptionalOpen((v) => !v)}>
          <span className="goal-optional__chevron" aria-hidden="true">{optionalOpen ? '\u2212' : '+'}</span>
          <span className="goal-optional__head">{t.optional.heading}</span>
        </button>
        {optionalOpen && (
          <div className="goal-optional__body">
            <p className="goal-optional__help">{t.optional.help}</p>
            <label className="goal-optin">
              <input type="checkbox" className="goal-optin__box" checked={returnEnabled}
                onChange={(ev) => { setReturnEnabled(ev.target.checked); setTouched((tt) => ({ ...tt, annualReturn: true })); if (ev.target.checked) requestAnimationFrame(() => returnInputRef.current?.focus()) }} />
              <span className="goal-optin__label">{t.optional.optIn}</span>
            </label>
            {returnEnabled && (
              <label className="plan-num plan-num--stack goal-optional__field">
                <span className="plan-num__label">{t.optional.field}</span>
                <span className="plan-num__field">
                  <input ref={returnInputRef} className="plan-num__input" type="text" inputMode="decimal" value={returnRaw}
                    onChange={(ev) => { setReturnRaw(ev.target.value); setTouched((tt) => ({ ...tt, annualReturn: true })) }}
                    aria-label={t.optional.field} aria-describedby={returnErr ? 'goal-err-return' : undefined} aria-invalid={returnErr ? true : undefined} />
                  <span className="plan-num__suffix" aria-hidden="true">%</span>
                </span>
                <span className="plan-num__help">{t.optional.fieldHelp}</span>
                {returnErr && <span className="plan-num__error" id="goal-err-return" role="alert">{returnErr}</span>}
              </label>
            )}
          </div>
        )}
      </section>

      {allValid && ok && (
        <section className="plan-result" aria-live="polite">
          <h2 className="serif plan-result__head">{t.compare.heading}</h2>
          {alreadyCovered && <p className="goal-covered">{t.alreadyCovered}</p>}
          {returnActive && <p className="ret-shared">{t.optional.applied}: {formatPercent(cmp.effectiveAnnual)}</p>}
          <div className="goal-paths">
            {pathCard('current')}
            {pathCard('planned')}
          </div>
          <p className="goal-diff">
            {t.compare.monthlyDiff}: {cmp.contributionDiff > 0 ? '+' : ''}{formatPlanAmount(cmp.contributionDiff, currency)}
            {'  '}<span className="goal-diff__tag">{contribChanged ? t.compare.changed : t.compare.unchanged}</span>
          </p>
          <p className="goal-progress-explain">{t.progressExplain}</p>
          {returnActive && <p className="goal-progress-explain">{t.optional.uncertainty}</p>}
          {!contribChanged && <p className="goal-nochange">{t.noChangeNote}</p>}
        </section>
      )}

      {allValid && cmp && cmp.status === 'beyondLimit' && <p className="plan__nochange">{t.states.beyondLimit}</p>}
      {!canAdopt && (!allValid || (cmp && cmp.status !== 'ok')) && <p className="plan__nochange">{t.cantAdopt}</p>}

      <div className="plan__actions">
        <button type="button" className="btn btn--primary" disabled={!canAdopt} onClick={onKeep}>{t.keep}</button>
        <button type="button" className="btn btn--quiet" onClick={reset}>{t.reset}</button>
        <Link className="btn btn--quiet" to="/plans">{t.leave}</Link>
      </div>

      {stage === 'confirm' && canAdopt && (
        <PlanModal label={t.confirm.heading} onCancel={() => setStage('tool')} openerRef={openerRef}>
          <h2 className="serif plan-modal__title">{t.confirm.heading}</h2>
          <p className="plan-modal__body">
            {t.confirm.goal}: {goalType === 'education' ? t.type.educationName : goalName}<br />
            {t.fields.target}: {formatPlanAmount(nums.target, currency)}<br />
            {t.fields.setAside}: {formatPlanAmount(nums.setAside, currency)}<br />
            {t.fields.months}: {nums.months}<br />
            {t.compare.contribution}: {formatPlanAmount(nums.currentContribution, currency)}{' \u2192 '}{formatPlanAmount(nums.plannedContribution, currency)}<br />
            {returnActive && <>{t.optional.applied}: {formatPercent(cmp.effectiveAnnual)}<br /></>}
            {t.compare.projected}: {formatPlanAmount(cmp.planned.projected, currency)}<br />
            {gapLabel(cmp.planned.gap, t)}: {formatPlanAmount(Math.abs(cmp.planned.gap), currency)}
            {returnActive && <><br />{t.optional.estDiff}: {cmp.planned.estDiff > 0 ? '+' : ''}{formatPlanAmount(cmp.planned.estDiff, currency)}</>}
            {!returnActive && <><br />{t.optional.noneApplied}</>}
          </p>
          <p className="plan-modal__aside">{returnActive ? t.confirm.returnChoice : t.confirm.yourChoice}</p>
          <div className="plan-modal__actions">
            <button type="button" className="btn btn--primary" onClick={onConfirm}>{t.confirm.confirm}</button>
            <button type="button" className="btn btn--quiet" onClick={() => setStage('tool')}>{t.confirm.cancel}</button>
          </div>
        </PlanModal>
      )}

      {stage === 'replace' && (
        <PlanModal label={t.replace.heading} onCancel={() => setStage('tool')} openerRef={openerRef}>
          <h2 className="serif plan-modal__title">{t.replace.heading}</h2>
          <p className="plan-modal__body">{t.replace.body}</p>
          <div className="plan-modal__actions">
            <button type="button" className="btn btn--primary" onClick={finishAdopt}>{t.replace.confirm}</button>
            <button type="button" className="btn btn--quiet" onClick={() => setStage('tool')}>{t.replace.cancel}</button>
          </div>
        </PlanModal>
      )}
    </main>
  )
}
