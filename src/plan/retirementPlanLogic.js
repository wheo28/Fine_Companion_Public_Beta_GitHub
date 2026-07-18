// Retirement Planning Tool — pure logic. No React; no scoring import; never calls
// computeResults. Explores "if I continue with this contribution, what might it
// become by the retirement point I entered?" as a monthly-compounding path under
// an explicit, visible return ASSUMPTION. Returns ONLY projected balance, total
// future contributions, estimated growth, and a technical status — never a score,
// grade, sufficiency verdict, recommended contribution/return, replacement income,
// withdrawal, another module result, or Roadmap priority.
import { getCheckup, getRetirementPlan } from '../lib/progress'
import { SAFE_AMOUNT, formatPlanAmount } from './cashflowPlanLogic.js'

export { formatPlanAmount }

// Technical limits (not financial expectations or recommendations).
export const RET_SAFE_AMOUNT = SAFE_AMOUNT        // 1e12
export const MAX_RETIREMENT_YEARS = 60
export const MIN_ANNUAL_RETURN = -50              // percent
export const MAX_ANNUAL_RETURN = 50               // percent
export const MIN_RET_CONTRIBUTION_CHANGE = -50    // technical limit, not suggested behavior
export const MAX_RET_CONTRIBUTION_CHANGE = 50
export const MIN_RET_INFLATION = -50              // technical limit, not an expected range
export const MAX_RET_INFLATION = 50

const isNum = (n) => typeof n === 'number' && Number.isFinite(n)
const overBound = (v) => !Number.isFinite(v) || Math.abs(v) > RET_SAFE_AMOUNT

// Currency-aware money rounding: USD cents, KRW whole won. Symmetric. Applied at
// each monthly step (same discipline as Debt Planning).
export function roundMoney(v, currency) {
  if (!Number.isFinite(v)) return v
  const f = currency === 'krw' ? 1 : 100
  const r = (Math.sign(v) * Math.round((Math.abs(v) + Number.EPSILON) * f)) / f
  return Object.is(r, -0) ? 0 : r
}
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
  if (!isNum(n) || n < 0 || n > RET_SAFE_AMOUNT) return false
  return hasValidPrecision(n, currency)
}
export function isValidYears(n) {
  return isNum(n) && Number.isInteger(n) && n > 0 && n <= MAX_RETIREMENT_YEARS
}
// Annual return is an ASSUMPTION, bounded technically to keep the monthly rate
// finite. Not a likely/expected/safe/guaranteed value.
export function isValidReturn(n) {
  return isNum(n) && n >= MIN_ANNUAL_RETURN && n <= MAX_ANNUAL_RETURN
}
// Optional percentage assumption (contribution-change / inflation): technical
// range with up to two decimals. Never a recommended or expected value.
export function isValidPctInRange(n, min, max) {
  if (!isNum(n) || n < min || n > max) return false
  return Math.abs(Math.round(n * 100) - n * 100) < 1e-6
}

// annual return (percent) -> equivalent monthly rate.
export function monthlyRateOf(annualReturn) {
  return Math.pow(1 + annualReturn / 100, 1 / 12) - 1
}

// One contribution path. Applies the monthly return to the running balance, then
// adds the contribution at month end, rounding at every step. Shared assumptions
// (starting balance, horizon, return) come from the caller so both paths match.
function projectPath(currentBalance, contribution, months, monthlyRate, currency) {
  let bal = roundMoney(currentBalance, currency)
  if (overBound(bal)) return { over: true }
  for (let m = 0; m < months; m++) {
    bal = roundMoney(bal * (1 + monthlyRate) + contribution, currency)
    if (overBound(bal)) return { over: true }
  }
  const projected = bal
  const totalContributions = roundMoney(contribution * months, currency)
  const growth = roundMoney(projected - roundMoney(currentBalance, currency) - totalContributions, currency)
  if (overBound(totalContributions) || overBound(growth)) return { over: true }
  return { projected, totalContributions, growth }
}

// Adjusted month-by-month path, used ONLY when an employer contribution or an
// annual personal-contribution change is in effect. Two rounds per month (after
// return, then after contributions) per the RC6.6 spec — deliberately distinct
// from the default single-round routine, which stays byte-identical for the
// simple case. Employer amount is fixed and never depends on the personal
// amount. The personal contribution steps once after each completed 12-month
// period. Accumulates actual monthly amounts for contribution totals.
function adjustedProjectPath(currentBalance, startContribution, months, monthlyRate, employerAmt, changeRate, currency) {
  let bal = roundMoney(currentBalance, currency)
  if (overBound(bal)) return { over: true }
  let personal = roundMoney(startContribution, currency)
  if (overBound(personal)) return { over: true }
  let totalPersonal = 0
  let totalEmployer = 0
  for (let m = 0; m < months; m++) {
    if (m > 0 && m % 12 === 0) {
      personal = roundMoney(personal * (1 + changeRate / 100), currency)
      if (overBound(personal)) return { over: true }
    }
    bal = roundMoney(bal * (1 + monthlyRate), currency)
    if (overBound(bal)) return { over: true }
    bal = roundMoney(bal + personal + employerAmt, currency)
    if (overBound(bal)) return { over: true }
    totalPersonal = roundMoney(totalPersonal + personal, currency)
    totalEmployer = roundMoney(totalEmployer + employerAmt, currency)
    if (overBound(totalPersonal) || overBound(totalEmployer)) return { over: true }
  }
  const projected = bal
  const totalContributions = roundMoney(totalPersonal + totalEmployer, currency)
  const growth = roundMoney(projected - roundMoney(currentBalance, currency) - totalContributions, currency)
  if (overBound(totalContributions) || overBound(growth)) return { over: true }
  return { projected, totalPersonal, totalEmployer, totalContributions, growth, finalPersonalContribution: personal }
}

// Purchasing-power factor + today's-value of a nominal amount. Secondary view
// only; never alters nominal results. Returns null on any technical problem.
function purchasingPower(nominal, annualInflation, years, currency) {
  const factor = Math.pow(1 + annualInflation / 100, years)
  if (!Number.isFinite(factor) || factor <= 0) return null
  const today = roundMoney(nominal / factor, currency)
  if (overBound(today)) return null
  return today
}

// Wraps the default (single-round) projectPath into the richer path shape so
// both branches return the same fields. Used for the simple case AND for each
// path's basic (no-employer, no-change) reference.
function basicPathShape(currentBalance, contribution, months, monthlyRate, currency) {
  const p = projectPath(currentBalance, contribution, months, monthlyRate, currency)
  if (p.over) return p
  return { ...p, totalPersonal: p.totalContributions, totalEmployer: 0, finalPersonalContribution: roundMoney(contribution, currency) }
}

// Core comparison. The five required inputs plus THREE optional assumptions that
// all default off. With every optional assumption inactive, output is identical
// to RC6.5 (the default single-round routine is used, unchanged).
//   status: 'invalid' | 'beyondLimit' | 'ok'
export function computeRetirement({
  currentBalance, years, currentContribution, plannedContribution, annualReturn, currency,
  employerContributionEnabled = false, employerMonthlyContribution = 0,
  contributionChangeEnabled = false, annualContributionChange = 0,
  inflationEnabled = false, annualInflation = 0,
}) {
  if (![currentBalance, years, currentContribution, plannedContribution, annualReturn].every(isNum)) return { status: 'invalid' }
  if (!isValidMoney(currentBalance, currency)) return { status: 'invalid' }
  if (!isValidMoney(currentContribution, currency)) return { status: 'invalid' }
  if (!isValidMoney(plannedContribution, currency)) return { status: 'invalid' }
  if (!isValidYears(years)) return { status: 'invalid' }
  if (!isValidReturn(annualReturn)) return { status: 'invalid' }

  const empEnabled = employerContributionEnabled === true
  const chgEnabled = contributionChangeEnabled === true
  const infEnabled = inflationEnabled === true
  if (empEnabled && !isValidMoney(employerMonthlyContribution, currency)) return { status: 'invalid' }
  if (chgEnabled && !isValidPctInRange(annualContributionChange, MIN_RET_CONTRIBUTION_CHANGE, MAX_RET_CONTRIBUTION_CHANGE)) return { status: 'invalid' }
  if (infEnabled && !isValidPctInRange(annualInflation, MIN_RET_INFLATION, MAX_RET_INFLATION)) return { status: 'invalid' }

  const empAmt = empEnabled ? roundMoney(employerMonthlyContribution, currency) : 0
  const chgRate = chgEnabled ? annualContributionChange : 0
  const infRate = infEnabled ? annualInflation : 0
  const employerActive = empEnabled && empAmt > 0
  const changeActive = chgEnabled && chgRate !== 0
  const inflationActive = infEnabled
  const useAdjusted = employerActive || changeActive

  const months = years * 12
  const monthlyRate = monthlyRateOf(annualReturn)
  if (!Number.isFinite(monthlyRate)) return { status: 'invalid' }

  const buildPath = (startContribution) => {
    const basic = basicPathShape(currentBalance, startContribution, months, monthlyRate, currency)
    if (basic.over) return { over: true }
    const main = useAdjusted
      ? adjustedProjectPath(currentBalance, startContribution, months, monthlyRate, empAmt, chgRate, currency)
      : basic
    if (main.over) return { over: true }
    const basicDiff = roundMoney(main.projected - basic.projected, currency)
    if (overBound(basicDiff)) return { over: true }
    let pp = null
    if (inflationActive) {
      pp = purchasingPower(main.projected, infRate, years, currency)
      if (pp === null) return { over: true }
    }
    return { ...main, basicProjected: basic.projected, basicDiff, purchasingPower: pp }
  }

  const cur = buildPath(currentContribution)
  const plan = buildPath(plannedContribution)
  if (cur.over || plan.over) return { status: 'beyondLimit' }

  return {
    status: 'ok',
    months, monthlyRate,
    current: cur,
    planned: plan,
    contributionDiff: roundMoney(plannedContribution - currentContribution, currency),
    balanceDiff: roundMoney(plan.projected - cur.projected, currency),
    employerActive, changeActive, inflationActive,
    effectiveEmployer: empAmt, effectiveChange: chgRate, effectiveInflation: infRate,
    employerContributionEnabled: empEnabled, contributionChangeEnabled: chgEnabled, inflationEnabled: infEnabled,
  }
}

// Optional, secondary contribution-share of monthly income. Only when income is
// known from the Checkup, positive, and in the SAME currency as the plan. No
// benchmark, no recommendation, no pass/fail. Never converts currencies.
export function readMonthlyIncome() {
  const a = getCheckup()?.answers
  if (!a) return null
  const v = a.income
  if (v === 'skipped' || v === '' || v == null) return null
  const n = Number(v)
  if (!Number.isFinite(n) || n <= 0 || n > RET_SAFE_AMOUNT) return null
  const currency = a.currency === 'krw' ? 'krw' : 'usd'
  return { income: n, currency }
}
export function contributionShare({ currentContribution, plannedContribution, currency }) {
  const inc = readMonthlyIncome()
  if (!inc || inc.currency !== currency) return null // omit on missing/zero/mismatch
  const cur = roundPercent((currentContribution / inc.income) * 100)
  const plan = roundPercent((plannedContribution / inc.income) * 100)
  return { current: cur, planned: plan, changePts: roundPercent(plan - cur) }
}

// True when a set of entered values matches an already-stored plan on every
// field at accepted precision (currency, balance, years, both contributions,
// return). Used to disable an exact-duplicate replacement — the first plan is
// still adoptable even when current and planned contributions are equal.
export function sameStoredRetirement(nums, stored) {
  if (!stored || !nums) return false
  const cur = nums.currency
  if (stored.currency !== cur) return false
  const rm = (v) => roundMoney(v, cur)
  const base = (
    rm(nums.currentBalance) === rm(stored.currentBalance) &&
    nums.years === stored.years &&
    rm(nums.currentContribution) === rm(stored.currentContribution) &&
    rm(nums.plannedContribution) === rm(stored.plannedContribution) &&
    nums.annualReturn === stored.annualReturn
  )
  if (!base) return false
  // Optional enabled flags + their values (normalized: value only matters when enabled).
  const nEmp = !!nums.employerContributionEnabled, sEmp = !!stored.employerContributionEnabled
  const nChg = !!nums.contributionChangeEnabled, sChg = !!stored.contributionChangeEnabled
  const nInf = !!nums.inflationEnabled, sInf = !!stored.inflationEnabled
  if (nEmp !== sEmp || nChg !== sChg || nInf !== sInf) return false
  if (nEmp && rm(nums.employerMonthlyContribution || 0) !== rm(stored.employerMonthlyContribution || 0)) return false
  if (nChg && (nums.annualContributionChange || 0) !== (stored.annualContributionChange || 0)) return false
  if (nInf && (nums.annualInflation || 0) !== (stored.annualInflation || 0)) return false
  return true
}

// Adoption: all values valid and calculations within technical bounds. Planning-
// only, so defining and confirming the plan is meaningful even when the current
// and planned contributions are equal (first intentional definition).
export function canAdoptRetirement(args) {
  return computeRetirement(args).status === 'ok'
}

const SCHEMA = 2

// est payload shared by build + validate. FLAT superset: the RC6.5 legacy keys
// (curProjected/curTotalContrib/curGrowth + plan*) are preserved so existing My
// Plans / Roadmap / Review rendering keeps working, plus the new per-path
// breakdown (personal/employer totals, final personal, basic-path reference +
// difference, purchasing power). Neutral values when an assumption is off.
function estOf(r) {
  const c = r.current, p = r.planned
  return {
    curProjected: c.projected, curTotalContrib: c.totalContributions, curGrowth: c.growth,
    planProjected: p.projected, planTotalContrib: p.totalContributions, planGrowth: p.growth,
    curTotalPersonal: c.totalPersonal, curTotalEmployer: c.totalEmployer, curFinalPersonal: c.finalPersonalContribution,
    curBasicProjected: c.basicProjected, curBasicDiff: c.basicDiff,
    curPurchasingPower: c.purchasingPower === undefined ? null : c.purchasingPower,
    planTotalPersonal: p.totalPersonal, planTotalEmployer: p.totalEmployer, planFinalPersonal: p.finalPersonalContribution,
    planBasicProjected: p.basicProjected, planBasicDiff: p.basicDiff,
    planPurchasingPower: p.purchasingPower === undefined ? null : p.purchasingPower,
  }
}

const OPT_DEFAULTS = {
  employerContributionEnabled: false, employerMonthlyContribution: 0,
  contributionChangeEnabled: false, annualContributionChange: 0,
  inflationEnabled: false, annualInflation: 0,
}

export function buildRetirementPlan({
  currency, currentBalance, years, currentContribution, plannedContribution, annualReturn,
  employerContributionEnabled = false, employerMonthlyContribution = 0,
  contributionChangeEnabled = false, annualContributionChange = 0,
  inflationEnabled = false, annualInflation = 0,
}) {
  const cb = roundMoney(currentBalance, currency)
  const cc = roundMoney(currentContribution, currency), pc = roundMoney(plannedContribution, currency)
  const empEnabled = employerContributionEnabled === true
  const chgEnabled = contributionChangeEnabled === true
  const infEnabled = inflationEnabled === true
  const empAmt = empEnabled ? roundMoney(employerMonthlyContribution, currency) : 0
  const chgRate = chgEnabled ? annualContributionChange : 0
  const infRate = infEnabled ? annualInflation : 0
  const r = computeRetirement({
    currentBalance: cb, years, currentContribution: cc, plannedContribution: pc, annualReturn, currency,
    employerContributionEnabled: empEnabled, employerMonthlyContribution: empAmt,
    contributionChangeEnabled: chgEnabled, annualContributionChange: chgRate,
    inflationEnabled: infEnabled, annualInflation: infRate,
  })
  return {
    moduleId: 'retirement', schemaVersion: SCHEMA, currency,
    currentBalance: cb, years, currentContribution: cc, plannedContribution: pc, annualReturn,
    employerContributionEnabled: empEnabled, employerMonthlyContribution: empAmt,
    contributionChangeEnabled: chgEnabled, annualContributionChange: chgRate,
    inflationEnabled: infEnabled, annualInflation: infRate,
    est: estOf(r),
    updatedAt: Date.now(),
  }
}

function normalizedRetirementPlan(raw, currency, schemaVersion, opt, r) {
  const rm = (v) => roundMoney(v, currency)
  return {
    moduleId: 'retirement', schemaVersion, currency,
    currentBalance: rm(raw.currentBalance), years: raw.years,
    currentContribution: rm(raw.currentContribution), plannedContribution: rm(raw.plannedContribution), annualReturn: raw.annualReturn,
    employerContributionEnabled: opt.employerContributionEnabled, employerMonthlyContribution: opt.employerMonthlyContribution,
    contributionChangeEnabled: opt.contributionChangeEnabled, annualContributionChange: opt.annualContributionChange,
    inflationEnabled: opt.inflationEnabled, annualInflation: opt.annualInflation,
    employerActive: r.employerActive, changeActive: r.changeActive, inflationActive: r.inflationActive,
    est: estOf(r),
    current: r.current, planned: r.planned,
    contributionDiff: r.contributionDiff, balanceDiff: r.balanceDiff, updatedAt: raw.updatedAt,
  }
}

const HAS_OPT = (raw) => ['employerContributionEnabled', 'employerMonthlyContribution', 'contributionChangeEnabled', 'annualContributionChange', 'inflationEnabled', 'annualInflation'].some((k) => k in raw)

// Migration-aware validation. Never renders raw stored data.
// - schemaVersion 1 (legacy RC6.5): required fields validated exactly as before,
//   then NORMALIZED in-memory to all optional assumptions inactive with neutral
//   values (employer 0, change 0, inflation 0, basicDiff 0, no PP). A v1 plan
//   that improperly carries optional top-level fields is rejected.
// - schemaVersion 2: validates the three enabled flags + numeric values and
//   requires every stored derived value to match a fresh recomputation.
export function validateStoredRetirementPlan(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  if (raw.moduleId !== 'retirement') return null
  if (raw.schemaVersion !== 1 && raw.schemaVersion !== 2) return null
  if (raw.currency !== 'usd' && raw.currency !== 'krw') return null
  const currency = raw.currency
  const { currentBalance, years, currentContribution, plannedContribution, annualReturn } = raw
  for (const v of [currentBalance, years, currentContribution, plannedContribution, annualReturn]) {
    if (typeof v !== 'number' || !Number.isFinite(v)) return null // rejects numeric strings, null
  }
  if (!isValidMoney(currentBalance, currency)) return null
  if (!isValidMoney(currentContribution, currency)) return null
  if (!isValidMoney(plannedContribution, currency)) return null
  if (!isValidYears(years)) return null
  if (!isValidReturn(annualReturn)) return null
  if (typeof raw.updatedAt !== 'number' || !Number.isInteger(raw.updatedAt) || raw.updatedAt <= 0) return null

  let opt
  if (raw.schemaVersion === 1) {
    if (HAS_OPT(raw)) return null // legacy plan must not carry optional fields
    opt = { ...OPT_DEFAULTS }
  } else {
    // schemaVersion 2 — validate optional flags + values.
    const empEnabled = raw.employerContributionEnabled, chgEnabled = raw.contributionChangeEnabled, infEnabled = raw.inflationEnabled
    if (typeof empEnabled !== 'boolean' || typeof chgEnabled !== 'boolean' || typeof infEnabled !== 'boolean') return null
    const emp = raw.employerMonthlyContribution, chg = raw.annualContributionChange, inf = raw.annualInflation
    if ([emp, chg, inf].some((v) => typeof v !== 'number' || !Number.isFinite(v))) return null
    if (!empEnabled && emp !== 0) return null
    if (!chgEnabled && chg !== 0) return null
    if (!infEnabled && inf !== 0) return null
    if (empEnabled && !isValidMoney(emp, currency)) return null
    if (chgEnabled && !isValidPctInRange(chg, MIN_RET_CONTRIBUTION_CHANGE, MAX_RET_CONTRIBUTION_CHANGE)) return null
    if (infEnabled && !isValidPctInRange(inf, MIN_RET_INFLATION, MAX_RET_INFLATION)) return null
    opt = {
      employerContributionEnabled: empEnabled, employerMonthlyContribution: emp,
      contributionChangeEnabled: chgEnabled, annualContributionChange: chg,
      inflationEnabled: infEnabled, annualInflation: inf,
    }
  }

  const r = computeRetirement({ currentBalance, years, currentContribution, plannedContribution, annualReturn, currency, ...opt })
  if (r.status !== 'ok') return null
  const e = raw.est
  if (!e || typeof e !== 'object' || Array.isArray(e)) return null
  const rm = (v) => roundMoney(v, currency)

  if (raw.schemaVersion === 1) {
    // Legacy est only carries curProjected/curTotalContrib/curGrowth + plan*.
    if (rm(e.curProjected) !== r.current.projected || rm(e.curTotalContrib) !== r.current.totalContributions || rm(e.curGrowth) !== r.current.growth) return null
    if (rm(e.planProjected) !== r.planned.projected || rm(e.planTotalContrib) !== r.planned.totalContributions || rm(e.planGrowth) !== r.planned.growth) return null
  } else {
    const fresh = estOf(r)
    const flat = ['curProjected', 'curTotalContrib', 'curGrowth', 'planProjected', 'planTotalContrib', 'planGrowth',
      'curTotalPersonal', 'curTotalEmployer', 'curFinalPersonal', 'curBasicProjected', 'curBasicDiff',
      'planTotalPersonal', 'planTotalEmployer', 'planFinalPersonal', 'planBasicProjected', 'planBasicDiff']
    for (const k of flat) {
      if (typeof e[k] !== 'number' || rm(e[k]) !== fresh[k]) return null
    }
    for (const k of ['curPurchasingPower', 'planPurchasingPower']) {
      const ppE = e[k], ppR = fresh[k]
      if (ppR === null) { if (ppE !== null && ppE !== undefined) return null }
      else { if (typeof ppE !== 'number' || rm(ppE) !== ppR) return null }
    }
  }
  return normalizedRetirementPlan(raw, currency, raw.schemaVersion, opt, r)
}

export function loadValidatedRetirementPlan() { return validateStoredRetirementPlan(getRetirementPlan()) }
