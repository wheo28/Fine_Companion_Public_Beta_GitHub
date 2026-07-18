// Emergency Fund Planning Tool — pure logic. No React; no scoring import; never
// calls computeResults. Explores "how much time could the money I can reach give
// me if life were interrupted?" as accessible money / monthly must-pay costs.
// Returns ONLY a month estimate + status — never a state (none/building/solid/
// cushioned), score, grade, benchmark, recommendation, or another module result.
import { getCheckup, getEmergencyPlan } from '../lib/progress'
import { SAFE_AMOUNT, formatPlanAmount } from './cashflowPlanLogic.js'

export { formatPlanAmount }

// Existing Planning technical amount boundary; technical month display limit.
export const EMERGENCY_SAFE_AMOUNT = SAFE_AMOUNT      // 1e12
export const MAX_EMERGENCY_MONTHS = 1200              // technical limit, not a recommended maximum

const isNum = (n) => typeof n === 'number' && Number.isFinite(n)

// Months are displayed to one decimal place, symmetric (round half away from zero).
export function roundMonths(v) {
  if (!Number.isFinite(v)) return v
  const r = (Math.sign(v) * Math.round((Math.abs(v) + Number.EPSILON) * 10)) / 10
  return Object.is(r, -0) ? 0 : r
}
export function formatMonths1(v) { return roundMonths(v).toFixed(1) }

// Money precision: KRW whole units, USD up to two decimals.
function currencyPlaces(currency) { return currency === 'krw' ? 0 : 2 }
export function hasValidPrecision(n, currency) {
  const f = Math.pow(10, currencyPlaces(currency))
  return Math.abs(Math.round(n * f) - n * f) < 1e-6
}
export function roundMoney(v, currency) {
  if (!Number.isFinite(v)) return v
  const f = currency === 'krw' ? 1 : 100
  const r = (Math.sign(v) * Math.round((Math.abs(v) + Number.EPSILON) * f)) / f
  return Object.is(r, -0) ? 0 : r
}
export function isValidMoney(n, currency) {
  if (!isNum(n) || n < 0 || n > EMERGENCY_SAFE_AMOUNT) return false
  return hasValidPrecision(n, currency)
}

// Core: accessible money / monthly must-pay costs -> months of accessible room.
//   status: 'invalid' | 'unavailable' (must-pays = 0) | 'beyondLimit' | 'ok'
// accessible = 0 with must-pays > 0 is a valid 'ok' result of 0 months.
export function computeEmergencyMonths({ accessible, mustPays }) {
  if (![accessible, mustPays].every(isNum)) return { status: 'invalid' }
  if (accessible < 0 || mustPays < 0) return { status: 'invalid' }
  if (accessible > EMERGENCY_SAFE_AMOUNT || mustPays > EMERGENCY_SAFE_AMOUNT) return { status: 'invalid' }
  if (mustPays === 0) return { status: 'unavailable' } // no divide by zero; not "fully protected"
  const months = accessible / mustPays
  if (!Number.isFinite(months)) return { status: 'invalid' }
  if (months > MAX_EMERGENCY_MONTHS) return { status: 'beyondLimit' }
  return { status: 'ok', months }
}

export function compareEmergency({ baseline, scenario }) {
  return {
    current: computeEmergencyMonths(baseline),
    scenario: computeEmergencyMonths(scenario),
  }
}

// Adoption: at least one value changed, both paths yield a valid month estimate,
// and the change in months is non-zero at one-decimal precision.
export function canAdoptEmergency({ baseline, scenario }) {
  if (!baseline || !scenario) return false
  const changed = baseline.accessible !== scenario.accessible || baseline.mustPays !== scenario.mustPays
  if (!changed) return false
  const { current, scenario: sc } = compareEmergency({ baseline, scenario })
  if (current.status !== 'ok' || sc.status !== 'ok') return false
  return roundMonths(current.months) !== roundMonths(sc.months)
}

// The assessed Emergency picture from the Checkup (accessible savings; monthly
// must-pays = essentials + debt payments). Read-only; never written back.
//  - known:      required inputs (savings, essentials, debt) are present, finite,
//                non-negative, and within the technical bound. Editable-input
//                precision is NOT applied to these read-only assessed values.
//  - assessable: a usable month-based picture exists, i.e. known AND must-pays > 0.
//                A Checkup-based starting path / edit is offered only when assessable.
export function readAssessedEmergency() {
  const a = getCheckup()?.answers
  if (!a) return { known: false, assessable: false }
  const get = (k) => {
    const v = a[k]
    if (v === 'skipped' || v === '' || v == null) return null
    const n = Number(v)
    if (!Number.isFinite(n) || n < 0 || n > EMERGENCY_SAFE_AMOUNT) return null // finite, non-negative, in-bound; no precision rule
    return n
  }
  const savings = get('savings'), essentials = get('essentials'), debt = get('debt')
  if (savings == null || essentials == null || debt == null) return { known: false, assessable: false }
  const mustPays = essentials + debt
  if (!Number.isFinite(mustPays) || mustPays > EMERGENCY_SAFE_AMOUNT) return { known: false, assessable: false }
  const currency = a.currency === 'krw' ? 'krw' : 'usd'
  // must-pays === 0 -> the assessed dimension is not month-assessable (no divide),
  // so no Checkup-based Planning start is offered; planning-only entry is used.
  const assessable = mustPays > 0
  return { known: true, assessable, accessible: savings, mustPays, savings, essentials, debt, currency }
}

const SCHEMA = 1

export function buildEmergencyPlan({ source, currency, baseline, scenario }) {
  const b = { accessible: roundMoney(baseline.accessible, currency), mustPays: roundMoney(baseline.mustPays, currency) }
  const s = { accessible: roundMoney(scenario.accessible, currency), mustPays: roundMoney(scenario.mustPays, currency) }
  const { current, scenario: sc } = compareEmergency({ baseline: b, scenario: s })
  return {
    moduleId: 'emergency', schemaVersion: SCHEMA, source, currency,
    baseline: b, scenario: s,
    est: { curMonths: roundMonths(current.months), scenMonths: roundMonths(sc.months) },
    updatedAt: Date.now(),
  }
}

// Structural + arithmetic validation. Rejects malformed shapes, numeric strings,
// bad source/currency, out-of-range or wrong-precision values, no-change plans,
// and any plan whose recomputed estimate isn't a clean 'ok' with a non-zero
// one-decimal month change. Returns a normalized plan or null.
export function validateStoredEmergencyPlan(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  if (raw.moduleId !== 'emergency' || raw.schemaVersion !== 1) return null
  if (raw.source !== 'checkup' && raw.source !== 'planning') return null
  if (raw.currency !== 'usd' && raw.currency !== 'krw') return null
  const currency = raw.currency
  const b = raw.baseline, s = raw.scenario
  if (!b || typeof b !== 'object' || Array.isArray(b)) return null
  if (!s || typeof s !== 'object' || Array.isArray(s)) return null
  for (const v of [b.accessible, b.mustPays, s.accessible, s.mustPays]) {
    if (typeof v !== 'number' || !Number.isFinite(v)) return null // rejects numeric strings, null, etc.
  }
  if (!isValidMoney(b.accessible, currency) || !isValidMoney(b.mustPays, currency)) return null
  if (!isValidMoney(s.accessible, currency) || !isValidMoney(s.mustPays, currency)) return null
  if (b.accessible === s.accessible && b.mustPays === s.mustPays) return null // no change
  const { current, scenario: sc } = compareEmergency({ baseline: b, scenario: s })
  if (current.status !== 'ok' || sc.status !== 'ok') return null
  if (roundMonths(current.months) === roundMonths(sc.months)) return null
  const e = raw.est
  if (!e || typeof e !== 'object' || Array.isArray(e)) return null
  if (roundMonths(e.curMonths) !== roundMonths(current.months)) return null
  if (roundMonths(e.scenMonths) !== roundMonths(sc.months)) return null
  if (typeof raw.updatedAt !== 'number' || !Number.isInteger(raw.updatedAt) || raw.updatedAt <= 0) return null
  return {
    moduleId: 'emergency', schemaVersion: 1, source: raw.source, currency,
    baseline: { accessible: b.accessible, mustPays: b.mustPays },
    scenario: { accessible: s.accessible, mustPays: s.mustPays },
    est: { curMonths: roundMonths(current.months), scenMonths: roundMonths(sc.months) },
    updatedAt: raw.updatedAt,
  }
}

export function loadValidatedEmergencyPlan() { return validateStoredEmergencyPlan(getEmergencyPlan()) }

// Freshness. Only a checkup-sourced plan can be stale; a planning-only plan is
// self-contained. 'planning' | 'fresh' | 'stale' | 'no-picture'.
export function emergencyPlanStatus(plan, assessed) {
  if (plan.source !== 'checkup') return 'planning'
  if (!assessed || !assessed.assessable) return 'no-picture'
  if (assessed.currency !== plan.currency) return 'stale'
  if (plan.baseline.accessible !== assessed.accessible || plan.baseline.mustPays !== assessed.mustPays) return 'stale'
  return 'fresh'
}

// Edit eligibility. Planning-only: always. Checkup: only when a current assessed
// picture exists with a matching currency (otherwise Review + Remove only).
export function canEditEmergency(plan, assessed) {
  if (!plan) return false
  if (plan.source === 'planning') return true
  return Boolean(assessed && assessed.assessable && assessed.currency === plan.currency)
}
