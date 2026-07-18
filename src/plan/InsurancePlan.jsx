import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { insuranceContent } from './insuranceContent'
import { getInsurancePlan, adoptInsurancePlan } from '../lib/progress'
import {
  INS_SAFE_AMOUNT, MAX_SUPPORT_YEARS,
  computeInsurance, canAdoptInsurance, buildInsurancePlan, validateStoredInsurancePlan,
  sameStoredInsurance, formatPercent, formatPlanAmount,
} from './insurancePlanLogic.js'

const MODES = ['explore', 'review', 'edit']
const MONEY_RE = /^\d+(\.\d+)?$/
const YEARS_RE = /^\d+$/
const SIGNED_RE = /^-?\d+(\.\d+)?$/

function validateMoney(raw, currency) {
  const t = String(raw).trim()
  if (t === '') return { error: 'blank' }
  if (!MONEY_RE.test(t)) return { error: /^[+-]/.test(t) ? 'negative' : 'syntax' }
  const decimals = (t.split('.')[1] || '').length
  if (currency === 'krw' && decimals > 0) return { error: 'wholeKrw' }
  if (currency !== 'krw' && decimals > 2) return { error: 'decimalsUsd' }
  const n = Number(t)
  if (n > INS_SAFE_AMOUNT) return { error: 'tooLarge' }
  return { value: n }
}
function validateYears(raw) {
  const t = String(raw).trim()
  if (t === '') return { error: 'blank' }
  if (YEARS_RE.test(t)) {
    const n = Number(t)
    if (n < 1 || n > MAX_SUPPORT_YEARS) return { error: 'yearsRange' }
    return { value: n }
  }
  if (SIGNED_RE.test(t)) return { error: t.includes('.') ? 'yearsWhole' : 'yearsRange' }
  return { error: 'syntax' }
}

function uncoveredChangeLine(t, value, currency) {
  const label = value < 0 ? t.compare.uncoveredChangeDown : value > 0 ? t.compare.uncoveredChangeUp : t.compare.uncoveredChangeSame
  return <p className="goal-diff">{label}: {formatPlanAmount(Math.abs(value), currency)}</p>
}

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

export default function InsurancePlan() {
  const { lang } = useLanguage()
  const t = insuranceContent[lang]
  const [params] = useSearchParams()

  const storedValidated = useMemo(() => validateStoredInsurancePlan(getInsurancePlan()), [])
  const rawMode = params.get('mode')
  const mode = MODES.includes(rawMode) ? rawMode : 'explore'
  const effectiveMode = (mode === 'review' && storedValidated) ? 'review'
    : (mode === 'edit' && storedValidated) ? 'edit' : 'explore'
  const isEdit = effectiveMode === 'edit'

  const [planningCurrency, setPlanningCurrency] = useState(() => {
    if (isEdit && storedValidated) return storedValidated.currency
    return lang === 'ko' ? 'krw' : 'usd'
  })
  const currency = planningCurrency

  const blank = { monthlySupport: '', years: '', oneTime: '', currentCoverage: '', otherResources: '', exploredCoverage: '' }
  const initVals = () => {
    if (isEdit && storedValidated) {
      const s = storedValidated
      return {
        monthlySupport: String(s.monthlySupport), years: String(s.years), oneTime: String(s.oneTime),
        currentCoverage: String(s.currentCoverage), otherResources: String(s.otherResources), exploredCoverage: String(s.exploredCoverage),
      }
    }
    return { ...blank }
  }
  const [vals, setVals] = useState(initVals)
  const [touched, setTouched] = useState({})
  const [stage, setStage] = useState('tool')

  const firstRef = useRef(null)
  const doneRef = useRef(null)
  const openerRef = useRef(null)

  useEffect(() => {
    if (isEdit && storedValidated) {
      setPlanningCurrency(storedValidated.currency); setVals(initVals()); setTouched({}); setStage('tool')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, storedValidated])

  const amountLabel = (bucket) => t.amount[bucket]

  // ---------- Review mode ----------
  if (effectiveMode === 'review') {
    const p = storedValidated
    const roPathCard = (which) => {
      const path = which === 'current' ? p.current : p.explored
      const coverage = which === 'current' ? p.currentCoverage : p.exploredCoverage
      return (
        <div className={`goal-path${which === 'explored' ? ' goal-path--plan' : ''}`}>
          <p className="goal-path__label">{which === 'current' ? t.compare.current : t.compare.explored}</p>
          <p className="goal-path__row"><span>{t.compare.coverage}</span><span>{formatPlanAmount(coverage, p.currency)}</span></p>
          <p className="goal-path__row"><span>{t.compare.other}</span><span>{formatPlanAmount(p.otherResources, p.currency)}</span></p>
          <p className="goal-path__row"><span>{t.compare.totalRes}</span><span>{formatPlanAmount(path.resources, p.currency)}</span></p>
          <p className="goal-path__row"><span>{amountLabel(path.bucket)}</span><span>{formatPlanAmount(Math.abs(path.diff), p.currency)}</span></p>
          <p className="goal-path__row goal-path__row--pct"><span>{t.share.heading}</span><span>{formatPercent(path.share)}</span></p>
        </div>
      )
    }
    return (
      <main className="page page__reading plan">
        <header className="plan__head">
          <h1 className="serif plan__title">{t.review.heading}</h1>
          <p className="plan__note">{t.review.note}</p>
        </header>
        <section className="plan-card plan-review-compare" aria-label={t.compare.heading}>
          <p className="ret-shared">{t.compare.monthlySupport}: {formatPlanAmount(p.monthlySupport, p.currency)} · {t.compare.years}: {p.years} · {t.compare.oneTime}: {formatPlanAmount(p.oneTime, p.currency)}</p>
          <p className="ret-shared ret-shared--note">{t.compare.totalResp}: {formatPlanAmount(p.est.responsibilities, p.currency)}</p>
          <div className="goal-paths">
            {roPathCard('current')}
            {roPathCard('explored')}
          </div>
          <p className="goal-diff">{t.compare.coverageDiff}: {p.coverageDiff > 0 ? '+' : ''}{formatPlanAmount(p.coverageDiff, p.currency)}</p>
          {uncoveredChangeLine(t, p.uncoveredChange, p.currency)}
          <p className="goal-diff">{t.compare.shareChange}: {p.sharePtsChange > 0 ? '+' : ''}{formatPercent(p.sharePtsChange)}</p>
          <p className="ret-shared--note">{t.share.note}</p>
          <div className="goal-assume">
            <p className="goal-assume__head">{t.assumptionsHeading}</p>
            <ul className="goal-assume__list">{t.assumptions.map((a, i) => <li key={i}>{a}</li>)}</ul>
          </div>
          <p className="ret-shared--note">{t.compare.notDecide}</p>
        </section>
        <div className="plan__actions">
          <Link className="btn btn--primary" to="/plan/insurance?mode=edit">{t.review.edit}</Link>
          <Link className="btn btn--quiet" to="/plans">{t.review.backToPlans}</Link>
        </div>
      </main>
    )
  }

  // ---------- Explore / Edit ----------
  const parsed = {
    monthlySupport: validateMoney(vals.monthlySupport, currency),
    years: validateYears(vals.years),
    oneTime: validateMoney(vals.oneTime, currency),
    currentCoverage: validateMoney(vals.currentCoverage, currency),
    otherResources: validateMoney(vals.otherResources, currency),
    exploredCoverage: validateMoney(vals.exploredCoverage, currency),
  }
  const allValid = Object.values(parsed).every((r) => 'value' in r)
  const nums = allValid ? {
    monthlySupport: parsed.monthlySupport.value, years: parsed.years.value, oneTime: parsed.oneTime.value,
    currentCoverage: parsed.currentCoverage.value, otherResources: parsed.otherResources.value, exploredCoverage: parsed.exploredCoverage.value,
    currency,
  } : null
  const cmp = allValid ? computeInsurance(nums) : null
  const ok = cmp && cmp.status === 'ok'
  const noResp = cmp && cmp.status === 'noResponsibilities'
  const coverageChanged = allValid && nums.currentCoverage !== nums.exploredCoverage
  const identicalToStored = ok && !!storedValidated && sameStoredInsurance(nums, storedValidated)
  const canAdopt = allValid && ok && canAdoptInsurance(nums) && !identicalToStored

  const err = (k) => (touched[k] && parsed[k] && parsed[k].error) ? t.errors[parsed[k].error] : null
  function setVal(k, v) { setVals((s) => ({ ...s, [k]: v })); setTouched((tt) => ({ ...tt, [k]: true })) }
  function reset() {
    setVals(isEdit ? initVals() : { ...blank }); setTouched({}); setStage('tool')
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
    adoptInsurancePlan(buildInsurancePlan(nums))
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
    const eid = `ins-err-${k}`
    return (
      <label className="plan-num plan-num--stack" key={k}>
        <span className="plan-num__label">{t.fields[k]}</span>
        <span className="plan-num__field">
          <span className="plan-num__sym" aria-hidden="true">{sym}</span>
          <input ref={refFirst ? firstRef : undefined} className="plan-num__input" type="text" inputMode="decimal" value={vals[k]}
            onChange={(ev) => setVal(k, ev.target.value)}
            aria-label={t.fields[k]} aria-describedby={e ? eid : undefined} aria-invalid={e ? true : undefined} />
        </span>
        <span className="plan-num__help">{t.fieldHelp[k]}</span>
        {e && <span className="plan-num__error" id={eid} role="alert">{e}</span>}
      </label>
    )
  }
  const yearsInput = () => {
    const e = err('years')
    const eid = 'ins-err-years'
    return (
      <label className="plan-num plan-num--stack" key="years">
        <span className="plan-num__label">{t.fields.years}</span>
        <span className="plan-num__field">
          <input className="plan-num__input" type="text" inputMode="numeric" value={vals.years}
            onChange={(ev) => setVal('years', ev.target.value)}
            aria-label={t.fields.years} aria-describedby={e ? eid : undefined} aria-invalid={e ? true : undefined} />
        </span>
        <span className="plan-num__help">{t.fieldHelp.years}</span>
        {e && <span className="plan-num__error" id={eid} role="alert">{e}</span>}
      </label>
    )
  }

  const pathCard = (which) => {
    const path = which === 'current' ? cmp.currentResources : cmp.exploredResources
    const diff = which === 'current' ? cmp.currentDiff : cmp.exploredDiff
    const bucket = which === 'current' ? cmp.currentBucket : cmp.exploredBucket
    const share = which === 'current' ? cmp.currentShare : cmp.exploredShare
    const coverage = which === 'current' ? nums.currentCoverage : nums.exploredCoverage
    return (
      <div className={`goal-path${which === 'explored' ? ' goal-path--plan' : ''}`}>
        <p className="goal-path__label">{which === 'current' ? t.compare.current : t.compare.explored}</p>
        <p className="goal-path__row"><span>{t.compare.coverage}</span><span>{formatPlanAmount(coverage, currency)}</span></p>
        <p className="goal-path__row"><span>{t.compare.other}</span><span>{formatPlanAmount(nums.otherResources, currency)}</span></p>
        <p className="goal-path__row"><span>{t.compare.totalRes}</span><span>{formatPlanAmount(path, currency)}</span></p>
        <p className="goal-path__row"><span>{amountLabel(bucket)}</span><span>{formatPlanAmount(Math.abs(diff), currency)}</span></p>
        <p className="goal-path__row goal-path__row--pct"><span>{t.share.heading}</span><span>{formatPercent(share)}</span></p>
      </div>
    )
  }

  return (
    <main className="page page__reading plan">
      <header className="plan__head">
        <h1 className="serif plan__title">{isEdit ? t.edit.heading : t.label}</h1>
        <p className="plan__note">{isEdit ? t.edit.note : t.purpose}</p>
      </header>

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

        <div className="ret-group" role="group" aria-label={t.responsibilitiesHeading}>
          <p className="ret-group__head">{t.responsibilitiesHeading}</p>
          {moneyInput('monthlySupport', true)}
          {yearsInput()}
          {moneyInput('oneTime', false)}
        </div>

        <div className="ret-group ret-group--current" role="group" aria-label={t.currentHeading}>
          <p className="ret-group__head">{t.currentHeading}</p>
          {moneyInput('currentCoverage', false)}
          {moneyInput('otherResources', false)}
        </div>

        <div className="ret-group ret-group--choose" role="group" aria-label={t.choosingHeading}>
          <p className="ret-group__head">{t.choosingHeading}</p>
          {moneyInput('exploredCoverage', false)}
        </div>
      </section>

      <p className="ret-return-note">{t.meaning}</p>

      <div className="goal-assume">
        <p className="goal-assume__head">{t.assumptionsHeading}</p>
        <ul className="goal-assume__list">{t.assumptions.map((a, i) => <li key={i}>{a}</li>)}</ul>
      </div>

      {allValid && noResp && <p className="plan__nochange">{t.noResp}</p>}

      {allValid && ok && (
        <section className="plan-result" aria-live="polite">
          <h2 className="serif plan-result__head">{t.compare.heading}</h2>
          <p className="ret-shared">{t.compare.monthlySupport}: {formatPlanAmount(nums.monthlySupport, currency)} · {t.compare.years}: {nums.years} · {t.compare.oneTime}: {formatPlanAmount(nums.oneTime, currency)}</p>
          <p className="ret-shared ret-shared--note">{t.compare.totalResp}: {formatPlanAmount(cmp.responsibilities, currency)} · {t.compare.sharedNote}</p>
          <div className="goal-paths">
            {pathCard('current')}
            {pathCard('explored')}
          </div>
          <p className="goal-diff">
            {t.compare.coverageDiff}: {cmp.coverageDiff > 0 ? '+' : ''}{formatPlanAmount(cmp.coverageDiff, currency)}
            {'  '}<span className="goal-diff__tag">{coverageChanged ? t.compare.changed : t.compare.unchanged}</span>
          </p>
          {uncoveredChangeLine(t, cmp.uncoveredChange, currency)}
          <div className="ret-ratio">
            <p className="ret-ratio__head">{t.share.heading}</p>
            <p className="ret-ratio__row"><span>{t.share.current}</span><span>{formatPercent(cmp.currentShare)}</span></p>
            <p className="ret-ratio__row"><span>{t.share.explored}</span><span>{formatPercent(cmp.exploredShare)}</span></p>
            <p className="ret-ratio__row"><span>{t.share.change}</span><span>{cmp.sharePtsChange > 0 ? '+' : ''}{formatPercent(cmp.sharePtsChange)}</span></p>
            <p className="ret-ratio__note">{t.share.note}</p>
          </div>
          <p className="goal-progress-explain">{t.compare.notDecide}</p>
          <p className="ret-reflect">{t.reflection}</p>
          {identicalToStored && <p className="goal-nochange">{t.identicalNote}</p>}
        </section>
      )}

      {allValid && cmp && cmp.status === 'beyondLimit' && <p className="plan__nochange">{t.states.beyondLimit}</p>}
      {!canAdopt && !noResp && (!allValid || (cmp && cmp.status !== 'ok')) && <p className="plan__nochange">{t.cantAdopt}</p>}

      <div className="plan__actions">
        <button type="button" className="btn btn--primary" disabled={!canAdopt} onClick={onKeep}>{t.keep}</button>
        <button type="button" className="btn btn--quiet" onClick={reset}>{t.reset}</button>
        <Link className="btn btn--quiet" to="/plans">{t.leave}</Link>
      </div>

      {stage === 'confirm' && canAdopt && (
        <PlanModal label={t.confirm.heading} onCancel={() => setStage('tool')} openerRef={openerRef}>
          <h2 className="serif plan-modal__title">{t.confirm.heading}</h2>
          <p className="plan-modal__body">
            {t.compare.monthlySupport}: {formatPlanAmount(nums.monthlySupport, currency)}<br />
            {t.compare.years}: {nums.years}<br />
            {t.compare.oneTime}: {formatPlanAmount(nums.oneTime, currency)}<br />
            {t.compare.totalResp}: {formatPlanAmount(cmp.responsibilities, currency)}<br />
            {t.compare.coverage}: {formatPlanAmount(nums.currentCoverage, currency)}{' \u2192 '}{formatPlanAmount(nums.exploredCoverage, currency)}<br />
            {t.compare.other}: {formatPlanAmount(nums.otherResources, currency)}<br />
            {t.compare.totalRes}: {formatPlanAmount(cmp.exploredResources, currency)}<br />
            {amountLabel(cmp.exploredBucket)}: {formatPlanAmount(Math.abs(cmp.exploredDiff), currency)}<br />
            {t.share.heading}: {formatPercent(cmp.exploredShare)}
          </p>
          <p className="plan-modal__aside">{t.confirm.yourChoice}</p>
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
