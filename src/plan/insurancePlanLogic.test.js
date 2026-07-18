import { describe, it, expect, beforeEach } from 'vitest'
import {
  computeInsurance, canAdoptInsurance, sameStoredInsurance, buildInsurancePlan, validateStoredInsurancePlan,
  amountBucket, isValidYears, MAX_SUPPORT_YEARS, INS_SAFE_AMOUNT,
} from './insurancePlanLogic.js'

beforeEach(() => globalThis.localStorage.clear())

// monthly 3000 × 12 × 20 = 720000 + oneTime 50000 = 770000 responsibilities
const base = { monthlySupport: 3000, years: 20, oneTime: 50000, currentCoverage: 200000, otherResources: 100000, exploredCoverage: 500000, currency: 'usd' }

describe('computeInsurance — core arithmetic', () => {
  it('responsibilities = monthly×12×years + one-time', () => {
    const r = computeInsurance(base)
    expect(r.status).toBe('ok')
    expect(r.responsibilities).toBe(770000)
  })
  it('current/explored resources = coverage + other resources', () => {
    const r = computeInsurance(base)
    expect(r.currentResources).toBe(300000)   // 200000 + 100000
    expect(r.exploredResources).toBe(600000)  // 500000 + 100000
  })
  it('differences = resources − responsibilities', () => {
    const r = computeInsurance(base)
    expect(r.currentDiff).toBe(300000 - 770000)   // -470000 (uncovered)
    expect(r.exploredDiff).toBe(600000 - 770000)  // -170000 (uncovered)
    expect(r.uncoveredChange).toBe(-300000) // corrected: uncovered drops 470000 -> 170000
    expect(r.coverageDiff).toBe(300000) // 500000 - 200000 (separate line)
  })
  it('descriptive shares = resources ÷ responsibilities × 100 (one decimal, may exceed 100)', () => {
    const r = computeInsurance(base)
    expect(r.currentShare).toBeCloseTo(38.96, 1)
    expect(r.exploredShare).toBeCloseTo(77.92, 1)
    const over = computeInsurance({ ...base, exploredCoverage: 900000 }) // 1000000/770000 = 129.9%
    expect(over.exploredShare).toBeGreaterThan(100)
  })
  it('buckets: below / equal / above responsibilities', () => {
    expect(amountBucket(-1)).toBe('uncovered')
    expect(amountBucket(0)).toBe('none')
    expect(amountBucket(1)).toBe('beyond')
    const eq = computeInsurance({ ...base, oneTime: 0, monthlySupport: 0, currentCoverage: 100000, otherResources: 0, exploredCoverage: 100000, years: 10 })
    expect(eq.status).toBe('noResponsibilities') // monthly 0 + oneTime 0 -> 0 responsibilities
  })
})

describe('computeInsurance — states', () => {
  it('monthly support = 0 with one-time > 0 is normal', () => {
    const r = computeInsurance({ ...base, monthlySupport: 0 })
    expect(r.status).toBe('ok'); expect(r.responsibilities).toBe(50000)
  })
  it('one-time = 0 with monthly×years > 0 is normal', () => {
    const r = computeInsurance({ ...base, oneTime: 0 })
    expect(r.status).toBe('ok'); expect(r.responsibilities).toBe(720000)
  })
  it('total responsibilities = 0 -> noResponsibilities (no comparison/ratio/adopt)', () => {
    const r = computeInsurance({ ...base, monthlySupport: 0, oneTime: 0 })
    expect(r.status).toBe('noResponsibilities')
    expect(r.currentShare).toBeUndefined()
    expect(canAdoptInsurance({ ...base, monthlySupport: 0, oneTime: 0 })).toBe(false)
  })
  it('current coverage = 0, other resources = 0, explored coverage = 0 all allowed', () => {
    expect(computeInsurance({ ...base, currentCoverage: 0 }).status).toBe('ok')
    expect(computeInsurance({ ...base, otherResources: 0 }).status).toBe('ok')
    expect(computeInsurance({ ...base, exploredCoverage: 0 }).status).toBe('ok')
  })
  it('resources below / equal / above responsibilities', () => {
    expect(computeInsurance({ ...base, currentCoverage: 0, otherResources: 0 }).currentBucket).toBe('uncovered')
    const eq = computeInsurance({ ...base, currentCoverage: 670000 }) // 670000+100000=770000
    expect(eq.currentBucket).toBe('none'); expect(eq.currentDiff).toBe(0)
    expect(computeInsurance({ ...base, currentCoverage: 900000 }).currentBucket).toBe('beyond')
  })
})

describe('computeInsurance — technical bounds', () => {
  it('years 0 invalid; 1 and 60 valid; 61 invalid; non-integer invalid', () => {
    expect(computeInsurance({ ...base, years: 0 }).status).toBe('invalid')
    expect(computeInsurance({ ...base, years: 1 }).status).toBe('ok')
    expect(computeInsurance({ ...base, years: MAX_SUPPORT_YEARS }).status).toBe('ok')
    expect(computeInsurance({ ...base, years: 61 }).status).toBe('invalid')
    expect(isValidYears(20.5)).toBe(false)
  })
  it('negative / non-finite / precision-violating money invalid', () => {
    expect(computeInsurance({ ...base, monthlySupport: -1 }).status).toBe('invalid')
    expect(computeInsurance({ ...base, currentCoverage: NaN }).status).toBe('invalid')
    expect(computeInsurance({ ...base, oneTime: 100.555 }).status).toBe('invalid')
  })
  it('responsibility overflow -> beyondLimit', () => {
    expect(computeInsurance({ ...base, monthlySupport: 9e11, years: 60, oneTime: 0 }).status).toBe('beyondLimit')
  })
  it('resource overflow -> beyondLimit', () => {
    expect(computeInsurance({ ...base, exploredCoverage: 9e11, otherResources: 9e11 }).status).toBe('beyondLimit')
  })
})

describe('precision + rounding', () => {
  it('USD two-decimal precision; symmetric percentage rounding', () => {
    const r = computeInsurance({ ...base, monthlySupport: 3000.25 })
    expect(r.status).toBe('ok')
    expect(Number.isFinite(r.currentShare)).toBe(true)
  })
  it('whole KRW at every derived step', () => {
    const r = computeInsurance({ monthlySupport: 3000000, years: 20, oneTime: 50000000, currentCoverage: 200000000, otherResources: 100000000, exploredCoverage: 500000000, currency: 'krw' })
    expect(Number.isInteger(r.responsibilities)).toBe(true)
    expect(Number.isInteger(r.currentResources)).toBe(true)
    expect(Number.isInteger(r.exploredResources)).toBe(true)
  })
  it('equal current/explored coverage -> identical resources + zero coverage diff', () => {
    const r = computeInsurance({ ...base, currentCoverage: 400000, exploredCoverage: 400000 })
    expect(r.currentResources).toBe(r.exploredResources)
    expect(r.coverageDiff).toBe(0)
  })
})

describe('adoption + duplicate detection', () => {
  it('adopts when valid (including equal coverage — first definition)', () => {
    expect(canAdoptInsurance({ ...base, currentCoverage: 400000, exploredCoverage: 400000 })).toBe(true)
    expect(canAdoptInsurance({ ...base, years: 0 })).toBe(false)
  })
  it('sameStoredInsurance matches identical, differs on any field / currency', () => {
    const stored = { currency: 'usd', monthlySupport: 3000, years: 20, oneTime: 50000, currentCoverage: 200000, otherResources: 100000, exploredCoverage: 500000 }
    expect(sameStoredInsurance({ ...base }, stored)).toBe(true)
    expect(sameStoredInsurance({ ...base, exploredCoverage: 500001 }, stored)).toBe(false)
    expect(sameStoredInsurance({ ...base, years: 21 }, stored)).toBe(false)
    expect(sameStoredInsurance({ ...base, currency: 'krw' }, stored)).toBe(false)
    expect(sameStoredInsurance({ ...base }, null)).toBe(false)
  })
})

describe('build + validate', () => {
  const plan = (over = {}) => buildInsurancePlan({ ...base, ...over })
  it('build -> validate round-trips with paths + shares', () => {
    const v = validateStoredInsurancePlan(plan())
    expect(v).not.toBeNull()
    expect(v.est.responsibilities).toBe(770000)
    expect(v.current.bucket).toBe('uncovered')
    expect(v.explored.share).toBeCloseTo(77.9, 1)
  })
  it('rejects numeric strings, bad source, inconsistent est, out-of-range, null', () => {
    const bad = JSON.parse(JSON.stringify(plan())); bad.monthlySupport = '3000'
    expect(validateStoredInsurancePlan(bad)).toBeNull()
    const bad2 = JSON.parse(JSON.stringify(plan())); bad2.source = 'assessed'
    expect(validateStoredInsurancePlan(bad2)).toBeNull()
    const bad3 = JSON.parse(JSON.stringify(plan())); bad3.est.exploredResources = 1
    expect(validateStoredInsurancePlan(bad3)).toBeNull()
    expect(validateStoredInsurancePlan({ ...plan(), years: 61 })).toBeNull()
    expect(validateStoredInsurancePlan(null)).toBeNull()
  })
  it('a zero-responsibility plan cannot be a valid stored plan', () => {
    const z = buildInsurancePlan({ ...base, monthlySupport: 0, oneTime: 0 })
    expect(validateStoredInsurancePlan(z)).toBeNull()
  })
})

describe('RC6.4 — corrected uncoveredChange (change in the amount NOT covered)', () => {
  // responsibilities = 770000 throughout (base). currentResources=300000 -> uncovered 470000
  it('below → below: 470,000 uncovered → 170,000 uncovered = -300,000', () => {
    const r = computeInsurance({ ...base }) // explored 600000 -> uncovered 170000
    expect(r.currentUncovered).toBe(470000)
    expect(r.exploredUncovered).toBe(170000)
    expect(r.uncoveredChange).toBe(-300000)
  })
  it('below → beyond: 470,000 uncovered → 0 uncovered = -470,000', () => {
    const r = computeInsurance({ ...base, exploredCoverage: 800000 }) // 900000 resources > 770000 -> uncovered 0
    expect(r.currentUncovered).toBe(470000)
    expect(r.exploredUncovered).toBe(0)
    expect(r.uncoveredChange).toBe(-470000)
  })
  it('beyond → below: current beyond (0 uncovered) → explored uncovered 100,000 = +100,000', () => {
    // current 900000 res -> uncovered 0 ; explored 670000 res -> uncovered 100000
    const r = computeInsurance({ ...base, currentCoverage: 800000, exploredCoverage: 570000 })
    expect(r.currentUncovered).toBe(0)
    expect(r.exploredUncovered).toBe(100000)
    expect(r.uncoveredChange).toBe(100000)
  })
  it('both paths beyond responsibilities: unchanged at 0', () => {
    const r = computeInsurance({ ...base, currentCoverage: 800000, exploredCoverage: 900000 })
    expect(r.currentUncovered).toBe(0); expect(r.exploredUncovered).toBe(0); expect(r.uncoveredChange).toBe(0)
  })
  it('both paths equal responsibilities: unchanged at 0', () => {
    const r = computeInsurance({ ...base, currentCoverage: 670000, exploredCoverage: 670000 }) // 770000 == 770000
    expect(r.currentUncovered).toBe(0); expect(r.exploredUncovered).toBe(0); expect(r.uncoveredChange).toBe(0)
  })
  it('current and explored coverage equal: unchanged at 0 (even when uncovered)', () => {
    const r = computeInsurance({ ...base, currentCoverage: 300000, exploredCoverage: 300000 })
    expect(r.currentUncovered).toBe(r.exploredUncovered)
    expect(r.uncoveredChange).toBe(0)
  })
  it('uncoveredChange is NOT just the coverage difference (regression on the RC6.3 bug)', () => {
    const r = computeInsurance({ ...base }) // coverageDiff = 300000, but uncoveredChange = -300000 (sign + meaning differ)
    expect(r.coverageDiff).toBe(300000)
    expect(r.uncoveredChange).toBe(-300000)
    expect(r.uncoveredChange).not.toBe(r.coverageDiff)
  })
  it('USD cents + KRW whole rounding on uncovered amounts', () => {
    const usd = computeInsurance({ ...base, monthlySupport: 3000.25 })
    expect(Number.isFinite(usd.uncoveredChange)).toBe(true)
    const krw = computeInsurance({ monthlySupport: 3000000, years: 20, oneTime: 50000000, currentCoverage: 200000000, otherResources: 100000000, exploredCoverage: 500000000, currency: 'krw' })
    expect(Number.isInteger(krw.currentUncovered)).toBe(true)
    expect(Number.isInteger(krw.exploredUncovered)).toBe(true)
    expect(Number.isInteger(krw.uncoveredChange)).toBe(true)
  })
})

describe('RC6.4 — schema migration boundary', () => {
  const nums = { ...base }
  const legacyV1 = () => {
    // Build a valid RC6.3 v1 plan: legacy uncoveredChange = exploredDiff - currentDiff
    const p = buildInsurancePlan(nums) // v2
    const r = computeInsurance(nums)
    const legacy = { ...p, schemaVersion: 1 }
    legacy.est = { ...p.est }
    delete legacy.est.currentUncovered
    delete legacy.est.exploredUncovered
    legacy.est.uncoveredChange = r.exploredDiff - r.currentDiff // legacy formula (= coverageDiff)
    return legacy
  }
  it('new plans are schemaVersion 2 with corrected uncoveredChange', () => {
    const p = buildInsurancePlan(nums)
    expect(p.schemaVersion).toBe(2)
    expect(p.est.uncoveredChange).toBe(-300000)
    expect(p.est.currentUncovered).toBe(470000)
  })
  it('v2 validates the corrected arithmetic and round-trips', () => {
    const v = validateStoredInsurancePlan(buildInsurancePlan(nums))
    expect(v).not.toBeNull()
    expect(v.schemaVersion).toBe(2)
    expect(v.uncoveredChange).toBe(-300000)
  })
  it('a legacy v1 plan validates ONLY with its valid legacy arithmetic', () => {
    const v = validateStoredInsurancePlan(legacyV1())
    expect(v).not.toBeNull()
    expect(v.schemaVersion).toBe(1)
  })
  it('legacy v1 is normalized to the CORRECTED uncoveredChange for rendering', () => {
    const v = validateStoredInsurancePlan(legacyV1())
    expect(v.uncoveredChange).toBe(-300000)          // corrected, not the stored legacy +300000
    expect(v.est.uncoveredChange).toBe(-300000)
    expect(v.est.currentUncovered).toBe(470000)
    expect(v.explored.uncovered).toBe(170000)
  })
  it('a v1 plan carrying corrected (non-legacy) arithmetic is rejected (no arbitrary arithmetic)', () => {
    const bad = legacyV1(); bad.est.uncoveredChange = -300000 // corrected value under a v1 tag -> not legacy-consistent
    expect(validateStoredInsurancePlan(bad)).toBeNull()
  })
  it('a v2 plan carrying legacy arithmetic is rejected', () => {
    const p = buildInsurancePlan(nums); p.est.uncoveredChange = 300000 // legacy value under v2 tag
    expect(validateStoredInsurancePlan(p)).toBeNull()
  })
  it('malformed v1 and v2 plans are rejected', () => {
    const p2 = buildInsurancePlan(nums); p2.est.currentUncovered = 1
    expect(validateStoredInsurancePlan(p2)).toBeNull()
    const p1 = legacyV1(); p1.monthlySupport = '3000'
    expect(validateStoredInsurancePlan(p1)).toBeNull()
    expect(validateStoredInsurancePlan({ ...buildInsurancePlan(nums), schemaVersion: 3 })).toBeNull()
  })
  it('duplicate-replacement detection is unchanged (fields, not uncoveredChange)', () => {
    const stored = { currency: 'usd', monthlySupport: 3000, years: 20, oneTime: 50000, currentCoverage: 200000, otherResources: 100000, exploredCoverage: 500000 }
    expect(sameStoredInsurance({ ...base }, stored)).toBe(true)
    expect(sameStoredInsurance({ ...base, exploredCoverage: 500001 }, stored)).toBe(false)
  })
})
