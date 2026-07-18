import { describe, it, expect, beforeEach } from 'vitest'
import {
  computeDebtPayoff, compareDebt, canAdoptDebt, buildDebtPlan, validateStoredDebtPlan,
  paymentShare, isValidMoney, isValidApr, hasValidPrecision, readIncome,
  MAX_PAYOFF_MONTHS, MAX_APR, DEBT_SAFE_AMOUNT,
} from './debtPlanLogic.js'

const CK = 'fine-companion.checkup.v1'
beforeEach(() => globalThis.localStorage.clear())

describe('computeDebtPayoff — states', () => {
  it('balance = 0 -> zeroBalance (no schedule)', () => {
    expect(computeDebtPayoff({ balance: 0, apr: 10, payment: 100 }).status).toBe('zeroBalance')
  })
  it('payment = 0 with positive balance -> zeroPayment', () => {
    expect(computeDebtPayoff({ balance: 1000, apr: 10, payment: 0 }).status).toBe('zeroPayment')
  })
  it('payment below first-month interest -> belowInterest', () => {
    // balance 1000, apr 12% -> monthly 1% -> first interest 10; pay 5
    expect(computeDebtPayoff({ balance: 1000, apr: 12, payment: 5 }).status).toBe('belowInterest')
  })
  it('payment equals first-month interest -> belowInterest (flat)', () => {
    expect(computeDebtPayoff({ balance: 1000, apr: 12, payment: 10 }).status).toBe('belowInterest')
  })
  it('payment slightly above interest amortizes ("ok") but slowly', () => {
    const r = computeDebtPayoff({ balance: 1000, apr: 12, payment: 11 })
    expect(r.status).toBe('ok'); expect(r.months).toBeGreaterThan(100)
  })
  it('APR = 0 -> principal / payment with a smaller final payment', () => {
    const r = computeDebtPayoff({ balance: 1000, apr: 0, payment: 300 })
    expect(r.status).toBe('ok'); expect(r.months).toBe(4)        // 300,300,300,100
    expect(r.totalInterest).toBe(0); expect(r.finalPayment).toBe(100)
    expect(r.totalPaid).toBe(1000)
  })
  it('normal positive APR amortizes with interest', () => {
    const r = computeDebtPayoff({ balance: 1200, apr: 12, payment: 200 })
    expect(r.status).toBe('ok'); expect(r.months).toBeGreaterThan(0)
    expect(r.totalInterest).toBeGreaterThan(0)
    expect(r.totalPaid).toBe(Math.round((1200 + r.totalInterest) * 100) / 100)
  })
  it('final partial payment is <= regular payment', () => {
    const r = computeDebtPayoff({ balance: 1000, apr: 0, payment: 300 })
    expect(r.finalPayment).toBeLessThanOrEqual(300)
  })
  it('very long payoff beyond the technical cap -> beyondLimit', () => {
    // APR 0, 1,000,000 / 500 = 2000 months > MAX_PAYOFF_MONTHS
    const r = computeDebtPayoff({ balance: 1_000_000, apr: 0, payment: 500 })
    expect(r.status).toBe('beyondLimit')
  })
  it('respects MAX_PAYOFF_MONTHS = 1200', () => {
    expect(MAX_PAYOFF_MONTHS).toBe(1200)
  })
})

describe('computeDebtPayoff — numeric safety', () => {
  it('rejects negative / non-finite / overflow', () => {
    expect(computeDebtPayoff({ balance: -1, apr: 10, payment: 100 }).status).toBe('invalid')
    expect(computeDebtPayoff({ balance: NaN, apr: 10, payment: 100 }).status).toBe('invalid')
    expect(computeDebtPayoff({ balance: DEBT_SAFE_AMOUNT + 1, apr: 10, payment: 100 }).status).toBe('invalid')
    expect(computeDebtPayoff({ balance: 1000, apr: MAX_APR + 1, payment: 100 }).status).toBe('invalid')
  })
  it('deterministic: same inputs -> same result', () => {
    const a = computeDebtPayoff({ balance: 3210.55, apr: 18.9, payment: 250 })
    const b = computeDebtPayoff({ balance: 3210.55, apr: 18.9, payment: 250 })
    expect(a).toEqual(b)
  })
  it('current and scenario use identical rules', () => {
    const { current, scenario } = compareDebt({ balance: 5000, apr: 15, currentPayment: 200, scenarioPayment: 200 })
    expect(current).toEqual(scenario) // same payment -> identical output
  })
  it('handles large safe values', () => {
    const r = computeDebtPayoff({ balance: 1_000_000, apr: 5, payment: 200000 })
    expect(r.status).toBe('ok')
  })
  it('handles decimal USD balances', () => {
    const r = computeDebtPayoff({ balance: 2500.75, apr: 9.99, payment: 300 })
    expect(r.status).toBe('ok'); expect(Number.isFinite(r.totalInterest)).toBe(true)
  })
})

describe('precision + validators', () => {
  it('KRW requires whole units; USD allows two decimals', () => {
    expect(isValidMoney(1000, 'krw')).toBe(true)
    expect(isValidMoney(1000.5, 'krw')).toBe(false)
    expect(isValidMoney(1000.55, 'usd')).toBe(true)
    expect(isValidMoney(1000.555, 'usd')).toBe(false)
  })
  it('APR allows decimals within range', () => {
    expect(isValidApr(18.99)).toBe(true); expect(isValidApr(-1)).toBe(false); expect(isValidApr(MAX_APR + 1)).toBe(false)
  })
})

describe('adoption + build + validate', () => {
  const good = { balance: 3000, apr: 18, currentPayment: 150, scenarioPayment: 300 }
  it('canAdoptDebt requires a difference and both paths ok', () => {
    expect(canAdoptDebt(good)).toBe(true)
    expect(canAdoptDebt({ ...good, scenarioPayment: 150 })).toBe(false) // no change
    expect(canAdoptDebt({ ...good, currentPayment: 10, scenarioPayment: 20 })).toBe(false) // below interest
  })
  it('buildDebtPlan -> validateStoredDebtPlan round-trips', () => {
    const p = buildDebtPlan({ currency: 'usd', ...good })
    const v = validateStoredDebtPlan(p)
    expect(v).not.toBeNull(); expect(v.scenario.status).toBe('ok')
  })
  it('rejects numeric-string fields', () => {
    const p = buildDebtPlan({ currency: 'usd', ...good })
    const bad = JSON.parse(JSON.stringify(p)); bad.balance = '3000'
    expect(validateStoredDebtPlan(bad)).toBeNull()
  })
  it('rejects inconsistent stored estimates', () => {
    const p = buildDebtPlan({ currency: 'usd', ...good })
    const bad = JSON.parse(JSON.stringify(p)); bad.est.scenMonths = bad.est.scenMonths + 5
    expect(validateStoredDebtPlan(bad)).toBeNull()
  })
  it('rejects malformed / wrong module / bad currency', () => {
    expect(validateStoredDebtPlan(null)).toBeNull()
    expect(validateStoredDebtPlan('x')).toBeNull()
    const p = buildDebtPlan({ currency: 'usd', ...good })
    expect(validateStoredDebtPlan({ ...p, currency: 'eur' })).toBeNull()
    expect(validateStoredDebtPlan({ ...p, moduleId: 'cashflow' })).toBeNull()
  })
})

describe('paymentShare', () => {
  it('computes payment / income * 100 when income positive', () => {
    expect(paymentShare(300, 5000)).toBeCloseTo(6, 6)
  })
  it('null when income absent or zero', () => {
    expect(paymentShare(300, 0)).toBeNull()
    expect(paymentShare(300, null)).toBeNull()
  })
})

// ---------------- RC5.5 corrective patch ----------------
describe('RC5.5: currency-specific rounding', () => {
  it('KRW rounds every step to whole won (no decimal fraction)', () => {
    const k = computeDebtPayoff({ balance: 3000, apr: 18, payment: 300, currency: 'krw' })
    expect(k.status).toBe('ok')
    expect(Number.isInteger(k.totalInterest)).toBe(true)
    expect(Number.isInteger(k.totalPaid)).toBe(true)
    expect(Number.isInteger(k.finalPayment)).toBe(true)
  })
  it('USD keeps cents (two decimals)', () => {
    const u = computeDebtPayoff({ balance: 3000, apr: 18, payment: 300, currency: 'usd' })
    expect(u.status).toBe('ok')
    expect(Math.abs(Math.round(u.totalInterest * 100) - u.totalInterest * 100)).toBeLessThan(1e-6)
  })
  it('USD and KRW differ under their own rounding', () => {
    const u = computeDebtPayoff({ balance: 3000, apr: 18, payment: 300, currency: 'usd' })
    const k = computeDebtPayoff({ balance: 3000, apr: 18, payment: 300, currency: 'krw' })
    expect(u.totalInterest).not.toBe(k.totalInterest) // 274.86 vs 273
  })
  it('current and scenario use the identical currency routine', () => {
    const { current, scenario } = compareDebt({ balance: 5000, apr: 15, currentPayment: 200, scenarioPayment: 200, currency: 'krw' })
    expect(current).toEqual(scenario)
  })
})

describe('RC5.5: derived-value overflow', () => {
  it('total interest beyond bound -> overflow (all inputs within DEBT_SAFE_AMOUNT)', () => {
    const inputs = { balance: 9e11, apr: 50, payment: 3.8e10, currency: 'usd' }
    expect(inputs.balance <= DEBT_SAFE_AMOUNT && inputs.payment <= DEBT_SAFE_AMOUNT).toBe(true)
    expect(computeDebtPayoff(inputs).status).toBe('overflow')
  })
  it('total paid beyond bound -> overflow', () => {
    expect(computeDebtPayoff({ balance: 9.9e11, apr: 5, payment: 5e10, currency: 'usd' }).status).toBe('overflow')
  })
  it('adoption disabled for an overflow scenario', () => {
    expect(canAdoptDebt({ balance: 9e11, apr: 50, currentPayment: 3.9e10, scenarioPayment: 3.8e10, currency: 'usd' })).toBe(false)
  })
})

describe('RC5.5: schema-v1 migration + v2', () => {
  const mkV1 = (currency) => {
    // legacy est is computed with the two-decimal convention (== usd rounding)
    const legacy = compareDebt({ balance: 3000, apr: 18, currentPayment: 150, scenarioPayment: 300, currency: 'usd' })
    return { moduleId: 'debt', schemaVersion: 1, currency, balance: 3000, apr: 18, currentPayment: 150, scenarioPayment: 300,
      est: { curMonths: legacy.current.months, curInterest: legacy.current.totalInterest, scenMonths: legacy.scenario.months, scenInterest: legacy.scenario.totalInterest }, updatedAt: 1 }
  }
  it('valid schema-v1 USD migrates to v2 and stays equivalent', () => {
    const v = validateStoredDebtPlan(mkV1('usd'))
    expect(v).not.toBeNull(); expect(v.schemaVersion).toBe(2)
    const nu = compareDebt({ balance: 3000, apr: 18, currentPayment: 150, scenarioPayment: 300, currency: 'usd' })
    expect(v.est.scenInterest).toBe(nu.scenario.totalInterest)
  })
  it('valid schema-v1 KRW migrates to whole-won estimates', () => {
    const v = validateStoredDebtPlan(mkV1('krw'))
    expect(v).not.toBeNull(); expect(v.schemaVersion).toBe(2)
    expect(Number.isInteger(v.est.curInterest)).toBe(true)
    expect(Number.isInteger(v.est.scenInterest)).toBe(true)
  })
  it('malformed schema-v1 (inconsistent est) is rejected', () => {
    const bad = mkV1('usd'); bad.est.scenMonths += 3
    expect(validateStoredDebtPlan(bad)).toBeNull()
  })
  it('buildDebtPlan writes schema v2; validate re-reads it', () => {
    const p = buildDebtPlan({ currency: 'krw', balance: 3000, apr: 18, currentPayment: 150, scenarioPayment: 300 })
    expect(p.schemaVersion).toBe(2)
    const v = validateStoredDebtPlan(p)
    expect(v).not.toBeNull(); expect(Number.isInteger(v.est.scenInterest)).toBe(true)
  })
})

describe('RC5.5: currency-aware readIncome', () => {
  it('returns value AND currency from a USD Checkup', () => {
    globalThis.localStorage.setItem(CK, JSON.stringify({ answers: { income: 5000, currency: 'usd' }, ts: 1 }))
    expect(readIncome()).toEqual({ value: 5000, currency: 'usd' })
  })
  it('returns krw currency from a KRW Checkup', () => {
    globalThis.localStorage.setItem(CK, JSON.stringify({ answers: { income: 3000000, currency: 'krw' }, ts: 1 }))
    expect(readIncome().currency).toBe('krw')
  })
})
