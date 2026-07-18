// Goal / Education Planning Tool — pure logic. No React; no scoring import; never
// calls computeResults. Explores "if I keep setting aside this amount, where
// could I be by the time this goal arrives?" as a simple no-return contribution
// path. Returns ONLY projections, gaps, progress %, and a technical status —
// never a score, grade, realistic/unrealistic label, recommended contribution,
// investment return, another module result, or Roadmap priority.
import { getGoalPlan } from '../lib/progress'
import { SAFE_AMOUNT, formatPlanAmount } from './cashflowPlanLogic.js'

export { formatPlanAmount }

// Existing Planning technical amount boundary; technical month horizon cap.
export const GOAL_SAFE_AMOUNT = SAFE_AMOUNT   // 1e12
export const MAX_GOAL_MONTHS = 600            // technical limit, not a recommendation
export const MAX_GOAL_NAME = 60               // custom goal-name length cap
export const MIN_GOAL_ANNUAL_RETURN = -50     // technical calc limit, not a recommended range
export const MAX_GOAL_ANNUAL_RETURN = 50      // technical calc limit, not a recommended range

const isNum = (n) => typeof n === 'number' && Number.isFinite(n)
const overBound = (v) => !Number.isFinite(v) || Math.abs(v) > GOAL_SAFE_AMOUNT

// Currency-aware money rounding: USD cents, KRW whole won. Symmetric.
export function roundMoney(v, currency) {
  if (!Number.isFinite(v)) return v
  const f = currency === 'krw' ? 1 : 100
  const r = (Math.sign(v) * Math.round((Math.abs(v) + Number.EPSILON) * f)) / f
  return Object.is(r, -0) ? 0 : r
}
// Progress percentage: one decimal, symmetric. May exceed 100.
export function roundPercent(v) {
  if (!Number.isFinite(v)) return v
  const r = (Math.sign(v) * Math.round((Math.abs(v) + Number.EPSILON) * 10)) / 10
  return Object.is(r, -0) ? 0 : r
}
export function formatPercent(v) { return `${roundPercent(v).toFixed(1)}%` }

function currencyPlaces(currency) { return currency === 'krw' ? 0 : 2 }
export function hasValidPrecision(n, currency) {
  const f = Math.pow(10, currencyPlaces(currency))
  return Math.abs(Math.round(n * f) - n * f) < 1e-6
}
export function isValidMoney(n, currency) {
  if (!isNum(n) || n < 0 || n > GOAL_SAFE_AMOUNT) return false
  return hasValidPrecision(n, currency)
}
export function isValidMonths(n) {
  return isNum(n) && Number.isInteger(n) && n > 0 && n <= MAX_GOAL_MONTHS
}
// Optional annual return/interest assumption: a value the person chooses to
// explore. Technical range only — never a recommended or expected return.
export function isValidGoalReturn(n) {
  if (!isNum(n) || n < MIN_GOAL_ANNUAL_RETURN || n > MAX_GOAL_ANNUAL_RETURN) return false
  return Math.abs(Math.round(n * 100) - n * 100) < 1e-6 // up to two decimals
}
// Annual percent -> equivalent monthly rate. Within [-50, 50] the base stays
// positive, so the 12th root is always real.
export function goalMonthlyRate(annualReturn) {
  return Math.pow(1 + annualReturn / 100, 1 / 12) - 1
}
// A custom goal needs a meaningful, non-blank, length-safe label. Education needs none.
export function isValidGoalName(goalType, name) {
  if (goalType === 'education') return true
  if (typeof name !== 'string') return false
  const t = name.trim()
  return t.length > 0 && t.length <= MAX_GOAL_NAME
}

// Projection for one contribution path. When the optional assumption is
// inactive (disabled or 0%), this uses the EXACT RC6.4 formula with no loop, so
// the default result is byte-for-byte unchanged and free of looping drift:
//   projected = setAside + contribution * months
// When active, it compounds month by month at the entered rate, rounding the
// plan currency at each step: apply the monthly rate to the running balance,
// round, add the end-of-month contribution, round, then check the safety bound.
//   monthlyRate = (1 + annualReturn/100)^(1/12) − 1
// Returns projected, signed gap, progress %, the 0%-path reference amount, and
// the estimated difference the assumption produced (projected − noReturn).
function projectPath(setAside, contribution, months, target, currency, active, monthlyRate) {
  const noReturnRaw = setAside + contribution * months
  if (overBound(noReturnRaw)) return { over: true }
  const noReturn = roundMoney(noReturnRaw, currency)
  let projected
  if (!active) {
    projected = noReturn
  } else {
    let bal = roundMoney(setAside, currency)
    for (let m = 0; m < months; m++) {
      bal = roundMoney(bal * (1 + monthlyRate), currency)
      bal = roundMoney(bal + contribution, currency)
      if (overBound(bal)) return { over: true }
    }
    projected = bal
  }
  const gap = roundMoney(target - projected, currency)
  if (overBound(gap)) return { over: true }
  const progress = roundPercent((projected / target) * 100)
  const estDiff = roundMoney(projected - noReturn, currency)
  return { projected, gap, progress, noReturn, estDiff }
}

// Core comparison. The five required planning inputs plus an OPTIONAL annual
// return assumption that defaults off. With the assumption disabled (or exactly
// 0%), output is identical to RC6.4.
//   status: 'invalid' | 'beyondLimit' | 'ok'
export function computeGoal({ target, setAside, months, currentContribution, plannedContribution, currency, returnAssumptionEnabled = false, annualReturn = 0 }) {
  const nums = [target, setAside, months, currentContribution, plannedContribution]
  if (!nums.every(isNum)) return { status: 'invalid' }
  if (!isValidMoney(target, currency) || target <= 0) return { status: 'invalid' } // target must be > 0
  if (!isValidMoney(setAside, currency)) return { status: 'invalid' }
  if (!isValidMoney(currentContribution, currency)) return { status: 'invalid' }
  if (!isValidMoney(plannedContribution, currency)) return { status: 'invalid' }
  if (!isValidMonths(months)) return { status: 'invalid' }

  const enabled = returnAssumptionEnabled === true
  if (enabled && !isValidGoalReturn(annualReturn)) return { status: 'invalid' }
  const ar = enabled ? annualReturn : 0
  const active = enabled && ar !== 0
  const monthlyRate = active ? goalMonthlyRate(ar) : 0
  if (active && !Number.isFinite(monthlyRate)) return { status: 'beyondLimit' }

  const cur = projectPath(setAside, currentContribution, months, target, currency, active, monthlyRate)
  const plan = projectPath(setAside, plannedContribution, months, target, currency, active, monthlyRate)
  if (cur.over || plan.over) return { status: 'beyondLimit' }

  return {
    status: 'ok',
    current: cur,
    planned: plan,
    contributionDiff: roundMoney(plannedContribution - currentContribution, currency),
    returnActive: active,
    returnAssumptionEnabled: enabled,
    effectiveAnnual: ar,
  }
}

// Adoption: valid goal type + name, all values valid, calculations within
// technical limits, explicit confirm. UNLIKE Cash Flow, a matching current and
// planned contribution is allowed — defining and keeping the goal is meaningful.
export function canAdoptGoal({ goalType, goalName, target, setAside, months, currentContribution, plannedContribution, currency, returnAssumptionEnabled = false, annualReturn = 0 }) {
  if (goalType !== 'education' && goalType !== 'custom') return false
  if (!isValidGoalName(goalType, goalName)) return false
  return computeGoal({ target, setAside, months, currentContribution, plannedContribution, currency, returnAssumptionEnabled, annualReturn }).status === 'ok'
}

const SCHEMA = 2

// est payload shared by build + validate. Includes the 0%-path reference
// (curNoReturn/planNoReturn) and the estimated assumption difference
// (curEstDiff/planEstDiff), which are 0 whenever the assumption is inactive.
function estOf(r) {
  return {
    curProjected: r.current.projected, curGap: r.current.gap, curProgress: r.current.progress,
    curNoReturn: r.current.noReturn, curEstDiff: r.current.estDiff,
    planProjected: r.planned.projected, planGap: r.planned.gap, planProgress: r.planned.progress,
    planNoReturn: r.planned.noReturn, planEstDiff: r.planned.estDiff,
  }
}

export function buildGoalPlan({ goalType, goalName, currency, target, setAside, months, currentContribution, plannedContribution, returnAssumptionEnabled = false, annualReturn = 0 }) {
  const t = roundMoney(target, currency), sa = roundMoney(setAside, currency)
  const cc = roundMoney(currentContribution, currency), pc = roundMoney(plannedContribution, currency)
  const enabled = returnAssumptionEnabled === true
  const ar = enabled ? annualReturn : 0
  const r = computeGoal({ target: t, setAside: sa, months, currentContribution: cc, plannedContribution: pc, currency, returnAssumptionEnabled: enabled, annualReturn: ar })
  return {
    moduleId: 'goal', schemaVersion: SCHEMA,
    goalType, goalName: goalType === 'custom' ? String(goalName).trim() : '',
    currency, target: t, setAside: sa, months,
    currentContribution: cc, plannedContribution: pc,
    returnAssumptionEnabled: enabled, annualReturn: ar,
    est: estOf(r),
    updatedAt: Date.now(),
  }
}

// Shared field + arithmetic checks for both schema versions. Returns the fresh
// recomputation `r` (already known 'ok') or null on any mismatch.
function validateGoalCore(raw, currency, enabled, annualReturn) {
  const { target, setAside, months, currentContribution, plannedContribution } = raw
  for (const v of [target, setAside, months, currentContribution, plannedContribution]) {
    if (typeof v !== 'number' || !Number.isFinite(v)) return null // rejects numeric strings, null, etc.
  }
  if (!isValidMoney(target, currency) || target <= 0) return null
  if (!isValidMoney(setAside, currency)) return null
  if (!isValidMoney(currentContribution, currency)) return null
  if (!isValidMoney(plannedContribution, currency)) return null
  if (!isValidMonths(months)) return null
  const r = computeGoal({ target, setAside, months, currentContribution, plannedContribution, currency, returnAssumptionEnabled: enabled, annualReturn })
  if (r.status !== 'ok') return null
  const e = raw.est
  if (!e || typeof e !== 'object' || Array.isArray(e)) return null
  const rm = (v) => roundMoney(v, currency)
  if (rm(e.curProjected) !== r.current.projected || rm(e.curGap) !== r.current.gap) return null
  if (rm(e.planProjected) !== r.planned.projected || rm(e.planGap) !== r.planned.gap) return null
  if (roundPercent(e.curProgress) !== r.current.progress || roundPercent(e.planProgress) !== r.planned.progress) return null
  return r
}

function normalizedGoalPlan(raw, currency, schemaVersion, enabled, annualReturn, r) {
  const rm = (v) => roundMoney(v, currency)
  return {
    moduleId: 'goal', schemaVersion,
    goalType: raw.goalType, goalName: raw.goalType === 'custom' ? raw.goalName.trim() : '',
    currency, target: rm(raw.target), setAside: rm(raw.setAside), months: raw.months,
    currentContribution: rm(raw.currentContribution), plannedContribution: rm(raw.plannedContribution),
    returnAssumptionEnabled: enabled, annualReturn: enabled ? annualReturn : 0, returnActive: r.returnActive, effectiveAnnual: r.effectiveAnnual,
    est: estOf(r),
    current: r.current, planned: r.planned, contributionDiff: r.contributionDiff, updatedAt: raw.updatedAt,
  }
}

// Migration-aware validation. Never renders raw stored data.
// - schemaVersion 1 (legacy RC6.4): validated exactly as before (no-return
//   arithmetic), then NORMALIZED in-memory to returnAssumptionEnabled:false /
//   annualReturn:0 with zero estimated differences.
// - schemaVersion 2: validates the optional-assumption fields and requires
//   every stored value to match a fresh recomputation.
// Does not accept legacy arithmetic under v2 or new arithmetic under v1.
export function validateStoredGoalPlan(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  if (raw.moduleId !== 'goal') return null
  if (raw.schemaVersion !== 1 && raw.schemaVersion !== 2) return null
  if (raw.goalType !== 'education' && raw.goalType !== 'custom') return null
  if (raw.currency !== 'usd' && raw.currency !== 'krw') return null
  const currency = raw.currency
  if (typeof raw.goalName !== 'string') return null
  if (raw.goalType === 'custom') {
    const t = raw.goalName.trim()
    if (t.length === 0 || t.length > MAX_GOAL_NAME) return null
  }
  if (typeof raw.updatedAt !== 'number' || !Number.isInteger(raw.updatedAt) || raw.updatedAt <= 0) return null

  if (raw.schemaVersion === 1) {
    // Legacy plans carry no optional-assumption fields; reject any that sneaked in.
    if ('returnAssumptionEnabled' in raw || 'annualReturn' in raw) return null
    const r = validateGoalCore(raw, currency, false, 0)
    if (!r) return null
    // Legacy est must NOT carry return-specific fields inconsistently; if present they must be the 0 defaults.
    const e = raw.est
    if ('curNoReturn' in e && roundMoney(e.curNoReturn, currency) !== r.current.noReturn) return null
    if ('curEstDiff' in e && roundMoney(e.curEstDiff, currency) !== 0) return null
    return normalizedGoalPlan(raw, currency, 1, false, 0, r)
  }

  // schemaVersion 2
  const enabled = raw.returnAssumptionEnabled
  if (typeof enabled !== 'boolean') return null
  if (typeof raw.annualReturn !== 'number' || !Number.isFinite(raw.annualReturn)) return null
  if (!enabled && raw.annualReturn !== 0) return null
  if (enabled && !isValidGoalReturn(raw.annualReturn)) return null
  const r = validateGoalCore(raw, currency, enabled, raw.annualReturn)
  if (!r) return null
  const e = raw.est
  const rm = (v) => roundMoney(v, currency)
  if (rm(e.curNoReturn) !== r.current.noReturn || rm(e.planNoReturn) !== r.planned.noReturn) return null
  if (rm(e.curEstDiff) !== r.current.estDiff || rm(e.planEstDiff) !== r.planned.estDiff) return null
  return normalizedGoalPlan(raw, currency, 2, enabled, raw.annualReturn, r)
}

export function loadValidatedGoalPlan() { return validateStoredGoalPlan(getGoalPlan()) }
