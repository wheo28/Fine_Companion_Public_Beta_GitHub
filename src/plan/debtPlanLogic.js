// Debt Repayment Planning Tool — pure logic. No React; no scoring import; never
// calls computeResults. One-debt scenario exploration only. This module returns
// only payoff estimates — never a score, grade, classification, recommended
// payment, strategy, or another module's state.
import { getCheckup, getDebtPlan } from '../lib/progress'
// Reuse RC5.3 safe formatters (generic currency/percent display only).
import { formatPlanAmount, formatPercent, roundPercentValue } from './cashflowPlanLogic.js'

export { formatPlanAmount, formatPercent, roundPercentValue }

// Technical limits (consistent with the existing Planning architecture).
export const DEBT_SAFE_AMOUNT = 1_000_000_000_000
export const MAX_APR = 1000            // technical bound, not a benchmark
export const MAX_PAYOFF_MONTHS = 1200  // technical simulation cap, not a recommendation

// Deterministic currency rounding: symmetric (round half away from zero) to two
// decimal places (cents). Applied at every monthly step, identically for the
// current and scenario calculations. Documented in the product report.
// Currency-aware money rounding: USD to two decimals (cents), KRW to whole won.
// Symmetric (round half away from zero); -0 normalized to 0. Used for EVERY
// derived monetary value in the simulation, identically for both paths.
function roundMoney(v, currency) {
  if (!Number.isFinite(v)) return v
  const f = currency === 'krw' ? 1 : 100
  const r = (Math.sign(v) * Math.round((Math.abs(v) + Number.EPSILON) * f)) / f
  return Object.is(r, -0) ? 0 : r
}
export { roundMoney }
// Legacy RC5.4 convention: two decimals regardless of currency (used only to
// validate stored schema-v1 plans before migrating them).
const round2 = (v) => roundMoney(v, 'usd')

const isNum = (n) => typeof n === 'number' && Number.isFinite(n)
const overBound = (v) => !Number.isFinite(v) || Math.abs(v) > DEBT_SAFE_AMOUNT

// Precision: KRW inputs are whole units; USD inputs allow up to two decimals.
function currencyPlaces(currency) { return currency === 'krw' ? 0 : 2 }
export function hasValidPrecision(n, currency) {
  const f = Math.pow(10, currencyPlaces(currency))
  return Math.abs(Math.round(n * f) - n * f) < 1e-6
}
export function isValidMoney(n, currency) {
  if (!isNum(n) || n < 0 || n > DEBT_SAFE_AMOUNT) return false
  return hasValidPrecision(n, currency)
}
export function isValidApr(n) { return isNum(n) && n >= 0 && n <= MAX_APR }

// Core payoff simulation, parameterized by a unary rounding function. When
// checkOverflow is true, any derived value that is non-finite or exceeds
// DEBT_SAFE_AMOUNT yields an explicit 'overflow' status (no partial estimate).
//   status: 'invalid' | 'zeroBalance' | 'zeroPayment' | 'belowInterest'
//         | 'beyondLimit' | 'overflow' | 'ok'
function runPayoff(balance, apr, payment, round, checkOverflow) {
  if (![balance, apr, payment].every(isNum)) return { status: 'invalid' }
  if (balance < 0 || apr < 0 || payment < 0) return { status: 'invalid' }
  if (balance > DEBT_SAFE_AMOUNT || payment > DEBT_SAFE_AMOUNT || apr > MAX_APR) return { status: 'invalid' }

  const B0 = round(balance)
  if (B0 === 0) return { status: 'zeroBalance' }

  const r = apr / 100 / 12
  const firstInterest = round(B0 * r)
  if (payment === 0) return { status: 'zeroPayment', firstInterest }
  if (r > 0 && payment <= firstInterest) return { status: 'belowInterest', firstInterest }

  let bal = B0
  let totalInterest = 0
  let months = 0
  let finalPayment = round(payment)
  while (bal > 0 && months < MAX_PAYOFF_MONTHS) {
    const interest = round(bal * r)
    const owed = round(bal + interest)
    let pay = payment
    if (pay >= owed) { pay = owed; finalPayment = round(pay) } // smaller final payment
    const principal = round(pay - interest)
    bal = round(bal - principal)
    totalInterest = round(totalInterest + interest)
    if (checkOverflow && [interest, owed, pay, principal, bal, totalInterest, finalPayment].some(overBound)) {
      return { status: 'overflow' }
    }
    months += 1
    if (bal <= 0) { bal = 0; break }
  }
  if (bal > 0) return { status: 'beyondLimit' } // extends beyond MAX_PAYOFF_MONTHS
  const totalPaid = round(B0 + totalInterest)
  if (checkOverflow && overBound(totalPaid)) return { status: 'overflow' }
  return { status: 'ok', months, totalInterest, totalPaid, finalPayment }
}

// Currency-aware payoff (current calculation convention). currency is metadata.
export function computeDebtPayoff({ balance, apr, payment, currency }) {
  return runPayoff(balance, apr, payment, (v) => roundMoney(v, currency), true)
}
// Legacy schema-v1 payoff (two-decimal, no overflow status) for validating old plans.
function computeDebtPayoffV1(balance, apr, payment) {
  return runPayoff(balance, apr, payment, round2, false)
}

// Both paths, identical currency-specific routine.
export function compareDebt({ balance, apr, currentPayment, scenarioPayment, currency }) {
  return {
    current: computeDebtPayoff({ balance, apr, payment: currentPayment, currency }),
    scenario: computeDebtPayoff({ balance, apr, payment: scenarioPayment, currency }),
  }
}
function compareDebtV1({ balance, apr, currentPayment, scenarioPayment }) {
  return {
    current: computeDebtPayoffV1(balance, apr, currentPayment),
    scenario: computeDebtPayoffV1(balance, apr, scenarioPayment),
  }
}

// Adoption is allowed only when both paths yield an honest payoff ('ok') and the
// scenario payment differs from the current payment. Overflow/non-amortizing/
// beyond-limit are never adoptable.
export function canAdoptDebt({ balance, apr, currentPayment, scenarioPayment, currency }) {
  if (![balance, apr, currentPayment, scenarioPayment].every(isNum)) return false
  if (roundMoney(scenarioPayment, currency) === roundMoney(currentPayment, currency)) return false
  const { current, scenario } = compareDebt({ balance, apr, currentPayment, scenarioPayment, currency })
  return current.status === 'ok' && scenario.status === 'ok'
}

const SCHEMA = 2

export function buildDebtPlan({ currency, balance, apr, currentPayment, scenarioPayment }) {
  const { current, scenario } = compareDebt({ balance, apr, currentPayment, scenarioPayment, currency })
  return {
    moduleId: 'debt', schemaVersion: SCHEMA, currency,
    balance: roundMoney(balance, currency), apr,
    currentPayment: roundMoney(currentPayment, currency), scenarioPayment: roundMoney(scenarioPayment, currency),
    est: { curMonths: current.months, curInterest: current.totalInterest, scenMonths: scenario.months, scenInterest: scenario.totalInterest },
    updatedAt: Date.now(),
  }
}

// Structural + arithmetic validation. Reads valid schema-v1 (RC5.4) plans by
// validating them under the OLD two-decimal convention, then migrating in
// memory to the new currency-aware estimates; malformed/inconsistent old plans
// stay invalid, and any plan whose recomputed estimates aren't a clean 'ok'
// (e.g. overflow) is rejected. New adoptions are schema-v2. Returns a
// normalized v2 plan with re-derived current/scenario estimates, or null.
export function validateStoredDebtPlan(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  if (raw.moduleId !== 'debt') return null
  if (raw.schemaVersion !== 1 && raw.schemaVersion !== 2) return null
  if (raw.currency !== 'usd' && raw.currency !== 'krw') return null
  const currency = raw.currency
  const { balance, apr, currentPayment, scenarioPayment } = raw
  for (const v of [balance, apr, currentPayment, scenarioPayment]) {
    if (typeof v !== 'number' || !Number.isFinite(v)) return null // rejects numeric strings, null, etc.
  }
  if (!isValidMoney(balance, currency)) return null
  if (!isValidMoney(currentPayment, currency)) return null
  if (!isValidMoney(scenarioPayment, currency)) return null
  if (!isValidApr(apr)) return null
  if (roundMoney(scenarioPayment, currency) === roundMoney(currentPayment, currency)) return null
  const e = raw.est
  if (!e || typeof e !== 'object' || Array.isArray(e)) return null
  if (typeof raw.updatedAt !== 'number' || !Number.isInteger(raw.updatedAt) || raw.updatedAt <= 0) return null

  // Consistency of stored estimates against the convention the plan was written
  // with (v1 = legacy two-decimal; v2 = currency-aware).
  const legacy = raw.schemaVersion === 1
  const check = legacy
    ? compareDebtV1({ balance, apr, currentPayment, scenarioPayment })
    : compareDebt({ balance, apr, currentPayment, scenarioPayment, currency })
  if (check.current.status !== 'ok' || check.scenario.status !== 'ok') return null
  if (e.curMonths !== check.current.months || e.scenMonths !== check.scenario.months) return null
  const rc = (v) => roundMoney(v, legacy ? 'usd' : currency)
  if (rc(e.curInterest) !== rc(check.current.totalInterest)) return null
  if (rc(e.scenInterest) !== rc(check.scenario.totalInterest)) return null

  // Migrate to the current currency-aware estimates (for v1) / confirm (for v2).
  const migrated = compareDebt({ balance, apr, currentPayment, scenarioPayment, currency })
  if (migrated.current.status !== 'ok' || migrated.scenario.status !== 'ok') return null // e.g. overflow -> reject
  return {
    moduleId: 'debt', schemaVersion: SCHEMA, currency,
    balance: roundMoney(balance, currency), apr,
    currentPayment: roundMoney(currentPayment, currency), scenarioPayment: roundMoney(scenarioPayment, currency),
    est: { curMonths: migrated.current.months, curInterest: migrated.current.totalInterest, scenMonths: migrated.scenario.months, scenInterest: migrated.scenario.totalInterest },
    current: migrated.current, scenario: migrated.scenario, updatedAt: raw.updatedAt,
  }
}

export function loadValidatedDebtPlan() { return validateStoredDebtPlan(getDebtPlan()) }

// Optional income for the payment-share ratio: from the Checkup if a positive
// finite value exists, else null. Returns value AND currency so callers can
// require a currency match with the Debt plan. Debt Planning never requires income.
export function readIncome() {
  const a = getCheckup()?.answers
  if (!a) return null
  const n = Number(a.income)
  if (!Number.isFinite(n) || n <= 0) return null
  return { value: n, currency: a.currency === 'krw' ? 'krw' : 'usd' }
}

// The Checkup's own currency (for optional-context currency matching), or null.
export function readCheckupCurrency() {
  const a = getCheckup()?.answers
  if (!a) return null
  return a.currency === 'krw' ? 'krw' : 'usd'
}

// Optional reference: the Checkup's total monthly debt payment (which may cover
// more than this one debt). Shown as a labelled reference only; never auto-used.
export function readCheckupDebtRef() {
  const a = getCheckup()?.answers
  if (!a) return null
  const n = Number(a.debt)
  if (!Number.isFinite(n) || n < 0) return null
  return { amount: n, currency: a.currency === 'krw' ? 'krw' : 'usd' }
}

// payment / income * 100. null when income is absent or not positive.
export function paymentShare(payment, income) {
  if (!isNum(payment) || !isNum(income) || income <= 0) return null
  return (payment / income) * 100
}

// Compact duration display, e.g. "2 yr 3 mo" / "2년 3개월". words = { yr, mo, under1 }.
export function formatMonths(months, words, lang) {
  if (months <= 0) return words.under1
  const y = Math.floor(months / 12)
  const mo = months % 12
  const sp = lang === 'ko' ? '' : ' '
  const parts = []
  if (y > 0) parts.push(`${y}${sp}${words.yr}`)
  if (mo > 0) parts.push(`${mo}${sp}${words.mo}`)
  return parts.join(' ') || `0${sp}${words.mo}`
}
