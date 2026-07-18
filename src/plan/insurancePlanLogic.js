// Insurance Protection Planning Tool — pure logic. No React; no scoring import;
// never calls computeResults. A bounded household-protection scenario: it ONLY
// compares user-entered responsibilities against user-entered protection
// resources. It never tells the person how much insurance they need, recommends
// a policy/carrier/term/type, calculates a premium, calls a gap dangerous, or
// classifies anyone as under/overinsured. Returns only descriptive amounts,
// differences, shares, and a technical status.
import { SAFE_AMOUNT, formatPlanAmount } from './cashflowPlanLogic.js'
import { getInsurancePlan } from '../lib/progress'

export { formatPlanAmount }

// Technical limits (not recommended financial limits).
export const INS_SAFE_AMOUNT = SAFE_AMOUNT        // 1e12
export const MAX_SUPPORT_YEARS = 60

const isNum = (n) => typeof n === 'number' && Number.isFinite(n)
const overPos = (v) => !Number.isFinite(v) || v > INS_SAFE_AMOUNT || v < 0
const overSigned = (v) => !Number.isFinite(v) || Math.abs(v) > INS_SAFE_AMOUNT

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
  if (!isNum(n) || n < 0 || n > INS_SAFE_AMOUNT) return false
  return hasValidPrecision(n, currency)
}
export function isValidYears(n) {
  return isNum(n) && Number.isInteger(n) && n > 0 && n <= MAX_SUPPORT_YEARS
}

// Sign of a protection difference -> neutral amount-language bucket.
//   'uncovered' (resources below responsibilities)
//   'none'      (equal)
//   'beyond'    (resources above responsibilities)
export function amountBucket(diff) {
  if (diff < 0) return 'uncovered'
  if (diff > 0) return 'beyond'
  return 'none'
}

// Core comparison. Consumes ONLY the seven planning inputs (+ currency).
//   status: 'invalid' | 'noResponsibilities' | 'beyondLimit' | 'ok'
export function computeInsurance({ monthlySupport, years, oneTime, currentCoverage, otherResources, exploredCoverage, currency }) {
  if (![monthlySupport, years, oneTime, currentCoverage, otherResources, exploredCoverage].every(isNum)) return { status: 'invalid' }
  if (!isValidMoney(monthlySupport, currency)) return { status: 'invalid' }
  if (!isValidMoney(oneTime, currency)) return { status: 'invalid' }
  if (!isValidMoney(currentCoverage, currency)) return { status: 'invalid' }
  if (!isValidMoney(otherResources, currency)) return { status: 'invalid' }
  if (!isValidMoney(exploredCoverage, currency)) return { status: 'invalid' }
  if (!isValidYears(years)) return { status: 'invalid' }

  const responsibilities = roundMoney(monthlySupport * 12 * years + oneTime, currency)
  const currentResources = roundMoney(currentCoverage + otherResources, currency)
  const exploredResources = roundMoney(exploredCoverage + otherResources, currency)
  if ([responsibilities, currentResources, exploredResources].some(overPos)) return { status: 'beyondLimit' }

  // Total entered responsibilities = 0 -> no comparison, no ratio, no adoption.
  if (responsibilities === 0) return { status: 'noResponsibilities' }

  const currentDiff = roundMoney(currentResources - responsibilities, currency)
  const exploredDiff = roundMoney(exploredResources - responsibilities, currency)
  const coverageDiff = roundMoney(exploredCoverage - currentCoverage, currency)
  // Corrected: the change in the amount NOT covered, floored at zero per path.
  // (The legacy RC6.3 formula exploredDiff − currentDiff always equalled
  // coverageDiff, which is not the change in the uncovered amount.)
  const currentUncovered = roundMoney(Math.max(responsibilities - currentResources, 0), currency)
  const exploredUncovered = roundMoney(Math.max(responsibilities - exploredResources, 0), currency)
  const uncoveredChange = roundMoney(exploredUncovered - currentUncovered, currency)
  if ([currentDiff, exploredDiff, uncoveredChange, coverageDiff].some(overSigned)) return { status: 'beyondLimit' }

  const currentShare = roundPercent((currentResources / responsibilities) * 100)
  const exploredShare = roundPercent((exploredResources / responsibilities) * 100)
  const sharePtsChange = roundPercent(exploredShare - currentShare)

  return {
    status: 'ok',
    responsibilities, currentResources, exploredResources,
    currentDiff, exploredDiff, coverageDiff,
    currentUncovered, exploredUncovered, uncoveredChange,
    currentBucket: amountBucket(currentDiff), exploredBucket: amountBucket(exploredDiff),
    currentShare, exploredShare, sharePtsChange,
  }
}

// Legacy RC6.3 (schemaVersion 1) uncovered-change arithmetic, kept ONLY to
// validate that an old stored plan is internally consistent before we normalize
// it to the corrected value. Not used for display.
function legacyUncoveredChange(r, currency) {
  return roundMoney(r.exploredDiff - r.currentDiff, currency)
}

// Adoption: valid, responsibilities above zero, within technical bounds. Planning-
// only, so defining and confirming the plan is meaningful even when current and
// explored coverage are equal (first intentional definition).
export function canAdoptInsurance(args) {
  return computeInsurance(args).status === 'ok'
}

// True when entered values match an already-stored plan on every field at
// accepted precision. Used to block an exact-duplicate replacement; the first
// plan is still adoptable even when current and explored coverage are equal.
export function sameStoredInsurance(nums, stored) {
  if (!stored || !nums) return false
  const cur = nums.currency
  if (stored.currency !== cur) return false
  const rm = (v) => roundMoney(v, cur)
  return (
    rm(nums.monthlySupport) === rm(stored.monthlySupport) &&
    nums.years === stored.years &&
    rm(nums.oneTime) === rm(stored.oneTime) &&
    rm(nums.currentCoverage) === rm(stored.currentCoverage) &&
    rm(nums.otherResources) === rm(stored.otherResources) &&
    rm(nums.exploredCoverage) === rm(stored.exploredCoverage)
  )
}

const SCHEMA = 2

export function buildInsurancePlan({ currency, monthlySupport, years, oneTime, currentCoverage, otherResources, exploredCoverage }) {
  const rm = (v) => roundMoney(v, currency)
  const ms = rm(monthlySupport), ot = rm(oneTime), cc = rm(currentCoverage), or = rm(otherResources), ec = rm(exploredCoverage)
  const r = computeInsurance({ monthlySupport: ms, years, oneTime: ot, currentCoverage: cc, otherResources: or, exploredCoverage: ec, currency })
  return {
    moduleId: 'insurance', schemaVersion: SCHEMA, source: 'planning', currency,
    monthlySupport: ms, years, oneTime: ot, currentCoverage: cc, otherResources: or, exploredCoverage: ec,
    est: {
      responsibilities: r.responsibilities, currentResources: r.currentResources, exploredResources: r.exploredResources,
      currentDiff: r.currentDiff, exploredDiff: r.exploredDiff, coverageDiff: r.coverageDiff,
      currentUncovered: r.currentUncovered, exploredUncovered: r.exploredUncovered, uncoveredChange: r.uncoveredChange,
      currentShare: r.currentShare, exploredShare: r.exploredShare, sharePtsChange: r.sharePtsChange,
    },
    updatedAt: Date.now(),
  }
}

// Structural + arithmetic validation with an explicit schema-migration boundary.
// - schemaVersion 2: validates the corrected uncoveredChange (and per-path
//   uncovered amounts).
// - schemaVersion 1 (legacy RC6.3): accepted ONLY when its stored legacy
//   uncoveredChange (exploredDiff − currentDiff) is internally valid; every
//   other field is validated normally. The returned in-memory plan is then
//   normalized to the CORRECTED uncoveredChange for Review, My Plans, Roadmap.
// Rejects malformed shapes, numeric strings, bad currency/source, non-integer/
// out-of-range years, wrong precision, overflow, and inconsistent estimates.
export function validateStoredInsurancePlan(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  if (raw.moduleId !== 'insurance') return null
  if (raw.schemaVersion !== 1 && raw.schemaVersion !== 2) return null
  if (raw.source !== 'planning') return null
  if (raw.currency !== 'usd' && raw.currency !== 'krw') return null
  const currency = raw.currency
  const { monthlySupport, years, oneTime, currentCoverage, otherResources, exploredCoverage } = raw
  for (const v of [monthlySupport, years, oneTime, currentCoverage, otherResources, exploredCoverage]) {
    if (typeof v !== 'number' || !Number.isFinite(v)) return null // rejects numeric strings, null
  }
  if (!isValidMoney(monthlySupport, currency)) return null
  if (!isValidMoney(oneTime, currency)) return null
  if (!isValidMoney(currentCoverage, currency)) return null
  if (!isValidMoney(otherResources, currency)) return null
  if (!isValidMoney(exploredCoverage, currency)) return null
  if (!isValidYears(years)) return null
  const r = computeInsurance({ monthlySupport, years, oneTime, currentCoverage, otherResources, exploredCoverage, currency })
  if (r.status !== 'ok') return null // a stored plan must have responsibilities > 0 and be in-bounds
  const e = raw.est
  if (!e || typeof e !== 'object' || Array.isArray(e)) return null
  const rm = (v) => roundMoney(v, currency)
  const baseKeys = ['responsibilities', 'currentResources', 'exploredResources', 'currentDiff', 'exploredDiff', 'coverageDiff']
  for (const k of baseKeys) { if (typeof e[k] !== 'number' || rm(e[k]) !== r[k]) return null }
  const rp = (v) => roundPercent(v)
  if (rp(e.currentShare) !== r.currentShare || rp(e.exploredShare) !== r.exploredShare || rp(e.sharePtsChange) !== r.sharePtsChange) return null
  // Schema-specific uncovered-change arithmetic.
  if (raw.schemaVersion === 2) {
    if (typeof e.uncoveredChange !== 'number' || rm(e.uncoveredChange) !== r.uncoveredChange) return null
    if (typeof e.currentUncovered !== 'number' || rm(e.currentUncovered) !== r.currentUncovered) return null
    if (typeof e.exploredUncovered !== 'number' || rm(e.exploredUncovered) !== r.exploredUncovered) return null
  } else {
    // schemaVersion 1 — legacy arithmetic must be internally consistent.
    if (typeof e.uncoveredChange !== 'number' || rm(e.uncoveredChange) !== legacyUncoveredChange(r, currency)) return null
  }
  if (typeof raw.updatedAt !== 'number' || !Number.isInteger(raw.updatedAt) || raw.updatedAt <= 0) return null
  return {
    moduleId: 'insurance', schemaVersion: raw.schemaVersion, source: 'planning', currency,
    monthlySupport: rm(monthlySupport), years, oneTime: rm(oneTime),
    currentCoverage: rm(currentCoverage), otherResources: rm(otherResources), exploredCoverage: rm(exploredCoverage),
    est: {
      responsibilities: r.responsibilities, currentResources: r.currentResources, exploredResources: r.exploredResources,
      currentDiff: r.currentDiff, exploredDiff: r.exploredDiff, coverageDiff: r.coverageDiff,
      // Normalized to the CORRECTED uncovered change regardless of stored schema.
      currentUncovered: r.currentUncovered, exploredUncovered: r.exploredUncovered, uncoveredChange: r.uncoveredChange,
      currentShare: r.currentShare, exploredShare: r.exploredShare, sharePtsChange: r.sharePtsChange,
    },
    current: { resources: r.currentResources, diff: r.currentDiff, bucket: r.currentBucket, share: r.currentShare, uncovered: r.currentUncovered },
    explored: { resources: r.exploredResources, diff: r.exploredDiff, bucket: r.exploredBucket, share: r.exploredShare, uncovered: r.exploredUncovered },
    coverageDiff: r.coverageDiff, uncoveredChange: r.uncoveredChange, sharePtsChange: r.sharePtsChange,
    updatedAt: raw.updatedAt,
  }
}

export function loadValidatedInsurancePlan() { return validateStoredInsurancePlan(getInsurancePlan()) }
