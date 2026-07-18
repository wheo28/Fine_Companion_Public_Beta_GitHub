import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { planContent } from './planContent'
import { getPlan, adoptPlan } from '../lib/progress'
import {
  SAFE_AMOUNT,
  LEVERS,
  roundPlanAmount,
  formatPlanAmount,
  readAssessedCashflow,
  validateStoredPlan,
  planStatus,
  canEditPlan,
  computeMultiScenario,
  normalizeBaseline,
  computeRatios,
  formatPercent,
  roundPercentValue,
  buildPlan,
} from './cashflowPlanLogic.js'

const MODES = ['explore', 'review', 'edit']

// Validate a single raw amount string. Returns { error } or { value }.
function validateInput(raw) {
  const t = String(raw).trim()
  if (t === '') return { error: 'blank' }
  const n = Number(t)
  if (!Number.isFinite(n)) return { error: 'nonNumeric' }
  if (n < 0) return { error: 'negative' }
  if (!Number.isInteger(n)) return { error: 'fractional' }
  if (n > SAFE_AMOUNT) return { error: 'tooLarge' }
  return { value: n }
}

// Focus-managing modal: focuses the primary action, traps Tab, treats Escape as
// Cancel, and restores focus to the opener on close.
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
      const first = items[0]
      const last = items[items.length - 1]
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

const emptyVals = () => ({ income: '', essentials: '', nonEssentials: '', debt: '' })

// Amounts / Ratios segmented control (radiogroup; keyboard + screen-reader ready).
// Arrow keys and Home/End move selection AND focus to the newly selected radio;
// only the selected option is tabbable. Selection never touches scenario values
// and is never persisted.
function ViewToggle({ view, setView, t }) {
  const opts = ['amounts', 'ratios']
  const refs = useRef({})
  const select = (v) => { setView(v); requestAnimationFrame(() => refs.current[v]?.focus()) }
  function onKey(e) {
    const i = opts.indexOf(view)
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); select(opts[(i + 1) % opts.length]) }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); select(opts[(i + opts.length - 1) % opts.length]) }
    else if (e.key === 'Home') { e.preventDefault(); select('amounts') }
    else if (e.key === 'End') { e.preventDefault(); select('ratios') }
  }
  return (
    <div className="plan-viewtoggle" role="radiogroup" aria-label={t.ratio.viewLabel} onKeyDown={onKey}>
      {opts.map((v) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={view === v}
          tabIndex={view === v ? 0 : -1}
          ref={(el) => { refs.current[v] = el }}
          className={`plan-viewtoggle__opt${view === v ? ' is-on' : ''}`}
          onClick={() => select(v)}
        >
          {t.ratio[v]}
        </button>
      ))}
    </div>
  )
}

// One descriptive-ratio card. Current and plan are each shown on their own row
// with an explicit time label (Now / In this plan) and the ratio's own label
// (independent per side, so a room->gap flip reads correctly), then the
// percentage-point change. Meaning never depends on an arrow.
function RatioBlock({ groupLabel, curLabel, planLabel, curStr, planStr, changeStr, t }) {
  return (
    <div className="plan-ratio" role="group" aria-label={groupLabel}>
      <div className="plan-ratio__row">
        <span className="plan-ratio__time">{t.ratio.now}</span>
        <span className="plan-ratio__share">{curLabel}</span>
        <span className="plan-ratio__v">{curStr}</span>
      </div>
      <div className="plan-ratio__row">
        <span className="plan-ratio__time">{t.ratio.inPlan}</span>
        <span className="plan-ratio__share">{planLabel}</span>
        <span className="plan-ratio__v">{planStr}</span>
      </div>
      <p className="plan-ratio__change">{changeStr}</p>
    </div>
  )
}

// Ratio comparison body. Derives shares from validated numeric values only;
// never persists, never divides by zero, never substitutes zero for missing.
function RatioBody({ baseline, m, inRange, t, lang, onBack }) {
  if (!inRange || !m) return <p className="plan-result__none">{t.compare.noneYet}</p>
  const cur = computeRatios(baseline)
  const plan = computeRatios({
    income: m.scenario.income, essentials: m.scenario.essentials,
    nonEssentials: m.scenario.nonEssentials, debt: m.scenario.debt, room: m.room,
  })
  if (!cur || !plan) {
    return (
      <div className="plan-ratio-zero">
        <p className="plan-ratio-zero__msg">{t.ratio.incomeZero}</p>
        <button type="button" className="btn btn--soft" onClick={onBack}>{t.ratio.backToAmounts}</button>
      </div>
    )
  }
  const changed = (a, b) => roundPercentValue(a) !== roundPercentValue(b)
  const pts = (pp) => {
    const s = roundPercentValue(pp)
    const sign = s > 0 ? '+' : s < 0 ? '-' : ''
    const sep = lang === 'ko' ? '' : ' '
    return `${t.ratio.change}: ${sign}${Math.abs(s).toFixed(1)}${sep}${t.ratio.points}`
  }
  const changeStr = (a, b) => (changed(a, b) ? pts(b - a) : t.ratio.noChange)
  const curRoomLabel = cur.roomShare < 0 ? t.ratio.gapShare : t.ratio.roomShare
  const planRoomLabel = plan.roomShare < 0 ? t.ratio.gapShare : t.ratio.roomShare
  return (
    <div className="plan-ratios">
      <RatioBlock t={t} groupLabel={t.ratio.mustPay} curLabel={t.ratio.mustPay} planLabel={t.ratio.mustPay}
        curStr={formatPercent(cur.mustPay)} planStr={formatPercent(plan.mustPay)} changeStr={changeStr(cur.mustPay, plan.mustPay)} />
      <RatioBlock t={t} groupLabel={t.ratio.flexible} curLabel={t.ratio.flexible} planLabel={t.ratio.flexible}
        curStr={formatPercent(cur.flexible)} planStr={formatPercent(plan.flexible)} changeStr={changeStr(cur.flexible, plan.flexible)} />
      <RatioBlock t={t} groupLabel={curRoomLabel} curLabel={curRoomLabel} planLabel={planRoomLabel}
        curStr={formatPercent(Math.abs(cur.roomShare))} planStr={formatPercent(Math.abs(plan.roomShare))} changeStr={changeStr(cur.roomShare, plan.roomShare)} />
      <p className="plan-ratios__explain">{t.ratio.explanation}</p>
    </div>
  )
}

export default function CashFlowPlan() {
  const { lang } = useLanguage()
  const t = planContent[lang]
  const [params] = useSearchParams()

  const assessed = useMemo(() => readAssessedCashflow(), [])
  const storedValidated = useMemo(() => validateStoredPlan(getPlan()), [])
  const storedFresh = storedValidated ? planStatus(storedValidated, assessed) : null

  const rawMode = params.get('mode')
  const mode = MODES.includes(rawMode) ? rawMode : 'explore'
  const editEligible = canEditPlan(storedValidated, assessed)
  let effectiveMode = 'explore'
  if (mode === 'review' && storedValidated) effectiveMode = 'review'
  else if (mode === 'edit' && storedValidated && editEligible) effectiveMode = 'edit'
  else if (mode === 'edit' && storedValidated && !editEligible) effectiveMode = 'review' // ineligible edit falls back to review
  const isEdit = effectiveMode === 'edit'

  // Baseline source + baseline picture.
  const baselineSource = isEdit ? storedValidated.baselineSource : (assessed.known ? 'checkup' : 'planning')

  // Planning-only baseline entry (only for explore without a checkup picture).
  const [baselineRaw, setBaselineRaw] = useState(emptyVals)
  const [baselineTouched, setBaselineTouched] = useState({})
  const [baselineConfirmed, setBaselineConfirmed] = useState(false)
  // Planning-only currency: seeded from language, then held in state so a later
  // language switch does not silently change this plan's currency.
  const [planningCurrency, setPlanningCurrency] = useState(() => (lang === 'ko' ? 'krw' : 'usd'))

  // Scenario inputs (empty string = unchanged). Edit preloads stored changes.
  const [vals, setVals] = useState(() => {
    if (effectiveMode === 'edit') {
      const v = emptyVals()
      for (const k of LEVERS) if (Object.prototype.hasOwnProperty.call(storedValidated.changes, k)) v[k] = String(storedValidated.changes[k])
      return v
    }
    return emptyVals()
  })
  const [touched, setTouched] = useState({})
  const [stage, setStage] = useState('tool') // 'tool' | 'confirm' | 'replace' | 'done'
  const [view, setView] = useState('amounts') // 'amounts' | 'ratios' — component-only, not persisted

  const firstFieldRef = useRef(null)
  const baselineFirstRef = useRef(null)
  const doneRef = useRef(null)
  const openerRef = useRef(null)

  // Review -> Edit on the same mounted component: resync when effectiveMode becomes edit.
  useEffect(() => {
    if (effectiveMode === 'edit' && storedValidated) {
      const v = emptyVals()
      for (const k of LEVERS) if (Object.prototype.hasOwnProperty.call(storedValidated.changes, k)) v[k] = String(storedValidated.changes[k])
      setVals(v); setTouched({}); setStage('tool')
    }
  }, [effectiveMode, storedValidated])

  // ---------- Review mode (read-only, works without a current picture) ----------
  if (effectiveMode === 'review') {
    const p = storedValidated
    const negative = roundPlanAmount(p.scenarioRoom) < 0
    const changedKeys = LEVERS.filter((k) => Object.prototype.hasOwnProperty.call(p.changes, k))
    const rm = computeMultiScenario(p.baseline, p.changes) // re-derive scenario picture from stored values
    return (
      <main className="page page__reading plan">
        <header className="plan__head">
          <h1 className="serif plan__title">{t.review.heading}</h1>
          <p className="plan__note">{t.review.note}</p>
          <p className="plan__source">{p.baselineSource === 'planning' ? t.source.planning : t.source.checkup}</p>
          {storedFresh === 'stale' && <p className="plan__note plan__note--stale">{t.review.staleNote}</p>}
        </header>
        <section className="plan-card" aria-label={t.review.heading}>
          <div className="plan-result__viewhead">
            <p className="plan-card__caption">{t.explore.changed}</p>
            <ViewToggle view={view} setView={setView} t={t} />
          </div>
          {view === 'amounts' ? (
            <>
              <ul className="plan-card__changes">
                {changedKeys.map((k) => (
                  <li key={k} className="plan-card__change">
                    <span className="plan-card__k">{t.leverLabels[k]}</span>
                    <span className="plan-card__v">
                      {formatPlanAmount(p.baseline[k], p.currency)}{' \u2192 '}{formatPlanAmount(p.changes[k], p.currency)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="plan-card__line plan-card__line--main">
                {negative ? t.compare.gapAfter : t.compare.roomAfter}: {formatPlanAmount(Math.abs(p.scenarioRoom), p.currency)}
              </p>
              <p className="plan-card__line">{t.compare.total}: {formatPlanAmount(p.change, p.currency)}</p>
            </>
          ) : (
            <RatioBody baseline={p.baseline} m={rm} inRange={rm.inRange} t={t} lang={lang} onBack={() => setView('amounts')} />
          )}
        </section>
        <div className="plan__actions">
          {editEligible && <Link className="btn btn--primary" to="/plan/cashflow?mode=edit">{t.review.edit}</Link>}
          {!editEligible && p.baselineSource === 'checkup' && (
            <Link className="btn btn--soft" to="/checkup">{t.review.checkupPath}</Link>
          )}
          <Link className="btn btn--quiet" to="/plans">{t.review.backToPlans}</Link>
        </div>
      </main>
    )
  }

  // ---------- Planning-only baseline entry ----------
  const showBaselineEntry = !isEdit && baselineSource === 'planning' && !baselineConfirmed
  if (showBaselineEntry) {
    const bParsed = {}
    for (const k of LEVERS) bParsed[k] = validateInput(baselineRaw[k])
    const allBaselineValid = LEVERS.every((k) => 'value' in bParsed[k])
    function continueBaseline() {
      if (!allBaselineValid) { const t2 = {}; LEVERS.forEach((k) => { t2[k] = true }); setBaselineTouched(t2); return }
      setBaselineConfirmed(true)
      requestAnimationFrame(() => firstFieldRef.current?.focus())
    }
    return (
      <main className="page page__reading plan">
        <header className="plan__head">
          <h1 className="serif plan__title">{t.label}</h1>
          <p className="plan__note">{t.baseline.help}</p>
        </header>
        <section className="plan-entry" aria-label={t.baseline.heading}>
          <h2 className="serif plan-entry__title">{t.baseline.heading}</h2>
          <div className="plan-cur" role="radiogroup" aria-label={t.currencyChoice.label}>
            <span className="plan-cur__label">{t.currencyChoice.label}</span>
            <div className="plan-cur__opts">
              {['usd', 'krw'].map((cur) => (
                <button
                  key={cur}
                  type="button"
                  role="radio"
                  aria-checked={planningCurrency === cur}
                  className={`plan-cur__opt${planningCurrency === cur ? ' is-on' : ''}`}
                  onClick={() => setPlanningCurrency(cur)}
                >
                  {t.currencyChoice[cur]}
                </button>
              ))}
            </div>
          </div>
          {LEVERS.map((k, i) => {
            const err = baselineTouched[k] && bParsed[k].error
            const eid = `bl-err-${k}`
            return (
              <label className="plan-num plan-num--stack" key={k}>
                <span className="plan-num__label">{t.leverLabels[k]}</span>
                <span className="plan-num__field">
                  <span className="plan-num__sym" aria-hidden="true">{planningCurrency === 'krw' ? '\u20a9' : '$'}</span>
                  <input
                    ref={i === 0 ? baselineFirstRef : undefined}
                    className="plan-num__input" type="number" inputMode="numeric" min="0" step="1"
                    value={baselineRaw[k]}
                    onChange={(e) => { setBaselineRaw((v) => ({ ...v, [k]: e.target.value })); setBaselineTouched((tt) => ({ ...tt, [k]: true })) }}
                    aria-label={t.leverLabels[k]}
                    aria-describedby={err ? eid : undefined}
                    aria-invalid={err ? true : undefined}
                  />
                </span>
                <span className="plan-num__help">{t.fieldHelp[k]}</span>
                {err && <span className="plan-num__error" id={eid} role="alert">{t.errors[bParsed[k].error]}</span>}
              </label>
            )
          })}
        </section>
        <div className="plan__actions">
          <button type="button" className="btn btn--primary" disabled={!allBaselineValid} onClick={continueBaseline}>{t.baseline.continue}</button>
          <Link className="btn btn--quiet" to="/plans">{t.leave}</Link>
        </div>
      </main>
    )
  }

  // ---------- Resolve baseline + currency for the tool ----------
  let baseline, currency
  if (isEdit) {
    if (storedValidated.baselineSource === 'checkup') {
      // Eligible checkup edit: baseline is the CURRENT assessed picture (planned
      // values are preloaded from the stored plan); currency matches by eligibility.
      baseline = { income: assessed.income, essentials: assessed.essentials, nonEssentials: assessed.nonEssentials, debt: assessed.debt, room: assessed.assessedRoom }
      currency = assessed.currency
    } else {
      // Planning-source edit: stored baseline + stored currency.
      baseline = storedValidated.baseline
      currency = storedValidated.currency
    }
  } else if (baselineSource === 'checkup') {
    baseline = { income: assessed.income, essentials: assessed.essentials, nonEssentials: assessed.nonEssentials, debt: assessed.debt, room: assessed.assessedRoom }
    currency = assessed.currency
  } else {
    currency = planningCurrency
    baseline = normalizeBaseline({
      income: Number(baselineRaw.income), essentials: Number(baselineRaw.essentials),
      nonEssentials: Number(baselineRaw.nonEssentials), debt: Number(baselineRaw.debt),
    })
  }

  // ---------- Scenario derivation (multi-field) ----------
  const fieldParsed = {}
  for (const k of LEVERS) fieldParsed[k] = baselineRawEmpty(vals[k]) ? { empty: true } : validateInput(vals[k])
  const changes = {}
  for (const k of LEVERS) {
    const fp = fieldParsed[k]
    if ('value' in fp && roundPlanAmount(fp.value) !== roundPlanAmount(baseline[k])) changes[k] = fp.value
  }
  const anyFieldError = LEVERS.some((k) => touched[k] && fieldParsed[k].error)
  const allNonEmptyValid = LEVERS.every((k) => fieldParsed[k].empty || 'value' in fieldParsed[k])
  const hasChange = Object.keys(changes).length > 0
  const m = allNonEmptyValid ? computeMultiScenario(baseline, changes) : null
  const inRange = m ? m.inRange : false
  const roomChanged = m && inRange ? roundPlanAmount(m.change) !== 0 : false
  const isOverflow = Boolean(allNonEmptyValid && hasChange && m && !inRange)
  const canAdopt = Boolean(allNonEmptyValid && hasChange && inRange && roomChanged)
  const showNoChange = Boolean(allNonEmptyValid && !isOverflow && (!hasChange || (hasChange && inRange && !roomChanged)) && anyTouched(touched))

  const baseNeg = roundPlanAmount(baseline.room) < 0
  const scenNeg = m && inRange ? roundPlanAmount(m.room) < 0 : false

  function setField(k, value) { setVals((v) => ({ ...v, [k]: value })); setTouched((tt) => ({ ...tt, [k]: true })) }
  function reset() {
    setVals(emptyVals()); setTouched({}); setStage('tool')
    requestAnimationFrame(() => firstFieldRef.current?.focus())
  }
  function editBaseline() { setBaselineConfirmed(false); requestAnimationFrame(() => baselineFirstRef.current?.focus()) }
  function onKeep(e) {
    if (!canAdopt) return
    openerRef.current = (e && e.currentTarget) || (typeof document !== 'undefined' ? document.activeElement : null)
    setStage('confirm')
  }
  function onConfirm() { if (storedValidated) setStage('replace'); else finishAdopt() }
  function finishAdopt() {
    openerRef.current = null
    const plan = buildPlan({ baseline, baselineSource, currency, changes })
    adoptPlan(plan)
    setStage('done')
    requestAnimationFrame(() => doneRef.current?.focus())
  }

  // ---------- Success ----------
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

  const changedKeysNow = Object.keys(changes)

  return (
    <main className="page page__reading plan">
      <header className="plan__head">
        <h1 className="serif plan__title">{isEdit ? t.edit.heading : t.label}</h1>
        <p className="plan__note">{isEdit ? t.edit.note : t.purpose}</p>
        {isEdit && baselineSource === 'checkup' && storedFresh === 'stale' && (
          <p className="plan__note plan__note--stale">{t.edit.staleNote}</p>
        )}
      </header>

      {/* Starting picture */}
      <section className="plan-assessed" aria-label={baselineSource === 'planning' ? t.baseline.caption : t.current.caption}>
        <p className="plan-assessed__caption">{baselineSource === 'planning' ? t.baseline.caption : t.current.caption}</p>
        <ul className="plan-assessed__list">
          {LEVERS.map((k) => (
            <li key={k} className="plan-assessed__item">
              <span className="plan-assessed__k">{t.leverLabels[k]}</span>
              <span className="plan-assessed__v">{formatPlanAmount(baseline[k], currency)}</span>
            </li>
          ))}
          <li className="plan-assessed__item plan-assessed__item--room">
            <span className="plan-assessed__k">{baseNeg ? t.current.gapLabel : t.current.roomLabel}</span>
            <span className="plan-assessed__v">{formatPlanAmount(Math.abs(baseline.room), currency)}</span>
          </li>
        </ul>
        {baselineSource === 'planning' && !isEdit && (
          <button type="button" className="plan-assessed__edit" onClick={editBaseline}>{t.baseline.edit}</button>
        )}
      </section>

      {/* Your plan — multi-field */}
      <section className="plan-change">
        <h2 className="serif plan-change__prompt">{t.explore.heading}</h2>
        <p className="plan-change__help">{t.explore.help}</p>
        <div className="plan-fields">
          {LEVERS.map((k, i) => {
            const fp = fieldParsed[k]
            const err = touched[k] && fp.error
            const changed = k in changes
            const eid = `plan-err-${k}`
            return (
              <label className={`plan-field${changed ? ' is-changed' : ''}`} key={k}>
                <span className="plan-field__top">
                  <span className="plan-num__label">{t.leverLabels[k]}</span>
                  {changed && <span className="plan-field__tag">{t.explore.changed}</span>}
                </span>
                <span className="plan-field__now">{t.explore.now}: {formatPlanAmount(baseline[k], currency)}</span>
                <span className="plan-num__field">
                  <span className="plan-num__sym" aria-hidden="true">{currency === 'krw' ? '\u20a9' : '$'}</span>
                  <input
                    ref={i === 0 ? firstFieldRef : undefined}
                    className="plan-num__input" type="number" inputMode="numeric" min="0" step="1"
                    value={vals[k]}
                    placeholder={String(Math.trunc(roundPlanAmount(baseline[k])))}
                    onChange={(e) => setField(k, e.target.value)}
                    aria-label={`${t.leverLabels[k]} — ${t.explore.heading}`}
                    aria-describedby={err ? eid : undefined}
                    aria-invalid={err ? true : undefined}
                  />
                </span>
                {err && <span className="plan-num__error" id={eid} role="alert">{t.errors[fp.error]}</span>}
              </label>
            )
          })}
        </div>
      </section>

      {isOverflow && <p className="plan__overflow" role="alert">{t.overflow}</p>}

      {/* Comparison */}
      <section className="plan-result" aria-live="polite">
        <div className="plan-result__viewhead">
          <h2 className="serif plan-result__head">{t.compare.heading}</h2>
          <ViewToggle view={view} setView={setView} t={t} />
        </div>

        {view === 'amounts' && (
          <>
            {changedKeysNow.length > 0 && inRange ? (
              <ul className="plan-result__changes">
                {changedKeysNow.map((k) => (
                  <li key={k} className="plan-result__change">
                    <span className="plan-result__k">{t.leverLabels[k]}</span>
                    <span className="plan-result__v">{formatPlanAmount(baseline[k], currency)}{' \u2192 '}{formatPlanAmount(changes[k], currency)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="plan-result__none">{t.compare.noneYet}</p>
            )}
            {inRange && (
              <>
                <div className="plan-result__row">
                  <span className="plan-result__k">{baseNeg ? t.compare.gapBefore : t.compare.roomBefore}</span>
                  <span className="plan-result__v">{formatPlanAmount(Math.abs(baseline.room), currency)}</span>
                </div>
                <div className="plan-result__row plan-result__row--main">
                  <span className="plan-result__k">{scenNeg ? t.compare.gapAfter : t.compare.roomAfter}</span>
                  <span className="plan-result__v">{formatPlanAmount(Math.abs(m.room), currency)}</span>
                </div>
                <div className="plan-result__row">
                  <span className="plan-result__k">{t.compare.total}</span>
                  <span className="plan-result__v">{formatPlanAmount(m.change, currency)}</span>
                </div>
                <p className="plan-result__uncertainty">{t.uncertainty}</p>
                <p className="plan-result__reflection">{t.reflection}</p>
              </>
            )}
          </>
        )}

        {view === 'ratios' && (
          <RatioBody baseline={baseline} m={m} inRange={inRange} t={t} lang={lang} onBack={() => setView('amounts')} />
        )}
      </section>

      {showNoChange && <p className="plan__nochange">{t.noChange}</p>}

      <div className="plan__actions">
        <button type="button" className="btn btn--primary" disabled={!canAdopt} onClick={onKeep}>{t.keep}</button>
        <button type="button" className="btn btn--quiet" onClick={reset}>{t.reset}</button>
        <Link className="btn btn--quiet" to="/plans">{t.leave}</Link>
      </div>

      {/* Adoption confirmation */}
      {stage === 'confirm' && canAdopt && (
        <PlanModal label={t.confirm.heading} onCancel={() => setStage('tool')} openerRef={openerRef}>
          <h2 className="serif plan-modal__title">{t.confirm.heading}</h2>
          <p className="plan-modal__body">{t.confirm.listIntro}</p>
          <ul className="plan-modal__list">
            {changedKeysNow.map((k) => (
              <li key={k}>{t.confirm.changeLine(t.leverLabels[k], formatPlanAmount(baseline[k], currency), formatPlanAmount(changes[k], currency))}</li>
            ))}
          </ul>
          <p className="plan-modal__body">
            {scenNeg ? t.confirm.gapLine(formatPlanAmount(Math.abs(m.room), currency)) : t.confirm.roomLine(formatPlanAmount(m.room, currency))}
          </p>
          <p className="plan-modal__aside">{t.confirm.yourChoice}</p>
          <div className="plan-modal__actions">
            <button type="button" className="btn btn--primary" onClick={onConfirm}>{t.confirm.confirm}</button>
            <button type="button" className="btn btn--quiet" onClick={() => setStage('tool')}>{t.confirm.cancel}</button>
          </div>
        </PlanModal>
      )}

      {/* Replacement confirmation */}
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

function baselineRawEmpty(s) { return String(s).trim() === '' }
function anyTouched(o) { return Object.values(o).some(Boolean) }
