import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { retirementContent } from './retirementContent'
import { getRetirementPlan, adoptRetirementPlan } from '../lib/progress'
import {
  RET_SAFE_AMOUNT, MAX_RETIREMENT_YEARS, MIN_ANNUAL_RETURN, MAX_ANNUAL_RETURN,
  MIN_RET_CONTRIBUTION_CHANGE, MAX_RET_CONTRIBUTION_CHANGE, MIN_RET_INFLATION, MAX_RET_INFLATION,
  computeRetirement, canAdoptRetirement, buildRetirementPlan, validateStoredRetirementPlan,
  contributionShare, sameStoredRetirement, formatPercent, formatPlanAmount,
} from './retirementPlanLogic.js'

const MODES = ['explore', 'review', 'edit']

// Strict plain-decimal parsing. Rejects coercible-but-non-decimal syntax
// (scientific 1e3, hex 0x10, underscores 1_000, commas, isolated signs) rather
// than silently reinterpreting it via Number().
const MONEY_RE = /^\d+(\.\d+)?$/       // non-negative plain decimal, no sign
const RETURN_RE = /^-?\d+(\.\d+)?$/    // optional leading minus only
const YEARS_RE = /^\d+$/               // positive whole decimal digits only

function validateMoney(raw, currency) {
  const t = String(raw).trim()
  if (t === '') return { error: 'blank' }
  if (!MONEY_RE.test(t)) return { error: /^[+-]/.test(t) ? 'negative' : 'syntax' }
  const decimals = (t.split('.')[1] || '').length
  if (currency === 'krw' && decimals > 0) return { error: 'wholeKrw' }
  if (currency !== 'krw' && decimals > 2) return { error: 'decimalsUsd' }
  const n = Number(t)
  if (n > RET_SAFE_AMOUNT) return { error: 'tooLarge' }
  return { value: n }
}
function validateYears(raw) {
  const t = String(raw).trim()
  if (t === '') return { error: 'blank' }
  if (YEARS_RE.test(t)) {
    const n = Number(t)
    if (n < 1 || n > MAX_RETIREMENT_YEARS) return { error: 'yearsRange' }
    return { value: n }
  }
  if (RETURN_RE.test(t)) return { error: t.includes('.') ? 'yearsWhole' : 'yearsRange' }
  return { error: 'syntax' }
}
function validateReturn(raw) {
  const t = String(raw).trim()
  if (t === '') return { error: 'blank' }
  if (!RETURN_RE.test(t)) return { error: 'syntax' }
  const decimals = (t.split('.')[1] || '').length
  if (decimals > 2) return { error: 'returnRange' }
  const n = Number(t)
  if (n < MIN_ANNUAL_RETURN || n > MAX_ANNUAL_RETURN) return { error: 'returnRange' }
  return { value: n }
}
// Strict percentage for optional contribution-change / inflation: plain decimal,
// optional minus, technical range, up to two decimals.
function validatePct(raw, min, max) {
  const t = String(raw).trim()
  if (t === '') return { error: 'blank' }
  if (!RETURN_RE.test(t)) return { error: 'syntax' }
  const decimals = (t.split('.')[1] || '').length
  if (decimals > 2) return { error: 'pctRange' }
  const n = Number(t)
  if (n < min || n > max) return { error: 'pctRange' }
  return { value: n }
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

export default function RetirementPlan() {
  const { lang } = useLanguage()
  const t = retirementContent[lang]
  const [params] = useSearchParams()

  const storedValidated = useMemo(() => validateStoredRetirementPlan(getRetirementPlan()), [])
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

  const initVals = () => {
    if (isEdit && storedValidated) {
      const s = storedValidated
      return {
        currentBalance: String(s.currentBalance), years: String(s.years),
        currentContribution: String(s.currentContribution), plannedContribution: String(s.plannedContribution),
        annualReturn: String(s.annualReturn),
      }
    }
    return { currentBalance: '', years: '', currentContribution: '', plannedContribution: '', annualReturn: '' }
  }
  const [vals, setVals] = useState(initVals)
  const [touched, setTouched] = useState({})
  const [stage, setStage] = useState('tool')

  // Optional assumptions — all off by default. In Edit, preload each enabled flag
  // and value; open the section if any is enabled.
  const sv = storedValidated
  const [empEnabled, setEmpEnabled] = useState(() => !!(isEdit && sv && sv.employerContributionEnabled))
  const [empRaw, setEmpRaw] = useState(() => (isEdit && sv && sv.employerContributionEnabled ? String(sv.employerMonthlyContribution) : ''))
  const [chgEnabled, setChgEnabled] = useState(() => !!(isEdit && sv && sv.contributionChangeEnabled))
  const [chgRaw, setChgRaw] = useState(() => (isEdit && sv && sv.contributionChangeEnabled ? String(sv.annualContributionChange) : ''))
  const [infEnabled, setInfEnabled] = useState(() => !!(isEdit && sv && sv.inflationEnabled))
  const [infRaw, setInfRaw] = useState(() => (isEdit && sv && sv.inflationEnabled ? String(sv.annualInflation) : ''))
  const [optionalOpen, setOptionalOpen] = useState(() => !!(isEdit && sv && (sv.employerContributionEnabled || sv.contributionChangeEnabled || sv.inflationEnabled)))
  const empRef = useRef(null); const chgRef = useRef(null); const infRef = useRef(null)

  const firstRef = useRef(null)
  const doneRef = useRef(null)
  const openerRef = useRef(null)

  useEffect(() => {
    if (isEdit && storedValidated) {
      setPlanningCurrency(storedValidated.currency); setVals(initVals()); setTouched({}); setStage('tool')
      const s = storedValidated
      setEmpEnabled(!!s.employerContributionEnabled); setEmpRaw(s.employerContributionEnabled ? String(s.employerMonthlyContribution) : '')
      setChgEnabled(!!s.contributionChangeEnabled); setChgRaw(s.contributionChangeEnabled ? String(s.annualContributionChange) : '')
      setInfEnabled(!!s.inflationEnabled); setInfRaw(s.inflationEnabled ? String(s.annualInflation) : '')
      setOptionalOpen(!!(s.employerContributionEnabled || s.contributionChangeEnabled || s.inflationEnabled))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, storedValidated])

  // ---------- Review mode ----------
  if (effectiveMode === 'review') {
    const p = storedValidated
    const roShare = contributionShare({ currentContribution: p.currentContribution, plannedContribution: p.plannedContribution, currency: p.currency })
    const contribChangedRO = p.currentContribution !== p.plannedContribution
    const roEmp = p.employerActive, roChg = p.changeActive, roInf = p.inflationActive
    const roPathCard = (which) => {
      const path = which === 'current' ? p.current : p.planned
      const contribution = which === 'current' ? p.currentContribution : p.plannedContribution
      return (
        <div className={`goal-path${which === 'planned' ? ' goal-path--plan' : ''}`}>
          <p className="goal-path__label">{which === 'current' ? t.compare.current : t.compare.plan}</p>
          <p className="goal-path__row"><span>{t.compare.contribution}</span><span>{formatPlanAmount(contribution, p.currency)}</span></p>
          {roEmp && <p className="goal-path__row"><span>{t.optional.appliedEmployer}</span><span>{formatPlanAmount(p.employerMonthlyContribution, p.currency)}</span></p>}
          {roChg && <p className="goal-path__row"><span>{t.optional.finalPersonal}</span><span>{formatPlanAmount(path.finalPersonalContribution, p.currency)}</span></p>}
          <p className="goal-path__row"><span>{t.compare.projected}</span><span>{formatPlanAmount(path.projected, p.currency)}</span></p>
          {roInf && <p className="goal-path__row"><span>{t.optional.ppLabel}</span><span>{formatPlanAmount(path.purchasingPower, p.currency)}</span></p>}
          {roChg && <p className="goal-path__row"><span>{t.optional.totalPersonal}</span><span>{formatPlanAmount(path.totalPersonal, p.currency)}</span></p>}
          {roEmp && <p className="goal-path__row"><span>{t.optional.totalEmployer}</span><span>{formatPlanAmount(path.totalEmployer, p.currency)}</span></p>}
          <p className="goal-path__row"><span>{t.compare.totalContrib}</span><span>{formatPlanAmount(path.totalContributions, p.currency)}</span></p>
          <p className="goal-path__row goal-path__row--pct"><span>{t.compare.growth}</span><span>{formatPlanAmount(path.growth, p.currency)}</span></p>
          {(roEmp || roChg) && <p className="goal-path__row"><span>{t.optional.basicDiff}</span><span>{path.basicDiff > 0 ? '+' : ''}{formatPlanAmount(path.basicDiff, p.currency)}</span></p>}
        </div>
      )
    }
    const roSummary = []
    if (roEmp) roSummary.push(`${t.optional.appliedEmployer}: ${formatPlanAmount(p.employerMonthlyContribution, p.currency)}`)
    if (roChg) roSummary.push(`${t.optional.appliedChange}: ${formatPercent(p.annualContributionChange)}`)
    if (roInf) roSummary.push(`${t.optional.appliedInflation}: ${formatPercent(p.annualInflation)}`)
    const roAssumptions = t.assumptions.map((line) => {
      if (roEmp && line === t.assumeReplace.noEmployer) return t.assumeReplace.employer
      if (roChg && line === t.assumeReplace.noIncrease) return t.assumeReplace.change
      if (roInf && line === t.assumeReplace.noInflation) return t.assumeReplace.inflation
      return line
    })
    return (
      <main className="page page__reading plan">
        <header className="plan__head">
          <h1 className="serif plan__title">{t.review.heading}</h1>
          <p className="plan__note">{t.review.note}</p>
        </header>
        <section className="plan-card plan-review-compare" aria-label={t.compare.heading}>
          <p className="ret-shared">{t.compare.balance}: {formatPlanAmount(p.currentBalance, p.currency)} · {t.compare.years}: {p.years} · {t.compare.annualReturn}: {formatPercent(p.annualReturn)}</p>
          {roSummary.length > 0 && <p className="ret-shared">{roSummary.join(' \u00b7 ')}</p>}
          <p className="ret-shared ret-shared--note">{t.compare.sharedNote}</p>
          <div className="goal-paths">
            {roPathCard('current')}
            {roPathCard('planned')}
          </div>
          <p className="goal-diff">
            {t.compare.monthlyDiff}: {p.contributionDiff > 0 ? '+' : ''}{formatPlanAmount(p.contributionDiff, p.currency)}
            {'  '}<span className="goal-diff__tag">{contribChangedRO ? t.compare.changed : t.compare.unchanged}</span>
          </p>
          <p className="goal-diff">{t.compare.balanceDiff}: {p.balanceDiff > 0 ? '+' : ''}{formatPlanAmount(p.balanceDiff, p.currency)}</p>
          {roInf && <p className="ret-shared--note">{t.optional.ppExplain}</p>}
          {roShare && (
            <div className="ret-ratio">
              <p className="ret-ratio__head">{t.ratio.heading}</p>
              <p className="ret-ratio__row"><span>{t.ratio.current}</span><span>{formatPercent(roShare.current)}</span></p>
              <p className="ret-ratio__row"><span>{t.ratio.plan}</span><span>{formatPercent(roShare.planned)}</span></p>
              <p className="ret-ratio__row"><span>{t.ratio.change}</span><span>{roShare.changePts > 0 ? '+' : ''}{formatPercent(roShare.changePts)}</span></p>
              <p className="ret-ratio__note">{t.ratio.note}</p>
            </div>
          )}
          <div className="goal-assume">
            <p className="goal-assume__head">{t.assumesHeading}</p>
            <ul className="goal-assume__list">{roAssumptions.map((a, i) => <li key={i}>{a}</li>)}</ul>
          </div>
          <p className="ret-shared ret-shared--note">{t.uncertainty}</p>
        </section>
        <div className="plan__actions">
          <Link className="btn btn--primary" to="/plan/retirement?mode=edit">{t.review.edit}</Link>
          <Link className="btn btn--quiet" to="/plans">{t.review.backToPlans}</Link>
        </div>
      </main>
    )
  }

  // ---------- Explore / Edit ----------
  const parsed = {
    currentBalance: validateMoney(vals.currentBalance, currency),
    years: validateYears(vals.years),
    currentContribution: validateMoney(vals.currentContribution, currency),
    plannedContribution: validateMoney(vals.plannedContribution, currency),
    annualReturn: validateReturn(vals.annualReturn),
  }
  const parsedEmp = empEnabled ? validateMoney(empRaw, currency) : { value: 0 }
  const parsedChg = chgEnabled ? validatePct(chgRaw, MIN_RET_CONTRIBUTION_CHANGE, MAX_RET_CONTRIBUTION_CHANGE) : { value: 0 }
  const parsedInf = infEnabled ? validatePct(infRaw, MIN_RET_INFLATION, MAX_RET_INFLATION) : { value: 0 }
  const optValid = ('value' in parsedEmp) && ('value' in parsedChg) && ('value' in parsedInf)
  const allValid = Object.values(parsed).every((r) => 'value' in r) && optValid
  const nums = allValid ? {
    currentBalance: parsed.currentBalance.value, years: parsed.years.value,
    currentContribution: parsed.currentContribution.value, plannedContribution: parsed.plannedContribution.value,
    annualReturn: parsed.annualReturn.value, currency,
    employerContributionEnabled: empEnabled, employerMonthlyContribution: empEnabled ? parsedEmp.value : 0,
    contributionChangeEnabled: chgEnabled, annualContributionChange: chgEnabled ? parsedChg.value : 0,
    inflationEnabled: infEnabled, annualInflation: infEnabled ? parsedInf.value : 0,
  } : null
  const cmp = allValid ? computeRetirement(nums) : null
  const ok = cmp && cmp.status === 'ok'
  const contribChanged = allValid && nums.currentContribution !== nums.plannedContribution
  const share = ok ? contributionShare(nums) : null
  const identicalToStored = ok && !!storedValidated && sameStoredRetirement(nums, storedValidated)
  const canAdopt = allValid && ok && canAdoptRetirement(nums) && !identicalToStored
  const anyOptActive = ok && (cmp.employerActive || cmp.changeActive || cmp.inflationActive)

  const optErr = (enabled, parsedField, key) => (enabled && touched[key] && parsedField.error) ? t.errors[parsedField.error] : null
  const err = (k) => (touched[k] && parsed[k] && parsed[k].error) ? t.errors[parsed[k].error] : null
  function setVal(k, v) { setVals((s) => ({ ...s, [k]: v })); setTouched((tt) => ({ ...tt, [k]: true })) }
  function reset() {
    setVals(isEdit ? initVals() : { currentBalance: '', years: '', currentContribution: '', plannedContribution: '', annualReturn: '' })
    if (isEdit && storedValidated) {
      const s = storedValidated
      setEmpEnabled(!!s.employerContributionEnabled); setEmpRaw(s.employerContributionEnabled ? String(s.employerMonthlyContribution) : '')
      setChgEnabled(!!s.contributionChangeEnabled); setChgRaw(s.contributionChangeEnabled ? String(s.annualContributionChange) : '')
      setInfEnabled(!!s.inflationEnabled); setInfRaw(s.inflationEnabled ? String(s.annualInflation) : '')
      setOptionalOpen(!!(s.employerContributionEnabled || s.contributionChangeEnabled || s.inflationEnabled))
    } else {
      setEmpEnabled(false); setEmpRaw(''); setChgEnabled(false); setChgRaw(''); setInfEnabled(false); setInfRaw(''); setOptionalOpen(false)
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
    adoptRetirementPlan(buildRetirementPlan(nums))
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
    const eid = `ret-err-${k}`
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
  const plainInput = (k, mode, validate) => {
    const e = err(k)
    const eid = `ret-err-${k}`
    const suffix = k === 'annualReturn' ? '%' : null
    return (
      <label className="plan-num plan-num--stack" key={k}>
        <span className="plan-num__label">{t.fields[k]}</span>
        <span className="plan-num__field">
          <input className="plan-num__input" type="text" inputMode={mode} value={vals[k]}
            onChange={(ev) => setVal(k, ev.target.value)}
            aria-label={t.fields[k]} aria-describedby={e ? eid : undefined} aria-invalid={e ? true : undefined} />
          {suffix && <span className="plan-num__suffix" aria-hidden="true">{suffix}</span>}
        </span>
        <span className="plan-num__help">{t.fieldHelp[k]}</span>
        {e && <span className="plan-num__error" id={eid} role="alert">{e}</span>}
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
        {cmp.employerActive && <p className="goal-path__row"><span>{t.optional.appliedEmployer}</span><span>{formatPlanAmount(nums.employerMonthlyContribution, currency)}</span></p>}
        {cmp.changeActive && <p className="goal-path__row"><span>{t.optional.finalPersonal}</span><span>{formatPlanAmount(path.finalPersonalContribution, currency)}</span></p>}
        <p className="goal-path__row"><span>{t.compare.projected}</span><span>{formatPlanAmount(path.projected, currency)}</span></p>
        {cmp.inflationActive && <p className="goal-path__row"><span>{t.optional.ppLabel}</span><span>{formatPlanAmount(path.purchasingPower, currency)}</span></p>}
        {cmp.changeActive && <p className="goal-path__row"><span>{t.optional.totalPersonal}</span><span>{formatPlanAmount(path.totalPersonal, currency)}</span></p>}
        {cmp.employerActive && <p className="goal-path__row"><span>{t.optional.totalEmployer}</span><span>{formatPlanAmount(path.totalEmployer, currency)}</span></p>}
        <p className="goal-path__row"><span>{t.compare.totalContrib}</span><span>{formatPlanAmount(path.totalContributions, currency)}</span></p>
        <p className="goal-path__row goal-path__row--pct"><span>{t.compare.growth}</span><span>{formatPlanAmount(path.growth, currency)}</span></p>
        {(cmp.employerActive || cmp.changeActive) && <p className="goal-path__row"><span>{t.optional.basicDiff}</span><span>{path.basicDiff > 0 ? '+' : ''}{formatPlanAmount(path.basicDiff, currency)}</span></p>}
      </div>
    )
  }
  // Dynamic assumptions list: swap the now-false "no ..." lines when active.
  const dynAssumptions = t.assumptions.map((line) => {
    if (cmp && cmp.employerActive && line === t.assumeReplace.noEmployer) return t.assumeReplace.employer
    if (cmp && cmp.changeActive && line === t.assumeReplace.noIncrease) return t.assumeReplace.change
    if (cmp && cmp.inflationActive && line === t.assumeReplace.noInflation) return t.assumeReplace.inflation
    return line
  })
  const activeSummary = () => {
    if (!anyOptActive) return null
    const items = []
    if (cmp.employerActive) items.push(`${t.optional.appliedEmployer}: ${formatPlanAmount(nums.employerMonthlyContribution, currency)}`)
    if (cmp.changeActive) items.push(`${t.optional.appliedChange}: ${formatPercent(nums.annualContributionChange)}`)
    if (cmp.inflationActive) items.push(`${t.optional.appliedInflation}: ${formatPercent(nums.annualInflation)}`)
    return items.join(' \u00b7 ')
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

        <div className="ret-group" role="group" aria-label={t.assumesHeading}>
          <p className="ret-group__head">{t.assumesHeading}</p>
          {moneyInput('currentBalance', true)}
          {plainInput('years', 'numeric')}
          {plainInput('annualReturn', 'decimal')}
          <p className="ret-return-note">{t.returnNote}</p>
        </div>

        <div className="ret-group ret-group--current" role="group" aria-label={t.currentPathHeading}>
          <p className="ret-group__head">{t.currentPathHeading}</p>
          {moneyInput('currentContribution', false)}
        </div>

        <div className="ret-group ret-group--choose" role="group" aria-label={t.choosingHeading}>
          <p className="ret-group__head">{t.choosingHeading}</p>
          {moneyInput('plannedContribution', false)}
        </div>
      </section>

      <div className="goal-assume">
        <p className="goal-assume__head">{t.assumesHeading}</p>
        <ul className="goal-assume__list">{dynAssumptions.map((a, i) => <li key={i}>{a}</li>)}</ul>
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
              <input type="checkbox" className="goal-optin__box" checked={empEnabled}
                onChange={(ev) => { setEmpEnabled(ev.target.checked); setTouched((tt) => ({ ...tt, employer: true })); if (ev.target.checked) requestAnimationFrame(() => empRef.current?.focus()) }} />
              <span className="goal-optin__label">{t.optional.employerOptIn}</span>
            </label>
            {empEnabled && (
              <label className="plan-num plan-num--stack goal-optional__field">
                <span className="plan-num__label">{t.optional.employerField}</span>
                <span className="plan-num__field">
                  <span className="plan-num__sym" aria-hidden="true">{sym}</span>
                  <input ref={empRef} className="plan-num__input" type="text" inputMode="decimal" value={empRaw}
                    onChange={(ev) => { setEmpRaw(ev.target.value); setTouched((tt) => ({ ...tt, employer: true })) }}
                    aria-label={t.optional.employerField} aria-describedby={optErr(empEnabled, parsedEmp, 'employer') ? 'ret-err-emp' : undefined} aria-invalid={optErr(empEnabled, parsedEmp, 'employer') ? true : undefined} />
                </span>
                <span className="plan-num__help">{t.optional.employerHelp}</span>
                {optErr(empEnabled, parsedEmp, 'employer') && <span className="plan-num__error" id="ret-err-emp" role="alert">{optErr(empEnabled, parsedEmp, 'employer')}</span>}
              </label>
            )}

            <label className="goal-optin">
              <input type="checkbox" className="goal-optin__box" checked={chgEnabled}
                onChange={(ev) => { setChgEnabled(ev.target.checked); setTouched((tt) => ({ ...tt, change: true })); if (ev.target.checked) requestAnimationFrame(() => chgRef.current?.focus()) }} />
              <span className="goal-optin__label">{t.optional.changeOptIn}</span>
            </label>
            {chgEnabled && (
              <label className="plan-num plan-num--stack goal-optional__field">
                <span className="plan-num__label">{t.optional.changeField}</span>
                <span className="plan-num__field">
                  <input ref={chgRef} className="plan-num__input" type="text" inputMode="decimal" value={chgRaw}
                    onChange={(ev) => { setChgRaw(ev.target.value); setTouched((tt) => ({ ...tt, change: true })) }}
                    aria-label={t.optional.changeField} aria-describedby={optErr(chgEnabled, parsedChg, 'change') ? 'ret-err-chg' : undefined} aria-invalid={optErr(chgEnabled, parsedChg, 'change') ? true : undefined} />
                  <span className="plan-num__suffix" aria-hidden="true">%</span>
                </span>
                <span className="plan-num__help">{t.optional.changeHelp}</span>
                {optErr(chgEnabled, parsedChg, 'change') && <span className="plan-num__error" id="ret-err-chg" role="alert">{optErr(chgEnabled, parsedChg, 'change')}</span>}
              </label>
            )}

            <label className="goal-optin">
              <input type="checkbox" className="goal-optin__box" checked={infEnabled}
                onChange={(ev) => { setInfEnabled(ev.target.checked); setTouched((tt) => ({ ...tt, inflation: true })); if (ev.target.checked) requestAnimationFrame(() => infRef.current?.focus()) }} />
              <span className="goal-optin__label">{t.optional.inflationOptIn}</span>
            </label>
            {infEnabled && (
              <label className="plan-num plan-num--stack goal-optional__field">
                <span className="plan-num__label">{t.optional.inflationField}</span>
                <span className="plan-num__field">
                  <input ref={infRef} className="plan-num__input" type="text" inputMode="decimal" value={infRaw}
                    onChange={(ev) => { setInfRaw(ev.target.value); setTouched((tt) => ({ ...tt, inflation: true })) }}
                    aria-label={t.optional.inflationField} aria-describedby={optErr(infEnabled, parsedInf, 'inflation') ? 'ret-err-inf' : undefined} aria-invalid={optErr(infEnabled, parsedInf, 'inflation') ? true : undefined} />
                  <span className="plan-num__suffix" aria-hidden="true">%</span>
                </span>
                <span className="plan-num__help">{t.optional.inflationHelp}</span>
                {optErr(infEnabled, parsedInf, 'inflation') && <span className="plan-num__error" id="ret-err-inf" role="alert">{optErr(infEnabled, parsedInf, 'inflation')}</span>}
              </label>
            )}
          </div>
        )}
      </section>

      {allValid && ok && (
        <section className="plan-result" aria-live="polite">
          <h2 className="serif plan-result__head">{t.compare.heading}</h2>
          <p className="ret-shared">{t.compare.balance}: {formatPlanAmount(nums.currentBalance, currency)} · {t.compare.years}: {nums.years} · {t.compare.annualReturn}: {formatPercent(nums.annualReturn)}</p>
          {anyOptActive && <p className="ret-shared">{activeSummary()}</p>}
          <p className="ret-shared ret-shared--note">{t.compare.sharedNote}</p>
          <div className="goal-paths">
            {pathCard('current')}
            {pathCard('planned')}
          </div>
          <p className="goal-diff">
            {t.compare.monthlyDiff}: {cmp.contributionDiff > 0 ? '+' : ''}{formatPlanAmount(cmp.contributionDiff, currency)}
            {'  '}<span className="goal-diff__tag">{contribChanged ? t.compare.changed : t.compare.unchanged}</span>
          </p>
          <p className="goal-diff">{t.compare.balanceDiff}: {cmp.balanceDiff > 0 ? '+' : ''}{formatPlanAmount(cmp.balanceDiff, currency)}</p>
          {cmp.inflationActive && <p className="ret-shared--note">{t.optional.ppExplain}</p>}
          {share && (
            <div className="ret-ratio">
              <p className="ret-ratio__head">{t.ratio.heading}</p>
              <p className="ret-ratio__row"><span>{t.ratio.current}</span><span>{formatPercent(share.current)}</span></p>
              <p className="ret-ratio__row"><span>{t.ratio.plan}</span><span>{formatPercent(share.planned)}</span></p>
              <p className="ret-ratio__row"><span>{t.ratio.change}</span><span>{share.changePts > 0 ? '+' : ''}{formatPercent(share.changePts)}</span></p>
              <p className="ret-ratio__note">{t.ratio.note}</p>
            </div>
          )}
          <p className="goal-progress-explain">{t.uncertainty}</p>
          <p className="ret-reflect">{t.reflection}</p>
          {!contribChanged && <p className="goal-nochange">{t.noChangeNote}</p>}
          {identicalToStored && <p className="goal-nochange">{t.identicalNote}</p>}
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
            {t.compare.balance}: {formatPlanAmount(nums.currentBalance, currency)}<br />
            {t.compare.years}: {nums.years}<br />
            {t.compare.annualReturn}: {formatPercent(nums.annualReturn)}<br />
            {t.compare.contribution}: {formatPlanAmount(nums.currentContribution, currency)}{' \u2192 '}{formatPlanAmount(nums.plannedContribution, currency)}<br />
            {cmp.employerActive && <>{t.optional.appliedEmployer}: {formatPlanAmount(nums.employerMonthlyContribution, currency)}<br /></>}
            {cmp.changeActive && <>{t.optional.appliedChange}: {formatPercent(nums.annualContributionChange)}<br />{t.optional.finalPersonal}: {formatPlanAmount(cmp.planned.finalPersonalContribution, currency)}<br /></>}
            {cmp.inflationActive && <>{t.optional.appliedInflation}: {formatPercent(nums.annualInflation)}<br /></>}
            {t.compare.projected}: {formatPlanAmount(cmp.planned.projected, currency)}<br />
            {t.compare.totalContrib}: {formatPlanAmount(cmp.planned.totalContributions, currency)}<br />
            {t.compare.growth}: {formatPlanAmount(cmp.planned.growth, currency)}
            {(cmp.employerActive || cmp.changeActive) && <><br />{t.optional.basicDiff}: {cmp.planned.basicDiff > 0 ? '+' : ''}{formatPlanAmount(cmp.planned.basicDiff, currency)}</>}
            {cmp.inflationActive && <><br />{t.optional.ppLabel}: {formatPlanAmount(cmp.planned.purchasingPower, currency)}</>}
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
