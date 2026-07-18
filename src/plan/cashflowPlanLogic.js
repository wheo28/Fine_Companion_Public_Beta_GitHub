// Cash Flow Planning Tool — pure logic. No React, no scoring import.
// RC5.0: schema v2 supports multiple changed fields and two baseline sources
// (checkup | planning). v1 single-lever plans are migrated on read.
import { getCheckup, getPlan } from '../lib/progress'

// Technical calculation/display safety bound (not a financial benchmark).
export const SAFE_AMOUNT = 1_000_000_000_000

export const LEVERS = ['income', 'essentials', 'nonEssentials', 'debt']

// Cash-flow-only arithmetic. Consumes already-validated finite, non-negative
// numbers (baseline may be decimal; scenario values are whole integers).
export function cashflowRoom({ income, essentials, nonEssentials, debt }) {
  const out = essentials + nonEssentials + debt
  return { outflows: out, room: income - out } // room < 0 means a gap
}

// Symmetric 0.01 precision (technical correctness only).
export function roundPlanAmount(value) {
  return (Math.sign(value) * Math.round((Math.abs(value) + Number.EPSILON) * 100)) / 100
}

// Planning display: up to two decimals, trailing .00 dropped, thousands
// separators, currency symbol. Used for every Planning Tool amount.
export function formatPlanAmount(value, currency = 'usd') {
  const r = roundPlanAmount(Number(value) || 0)
  const symbol = currency === 'krw' ? '\u20a9' : '$'
  const sign = r < 0 ? '-' : ''
  const abs = Math.abs(r)
  const whole = Math.trunc(abs)
  const cents = Math.round((abs - whole) * 100)
  const wholeStr = whole.toLocaleString('en-US')
  const body = cents === 0 ? wholeStr : `${wholeStr}.${String(cents).padStart(2, '0')}`
  return `${sign}${symbol}${body}`
}

function finiteInRange(n) { return typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= SAFE_AMOUNT }
function magInRange(n) { return typeof n === 'number' && Number.isFinite(n) && Math.abs(n) <= SAFE_AMOUNT }
function isRealNumber(n) { return typeof n === 'number' && Number.isFinite(n) }
function baseVals(b) { return { income: b.income, essentials: b.essentials, nonEssentials: b.nonEssentials, debt: b.debt } }

// A user-entered scenario / baseline value: whole, non-negative, within range.
export function isValidScenarioValue(n) {
  return Number.isInteger(n) && n >= 0 && n <= SAFE_AMOUNT
}
export const isValidBaselineValue = isValidScenarioValue

// Assessed picture from the Checkup. Maps discretionary -> nonEssentials.
// Assessed values may be decimal (finite, non-negative); income 0 is allowed.
export function readAssessedCashflow() {
  const a = getCheckup()?.answers
  if (!a) return { known: false }
  const src = { income: a.income, essentials: a.essentials, nonEssentials: a.discretionary, debt: a.debt }
  const out = {}
  for (const k of LEVERS) {
    const v = src[k]
    if (v === 'skipped' || v === '' || v == null) return { known: false }
    const n = Number(v)
    if (!Number.isFinite(n) || n < 0 || n > SAFE_AMOUNT) return { known: false }
    out[k] = n
  }
  const currency = a.currency === 'krw' ? 'krw' : 'usd'
  const { outflows, room } = cashflowRoom(out)
  if (!finiteInRange(outflows) || !magInRange(room)) return { known: false }
  return { known: true, ...out, currency, assessedOutflows: outflows, assessedRoom: room }
}

// Overlay a partial { field: value } change map onto a baseline's four values.
function applyChanges(baseline, changes) {
  const s = baseVals(baseline)
  for (const k of LEVERS) if (changes && Object.prototype.hasOwnProperty.call(changes, k)) s[k] = changes[k]
  return s
}

// Derive a multi-field scenario's aggregate figures, its in-range flag, and
// which fields actually differ from the baseline. Overflow is reported, never
// clamped or partially calculated.
export function computeMultiScenario(baseline, changes) {
  const scenario = applyChanges(baseline, changes)
  const { outflows, room } = cashflowRoom(scenario)
  const change = room - baseline.room
  const inRange = finiteInRange(outflows) && magInRange(room) && magInRange(change)
  const changedFields = LEVERS.filter((k) => roundPlanAmount(scenario[k]) !== roundPlanAmount(baseline[k]))
  return { scenario, outflows, room, change, inRange, changedFields }
}

// Normalize a baseline object to the stored shape (four values + room).
export function normalizeBaseline(vals) {
  const base = cashflowRoom(baseVals(vals))
  return { income: vals.income, essentials: vals.essentials, nonEssentials: vals.nonEssentials, debt: vals.debt, room: base.room }
}

// ---- stored-plan validation --------------------------------------------

function validateV2(p) {
  if (p.currency !== 'usd' && p.currency !== 'krw') return null
  if (p.baselineSource !== 'checkup' && p.baselineSource !== 'planning') return null
  const b = p.baseline
  if (!b || typeof b !== 'object') return null
  for (const k of LEVERS) { if (!finiteInRange(b[k])) return null }
  if (!magInRange(b.room)) return null
  const base = cashflowRoom(baseVals(b))
  if (!finiteInRange(base.outflows)) return null
  if (!magInRange(base.room)) return null
  if (roundPlanAmount(base.room) !== roundPlanAmount(Number(b.room))) return null
  const ch = p.changes
  if (!ch || typeof ch !== 'object' || Array.isArray(ch)) return null
  const keys = Object.keys(ch)
  if (keys.length === 0) return null
  for (const k of keys) {
    if (!LEVERS.includes(k)) return null
    if (!isValidScenarioValue(ch[k])) return null              // strict integer (rejects numeric strings)
    if (roundPlanAmount(ch[k]) === roundPlanAmount(Number(b[k]))) return null  // must differ from baseline
  }
  const m = computeMultiScenario(b, ch)
  if (!m.inRange) return null
  if (!isRealNumber(p.scenarioRoom)) return null            // reject numeric strings, booleans, null, arrays, objects
  if (!isRealNumber(p.change)) return null
  if (roundPlanAmount(m.room) !== roundPlanAmount(p.scenarioRoom)) return null
  if (roundPlanAmount(m.change) !== roundPlanAmount(p.change)) return null
  if (roundPlanAmount(m.change) === 0) return null             // room/gap must have changed
  if (typeof p.updatedAt !== 'number' || !Number.isInteger(p.updatedAt) || p.updatedAt <= 0) return null
  return {
    moduleId: 'cashflow', schemaVersion: 2, currency: p.currency, baselineSource: p.baselineSource,
    baseline: normalizeBaseline(b),
    changes: keys.reduce((o, k) => { o[k] = ch[k]; return o }, {}),
    scenarioRoom: m.room, change: m.change, updatedAt: p.updatedAt,
  }
}

// RC4.9 single-lever plan -> v2 (checkup baseline, one changed field).
function migrateV1toV2(p) {
  if (p.currency !== 'usd' && p.currency !== 'krw') return null
  if (!LEVERS.includes(p.lever)) return null
  const b = p.baseline
  if (!b || typeof b !== 'object') return null
  for (const k of LEVERS) { if (!finiteInRange(b[k])) return null }
  if (!magInRange(b.room)) return null
  if (!isValidScenarioValue(p.chosenValue)) return null
  if (!finiteInRange(p.originalValue)) return null
  if (typeof p.updatedAt !== 'number' || !Number.isInteger(p.updatedAt) || p.updatedAt <= 0) return null
  const base = cashflowRoom(baseVals(b))
  if (roundPlanAmount(base.room) !== roundPlanAmount(Number(b.room))) return null
  if (roundPlanAmount(Number(p.originalValue)) !== roundPlanAmount(Number(b[p.lever]))) return null
  if (p.chosenValue === Number(p.originalValue)) return null
  const candidate = {
    moduleId: 'cashflow', schemaVersion: 2, currency: p.currency, baselineSource: 'checkup',
    baseline: normalizeBaseline(b), changes: { [p.lever]: p.chosenValue },
    scenarioRoom: 0, change: 0, updatedAt: p.updatedAt,
  }
  const m = computeMultiScenario(candidate.baseline, candidate.changes)
  if (!m.inRange || roundPlanAmount(m.change) === 0) return null
  candidate.scenarioRoom = m.room
  candidate.change = m.change
  return candidate
}

// Structural + arithmetic validation. Accepts v1 (migrates) and v2. Depends
// ONLY on the stored plan (no current picture), so it stays usable when the
// Cash Flow picture is unavailable. Returns a normalized v2 plan or null.
export function validateStoredPlan(raw) {
  if (!raw || typeof raw !== 'object') return null
  if (raw.moduleId !== 'cashflow') return null
  if (raw.schemaVersion === 1) return migrateV1toV2(raw)
  if (raw.schemaVersion === 2) return validateV2(raw)
  return null
}

// Freshness. Meaningful only for a checkup-sourced plan; a planning-only
// baseline is self-contained and never "stale". Returns 'fresh' | 'stale' |
// 'planning'.
export function planStatus(validatedPlan, assessed) {
  if (validatedPlan.baselineSource === 'planning') return 'planning'
  if (!assessed || !assessed.known) return 'stale'
  if (assessed.currency !== validatedPlan.currency) return 'stale'
  const b = validatedPlan.baseline
  if (b.income !== assessed.income || b.essentials !== assessed.essentials ||
      b.nonEssentials !== assessed.nonEssentials || b.debt !== assessed.debt) return 'stale'
  return 'fresh'
}

// Edit eligibility. A planning-source plan may always be edited from its stored
// baseline. A checkup-source plan may be edited only when a current assessed
// picture exists AND its currency matches the plan's.
export function canEditPlan(validatedPlan, assessed) {
  if (!validatedPlan) return false
  if (validatedPlan.baselineSource === 'planning') return true
  return Boolean(assessed && assessed.known && assessed.currency === validatedPlan.currency)
}

// Read + validate the stored plan. Callers must never render from raw getPlan().
export function loadValidatedPlan() {
  return validateStoredPlan(getPlan())
}

// Build a v2 plan object for adoption.
export function buildPlan({ baseline, baselineSource, currency, changes }) {
  const norm = normalizeBaseline(baseline)
  const m = computeMultiScenario(norm, changes)
  return {
    moduleId: 'cashflow', schemaVersion: 2, currency, baselineSource,
    baseline: norm, changes: { ...changes }, scenarioRoom: m.room, change: m.change, updatedAt: Date.now(),
  }
}

// ---- descriptive ratio view (secondary, optional, non-advisory) ----------

// One symmetric, magnitude-based rounding rule for ratio percentages and
// percentage-point changes. Half-steps round away from zero by magnitude, and
// negative zero is normalized to zero. Used by formatPercent, the pp-change
// display, and change-at-displayed-precision detection.
export function roundPercentValue(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return value
  const r = (Math.sign(value) * Math.round((Math.abs(value) + Number.EPSILON) * 10)) / 10
  return Object.is(r, -0) ? 0 : r
}

// One consistent percentage formatter: one decimal place, e.g. "52.4%".
// Ordinary values are never clamped; values may legitimately exceed 100%.
export function formatPercent(value) {
  return `${roundPercentValue(value).toFixed(1)}%`
}

// Three descriptive shares for one picture. Consumes only income, essentials,
// nonEssentials (discretionary), debt, and the room already derived from them.
// Returns null when income is not a positive finite number (caller shows the
// income-zero explanation) or when any input is non-finite — never partial,
// never zero-substituted. Returns ONLY the three shares (signed roomShare; the
// caller applies the room/gap label). No state, score, grade, benchmark, or
// recommendation is produced.
export function computeRatios(picture) {
  if (!picture || typeof picture !== 'object') return null
  const { income, essentials, nonEssentials, debt, room } = picture
  for (const v of [income, essentials, nonEssentials, debt, room]) {
    if (typeof v !== 'number' || !Number.isFinite(v)) return null
  }
  if (income <= 0) return null
  return {
    mustPay: ((essentials + debt) / income) * 100,
    flexible: (nonEssentials / income) * 100,
    roomShare: (room / income) * 100, // signed; positive/zero = room, negative = gap
  }
}
