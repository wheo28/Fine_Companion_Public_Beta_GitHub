import { describe, it, expect, beforeEach } from 'vitest'
import {
  computeGoal, canAdoptGoal, buildGoalPlan, validateStoredGoalPlan,
  isValidMoney, isValidMonths, isValidGoalName, roundPercent, formatPercent,
  MAX_GOAL_MONTHS, GOAL_SAFE_AMOUNT, MAX_GOAL_NAME,
} from './goalPlanLogic.js'

const GK = 'fine-companion.plan.goal.v1'
beforeEach(() => globalThis.localStorage.clear())

const base = { target: 20000, setAside: 5000, months: 30, currentContribution: 300, plannedContribution: 500, currency: 'usd' }

describe('computeGoal — projections', () => {
  it('projects setAside + contribution * months for both paths', () => {
    const r = computeGoal(base)
    expect(r.status).toBe('ok')
    expect(r.current.projected).toBe(5000 + 300 * 30)   // 14000
    expect(r.planned.projected).toBe(5000 + 500 * 30)   // 20000
    expect(r.contributionDiff).toBe(200)
  })
  it('gap is target - projected (remaining vs above target)', () => {
    const r = computeGoal(base)
    expect(r.current.gap).toBe(20000 - 14000)  // +6000 remaining
    expect(r.planned.gap).toBe(0)              // exactly reaches
  })
  it('progress = projected / target * 100, one decimal, may exceed 100', () => {
    const r = computeGoal({ ...base, plannedContribution: 700 }) // planned projected 26000 -> 130%
    expect(r.current.progress).toBe(70)      // 14000/20000
    expect(r.planned.progress).toBe(130)     // 26000/20000
  })
})

describe('computeGoal — states', () => {
  it('amount already set aside = 0 plans normally', () => {
    expect(computeGoal({ ...base, setAside: 0 }).status).toBe('ok')
  })
  it('current contribution = 0 shows the current path honestly', () => {
    const r = computeGoal({ ...base, currentContribution: 0 })
    expect(r.status).toBe('ok'); expect(r.current.projected).toBe(5000)
  })
  it('planned contribution = 0 is allowed', () => {
    const r = computeGoal({ ...base, plannedContribution: 0 })
    expect(r.status).toBe('ok'); expect(r.planned.projected).toBe(5000)
  })
  it('goal already covered: setAside >= target -> ok, gap <= 0', () => {
    const r = computeGoal({ ...base, setAside: 25000, currentContribution: 0, plannedContribution: 0 })
    expect(r.status).toBe('ok'); expect(r.current.gap).toBeLessThan(0) // above target
  })
  it('same current and planned contribution is a valid ok comparison', () => {
    const r = computeGoal({ ...base, currentContribution: 400, plannedContribution: 400 })
    expect(r.status).toBe('ok'); expect(r.contributionDiff).toBe(0)
  })
})

describe('computeGoal — technical limits', () => {
  it('target amount = 0 is invalid (no divide by zero)', () => {
    expect(computeGoal({ ...base, target: 0 }).status).toBe('invalid')
  })
  it('months = 0 is invalid', () => {
    expect(computeGoal({ ...base, months: 0 }).status).toBe('invalid')
  })
  it('one month and 600 months are valid; 601 is invalid', () => {
    expect(computeGoal({ ...base, months: 1 }).status).toBe('ok')
    expect(computeGoal({ ...base, months: MAX_GOAL_MONTHS }).status).toBe('ok')
    expect(computeGoal({ ...base, months: MAX_GOAL_MONTHS + 1 }).status).toBe('invalid')
  })
  it('negative / non-finite / out-of-range inputs are invalid', () => {
    expect(computeGoal({ ...base, setAside: -1 }).status).toBe('invalid')
    expect(computeGoal({ ...base, currentContribution: NaN }).status).toBe('invalid')
    expect(computeGoal({ ...base, target: GOAL_SAFE_AMOUNT + 1 }).status).toBe('invalid')
  })
  it('derived projection beyond the safety bound -> beyondLimit', () => {
    // target within bound, but setAside + contribution*months overflows
    const r = computeGoal({ target: 1000, setAside: 9e11, months: 600, currentContribution: 9e11, plannedContribution: 1, currency: 'usd' })
    expect(r.status).toBe('beyondLimit')
  })
  it('non-integer months invalid', () => {
    expect(isValidMonths(30.5)).toBe(false); expect(isValidMonths(30)).toBe(true)
  })
})

describe('precision + percent rounding', () => {
  it('USD two-decimal / KRW whole precision', () => {
    expect(isValidMoney(100.55, 'usd')).toBe(true)
    expect(isValidMoney(100.555, 'usd')).toBe(false)
    expect(isValidMoney(100, 'krw')).toBe(true)
    expect(isValidMoney(100.5, 'krw')).toBe(false)
  })
  it('KRW whole-unit projections', () => {
    const r = computeGoal({ target: 30000000, setAside: 5000000, months: 20, currentContribution: 1000000, plannedContribution: 1250000, currency: 'krw' })
    expect(Number.isInteger(r.current.projected)).toBe(true)
    expect(Number.isInteger(r.planned.gap)).toBe(true)
  })
  it('symmetric one-decimal percentage rounding', () => {
    expect(roundPercent(70.049999)).toBe(70)
    expect(roundPercent(70.05)).toBe(70.1)
    expect(formatPercent(100)).toBe('100.0%')
  })
})

describe('adoption', () => {
  it('adopts even when current == planned contribution (unlike Cash Flow)', () => {
    expect(canAdoptGoal({ goalType: 'education', goalName: '', ...base, currentContribution: 400, plannedContribution: 400 })).toBe(true)
  })
  it('education needs no name; custom needs a non-blank, length-safe name', () => {
    expect(isValidGoalName('education', '')).toBe(true)
    expect(isValidGoalName('custom', '   ')).toBe(false)
    expect(isValidGoalName('custom', 'New car')).toBe(true)
    expect(isValidGoalName('custom', 'x'.repeat(MAX_GOAL_NAME + 1))).toBe(false)
  })
  it('a custom goal without a name is not adoptable', () => {
    expect(canAdoptGoal({ goalType: 'custom', goalName: '', ...base })).toBe(false)
  })
  it('an invalid (overflow/zero-target) plan is not adoptable', () => {
    expect(canAdoptGoal({ goalType: 'education', goalName: '', ...base, target: 0 })).toBe(false)
  })
})

describe('build + validate', () => {
  const plan = (over = {}) => buildGoalPlan({ goalType: 'education', goalName: '', ...base, ...over })
  it('build -> validate round-trips (education)', () => {
    const v = validateStoredGoalPlan(plan())
    expect(v).not.toBeNull()
    expect(v.est.curProjected).toBe(14000); expect(v.est.planProjected).toBe(20000)
    expect(v.current.progress).toBe(70)
  })
  it('build -> validate round-trips (custom with name)', () => {
    const p = buildGoalPlan({ goalType: 'custom', goalName: '  New car  ', ...base })
    const v = validateStoredGoalPlan(p)
    expect(v).not.toBeNull(); expect(v.goalName).toBe('New car'); expect(v.goalType).toBe('custom')
  })
  it('rejects numeric-string fields', () => {
    const bad = JSON.parse(JSON.stringify(plan())); bad.target = '20000'
    expect(validateStoredGoalPlan(bad)).toBeNull()
  })
  it('rejects inconsistent stored estimates', () => {
    const bad = JSON.parse(JSON.stringify(plan())); bad.est.planProjected = 99999
    expect(validateStoredGoalPlan(bad)).toBeNull()
  })
  it('rejects blank custom name, bad type, non-integer months, target 0, and null', () => {
    expect(validateStoredGoalPlan({ ...plan(), goalType: 'custom', goalName: '   ' })).toBeNull()
    expect(validateStoredGoalPlan({ ...plan(), goalType: 'x' })).toBeNull()
    expect(validateStoredGoalPlan({ ...plan(), months: 30.5 })).toBeNull()
    expect(validateStoredGoalPlan({ ...plan(), target: 0 })).toBeNull()
    expect(validateStoredGoalPlan(null)).toBeNull()
  })
})

describe('RC6.5 — optional annual return', () => {
  const roundMoney = (v, cur) => {
    const f = cur === 'krw' ? 1 : 100
    const r = (Math.sign(v) * Math.round((Math.abs(v) + Number.EPSILON) * f)) / f
    return Object.is(r, -0) ? 0 : r
  }
  // Independent reimplementation of the monthly-compounding loop for cross-check.
  const refProject = (setAside, contribution, months, annualReturn, cur) => {
    const mr = Math.pow(1 + annualReturn / 100, 1 / 12) - 1
    let bal = roundMoney(setAside, cur)
    for (let m = 0; m < months; m++) {
      bal = roundMoney(bal * (1 + mr), cur)
      bal = roundMoney(bal + contribution, cur)
    }
    return bal
  }

  it('disabled -> byte-equivalent to RC6.4 (no drift)', () => {
    const off = computeGoal({ ...base })
    const on0 = computeGoal({ ...base, returnAssumptionEnabled: true, annualReturn: 0 })
    expect(on0.current.projected).toBe(off.current.projected)
    expect(on0.planned.projected).toBe(off.planned.projected)
    expect(on0.returnActive).toBe(false)
    // both equal the closed-form no-return value
    expect(off.planned.projected).toBe(5000 + 500 * 30)
  })
  it('enabled 0% is treated as inactive and matches the simple estimate', () => {
    const r = computeGoal({ ...base, returnAssumptionEnabled: true, annualReturn: 0 })
    expect(r.current.estDiff).toBe(0)
    expect(r.planned.estDiff).toBe(0)
    expect(r.planned.noReturn).toBe(r.planned.projected)
  })
  it('positive return: projected above 0% path, estimated difference positive', () => {
    const r = computeGoal({ ...base, returnAssumptionEnabled: true, annualReturn: 6 })
    expect(r.returnActive).toBe(true)
    expect(r.planned.projected).toBeGreaterThan(r.planned.noReturn)
    expect(r.planned.estDiff).toBeGreaterThan(0)
    expect(r.planned.estDiff).toBe(roundMoney(r.planned.projected - r.planned.noReturn, 'usd'))
    expect(r.planned.projected).toBe(refProject(5000, 500, 30, 6, 'usd'))
  })
  it('negative return: projected below 0% path, estimated difference negative', () => {
    const r = computeGoal({ ...base, returnAssumptionEnabled: true, annualReturn: -3.5 })
    expect(r.planned.projected).toBeLessThan(r.planned.noReturn)
    expect(r.planned.estDiff).toBeLessThan(0)
    expect(r.planned.projected).toBe(refProject(5000, 500, 30, -3.5, 'usd'))
  })
  it('technical bounds: -50 and 50 accepted, beyond rejected, precision > 2 rejected', () => {
    expect(computeGoal({ ...base, returnAssumptionEnabled: true, annualReturn: -50 }).status).toBe('ok')
    expect(computeGoal({ ...base, returnAssumptionEnabled: true, annualReturn: 50 }).status).toBe('ok')
    expect(computeGoal({ ...base, returnAssumptionEnabled: true, annualReturn: -50.01 }).status).toBe('invalid')
    expect(computeGoal({ ...base, returnAssumptionEnabled: true, annualReturn: 50.01 }).status).toBe('invalid')
    expect(computeGoal({ ...base, returnAssumptionEnabled: true, annualReturn: 4.255 }).status).toBe('invalid')
    expect(computeGoal({ ...base, returnAssumptionEnabled: true, annualReturn: NaN }).status).toBe('invalid')
  })
  it('1 month and 600 months compute; identical assumption on both paths', () => {
    const one = computeGoal({ ...base, months: 1, returnAssumptionEnabled: true, annualReturn: 6 })
    expect(one.status).toBe('ok')
    const long = computeGoal({ ...base, target: 1000000, months: 600, returnAssumptionEnabled: true, annualReturn: 4 })
    expect(long.status === 'ok' || long.status === 'beyondLimit').toBe(true)
    // both paths use the same annual assumption -> same monthly rate applied
    const r = computeGoal({ ...base, currentContribution: 500, plannedContribution: 500, returnAssumptionEnabled: true, annualReturn: 6 })
    expect(r.current.projected).toBe(r.planned.projected)
  })
  it('zero/edge inputs: contribution 0, setAside 0, exact target, above 100%', () => {
    expect(computeGoal({ ...base, currentContribution: 0, returnAssumptionEnabled: true, annualReturn: 5 }).status).toBe('ok')
    expect(computeGoal({ ...base, plannedContribution: 0, returnAssumptionEnabled: true, annualReturn: 5 }).status).toBe('ok')
    expect(computeGoal({ ...base, setAside: 0, returnAssumptionEnabled: true, annualReturn: 5 }).status).toBe('ok')
    const over = computeGoal({ ...base, target: 100, setAside: 100, returnAssumptionEnabled: true, annualReturn: 5 })
    expect(over.planned.progress).toBeGreaterThan(100)
  })
  it('KRW rounds to whole won at each step', () => {
    const r = computeGoal({ target: 50000000, setAside: 1000000, months: 24, currentContribution: 200000, plannedContribution: 300000, currency: 'krw', returnAssumptionEnabled: true, annualReturn: 6 })
    expect(Number.isInteger(r.planned.projected)).toBe(true)
    expect(r.planned.projected).toBe(refProject(1000000, 300000, 24, 6, 'krw'))
  })
  it('overflow -> beyondLimit, no partial result', () => {
    const r = computeGoal({ target: 1e12, setAside: 9e11, months: 600, currentContribution: 9e9, plannedContribution: 9e9, currency: 'usd', returnAssumptionEnabled: true, annualReturn: 50 })
    expect(r.status).toBe('beyondLimit')
    expect(r.planned).toBeUndefined()
  })
})

describe('RC6.5 — schema migration + storage', () => {
  const v1Plan = () => {
    // build a legacy v1 plan by hand (RC6.4 shape, no return fields)
    const r = computeGoal({ ...base })
    return {
      moduleId: 'goal', schemaVersion: 1, goalType: 'education', goalName: '',
      currency: 'usd', target: 20000, setAside: 5000, months: 30, currentContribution: 300, plannedContribution: 500,
      est: {
        curProjected: r.current.projected, curGap: r.current.gap, curProgress: r.current.progress,
        planProjected: r.planned.projected, planGap: r.planned.gap, planProgress: r.planned.progress,
      },
      updatedAt: 111,
    }
  }
  it('valid v1 legacy plan validates and normalizes to disabled/0%', () => {
    const v = validateStoredGoalPlan(v1Plan())
    expect(v).not.toBeNull()
    expect(v.schemaVersion).toBe(1)
    expect(v.returnAssumptionEnabled).toBe(false)
    expect(v.annualReturn).toBe(0)
    expect(v.current.estDiff).toBe(0)
    expect(v.planned.estDiff).toBe(0)
    expect(v.est.planProjected).toBe(5000 + 500 * 30)
  })
  it('v1 carrying optional-assumption fields is rejected', () => {
    const bad = { ...v1Plan(), returnAssumptionEnabled: true, annualReturn: 5 }
    expect(validateStoredGoalPlan(bad)).toBeNull()
  })
  it('malformed v1 rejected (numeric string, inconsistent est)', () => {
    const s = v1Plan(); s.target = '20000'
    expect(validateStoredGoalPlan(s)).toBeNull()
    const s2 = v1Plan(); s2.est.planProjected = 1
    expect(validateStoredGoalPlan(s2)).toBeNull()
  })
  it('valid v2 disabled plan', () => {
    const p = buildGoalPlan({ goalType: 'education', goalName: '', ...base })
    expect(p.schemaVersion).toBe(2)
    expect(p.returnAssumptionEnabled).toBe(false)
    const v = validateStoredGoalPlan(p)
    expect(v).not.toBeNull()
    expect(v.returnActive).toBe(false)
  })
  it('valid v2 enabled plan round-trips with adjusted arithmetic', () => {
    const p = buildGoalPlan({ goalType: 'custom', goalName: 'Roof', ...base, returnAssumptionEnabled: true, annualReturn: 6 })
    expect(p.schemaVersion).toBe(2)
    const v = validateStoredGoalPlan(p)
    expect(v).not.toBeNull()
    expect(v.returnAssumptionEnabled).toBe(true)
    expect(v.annualReturn).toBe(6)
    expect(v.planned.estDiff).toBeGreaterThan(0)
  })
  it('v2 rejects: disabled-with-nonzero, enabled-out-of-range, inconsistent adjusted est', () => {
    const p = buildGoalPlan({ goalType: 'education', goalName: '', ...base, returnAssumptionEnabled: true, annualReturn: 6 })
    const a = JSON.parse(JSON.stringify(p)); a.returnAssumptionEnabled = false // now nonzero annualReturn while disabled
    expect(validateStoredGoalPlan(a)).toBeNull()
    const b = JSON.parse(JSON.stringify(p)); b.annualReturn = 99
    expect(validateStoredGoalPlan(b)).toBeNull()
    const c = JSON.parse(JSON.stringify(p)); c.est.planProjected = c.est.planProjected + 1
    expect(validateStoredGoalPlan(c)).toBeNull()
    const d = JSON.parse(JSON.stringify(p)); d.est.planEstDiff = 0 // legacy-style zero under v2 enabled
    expect(validateStoredGoalPlan(d)).toBeNull()
  })
  it('adoption works with an active assumption', () => {
    expect(canAdoptGoal({ goalType: 'education', goalName: '', ...base, returnAssumptionEnabled: true, annualReturn: 6 })).toBe(true)
    expect(canAdoptGoal({ goalType: 'education', goalName: '', ...base, returnAssumptionEnabled: true, annualReturn: 99 })).toBe(false)
  })
})
