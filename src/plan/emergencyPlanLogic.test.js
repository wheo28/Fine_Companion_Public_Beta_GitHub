import { describe, it, expect, beforeEach } from 'vitest'
import {
  computeEmergencyMonths, compareEmergency, canAdoptEmergency, buildEmergencyPlan,
  validateStoredEmergencyPlan, readAssessedEmergency, emergencyPlanStatus, canEditEmergency,
  roundMonths, formatMonths1, isValidMoney,
  MAX_EMERGENCY_MONTHS, EMERGENCY_SAFE_AMOUNT,
} from './emergencyPlanLogic.js'

const CK = 'fine-companion.checkup.v1'
beforeEach(() => globalThis.localStorage.clear())

describe('computeEmergencyMonths — states', () => {
  it('normal positive values -> months = accessible / mustPays', () => {
    const r = computeEmergencyMonths({ accessible: 6000, mustPays: 2500 })
    expect(r.status).toBe('ok'); expect(r.months).toBeCloseTo(2.4, 6)
  })
  it('accessible = 0 with must-pays > 0 -> 0 months (ok, no shame)', () => {
    const r = computeEmergencyMonths({ accessible: 0, mustPays: 2000 })
    expect(r.status).toBe('ok'); expect(r.months).toBe(0)
  })
  it('must-pays = 0 -> unavailable (no divide by zero)', () => {
    expect(computeEmergencyMonths({ accessible: 5000, mustPays: 0 }).status).toBe('unavailable')
  })
  it('both = 0 -> unavailable', () => {
    expect(computeEmergencyMonths({ accessible: 0, mustPays: 0 }).status).toBe('unavailable')
  })
  it('result above the technical limit -> beyondLimit', () => {
    // 1_200_001 / 1000 = 1200.001 months > 1200
    expect(computeEmergencyMonths({ accessible: 1_200_001, mustPays: 1000 }).status).toBe('beyondLimit')
  })
  it('respects MAX_EMERGENCY_MONTHS = 1200', () => {
    expect(MAX_EMERGENCY_MONTHS).toBe(1200)
    expect(computeEmergencyMonths({ accessible: 1_200_000, mustPays: 1000 }).status).toBe('ok') // exactly 1200 ok
  })
})

describe('computeEmergencyMonths — numeric safety', () => {
  it('rejects negative / non-finite / overflow inputs', () => {
    expect(computeEmergencyMonths({ accessible: -1, mustPays: 100 }).status).toBe('invalid')
    expect(computeEmergencyMonths({ accessible: NaN, mustPays: 100 }).status).toBe('invalid')
    expect(computeEmergencyMonths({ accessible: EMERGENCY_SAFE_AMOUNT + 1, mustPays: 100 }).status).toBe('invalid')
  })
  it('does not substitute invalid with zero', () => {
    expect(computeEmergencyMonths({ accessible: -5, mustPays: 100 })).not.toHaveProperty('months')
  })
  it('handles decimal USD and large safe values', () => {
    expect(computeEmergencyMonths({ accessible: 6250.75, mustPays: 2500.25 }).status).toBe('ok')
    expect(computeEmergencyMonths({ accessible: 1_000_000, mustPays: 1000 }).status).toBe('ok')
  })
})

describe('rounding + precision', () => {
  it('symmetric one-decimal month rounding', () => {
    expect(roundMonths(2.449999)).toBe(2.4)
    expect(roundMonths(2.45)).toBe(2.5)
    expect(formatMonths1(7)).toBe('7.0')
    expect(formatMonths1(0)).toBe('0.0')
  })
  it('KRW whole-unit / USD two-decimal money precision', () => {
    expect(isValidMoney(1000, 'krw')).toBe(true)
    expect(isValidMoney(1000.5, 'krw')).toBe(false)
    expect(isValidMoney(1000.55, 'usd')).toBe(true)
    expect(isValidMoney(1000.555, 'usd')).toBe(false)
  })
})

describe('adoption + change detection', () => {
  const base = { accessible: 6000, mustPays: 2000 }
  it('adopts when a field changes and months change at one decimal', () => {
    expect(canAdoptEmergency({ baseline: base, scenario: { accessible: 8000, mustPays: 2000 } })).toBe(true) // 3.0 -> 4.0
  })
  it('no-change scenario is not adoptable', () => {
    expect(canAdoptEmergency({ baseline: base, scenario: { ...base } })).toBe(false)
  })
  it('a change too small to alter one-decimal months is not adoptable', () => {
    // 6000/2000=3.0 ; 6000.5/2000=3.00025 -> rounds to 3.0
    expect(canAdoptEmergency({ baseline: base, scenario: { accessible: 6000.5, mustPays: 2000 } })).toBe(false)
  })
  it('scenario must-pays = 0 blocks adoption (unavailable)', () => {
    expect(canAdoptEmergency({ baseline: base, scenario: { accessible: 6000, mustPays: 0 } })).toBe(false)
  })
})

describe('build + validate + status', () => {
  const plan = () => buildEmergencyPlan({ source: 'planning', currency: 'usd', baseline: { accessible: 6000, mustPays: 2000 }, scenario: { accessible: 9000, mustPays: 2000 } })
  it('build -> validate round-trips', () => {
    const v = validateStoredEmergencyPlan(plan())
    expect(v).not.toBeNull(); expect(v.est.curMonths).toBe(3); expect(v.est.scenMonths).toBe(4.5)
  })
  it('rejects numeric-string fields', () => {
    const bad = JSON.parse(JSON.stringify(plan())); bad.baseline.accessible = '6000'
    expect(validateStoredEmergencyPlan(bad)).toBeNull()
  })
  it('rejects inconsistent stored months', () => {
    const bad = JSON.parse(JSON.stringify(plan())); bad.est.scenMonths = 9.9
    expect(validateStoredEmergencyPlan(bad)).toBeNull()
  })
  it('rejects no-change and malformed/bad-source plans', () => {
    const nc = buildEmergencyPlan({ source: 'planning', currency: 'usd', baseline: { accessible: 6000, mustPays: 2000 }, scenario: { accessible: 6000, mustPays: 2000 } })
    expect(validateStoredEmergencyPlan(nc)).toBeNull()
    expect(validateStoredEmergencyPlan({ ...plan(), source: 'x' })).toBeNull()
    expect(validateStoredEmergencyPlan(null)).toBeNull()
  })
  it('planning plan is never stale; checkup plan detects stale + no-picture', () => {
    const p = validateStoredEmergencyPlan(plan())
    expect(emergencyPlanStatus(p, { known: true, assessable: true, accessible: 6000, mustPays: 2000, currency: 'usd' })).toBe('planning')
    const cp = validateStoredEmergencyPlan(buildEmergencyPlan({ source: 'checkup', currency: 'usd', baseline: { accessible: 6000, mustPays: 2000 }, scenario: { accessible: 9000, mustPays: 2000 } }))
    expect(emergencyPlanStatus(cp, { known: true, assessable: true, accessible: 6000, mustPays: 2000, currency: 'usd' })).toBe('fresh')
    expect(emergencyPlanStatus(cp, { known: true, assessable: true, accessible: 7000, mustPays: 2000, currency: 'usd' })).toBe('stale')
    expect(emergencyPlanStatus(cp, { known: false, assessable: false })).toBe('no-picture')
    expect(canEditEmergency(cp, { known: false, assessable: false })).toBe(false)
    expect(canEditEmergency(p, { known: false, assessable: false })).toBe(true) // planning-only always editable
  })
})

describe('readAssessedEmergency', () => {
  it('reads savings + essentials + debt from the Checkup', () => {
    globalThis.localStorage.setItem(CK, JSON.stringify({ answers: { savings: 6000, essentials: 1500, debt: 500, currency: 'usd' }, ts: 1 }))
    const a = readAssessedEmergency()
    expect(a).toMatchObject({ known: true, accessible: 6000, mustPays: 2000, currency: 'usd' })
  })
  it('unknown when a field is missing', () => {
    globalThis.localStorage.setItem(CK, JSON.stringify({ answers: { savings: 6000, essentials: 1500, currency: 'usd' }, ts: 1 }))
    expect(readAssessedEmergency().known).toBe(false)
  })
})

// ---------------- RC5.7 corrective patch ----------------
describe('RC5.7: assessable flag + zero-must-pays picture', () => {
  const setCk = (o) => globalThis.localStorage.setItem(CK, JSON.stringify({ answers: o, ts: 1 }))
  it('known + must-pays > 0 -> assessable true', () => {
    setCk({ savings: 6000, essentials: 1500, debt: 500, currency: 'usd' })
    const a = readAssessedEmergency()
    expect(a).toMatchObject({ known: true, assessable: true, mustPays: 2000 })
  })
  it('required inputs present but must-pays = 0 -> known true, assessable false', () => {
    setCk({ savings: 6000, essentials: 0, debt: 0, currency: 'usd' })
    const a = readAssessedEmergency()
    expect(a.known).toBe(true)
    expect(a.assessable).toBe(false)
    expect(a.mustPays).toBe(0)
  })
  it('a zero-must-pays current picture is unavailable for editing', () => {
    const cp = validateStoredEmergencyPlan(buildEmergencyPlan({ source: 'checkup', currency: 'usd', baseline: { accessible: 6000, mustPays: 2000 }, scenario: { accessible: 9000, mustPays: 2000 } }))
    const zeroPic = { known: true, assessable: false, accessible: 6000, mustPays: 0, currency: 'usd' }
    expect(emergencyPlanStatus(cp, zeroPic)).toBe('no-picture')
    expect(canEditEmergency(cp, zeroPic)).toBe(false)
  })
})

describe('RC5.7: assessed decimal baseline stays usable', () => {
  const setCk = (o) => globalThis.localStorage.setItem(CK, JSON.stringify({ answers: o, ts: 1 }))
  it('accepts a finite non-negative decimal assessed value without rounding it', () => {
    // essentials carries three decimals -> must-pays = 1900.555 (beyond editable precision)
    setCk({ savings: 6250.75, essentials: 1500.555, debt: 400, currency: 'usd' })
    const a = readAssessedEmergency()
    expect(a.known).toBe(true); expect(a.assessable).toBe(true)
    expect(a.accessible).toBe(6250.75)      // exact, not rounded
    expect(a.mustPays).toBeCloseTo(1900.555, 6) // exact, not rounded
  })
  it('the assessed decimal baseline still computes a month estimate', () => {
    const r = computeEmergencyMonths({ accessible: 6250.75, mustPays: 1900.555 })
    expect(r.status).toBe('ok')
    expect(r.months).toBeCloseTo(6250.75 / 1900.555, 6)
  })
})
