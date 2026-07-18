import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { emergencyContent } from './emergencyContent'
import { getEmergencyPlan, adoptEmergencyPlan } from '../lib/progress'
import {
  EMERGENCY_SAFE_AMOUNT,
  compareEmergency, canAdoptEmergency, buildEmergencyPlan, validateStoredEmergencyPlan,
  readAssessedEmergency, emergencyPlanStatus, canEditEmergency,
  roundMonths, formatMonths1, formatPlanAmount,
} from './emergencyPlanLogic.js'

const MODES = ['explore', 'review', 'edit']

function validateMoney(raw, currency) {
  const t = String(raw).trim()
  if (t === '') return { error: 'blank' }
  const n = Number(t)
  if (!Number.isFinite(n)) return { error: 'nonNumeric' }
  if (n < 0) return { error: 'negative' }
  if (n > EMERGENCY_SAFE_AMOUNT) return { error: 'tooLarge' }
  const decimals = (t.split('.')[1] || '').length
  if (currency === 'krw' && decimals > 0) return { error: 'wholeKrw' }
  if (currency !== 'krw' && decimals > 2) return { error: 'decimalsUsd' }
  return { value: n }
}

// A read-only assessed value or an unchanged prefilled Checkup scenario value is
// accepted when it is finite, non-negative, and within the technical bound —
// WITHOUT the planning-only editable-precision rule. The Checkup owns these
// numbers; the Planning Tool must not reject or rewrite them for precision.
// Once the user edits such a field, validateMoney (with precision) applies.
function looseMoney(raw) {
  const t = String(raw).trim()
  if (t === '') return { error: 'blank' }
  const n = Number(t)
  if (!Number.isFinite(n)) return { error: 'nonNumeric' }
  if (n < 0) return { error: 'negative' }
  if (n > EMERGENCY_SAFE_AMOUNT) return { error: 'tooLarge' }
  return { value: n }
}

// Focus-managing modal (same pattern as the other Planning tools; kept local so
// Emergency stays independent of Cash Flow / Debt code).
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

// Month estimate or an honest state message.
function monthsText(res, t) {
  if (res.status === 'ok') return `${formatMonths1(res.months)} ${t.monthsUnit}`
  return t.states[res.status] || t.states.unavailable
}

export default function EmergencyPlan() {
  const { lang } = useLanguage()
  const t = emergencyContent[lang]
  const [params] = useSearchParams()

  const storedValidated = useMemo(() => validateStoredEmergencyPlan(getEmergencyPlan()), [])
  const assessed = useMemo(() => readAssessedEmergency(), [])
  const editEligible = storedValidated ? canEditEmergency(storedValidated, assessed) : false

  const rawMode = params.get('mode')
  const mode = MODES.includes(rawMode) ? rawMode : 'explore'
  let effectiveMode = 'explore'
  if (mode === 'review' && storedValidated) effectiveMode = 'review'
  else if (mode === 'edit' && storedValidated && editEligible) effectiveMode = 'edit'
  else if (mode === 'edit' && storedValidated && !editEligible) effectiveMode = 'review'
  const isEdit = effectiveMode === 'edit'

  const [source, setSource] = useState(() => {
    if (isEdit && storedValidated) return storedValidated.source
    return assessed.assessable ? 'checkup' : 'planning'
  })
  // Planning-only currency: for a planning-only Edit, preserve the STORED plan's
  // currency (language must not change it); for fresh exploration, default from
  // the current language.
  const [planningCurrency, setPlanningCurrency] = useState(() => {
    if (isEdit && storedValidated && storedValidated.source === 'planning') return storedValidated.currency
    return lang === 'ko' ? 'krw' : 'usd'
  })
  const currency = source === 'checkup' ? (assessed.currency || 'usd') : planningCurrency

  // Baseline for a checkup plan is the (current) assessed picture, read-only.
  // Only offered when the assessed picture is usable (assessable, must-pays > 0).
  const checkupBaseline = assessed.assessable ? { accessible: assessed.accessible, mustPays: assessed.mustPays } : null

  // Editable raw fields. Planning-only edits both baseline + scenario; checkup edits scenario only.
  const initBase = () => {
    if (isEdit && storedValidated && storedValidated.source === 'planning') {
      return { accessible: String(storedValidated.baseline.accessible), mustPays: String(storedValidated.baseline.mustPays) }
    }
    return { accessible: '', mustPays: '' }
  }
  const initScen = () => {
    if (isEdit && storedValidated) {
      return { accessible: String(storedValidated.scenario.accessible), mustPays: String(storedValidated.scenario.mustPays) }
    }
    if (checkupBaseline && source === 'checkup') {
      return { accessible: String(checkupBaseline.accessible), mustPays: String(checkupBaseline.mustPays) }
    }
    return { accessible: '', mustPays: '' }
  }
  const [baseRaw, setBaseRaw] = useState(initBase)
  const [scenRaw, setScenRaw] = useState(initScen)
  const [touched, setTouched] = useState({})
  const [stage, setStage] = useState('tool')

  const firstRef = useRef(null)
  const doneRef = useRef(null)
  const openerRef = useRef(null)

  // Resync on Review -> Edit, and when the source toggle flips (fresh explore).
  useEffect(() => {
    if (isEdit && storedValidated) {
      setSource(storedValidated.source)
      if (storedValidated.source === 'planning') setPlanningCurrency(storedValidated.currency)
      setBaseRaw(initBase()); setScenRaw(initScen()); setTouched({}); setStage('tool')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, storedValidated])

  function switchSource(next) {
    setSource(next)
    setTouched({}); setStage('tool')
    if (next === 'checkup' && checkupBaseline) {
      setScenRaw({ accessible: String(checkupBaseline.accessible), mustPays: String(checkupBaseline.mustPays) })
      setBaseRaw({ accessible: '', mustPays: '' })
    } else {
      setScenRaw({ accessible: '', mustPays: '' }); setBaseRaw({ accessible: '', mustPays: '' })
    }
  }

  // ---------- Review mode ----------
  if (effectiveMode === 'review') {
    const p = storedValidated
    const chg = roundMonths(p.est.scenMonths) - roundMonths(p.est.curMonths)
    const status = emergencyPlanStatus(p, assessed)
    const showStale = p.source === 'checkup' && (status === 'stale' || status === 'no-picture')
    return (
      <main className="page page__reading plan">
        <header className="plan__head">
          <h1 className="serif plan__title">{t.review.heading}</h1>
          <p className="plan__note">{t.review.note}</p>
        </header>
        <section className="plan-card" aria-label={t.review.heading}>
          <p className="plan-card__source">{p.source === 'planning' ? t.source.planningCaption : t.source.checkupCaption}</p>
          {showStale && <p className="plan-card__status plan-card__status--stale">{editEligible ? t.stale : t.staleUneditable}</p>}
          <ul className="plan-card__changes">
            <li className="plan-card__change"><span className="plan-card__k">{t.compare.accessible}</span><span className="plan-card__v">{formatPlanAmount(p.baseline.accessible, p.currency)}{' \u2192 '}{formatPlanAmount(p.scenario.accessible, p.currency)}</span></li>
            <li className="plan-card__change"><span className="plan-card__k">{t.compare.mustPays}</span><span className="plan-card__v">{formatPlanAmount(p.baseline.mustPays, p.currency)}{' \u2192 '}{formatPlanAmount(p.scenario.mustPays, p.currency)}</span></li>
          </ul>
          <div className="plan-card__totals">
            <p className="plan-card__line plan-card__line--main">{t.compare.months}: {formatMonths1(p.est.curMonths)}{' \u2192 '}{formatMonths1(p.est.scenMonths)} {t.monthsUnit}</p>
            <p className="plan-card__line">{t.compare.changeInMonths}: {chg > 0 ? '+' : ''}{formatMonths1(chg)}</p>
          </div>
          <p className="em-assume">{t.assumptions}</p>
          <p className="em-meaning">{t.meaning}</p>
        </section>
        <div className="plan__actions">
          {editEligible && <Link className="btn btn--primary" to="/plan/emergency?mode=edit">{t.review.edit}</Link>}
          {!editEligible && p.source === 'checkup' && <Link className="btn btn--soft" to="/checkup">{t.checkupPath}</Link>}
          <Link className="btn btn--quiet" to="/plans">{t.review.backToPlans}</Link>
        </div>
      </main>
    )
  }

  // ---------- Explore / Edit ----------
  const showSourceChoice = !isEdit && assessed.assessable
  const showBaselineEntry = source === 'planning' // planning-only edits/enters its own baseline

  // A checkup scenario field is "pristine" while it still holds the exact
  // prefilled assessed value and has not been edited — validated leniently so an
  // assessed value with more precision than the editable rule allows stays usable.
  const scenPristine = (k) => source === 'checkup' && checkupBaseline != null && !touched[`s_${k}`] && scenRaw[k] === String(checkupBaseline[k])
  const scenParse = (k) => (scenPristine(k) ? looseMoney(scenRaw[k]) : validateMoney(scenRaw[k], currency))

  // Checkup baseline is read-only assessed data: no editable-precision rule.
  const baseVals = source === 'checkup'
    ? { accessible: looseMoney(String(checkupBaseline?.accessible ?? '')), mustPays: looseMoney(String(checkupBaseline?.mustPays ?? '')) }
    : { accessible: validateMoney(baseRaw.accessible, currency), mustPays: validateMoney(baseRaw.mustPays, currency) }
  const scenVals = { accessible: scenParse('accessible'), mustPays: scenParse('mustPays') }

  const baseValid = 'value' in baseVals.accessible && 'value' in baseVals.mustPays
  const scenValid = 'value' in scenVals.accessible && 'value' in scenVals.mustPays
  const allValid = baseValid && scenValid

  const baseline = allValid ? { accessible: baseVals.accessible.value, mustPays: baseVals.mustPays.value } : null
  const scenario = allValid ? { accessible: scenVals.accessible.value, mustPays: scenVals.mustPays.value } : null
  const cmp = allValid ? compareEmergency({ baseline, scenario }) : null
  const changedAcc = allValid && baseline.accessible !== scenario.accessible
  const changedMust = allValid && baseline.mustPays !== scenario.mustPays
  const hasChange = changedAcc || changedMust
  const canAdopt = allValid && canAdoptEmergency({ baseline, scenario })
  const bothOk = cmp && cmp.current.status === 'ok' && cmp.scenario.status === 'ok'
  const monthChange = bothOk ? roundMonths(cmp.scenario.months) - roundMonths(cmp.current.months) : 0

  const err = (k, parsed) => (touched[k] && parsed.error) ? parsed.error : null
  function setBase(k, v) { setBaseRaw((s) => ({ ...s, [k]: v })); setTouched((tt) => ({ ...tt, [`b_${k}`]: true })) }
  function setScen(k, v) { setScenRaw((s) => ({ ...s, [k]: v })); setTouched((tt) => ({ ...tt, [`s_${k}`]: true })) }
  function reset() {
    if (source === 'checkup' && checkupBaseline) setScenRaw({ accessible: String(checkupBaseline.accessible), mustPays: String(checkupBaseline.mustPays) })
    else { setScenRaw({ accessible: '', mustPays: '' }); setBaseRaw({ accessible: '', mustPays: '' }) }
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
    adoptEmergencyPlan(buildEmergencyPlan({ source, currency, baseline, scenario }))
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
  const moneyInput = (scope, k, refFirst) => {
    const raw = scope === 'b' ? baseRaw[k] : scenRaw[k]
    const parsed = scope === 's' ? scenParse(k) : validateMoney(raw, currency)
    const tkey = `${scope}_${k}`
    const e = err(tkey, parsed)
    const eid = `em-err-${scope}-${k}`
    const labels = scope === 'b' ? t.fields : t.scenarioFields
    return (
      <label className="plan-num plan-num--stack" key={tkey}>
        <span className="plan-num__label">{labels[k]}</span>
        <span className="plan-num__field">
          <span className="plan-num__sym" aria-hidden="true">{sym}</span>
          <input
            ref={refFirst ? firstRef : undefined}
            className="plan-num__input" type="text" inputMode="decimal"
            value={raw}
            onChange={(ev) => (scope === 'b' ? setBase(k, ev.target.value) : setScen(k, ev.target.value))}
            aria-label={labels[k]}
            aria-describedby={e ? eid : undefined}
            aria-invalid={e ? true : undefined}
          />
        </span>
        <span className="plan-num__help">{(scope === 'b' ? t.fieldHelp : t.fieldHelp)[k]}</span>
        {e && <span className="plan-num__error" id={eid} role="alert">{t.errors[parsed.error]}</span>}
      </label>
    )
  }

  return (
    <main className="page page__reading plan">
      <header className="plan__head">
        <h1 className="serif plan__title">{isEdit ? t.edit.heading : t.label}</h1>
        <p className="plan__note">{isEdit ? t.edit.note : t.purpose}</p>
      </header>

      <p className="em-adequacy">{t.adequacy}</p>

      {showSourceChoice && (
        <section className="em-source" role="radiogroup" aria-label={t.source.choose}>
          <p className="em-source__label">{t.source.choose}</p>
          <div className="em-source__opts">
            <button type="button" role="radio" aria-checked={source === 'checkup'} className={`em-source__opt${source === 'checkup' ? ' is-on' : ''}`} onClick={() => switchSource('checkup')}>
              <span className="em-source__name">{t.source.fromCheckup}</span>
              <span className="em-source__hint">{t.source.fromCheckupHint}</span>
            </button>
            <button type="button" role="radio" aria-checked={source === 'planning'} className={`em-source__opt${source === 'planning' ? ' is-on' : ''}`} onClick={() => switchSource('planning')}>
              <span className="em-source__name">{t.source.planning}</span>
              <span className="em-source__hint">{t.source.planningHint}</span>
            </button>
          </div>
        </section>
      )}

      <section className="plan-entry" aria-label={t.label}>
        {source === 'planning' && (
          <div className="plan-cur" role="radiogroup" aria-label={t.currencyChoice.label}>
            <span className="plan-cur__label">{t.currencyChoice.label}</span>
            <div className="plan-cur__opts">
              {['usd', 'krw'].map((cur) => (
                <button key={cur} type="button" role="radio" aria-checked={planningCurrency === cur}
                  className={`plan-cur__opt${planningCurrency === cur ? ' is-on' : ''}`}
                  onClick={() => { setPlanningCurrency(cur) }}>{t.currencyChoice[cur]}</button>
              ))}
            </div>
          </div>
        )}

        {source === 'checkup' ? (
          <div className="plan-assessed" aria-label={t.source.checkupCaption}>
            <p className="plan-assessed__caption">{t.source.checkupCaption}</p>
            <p className="em-begins">{t.source.beginsFrom}</p>
            <div className="em-baseline-read">
              <p className="plan-assessed__row"><span>{t.fields.accessible}</span><span>{formatPlanAmount(checkupBaseline.accessible, currency)}</span></p>
              <p className="plan-assessed__row"><span>{t.fields.mustPays}</span><span>{formatPlanAmount(checkupBaseline.mustPays, currency)}</span></p>
            </div>
          </div>
        ) : (
          <div className="em-baseline-entry">
            <p className="plan-assessed__caption">{t.source.planningCaption}</p>
            <p className="em-begins">{t.source.planningNote}</p>
            {moneyInput('b', 'accessible', true)}
            {moneyInput('b', 'mustPays', false)}
          </div>
        )}

        <div className="em-scenario">
          <p className="em-scenario__caption">{t.compare.planned}</p>
          {moneyInput('s', 'accessible', source === 'checkup')}
          {moneyInput('s', 'mustPays', false)}
        </div>
      </section>

      {allValid && (
        <section className="plan-result" aria-live="polite">
          <h2 className="serif plan-result__head">{t.compare.heading}</h2>

          <div className="em-rows">
            <div className={`em-row${changedAcc ? ' is-changed' : ''}`}>
              <span className="em-row__k">{t.compare.accessible} <span className="em-row__tag">{changedAcc ? t.compare.changed : t.compare.unchanged}</span></span>
              <span className="em-row__v">{formatPlanAmount(baseline.accessible, currency)}{' \u2192 '}{formatPlanAmount(scenario.accessible, currency)}</span>
            </div>
            <div className={`em-row${changedMust ? ' is-changed' : ''}`}>
              <span className="em-row__k">{t.compare.mustPays} <span className="em-row__tag">{changedMust ? t.compare.changed : t.compare.unchanged}</span></span>
              <span className="em-row__v">{formatPlanAmount(baseline.mustPays, currency)}{' \u2192 '}{formatPlanAmount(scenario.mustPays, currency)}</span>
            </div>
          </div>

          <div className="em-months">
            <div className="em-month-card">
              <p className="em-month-card__label">{t.compare.now}</p>
              <p className="em-month-card__val">{monthsText(cmp.current, t)}</p>
            </div>
            <div className="em-month-card em-month-card--plan">
              <p className="em-month-card__label">{t.compare.planned}</p>
              <p className="em-month-card__val">{monthsText(cmp.scenario, t)}</p>
            </div>
          </div>

          {bothOk && (
            <p className="em-change" aria-live="polite">
              {t.compare.changeInMonths}: {monthChange > 0 ? '+' : ''}{formatMonths1(monthChange)} {t.monthsUnit}
              {'  '}
              {monthChange > 0 ? t.compare.more : monthChange < 0 ? t.compare.less : t.compare.same}
            </p>
          )}

          <p className="em-meaning">{t.meaning}</p>
        </section>
      )}

      {allValid && !hasChange && <p className="plan__nochange">{t.noChange}</p>}
      {allValid && hasChange && !canAdopt && <p className="plan__nochange">{t.cantAdopt}</p>}

      <div className="plan__actions">
        <button type="button" className="btn btn--primary" disabled={!canAdopt} onClick={onKeep}>{t.keep}</button>
        <button type="button" className="btn btn--quiet" onClick={reset}>{t.reset}</button>
        <Link className="btn btn--quiet" to="/plans">{t.leave}</Link>
      </div>

      {stage === 'confirm' && canAdopt && (
        <PlanModal label={t.confirm.heading} onCancel={() => setStage('tool')} openerRef={openerRef}>
          <h2 className="serif plan-modal__title">{t.confirm.heading}</h2>
          <p className="plan-modal__body">{t.confirm.line(`${formatMonths1(cmp.current.months)} ${t.monthsUnit}`, `${formatMonths1(cmp.scenario.months)} ${t.monthsUnit}`)}</p>
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
