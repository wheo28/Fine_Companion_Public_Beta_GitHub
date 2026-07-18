import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { debtContent } from './debtContent'
import { getDebtPlan, adoptDebtPlan } from '../lib/progress'
import {
  DEBT_SAFE_AMOUNT, MAX_APR,
  compareDebt, canAdoptDebt, buildDebtPlan, validateStoredDebtPlan,
  readIncome, readCheckupDebtRef, readCheckupCurrency, paymentShare, formatMonths,
  formatPlanAmount, formatPercent,
} from './debtPlanLogic.js'
import { readAssessedCashflow } from './cashflowPlanLogic.js'

const MODES = ['explore', 'review', 'edit']

function validateMoney(raw, currency) {
  const t = String(raw).trim()
  if (t === '') return { error: 'blank' }
  const n = Number(t)
  if (!Number.isFinite(n)) return { error: 'nonNumeric' }
  if (n < 0) return { error: 'negative' }
  if (n > DEBT_SAFE_AMOUNT) return { error: 'tooLarge' }
  const decimals = (t.split('.')[1] || '').length
  if (currency === 'krw' && decimals > 0) return { error: 'wholeKrw' }
  if (currency !== 'krw' && decimals > 2) return { error: 'decimalsUsd' }
  return { value: n }
}
function validateApr(raw) {
  const t = String(raw).trim()
  if (t === '') return { error: 'blank' }
  const n = Number(t)
  if (!Number.isFinite(n)) return { error: 'aprNonNumeric' }
  if (n < 0 || n > MAX_APR) return { error: 'aprRange' }
  return { value: n }
}

// Focus-managing modal (same pattern as the Cash Flow tool; kept local so Debt
// stays independent of Cash Flow-specific code).
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

// Assumptions, always shown before estimates.
function Assumptions({ t }) {
  return (
    <section className="debt-assume" aria-label={t.assumptions.heading}>
      <h2 className="serif debt-assume__title">{t.assumptions.heading}</h2>
      <p className="debt-assume__intro">{t.assumptions.intro}</p>
      <ul className="debt-assume__list">
        {t.assumptions.items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
      <p className="debt-assume__caveat">{t.assumptions.caveat}</p>
    </section>
  )
}

// One path's estimates (or an honest state message when there's no payoff).
function PathCard({ title, res, currency, t, lang }) {
  const ok = res.status === 'ok'
  return (
    <div className="debt-path" role="group" aria-label={title}>
      <p className="debt-path__title">{title}</p>
      {ok ? (
        <dl className="debt-path__rows">
          <div className="debt-path__row"><dt>{t.compare.payoff}</dt><dd>{formatMonths(res.months, t.duration, lang)}</dd></div>
          <div className="debt-path__row"><dt>{t.compare.interest}</dt><dd>{formatPlanAmount(res.totalInterest, currency)}</dd></div>
          <div className="debt-path__row"><dt>{t.compare.totalPaid}</dt><dd>{formatPlanAmount(res.totalPaid, currency)}</dd></div>
          <div className="debt-path__row"><dt>{t.compare.finalPayment}</dt><dd>{formatPlanAmount(res.finalPayment, currency)}</dd></div>
        </dl>
      ) : (
        <p className="debt-path__state" role="note">{t.states[res.status] || t.compare.unavailable}</p>
      )}
    </div>
  )
}

const emptyRaw = () => ({ balance: '', apr: '', currentPayment: '', scenarioPayment: '' })

export default function DebtPlan() {
  const { lang } = useLanguage()
  const t = debtContent[lang]
  const [params] = useSearchParams()

  const storedValidated = useMemo(() => validateStoredDebtPlan(getDebtPlan()), [])
  const income = useMemo(() => readIncome(), [])
  const debtRef = useMemo(() => readCheckupDebtRef(), [])
  const cashKnown = useMemo(() => readAssessedCashflow().known, [])
  const checkupCurrency = useMemo(() => readCheckupCurrency(), [])

  const rawMode = params.get('mode')
  const mode = MODES.includes(rawMode) ? rawMode : 'explore'
  let effectiveMode = 'explore'
  if (mode === 'review' && storedValidated) effectiveMode = 'review'
  else if (mode === 'edit' && storedValidated) effectiveMode = 'edit'
  const isEdit = effectiveMode === 'edit'

  const [currency, setCurrency] = useState(() => {
    if (effectiveMode === 'edit' && storedValidated) return storedValidated.currency
    return lang === 'ko' ? 'krw' : 'usd'
  })
  const [vals, setVals] = useState(() => {
    if (effectiveMode === 'edit' && storedValidated) {
      const s = storedValidated
      return { balance: String(s.balance), apr: String(s.apr), currentPayment: String(s.currentPayment), scenarioPayment: String(s.scenarioPayment) }
    }
    return emptyRaw()
  })
  const [touched, setTouched] = useState({})
  const [stage, setStage] = useState('tool')

  const firstRef = useRef(null)
  const doneRef = useRef(null)
  const openerRef = useRef(null)

  useEffect(() => {
    if (effectiveMode === 'edit' && storedValidated) {
      const s = storedValidated
      setCurrency(s.currency)
      setVals({ balance: String(s.balance), apr: String(s.apr), currentPayment: String(s.currentPayment), scenarioPayment: String(s.scenarioPayment) })
      setTouched({}); setStage('tool')
    }
  }, [effectiveMode, storedValidated])

  // ---------- Review mode ----------
  if (effectiveMode === 'review') {
    const p = storedValidated
    const diff = p.scenarioPayment - p.currentPayment
    return (
      <main className="page page__reading plan">
        <header className="plan__head">
          <h1 className="serif plan__title">{t.review.heading}</h1>
          <p className="plan__note">{t.review.note}</p>
        </header>
        <section className="plan-card" aria-label={t.review.heading}>
          <p className="plan-card__line">{t.fields.balance}: {formatPlanAmount(p.balance, p.currency)}</p>
          <p className="plan-card__line">{t.fields.apr}: {formatPercent(p.apr)}</p>
          <ul className="plan-card__changes">
            <li className="plan-card__change"><span className="plan-card__k">{t.compare.currentPayment}</span><span className="plan-card__v">{formatPlanAmount(p.currentPayment, p.currency)}</span></li>
            <li className="plan-card__change"><span className="plan-card__k">{t.compare.plannedPayment}</span><span className="plan-card__v">{formatPlanAmount(p.scenarioPayment, p.currency)}</span></li>
          </ul>
          <div className="debt-paths">
            <PathCard title={t.compare.currentPath} res={p.current} currency={p.currency} t={t} lang={lang} />
            <PathCard title={t.compare.planPath} res={p.scenario} currency={p.currency} t={t} lang={lang} />
          </div>
          <Assumptions t={t} />
        </section>
        <div className="plan__actions">
          <Link className="btn btn--primary" to="/plan/debt?mode=edit">{t.review.edit}</Link>
          <Link className="btn btn--quiet" to="/plans">{t.review.backToPlans}</Link>
        </div>
      </main>
    )
  }

  // ---------- Explore / Edit ----------
  const pBal = validateMoney(vals.balance, currency)
  const pApr = validateApr(vals.apr)
  const pCur = validateMoney(vals.currentPayment, currency)
  const pScen = validateMoney(vals.scenarioPayment, currency)
  const err = (k, parsed) => (touched[k] && parsed.error) ? parsed.error : null

  const baseValid = 'value' in pBal && 'value' in pApr && 'value' in pCur
  const scenValid = 'value' in pScen
  const allValid = baseValid && scenValid

  const cmp = allValid ? compareDebt({ balance: pBal.value, apr: pApr.value, currentPayment: pCur.value, scenarioPayment: pScen.value, currency }) : null
  const diff = allValid ? pScen.value - pCur.value : 0
  const hasChange = allValid && Math.round(pScen.value * 100) !== Math.round(pCur.value * 100)
  const canAdopt = allValid && hasChange && canAdoptDebt({ balance: pBal.value, apr: pApr.value, currentPayment: pCur.value, scenarioPayment: pScen.value, currency })
  const bothOk = cmp && cmp.current.status === 'ok' && cmp.scenario.status === 'ok'

  function setField(k, v) { setVals((s) => ({ ...s, [k]: v })); setTouched((tt) => ({ ...tt, [k]: true })) }
  function reset() {
    setVals(emptyRaw()); setTouched({}); setStage('tool')
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
    adoptDebtPlan(buildDebtPlan({ currency, balance: pBal.value, apr: pApr.value, currentPayment: pCur.value, scenarioPayment: pScen.value }))
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
  const moneyField = (k, refFirst) => {
    const parsed = validateMoney(vals[k], currency)
    const e = err(k, parsed)
    const eid = `debt-err-${k}`
    return (
      <label className="plan-num plan-num--stack" key={k}>
        <span className="plan-num__label">{t.fields[k]}</span>
        <span className="plan-num__field">
          <span className="plan-num__sym" aria-hidden="true">{sym}</span>
          <input
            ref={refFirst ? firstRef : undefined}
            className="plan-num__input" type="text" inputMode="decimal"
            value={vals[k]}
            onChange={(ev) => setField(k, ev.target.value)}
            aria-label={t.fields[k]}
            aria-describedby={e ? eid : undefined}
            aria-invalid={e ? true : undefined}
          />
        </span>
        <span className="plan-num__help">{t.fieldHelp[k]}</span>
        {k === 'currentPayment' && debtRef && debtRef.currency === currency && (
          <span className="debt-ref">{t.checkupRef.label}: {t.checkupRef.note(formatPlanAmount(debtRef.amount, debtRef.currency))}</span>
        )}
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

      <section className="plan-entry" aria-label={t.label}>
        <div className="plan-cur" role="radiogroup" aria-label={t.currencyChoice.label}>
          <span className="plan-cur__label">{t.currencyChoice.label}</span>
          <div className="plan-cur__opts">
            {['usd', 'krw'].map((cur) => (
              <button key={cur} type="button" role="radio" aria-checked={currency === cur}
                className={`plan-cur__opt${currency === cur ? ' is-on' : ''}`}
                onClick={() => setCurrency(cur)}>{t.currencyChoice[cur]}</button>
            ))}
          </div>
        </div>
        {moneyField('balance', true)}
        <label className="plan-num plan-num--stack">
          <span className="plan-num__label">{t.fields.apr}</span>
          <span className="plan-num__field plan-num__field--suffix">
            <input
              className="plan-num__input" type="text" inputMode="decimal"
              value={vals.apr}
              onChange={(ev) => setField('apr', ev.target.value)}
              aria-label={t.fields.apr}
              aria-describedby={err('apr', pApr) ? 'debt-err-apr' : undefined}
              aria-invalid={err('apr', pApr) ? true : undefined}
            />
            <span className="plan-num__suffix" aria-hidden="true">%</span>
          </span>
          <span className="plan-num__help">{t.fieldHelp.apr}</span>
          {err('apr', pApr) && <span className="plan-num__error" id="debt-err-apr" role="alert">{t.errors[pApr.error]}</span>}
        </label>
        {moneyField('currentPayment', false)}
        {moneyField('scenarioPayment', false)}
      </section>

      <Assumptions t={t} />

      {/* Comparison */}
      {allValid && (
        <section className="plan-result" aria-live="polite">
          <h2 className="serif plan-result__head">{t.compare.heading}</h2>
          <div className="plan-result__row">
            <span className="plan-result__k">{t.compare.currentPayment}</span>
            <span className="plan-result__v">{formatPlanAmount(pCur.value, currency)}</span>
          </div>
          <div className="plan-result__row plan-result__row--main">
            <span className="plan-result__k">{t.compare.plannedPayment}</span>
            <span className="plan-result__v">{formatPlanAmount(pScen.value, currency)}</span>
          </div>
          <div className="plan-result__row">
            <span className="plan-result__k">{t.compare.paymentDiff}</span>
            <span className="plan-result__v">{diff === 0 ? formatPlanAmount(0, currency) : `${diff > 0 ? '+' : '-'}${formatPlanAmount(Math.abs(diff), currency)}`}</span>
          </div>

          <div className="debt-paths">
            <PathCard title={t.compare.currentPath} res={cmp.current} currency={currency} t={t} lang={lang} />
            <PathCard title={t.compare.planPath} res={cmp.scenario} currency={currency} t={t} lang={lang} />
          </div>

          {/* Tradeoff summary (neutral; only when both paths resolve) */}
          {hasChange && (
            <p className="debt-tradeoff">
              {diff > 0 ? t.compare.moreEachMonth(formatPlanAmount(Math.abs(diff), currency)) : diff < 0 ? t.compare.lessEachMonth(formatPlanAmount(Math.abs(diff), currency)) : ''}
              {bothOk && ' '}
              {bothOk && (cmp.scenario.months < cmp.current.months ? t.compare.shorter : cmp.scenario.months > cmp.current.months ? t.compare.longer : t.compare.same)}
              {bothOk && ' '}
              {bothOk && (cmp.scenario.totalInterest < cmp.current.totalInterest
                ? t.compare.interestLess(formatPlanAmount(cmp.current.totalInterest - cmp.scenario.totalInterest, currency))
                : cmp.scenario.totalInterest > cmp.current.totalInterest
                  ? t.compare.interestMore(formatPlanAmount(cmp.scenario.totalInterest - cmp.current.totalInterest, currency))
                  : '')}
            </p>
          )}

          {/* Optional cash context (separate; never recalculates Cash Flow) */}
          {cashKnown && checkupCurrency === currency && hasChange && diff !== 0 && (
            <p className="debt-cashnote">
              {diff > 0 ? t.cashNote.more(formatPlanAmount(Math.abs(diff), currency)) : t.cashNote.less(formatPlanAmount(Math.abs(diff), currency))}
              {' '}<span className="debt-cashnote__caveat">{t.cashNote.caveat}</span>
            </p>
          )}

          {/* Optional payment-share ratio (only if income known; no target) */}
          {income != null && income.currency === currency && (() => {
            const curShare = paymentShare(pCur.value, income.value)
            const planShare = paymentShare(pScen.value, income.value)
            if (curShare == null || planShare == null) return null
            return (
              <div className="debt-ratio">
                <p className="debt-ratio__heading">{t.ratio.heading}</p>
                <p className="debt-ratio__line">{t.ratio.line(formatPercent(curShare), formatPercent(planShare))}</p>
                <p className="debt-ratio__note">{t.ratio.note}</p>
              </div>
            )
          })()}

          <p className="plan-result__reflection">{t.reflection}</p>
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
          <p className="plan-modal__body">{t.confirm.line(formatPlanAmount(pCur.value, currency), formatPlanAmount(pScen.value, currency))}</p>
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
