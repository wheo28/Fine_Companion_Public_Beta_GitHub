import { describe, it, expect, beforeEach } from 'vitest'
import {
  cashflowRoom, roundPlanAmount, formatPlanAmount, computeMultiScenario,
  validateStoredPlan, planStatus, buildPlan, readAssessedCashflow,
  isValidScenarioValue, normalizeBaseline, canEditPlan, computeRatios, formatPercent, roundPercentValue, SAFE_AMOUNT, LEVERS,
} from './cashflowPlanLogic.js'

const CK = 'fine-companion.checkup.v1'
const baseCk = (over = {}) => ({ answers: Object.assign({ income: 5000, essentials: 2000, discretionary: 800, debt: 400, savings: 6000, currency: 'usd' }, over), ts: Date.now() })
const B = normalizeBaseline({ income: 5000, essentials: 2000, nonEssentials: 800, debt: 400 }) // room 1800

beforeEach(() => { globalThis.localStorage.clear() })

describe('arithmetic', () => {
  it('room = income - outflows', () => {
    expect(cashflowRoom({ income: 5000, essentials: 2000, nonEssentials: 800, debt: 400 })).toEqual({ outflows: 3200, room: 1800 })
  })
  it('rounds symmetrically', () => { expect(roundPlanAmount(2.675)).toBe(2.68); expect(roundPlanAmount(-2.675)).toBe(-2.68) })
  it('formats currency', () => { expect(formatPlanAmount(2000, 'usd')).toBe('$2,000'); expect(formatPlanAmount(2000, 'krw')).toBe('\u20a92,000'); expect(formatPlanAmount(212.5)).toBe('$212.50') })
})

describe('computeMultiScenario', () => {
  it('single field change', () => {
    const m = computeMultiScenario(B, { nonEssentials: 600 })
    expect(m.room).toBe(2000); expect(m.change).toBe(200); expect(m.changedFields).toEqual(['nonEssentials']); expect(m.inRange).toBe(true)
  })
  it('multiple field change', () => {
    const m = computeMultiScenario(B, { essentials: 2500, debt: 300 })
    // outflows = 2500+800+300=3600 -> room 1400 -> change -400
    expect(m.room).toBe(1400); expect(m.change).toBe(-400); expect(m.changedFields.sort()).toEqual(['debt', 'essentials'])
  })
  it('all four fields', () => {
    const m = computeMultiScenario(B, { income: 6000, essentials: 1800, nonEssentials: 700, debt: 300 })
    // outflows 2800 -> room 3200 -> change 1400
    expect(m.room).toBe(3200); expect(m.change).toBe(1400); expect(m.changedFields.length).toBe(4)
  })
  it('no net change when values offset', () => {
    const m = computeMultiScenario(B, { income: 5100, essentials: 2100 })
    expect(m.change).toBe(0); expect(m.changedFields.length).toBe(2)
  })
  it('overflow reported not clamped', () => {
    const m = computeMultiScenario(B, { essentials: SAFE_AMOUNT })
    expect(m.inRange).toBe(false)
  })
})

describe('validateStoredPlan v2', () => {
  const good = buildPlan({ baseline: B, baselineSource: 'checkup', currency: 'usd', changes: { nonEssentials: 600 } })
  it('accepts a valid v2 plan', () => { expect(validateStoredPlan(good)).not.toBeNull() })
  it('rejects numeric-string change values', () => {
    const p = JSON.parse(JSON.stringify(good)); p.changes = { nonEssentials: '600' }
    expect(validateStoredPlan(p)).toBeNull()
  })
  it('rejects a change equal to baseline (no real change)', () => {
    const p = buildPlan({ baseline: B, baselineSource: 'checkup', currency: 'usd', changes: { nonEssentials: 800 } })
    // change would be 0 -> buildPlan still makes it, validate must reject
    expect(validateStoredPlan(p)).toBeNull()
  })
  it('rejects empty changes', () => { const p = JSON.parse(JSON.stringify(good)); p.changes = {}; expect(validateStoredPlan(p)).toBeNull() })
  it('rejects wrong currency / source', () => {
    let p = JSON.parse(JSON.stringify(good)); p.currency = 'eur'; expect(validateStoredPlan(p)).toBeNull()
    p = JSON.parse(JSON.stringify(good)); p.baselineSource = 'assessed'; expect(validateStoredPlan(p)).toBeNull()
  })
  it('rejects malformed / null / arrays', () => {
    expect(validateStoredPlan(null)).toBeNull(); expect(validateStoredPlan('x')).toBeNull()
    const p = JSON.parse(JSON.stringify(good)); p.changes = [600]; expect(validateStoredPlan(p)).toBeNull()
  })
  it('accepts a planning-source plan', () => {
    const p = buildPlan({ baseline: B, baselineSource: 'planning', currency: 'usd', changes: { income: 6000 } })
    expect(validateStoredPlan(p)?.baselineSource).toBe('planning')
  })
})

describe('v1 -> v2 migration', () => {
  const v1 = { moduleId: 'cashflow', schemaVersion: 1, currency: 'usd', baseline: { income: 5000, essentials: 2000, nonEssentials: 800, debt: 400, room: 1800 }, lever: 'nonEssentials', originalValue: 800, chosenValue: 600, scenarioRoom: 2000, change: 200, updatedAt: 111 }
  it('migrates a valid RC4.9 single-lever plan', () => {
    const v2 = validateStoredPlan(v1)
    expect(v2).not.toBeNull()
    expect(v2.schemaVersion).toBe(2); expect(v2.baselineSource).toBe('checkup')
    expect(v2.changes).toEqual({ nonEssentials: 600 }); expect(v2.scenarioRoom).toBe(2000); expect(v2.change).toBe(200)
  })
  it('rejects a corrupt v1 plan', () => {
    const bad = { ...v1, chosenValue: 'x' }; expect(validateStoredPlan(bad)).toBeNull()
  })
})

describe('planStatus', () => {
  const plan = buildPlan({ baseline: B, baselineSource: 'checkup', currency: 'usd', changes: { nonEssentials: 600 } })
  it('fresh when assessed matches', () => {
    const a = { known: true, income: 5000, essentials: 2000, nonEssentials: 800, debt: 400, currency: 'usd' }
    expect(planStatus(plan, a)).toBe('fresh')
  })
  it('stale when assessed differs or missing', () => {
    expect(planStatus(plan, { known: false })).toBe('stale')
    expect(planStatus(plan, { known: true, income: 7000, essentials: 2000, nonEssentials: 800, debt: 400, currency: 'usd' })).toBe('stale')
  })
  it('planning-source is never stale', () => {
    const pp = buildPlan({ baseline: B, baselineSource: 'planning', currency: 'usd', changes: { nonEssentials: 600 } })
    expect(planStatus(pp, { known: false })).toBe('planning')
  })
})

describe('readAssessedCashflow', () => {
  it('reads a known picture from the checkup', () => {
    globalThis.localStorage.setItem(CK, JSON.stringify(baseCk()))
    const a = readAssessedCashflow()
    expect(a.known).toBe(true); expect(a.nonEssentials).toBe(800); expect(a.assessedRoom).toBe(1800)
  })
  it('unavailable when a field is skipped', () => {
    globalThis.localStorage.setItem(CK, JSON.stringify(baseCk({ debt: 'skipped' })))
    expect(readAssessedCashflow().known).toBe(false)
  })
})

// ---------------- RC5.1 corrective patch ----------------
describe('RC5.1: type-strict scenarioRoom / change validation', () => {
  const good = buildPlan({ baseline: B, baselineSource: 'checkup', currency: 'usd', changes: { nonEssentials: 600 } })
  it('rejects a numeric-string scenarioRoom', () => {
    const p = JSON.parse(JSON.stringify(good)); p.scenarioRoom = '2000'
    expect(validateStoredPlan(p)).toBeNull()
  })
  it('rejects a numeric-string change', () => {
    const p = JSON.parse(JSON.stringify(good)); p.change = '200'
    expect(validateStoredPlan(p)).toBeNull()
  })
  it('rejects boolean / null / array / object scenarioRoom and change', () => {
    for (const bad of [true, null, [2000], { v: 2000 }]) {
      const p = JSON.parse(JSON.stringify(good)); p.scenarioRoom = bad
      expect(validateStoredPlan(p)).toBeNull()
    }
    for (const bad of [false, null, [200], { v: 200 }]) {
      const p = JSON.parse(JSON.stringify(good)); p.change = bad
      expect(validateStoredPlan(p)).toBeNull()
    }
  })
  it('preserves valid decimal scenarioRoom / change', () => {
    // decimal baseline so room/change carry a fraction
    const decBase = normalizeBaseline({ income: 5000.5, essentials: 2000, nonEssentials: 800, debt: 400 }) // room 1800.5
    const p = buildPlan({ baseline: decBase, baselineSource: 'checkup', currency: 'usd', changes: { nonEssentials: 600 } })
    expect(p.scenarioRoom).toBeCloseTo(2000.5, 5)
    const v = validateStoredPlan(p)
    expect(v).not.toBeNull()
    expect(v.scenarioRoom).toBeCloseTo(2000.5, 5)
  })
})

describe('RC5.1: canEditPlan eligibility', () => {
  const assessedUsd = { known: true, income: 5000, essentials: 2000, nonEssentials: 800, debt: 400, currency: 'usd' }
  const checkupPlan = buildPlan({ baseline: B, baselineSource: 'checkup', currency: 'usd', changes: { nonEssentials: 600 } })
  const planningPlan = buildPlan({ baseline: B, baselineSource: 'planning', currency: 'usd', changes: { nonEssentials: 600 } })
  it('planning-source is always editable, even with no checkup', () => {
    expect(canEditPlan(planningPlan, { known: false })).toBe(true)
  })
  it('checkup-source is editable when a matching picture exists', () => {
    expect(canEditPlan(checkupPlan, assessedUsd)).toBe(true)
  })
  it('checkup-source is not editable with no current picture', () => {
    expect(canEditPlan(checkupPlan, { known: false })).toBe(false)
  })
  it('checkup-source is not editable when currency differs', () => {
    expect(canEditPlan(checkupPlan, { ...assessedUsd, currency: 'krw' })).toBe(false)
  })
  it('null plan is not editable', () => { expect(canEditPlan(null, assessedUsd)).toBe(false) })
})

// ---------------- RC5.2 ratio view ----------------
describe('RC5.2: formatPercent', () => {
  it('formats to one decimal place', () => {
    expect(formatPercent(52.4)).toBe('52.4%')
    expect(formatPercent(20)).toBe('20.0%')
    expect(formatPercent(7.84)).toBe('7.8%')
  })
  it('does not clamp values above 100%', () => { expect(formatPercent(140)).toBe('140.0%') })
  it('normalizes -0 to 0.0', () => { expect(formatPercent(-0)).toBe('0.0%') })
})

describe('RC5.2: computeRatios', () => {
  // baseline B: income5000 ess2000 flex800 debt400 room1800
  it('current must-pay / flexible / room shares (checkup baseline)', () => {
    const r = computeRatios({ ...B }) // B has income/essentials/nonEssentials/debt/room
    expect(r.mustPay).toBeCloseTo((2400 / 5000) * 100, 6)  // 48
    expect(r.flexible).toBeCloseTo((800 / 5000) * 100, 6)  // 16
    expect(r.roomShare).toBeCloseTo((1800 / 5000) * 100, 6) // 36
  })
  it('scenario shares from a multi-field change', () => {
    const m = computeMultiScenario(B, { essentials: 2500, debt: 300 }) // outflows 3600, room 1400
    const r = computeRatios({ income: m.scenario.income, essentials: m.scenario.essentials, nonEssentials: m.scenario.nonEssentials, debt: m.scenario.debt, room: m.room })
    expect(r.mustPay).toBeCloseTo((2800 / 5000) * 100, 6) // 56
    expect(r.roomShare).toBeCloseTo((1400 / 5000) * 100, 6) // 28
  })
  it('percentage-point change is planShare - currentShare', () => {
    const cur = computeRatios({ ...B })
    const m = computeMultiScenario(B, { nonEssentials: 1800 }) // flex 800->1800, room 800
    const plan = computeRatios({ income: m.scenario.income, essentials: m.scenario.essentials, nonEssentials: m.scenario.nonEssentials, debt: m.scenario.debt, room: m.room })
    expect(plan.flexible - cur.flexible).toBeCloseTo(20, 6) // 36% - 16% = +20pp
    expect(plan.roomShare - cur.roomShare).toBeCloseTo(-20, 6) // 16% - 36% = -20pp
  })
  it('positive, zero, and negative room shares', () => {
    expect(computeRatios({ income: 5000, essentials: 2000, nonEssentials: 800, debt: 400, room: 1800 }).roomShare).toBeCloseTo(36, 6)
    expect(computeRatios({ income: 5000, essentials: 3800, nonEssentials: 800, debt: 400, room: 0 }).roomShare).toBe(0)
    const neg = computeRatios({ income: 5000, essentials: 4000, nonEssentials: 800, debt: 400, room: -200 })
    expect(neg.roomShare).toBeCloseTo(-4, 6)         // signed
    expect(Math.abs(neg.roomShare)).toBeCloseTo(4, 6) // magnitude for gap-label display
  })
  it('supports values above 100% (must-pays exceed income)', () => {
    const r = computeRatios({ income: 2000, essentials: 2400, nonEssentials: 200, debt: 200, room: -800 })
    expect(r.mustPay).toBeCloseTo(130, 6) // 2600/2000
  })
  it('handles decimal assessed values', () => {
    const r = computeRatios({ income: 5000.5, essentials: 2000, nonEssentials: 800, debt: 400, room: 1800.5 })
    expect(r.roomShare).toBeCloseTo((1800.5 / 5000.5) * 100, 6)
  })
  it('works for a planning-only baseline picture', () => {
    const pb = normalizeBaseline({ income: 4000, essentials: 1800, nonEssentials: 600, debt: 300 }) // room 1300
    const r = computeRatios(pb)
    expect(r.mustPay).toBeCloseTo((2100 / 4000) * 100, 6) // 52.5
  })
})

describe('RC5.2: income-zero ratio safety', () => {
  it('returns null when income is 0 (no division)', () => {
    expect(computeRatios({ income: 0, essentials: 100, nonEssentials: 0, debt: 0, room: -100 })).toBeNull()
  })
  it('never yields NaN or Infinity for income 0', () => {
    const r = computeRatios({ income: 0, essentials: 1, nonEssentials: 1, debt: 1, room: -3 })
    expect(r).toBeNull() // caller shows the income-zero message; no numbers
  })
  it('returns null for non-finite inputs (never substitutes zero)', () => {
    expect(computeRatios({ income: 5000, essentials: NaN, nonEssentials: 800, debt: 400, room: 1800 })).toBeNull()
    expect(computeRatios({ income: Infinity, essentials: 2000, nonEssentials: 800, debt: 400, room: 1800 })).toBeNull()
    expect(computeRatios(null)).toBeNull()
  })
})

// ---------------- RC5.3 corrective patch ----------------
describe('RC5.3: roundPercentValue symmetric one-decimal rounding', () => {
  it('positive half-steps round away from zero', () => {
    expect(roundPercentValue(2.65)).toBe(2.7)
    expect(roundPercentValue(0.05)).toBe(0.1)
  })
  it('negative half-steps round away from zero (by magnitude)', () => {
    expect(roundPercentValue(-2.65)).toBe(-2.7)
    expect(roundPercentValue(-0.05)).toBe(-0.1)
  })
  it('normalizes negative zero to positive zero', () => {
    expect(Object.is(roundPercentValue(-0), 0)).toBe(true)
    expect(Object.is(roundPercentValue(-0.04), 0)).toBe(true)
  })
  it('values rounding to zero display as 0.0', () => {
    expect(formatPercent(0.04)).toBe('0.0%')
    expect(formatPercent(-0.04)).toBe('0.0%')
  })
  it('formatPercent uses the symmetric rule', () => {
    expect(formatPercent(2.65)).toBe('2.7%')
    expect(formatPercent(-2.65)).toBe('-2.7%')
  })
  it('passes non-finite values through unchanged', () => {
    expect(Number.isNaN(roundPercentValue(NaN))).toBe(true)
    expect(roundPercentValue(Infinity)).toBe(Infinity)
  })
})

describe('RC5.3: change detection at displayed precision', () => {
  const changedAtDisplay = (a, b) => roundPercentValue(a) !== roundPercentValue(b)
  it('unchanged at one decimal counts as no change', () => {
    expect(changedAtDisplay(20.02, 20.03)).toBe(false) // both -> 20.0
    expect(changedAtDisplay(48.0, 48.04)).toBe(false)
  })
  it('a one-decimal difference counts as changed', () => {
    expect(changedAtDisplay(20.0, 20.05)).toBe(true) // 20.0 vs 20.1
  })
})

describe('RC5.3: room->gap / gap->room independent side labels', () => {
  // The card labels each side by the sign of that side's room share:
  //   share < 0 -> gap label, else -> room label. Assert the signs drive it.
  it('current room, plan gap', () => {
    const cur = computeRatios({ income: 5000, essentials: 2000, nonEssentials: 800, debt: 400, room: 1800 })
    const m = computeMultiScenario(B, { essentials: 4000 }) // room -200
    const plan = computeRatios({ income: m.scenario.income, essentials: m.scenario.essentials, nonEssentials: m.scenario.nonEssentials, debt: m.scenario.debt, room: m.room })
    expect(cur.roomShare >= 0).toBe(true)  // -> room label
    expect(plan.roomShare < 0).toBe(true)  // -> gap label
    expect(formatPercent(Math.abs(plan.roomShare))).toBe('4.0%') // magnitude, no minus
  })
  it('current gap, plan room', () => {
    const gapBase = normalizeBaseline({ income: 5000, essentials: 4000, nonEssentials: 800, debt: 400 }) // room -200
    const cur = computeRatios(gapBase)
    const m = computeMultiScenario(gapBase, { essentials: 2000 }) // room +1800
    const plan = computeRatios({ income: m.scenario.income, essentials: m.scenario.essentials, nonEssentials: m.scenario.nonEssentials, debt: m.scenario.debt, room: m.room })
    expect(cur.roomShare < 0).toBe(true)   // -> gap label
    expect(plan.roomShare >= 0).toBe(true) // -> room label
  })
  it('current and plan values are independently formatted (no shared sign)', () => {
    const cur = computeRatios({ income: 5000, essentials: 2000, nonEssentials: 800, debt: 400, room: 1800 }) // +36
    const m = computeMultiScenario(B, { essentials: 4000 })
    const plan = computeRatios({ income: 5000, essentials: 4000, nonEssentials: 800, debt: 400, room: m.room }) // -4
    expect(formatPercent(Math.abs(cur.roomShare))).toBe('36.0%')
    expect(formatPercent(Math.abs(plan.roomShare))).toBe('4.0%')
  })
})
