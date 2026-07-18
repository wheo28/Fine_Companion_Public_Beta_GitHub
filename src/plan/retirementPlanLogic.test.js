import { describe, it, expect, beforeEach } from 'vitest'
import {
  computeRetirement, canAdoptRetirement, buildRetirementPlan, validateStoredRetirementPlan,
  contributionShare, sameStoredRetirement, monthlyRateOf, isValidReturn, isValidYears,
  MAX_RETIREMENT_YEARS, MIN_ANNUAL_RETURN, MAX_ANNUAL_RETURN, RET_SAFE_AMOUNT,
} from './retirementPlanLogic.js'

const CK = 'fine-companion.checkup.v1'
beforeEach(() => globalThis.localStorage.clear())

const base = { currentBalance: 10000, years: 30, currentContribution: 300, plannedContribution: 500, annualReturn: 6, currency: 'usd' }

// Reference simulation (independent of the module) for cross-checking.
function sim(balance, contribution, years, annualReturn, currency) {
  const months = years * 12
  const r = Math.pow(1 + annualReturn / 100, 1 / 12) - 1
  const f = currency === 'krw' ? 1 : 100
  const round = (v) => Math.round((v + Number.EPSILON) * f) / f
  let bal = round(balance)
  for (let m = 0; m < months; m++) bal = round(bal * (1 + r) + contribution)
  return bal
}

describe('computeRetirement — engine', () => {
  it('monthly-compounding projection matches an independent simulation', () => {
    const r = computeRetirement(base)
    expect(r.status).toBe('ok')
    expect(r.current.projected).toBeCloseTo(sim(10000, 300, 30, 6, 'usd'), 2)
    expect(r.planned.projected).toBeCloseTo(sim(10000, 500, 30, 6, 'usd'), 2)
  })
  it('total contributions = contribution × months; growth = projected − balance − contributions', () => {
    const r = computeRetirement(base)
    expect(r.current.totalContributions).toBe(300 * 360)
    expect(r.current.growth).toBeCloseTo(r.current.projected - 10000 - 300 * 360, 2)
  })
  it('both paths share balance, horizon, and return assumption', () => {
    const r = computeRetirement(base)
    expect(r.months).toBe(360)
    expect(r.contributionDiff).toBe(200)
    expect(r.balanceDiff).toBeCloseTo(r.planned.projected - r.current.projected, 2)
  })
  it('monthlyRate is the 12th root of the annual factor', () => {
    expect(monthlyRateOf(0)).toBe(0)
    expect(Math.pow(1 + monthlyRateOf(6), 12)).toBeCloseTo(1.06, 10)
  })
})

describe('computeRetirement — states', () => {
  it('balance = 0 explores normally', () => {
    expect(computeRetirement({ ...base, currentBalance: 0 }).status).toBe('ok')
  })
  it('current contribution = 0 is honest', () => {
    const r = computeRetirement({ ...base, currentContribution: 0 })
    expect(r.status).toBe('ok'); expect(r.current.totalContributions).toBe(0)
  })
  it('planned contribution = 0 is allowed', () => {
    expect(computeRetirement({ ...base, plannedContribution: 0 }).status).toBe('ok')
  })
  it('return = 0 gives a contribution-only path (no growth)', () => {
    const r = computeRetirement({ ...base, annualReturn: 0 })
    expect(r.current.growth).toBe(0)
    expect(r.current.projected).toBe(10000 + 300 * 360)
  })
  it('positive vs negative return: growth positive vs negative', () => {
    expect(computeRetirement({ ...base, annualReturn: 6 }).current.growth).toBeGreaterThan(0)
    expect(computeRetirement({ ...base, annualReturn: -10 }).current.growth).toBeLessThan(0)
  })
  it('return = -50% and +50% are valid bounds; outside is invalid', () => {
    expect(computeRetirement({ ...base, annualReturn: MIN_ANNUAL_RETURN }).status).toBe('ok')
    expect(computeRetirement({ ...base, annualReturn: MAX_ANNUAL_RETURN, years: 5 }).status).toBe('ok')
    expect(computeRetirement({ ...base, annualReturn: -50.1 }).status).toBe('invalid')
    expect(computeRetirement({ ...base, annualReturn: 50.1 }).status).toBe('invalid')
  })
  it('a bounded negative assumption keeps the monthly rate finite', () => {
    expect(Number.isFinite(monthlyRateOf(-50))).toBe(true)
  })
})

describe('computeRetirement — technical limits', () => {
  it('years = 0 is invalid; 1 and 60 valid; 61 invalid', () => {
    expect(computeRetirement({ ...base, years: 0 }).status).toBe('invalid')
    expect(computeRetirement({ ...base, years: 1 }).status).toBe('ok')
    expect(computeRetirement({ ...base, years: MAX_RETIREMENT_YEARS }).status).toBe('ok')
    expect(computeRetirement({ ...base, years: MAX_RETIREMENT_YEARS + 1 }).status).toBe('invalid')
  })
  it('non-integer years invalid', () => {
    expect(isValidYears(30.5)).toBe(false); expect(isValidYears(30)).toBe(true)
  })
  it('negative / non-finite / out-of-range money invalid', () => {
    expect(computeRetirement({ ...base, currentBalance: -1 }).status).toBe('invalid')
    expect(computeRetirement({ ...base, currentContribution: NaN }).status).toBe('invalid')
    expect(computeRetirement({ ...base, currentBalance: RET_SAFE_AMOUNT + 1 }).status).toBe('invalid')
  })
  it('derived overflow -> beyondLimit (no partial projection)', () => {
    const r = computeRetirement({ currentBalance: 9e11, years: 60, currentContribution: 9e9, plannedContribution: 1, annualReturn: 50, currency: 'usd' })
    expect(r.status).toBe('beyondLimit')
  })
})

describe('precision + deterministic rounding', () => {
  it('USD two-decimal money precision enforced', () => {
    expect(computeRetirement({ ...base, currentContribution: 300.555 }).status).toBe('invalid')
    expect(computeRetirement({ ...base, currentContribution: 300.55 }).status).toBe('ok')
  })
  it('KRW whole-unit projections at every step', () => {
    const r = computeRetirement({ currentBalance: 5000000, years: 20, currentContribution: 200000, plannedContribution: 300000, annualReturn: 5, currency: 'krw' })
    expect(Number.isInteger(r.current.projected)).toBe(true)
    expect(Number.isInteger(r.planned.growth)).toBe(true)
  })
  it('current and plan paths use the identical routine (equal contributions -> equal projections)', () => {
    const r = computeRetirement({ ...base, currentContribution: 400, plannedContribution: 400 })
    expect(r.current.projected).toBe(r.planned.projected)
    expect(r.balanceDiff).toBe(0)
  })
})

describe('adoption + income ratio', () => {
  it('adopts when valid (including equal contributions — first definition)', () => {
    expect(canAdoptRetirement({ ...base, currentContribution: 400, plannedContribution: 400 })).toBe(true)
    expect(canAdoptRetirement({ ...base, years: 0 })).toBe(false)
  })
  it('contribution share only when income known, positive, same currency', () => {
    globalThis.localStorage.setItem(CK, JSON.stringify({ answers: { income: 5000, currency: 'usd' }, ts: 1 }))
    const s = contributionShare({ currentContribution: 300, plannedContribution: 500, currency: 'usd' })
    expect(s).toEqual({ current: 6, planned: 10, changePts: 4 })
  })
  it('ratio omitted for missing / zero / currency-mismatch income', () => {
    expect(contributionShare({ currentContribution: 300, plannedContribution: 500, currency: 'usd' })).toBeNull()
    globalThis.localStorage.setItem(CK, JSON.stringify({ answers: { income: 0, currency: 'usd' }, ts: 1 }))
    expect(contributionShare({ currentContribution: 300, plannedContribution: 500, currency: 'usd' })).toBeNull()
    globalThis.localStorage.setItem(CK, JSON.stringify({ answers: { income: 5000, currency: 'krw' }, ts: 1 }))
    expect(contributionShare({ currentContribution: 300, plannedContribution: 500, currency: 'usd' })).toBeNull()
  })
})

describe('build + validate', () => {
  const plan = (over = {}) => buildRetirementPlan({ ...base, ...over })
  it('build -> validate round-trips', () => {
    const v = validateStoredRetirementPlan(plan())
    expect(v).not.toBeNull()
    expect(v.est.curProjected).toBeGreaterThan(0)
    expect(v.balanceDiff).toBeCloseTo(v.planned.projected - v.current.projected, 2)
  })
  it('rejects numeric-string fields, inconsistent est, out-of-range, null', () => {
    const bad = JSON.parse(JSON.stringify(plan())); bad.currentBalance = '10000'
    expect(validateStoredRetirementPlan(bad)).toBeNull()
    const bad2 = JSON.parse(JSON.stringify(plan())); bad2.est.planProjected = 123
    expect(validateStoredRetirementPlan(bad2)).toBeNull()
    expect(validateStoredRetirementPlan({ ...plan(), years: 61 })).toBeNull()
    expect(validateStoredRetirementPlan({ ...plan(), annualReturn: 99 })).toBeNull()
    expect(validateStoredRetirementPlan(null)).toBeNull()
  })
})

describe('RC6.2 — identical-plan detection (logic)', () => {
  const stored = { currency: 'usd', currentBalance: 10000, years: 30, currentContribution: 300, plannedContribution: 500, annualReturn: 6 }
  it('matches when every field is unchanged at precision', () => {
    expect(sameStoredRetirement({ ...base }, stored)).toBe(true)
  })
  it('differs when any single field changes', () => {
    expect(sameStoredRetirement({ ...base, plannedContribution: 501 }, stored)).toBe(false)
    expect(sameStoredRetirement({ ...base, years: 31 }, stored)).toBe(false)
    expect(sameStoredRetirement({ ...base, annualReturn: 6.5 }, stored)).toBe(false)
    expect(sameStoredRetirement({ ...base, currentBalance: 10000.01 }, stored)).toBe(false)
  })
  it('differs on currency mismatch', () => {
    expect(sameStoredRetirement({ ...base, currency: 'krw' }, stored)).toBe(false)
  })
  it('null stored -> not identical (first plan adoptable)', () => {
    expect(sameStoredRetirement({ ...base }, null)).toBe(false)
  })
})

describe('RC6.6 — optional assumptions: default equivalence', () => {
  it('all optional inactive -> identical to the required-only result', () => {
    const off = computeRetirement({ ...base })
    const withOff = computeRetirement({ ...base, employerContributionEnabled: false, contributionChangeEnabled: false, inflationEnabled: false })
    expect(withOff.current.projected).toBe(off.current.projected)
    expect(withOff.planned.projected).toBe(off.planned.projected)
    expect(withOff.current.totalContributions).toBe(off.current.totalContributions)
    expect(withOff.employerActive).toBe(false)
  })
  it('enabled-with-zero employer / 0% change behave like the simple path (no drift)', () => {
    const off = computeRetirement({ ...base })
    const empZero = computeRetirement({ ...base, employerContributionEnabled: true, employerMonthlyContribution: 0 })
    const chgZero = computeRetirement({ ...base, contributionChangeEnabled: true, annualContributionChange: 0 })
    expect(empZero.planned.projected).toBe(off.planned.projected)
    expect(empZero.employerActive).toBe(false)
    expect(chgZero.planned.projected).toBe(off.planned.projected)
    expect(chgZero.changeActive).toBe(false)
  })
})

describe('RC6.6 — employer contribution', () => {
  it('same employer amount in both paths; included in totals, excluded from growth', () => {
    const r = computeRetirement({ ...base, employerContributionEnabled: true, employerMonthlyContribution: 100 })
    expect(r.employerActive).toBe(true)
    const months = 360
    expect(r.current.totalEmployer).toBe(100 * months)
    expect(r.planned.totalEmployer).toBe(100 * months)
    // total future contributions = personal + employer
    expect(r.planned.totalContributions).toBe(r.planned.totalPersonal + r.planned.totalEmployer)
    // growth excludes employer principal
    expect(r.planned.growth).toBe(Math.round((r.planned.projected - 10000 - r.planned.totalContributions) * 100) / 100)
    // employer does NOT vary with personal contribution
    expect(r.current.totalEmployer).toBe(r.planned.totalEmployer)
  })
  it('employer raises projected vs basic; basicDiff positive', () => {
    const r = computeRetirement({ ...base, employerContributionEnabled: true, employerMonthlyContribution: 100 })
    expect(r.planned.projected).toBeGreaterThan(r.planned.basicProjected)
    expect(r.planned.basicDiff).toBeGreaterThan(0)
  })
  it('malformed / overflow employer -> invalid or beyondLimit', () => {
    expect(computeRetirement({ ...base, employerContributionEnabled: true, employerMonthlyContribution: -5 }).status).toBe('invalid')
    expect(computeRetirement({ ...base, employerContributionEnabled: true, employerMonthlyContribution: 100.555 }).status).toBe('invalid')
    expect(computeRetirement({ ...base, employerContributionEnabled: true, employerMonthlyContribution: 9e11, years: 60 }).status).toBe('beyondLimit')
  })
})

describe('RC6.6 — annual contribution change', () => {
  it('month 12 uses start; month 13 uses first adjusted amount', () => {
    // 24 months, +10%/yr, start 100, USD: months 1-12 = 100, months 13-24 = 110
    const r = computeRetirement({ ...base, years: 2, currentContribution: 100, plannedContribution: 100, contributionChangeEnabled: true, annualContributionChange: 10 })
    // total personal = 100*12 + 110*12 = 1200 + 1320 = 2520
    expect(r.planned.totalPersonal).toBe(2520)
    expect(r.planned.finalPersonalContribution).toBe(110)
  })
  it('current and planned share the rate but keep their own starting amounts', () => {
    const r = computeRetirement({ ...base, years: 2, currentContribution: 100, plannedContribution: 200, contributionChangeEnabled: true, annualContributionChange: 10 })
    expect(r.current.finalPersonalContribution).toBe(110)
    expect(r.planned.finalPersonalContribution).toBe(220)
  })
  it('range: -50 and 50 ok; beyond invalid; negative reduces contributions', () => {
    expect(computeRetirement({ ...base, contributionChangeEnabled: true, annualContributionChange: -50 }).status).toBe('ok')
    expect(computeRetirement({ ...base, contributionChangeEnabled: true, annualContributionChange: 50 }).status).toBe('ok')
    expect(computeRetirement({ ...base, contributionChangeEnabled: true, annualContributionChange: 51 }).status).toBe('invalid')
    const neg = computeRetirement({ ...base, years: 2, currentContribution: 100, plannedContribution: 100, contributionChangeEnabled: true, annualContributionChange: -50 })
    expect(neg.planned.finalPersonalContribution).toBe(50)
  })
  it('KRW annual-boundary rounds the stepped contribution to whole won', () => {
    const r = computeRetirement({ currentBalance: 0, years: 2, currentContribution: 333333, plannedContribution: 333333, annualReturn: 0, currency: 'krw', contributionChangeEnabled: true, annualContributionChange: 3.5 })
    expect(Number.isInteger(r.planned.finalPersonalContribution)).toBe(true)
    expect(r.planned.finalPersonalContribution).toBe(Math.round(333333 * 1.035))
  })
})

describe('RC6.6 — inflation / purchasing power', () => {
  it('inflation is secondary: nominal unchanged, PP < nominal for positive inflation', () => {
    const base2 = { ...base }
    const nominal = computeRetirement(base2)
    const infl = computeRetirement({ ...base2, inflationEnabled: true, annualInflation: 3 })
    expect(infl.planned.projected).toBe(nominal.planned.projected) // nominal unchanged
    expect(infl.inflationActive).toBe(true)
    expect(infl.planned.purchasingPower).toBeLessThan(infl.planned.projected)
    // both paths use the same inflation
    expect(infl.current.purchasingPower).toBeLessThan(infl.current.projected)
  })
  it('0% inflation -> PP equals nominal; negative inflation -> PP above nominal', () => {
    const z = computeRetirement({ ...base, inflationEnabled: true, annualInflation: 0 })
    expect(z.planned.purchasingPower).toBe(z.planned.projected)
    const neg = computeRetirement({ ...base, inflationEnabled: true, annualInflation: -3 })
    expect(neg.planned.purchasingPower).toBeGreaterThan(neg.planned.projected)
  })
  it('range enforced; inactive -> no PP', () => {
    expect(computeRetirement({ ...base, inflationEnabled: true, annualInflation: 51 }).status).toBe('invalid')
    const off = computeRetirement({ ...base })
    expect(off.current.purchasingPower).toBeNull()
  })
})

describe('RC6.6 — combined + basic-path difference sign', () => {
  it('all three active compute; basicDiff can be negative with a negative change', () => {
    const all = computeRetirement({ ...base, years: 3, currentContribution: 100, plannedContribution: 100, employerContributionEnabled: true, employerMonthlyContribution: 50, contributionChangeEnabled: true, annualContributionChange: 5, inflationEnabled: true, annualInflation: 2 })
    expect(all.status).toBe('ok')
    expect(all.planned.basicDiff).toBeGreaterThan(0) // employer + positive change lift above basic
    const down = computeRetirement({ ...base, years: 3, currentContribution: 300, plannedContribution: 300, contributionChangeEnabled: true, annualContributionChange: -40 })
    expect(down.planned.basicDiff).toBeLessThan(0)
  })
})

describe('RC6.6 — duplicate detection with optional flags', () => {
  const stored = { currency: 'usd', currentBalance: 10000, years: 30, currentContribution: 300, plannedContribution: 500, annualReturn: 6, employerContributionEnabled: true, employerMonthlyContribution: 100, contributionChangeEnabled: false, annualContributionChange: 0, inflationEnabled: false, annualInflation: 0 }
  it('identical incl optional flags -> duplicate; any flag/value change -> not', () => {
    expect(sameStoredRetirement({ ...base, employerContributionEnabled: true, employerMonthlyContribution: 100 }, stored)).toBe(true)
    expect(sameStoredRetirement({ ...base, employerContributionEnabled: true, employerMonthlyContribution: 150 }, stored)).toBe(false)
    expect(sameStoredRetirement({ ...base, employerContributionEnabled: false }, stored)).toBe(false)
    expect(sameStoredRetirement({ ...base, employerContributionEnabled: true, employerMonthlyContribution: 100, inflationEnabled: true, annualInflation: 2 }, stored)).toBe(false)
  })
})

describe('RC6.6 — schema migration + storage', () => {
  const v1Plan = () => {
    const r = computeRetirement({ ...base })
    return {
      moduleId: 'retirement', schemaVersion: 1, currency: 'usd',
      currentBalance: 10000, years: 30, currentContribution: 300, plannedContribution: 500, annualReturn: 6,
      est: {
        curProjected: r.current.projected, curTotalContrib: r.current.totalContributions, curGrowth: r.current.growth,
        planProjected: r.planned.projected, planTotalContrib: r.planned.totalContributions, planGrowth: r.planned.growth,
      },
      updatedAt: 111,
    }
  }
  it('valid v1 validates and normalizes to all optional inactive', () => {
    const v = validateStoredRetirementPlan(v1Plan())
    expect(v).not.toBeNull()
    expect(v.schemaVersion).toBe(1)
    expect(v.employerContributionEnabled).toBe(false)
    expect(v.contributionChangeEnabled).toBe(false)
    expect(v.inflationEnabled).toBe(false)
    expect(v.current.totalEmployer).toBe(0)
    expect(v.current.basicDiff).toBe(0)
    expect(v.current.purchasingPower).toBeNull()
  })
  it('v1 carrying optional fields is rejected', () => {
    const bad = { ...v1Plan(), employerContributionEnabled: true, employerMonthlyContribution: 100 }
    expect(validateStoredRetirementPlan(bad)).toBeNull()
  })
  it('build -> v2; round-trips with active assumptions', () => {
    const p = buildRetirementPlan({ ...base, employerContributionEnabled: true, employerMonthlyContribution: 100, inflationEnabled: true, annualInflation: 3 })
    expect(p.schemaVersion).toBe(2)
    const v = validateStoredRetirementPlan(p)
    expect(v).not.toBeNull()
    expect(v.employerActive).toBe(true)
    expect(v.inflationActive).toBe(true)
    expect(v.planned.purchasingPower).toBeGreaterThan(0)
  })
  it('v2 rejects: disabled-with-nonzero, out-of-range, inconsistent totals/growth/basic/PP, numeric strings', () => {
    const p = buildRetirementPlan({ ...base, employerContributionEnabled: true, employerMonthlyContribution: 100, inflationEnabled: true, annualInflation: 3 })
    const a = JSON.parse(JSON.stringify(p)); a.employerContributionEnabled = false // now nonzero while disabled
    expect(validateStoredRetirementPlan(a)).toBeNull()
    const b = JSON.parse(JSON.stringify(p)); b.annualInflation = 99
    expect(validateStoredRetirementPlan(b)).toBeNull()
    const c = JSON.parse(JSON.stringify(p)); c.est.planTotalEmployer = 1
    expect(validateStoredRetirementPlan(c)).toBeNull()
    const d = JSON.parse(JSON.stringify(p)); d.est.planGrowth = d.est.planGrowth + 1
    expect(validateStoredRetirementPlan(d)).toBeNull()
    const e = JSON.parse(JSON.stringify(p)); e.est.planBasicProjected = 1
    expect(validateStoredRetirementPlan(e)).toBeNull()
    const f = JSON.parse(JSON.stringify(p)); f.est.planPurchasingPower = 1
    expect(validateStoredRetirementPlan(f)).toBeNull()
    const g = JSON.parse(JSON.stringify(p)); g.employerMonthlyContribution = '100'
    expect(validateStoredRetirementPlan(g)).toBeNull()
  })
  it('v2 with no active assumptions round-trips', () => {
    const p = buildRetirementPlan({ ...base })
    expect(p.schemaVersion).toBe(2)
    expect(validateStoredRetirementPlan(p)).not.toBeNull()
  })
})
