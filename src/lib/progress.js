// Shared progress helpers. Privacy-first: everything stays in the browser.

const EXPLORED_KEY = 'fine-companion.explored.v1'
const CHECKUP_KEY = 'fine-companion.checkup.v1'

export function getExplored() {
  try {
    const raw = window.localStorage.getItem(EXPLORED_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function markExplored(id) {
  try {
    const e = getExplored()
    e[id] = { ts: Date.now() }
    window.localStorage.setItem(EXPLORED_KEY, JSON.stringify(e))
  } catch {
    /* ignore */
  }
}

export function isExplored(id) {
  return Boolean(getExplored()[id])
}

export function exploredIds() {
  return Object.keys(getExplored())
}

export function getCheckup() {
  try {
    const raw = window.localStorage.getItem(CHECKUP_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const CHECKIN_KEY = 'fine-companion.checkin.v1'

// Monthly check-in: embodies "revisit as life changes." Stores last check-in time.
export function getLastCheckin() {
  try {
    const raw = window.localStorage.getItem(CHECKIN_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function markCheckin(changes) {
  try {
    window.localStorage.setItem(CHECKIN_KEY, JSON.stringify({ ts: Date.now(), changes: changes || [] }))
  } catch {
    /* ignore */
  }
}

// Days since the last check-in, or null if never.
export function daysSinceCheckin() {
  const last = getLastCheckin()
  if (!last || !last.ts) return null
  return Math.floor((Date.now() - last.ts) / 86400000)
}

const PLAN_KEY = 'fine-companion.plan.cashflow.v1'

// Cash Flow Planning Tool — adopted plan. Storage access and JSON parse only;
// all schema/enum/range/arithmetic validation lives in cashflowPlanLogic.js.
export function getPlan() {
  try {
    const raw = window.localStorage.getItem(PLAN_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function adoptPlan(plan) {
  try {
    window.localStorage.setItem(PLAN_KEY, JSON.stringify(plan))
  } catch {
    /* ignore */
  }
}

export function removePlan() {
  try {
    window.localStorage.removeItem(PLAN_KEY)
  } catch {
    /* ignore */
  }
}

const DEBT_PLAN_KEY = 'fine-companion.plan.debt.v1'

// Debt Repayment Planning Tool — adopted plan. Separate namespace from Cash
// Flow. Storage access + JSON parse only; all validation lives in
// debtPlanLogic.js. Never render raw output from getDebtPlan().
export function getDebtPlan() {
  try {
    const raw = window.localStorage.getItem(DEBT_PLAN_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function adoptDebtPlan(plan) {
  try {
    window.localStorage.setItem(DEBT_PLAN_KEY, JSON.stringify(plan))
  } catch {
    /* ignore */
  }
}

export function removeDebtPlan() {
  try {
    window.localStorage.removeItem(DEBT_PLAN_KEY)
  } catch {
    /* ignore */
  }
}

const EMERGENCY_PLAN_KEY = 'fine-companion.plan.emergency.v1'

// Emergency Fund Planning Tool — adopted plan. Separate namespace from Cash Flow
// and Debt. Storage access + JSON parse only; all validation lives in
// emergencyPlanLogic.js. Never render raw output from getEmergencyPlan().
export function getEmergencyPlan() {
  try {
    const raw = window.localStorage.getItem(EMERGENCY_PLAN_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function adoptEmergencyPlan(plan) {
  try {
    window.localStorage.setItem(EMERGENCY_PLAN_KEY, JSON.stringify(plan))
  } catch {
    /* ignore */
  }
}

export function removeEmergencyPlan() {
  try {
    window.localStorage.removeItem(EMERGENCY_PLAN_KEY)
  } catch {
    /* ignore */
  }
}

const GOAL_PLAN_KEY = 'fine-companion.plan.goal.v1'

// Goal / Education Planning Tool — adopted plan. Separate namespace from Cash
// Flow, Debt, and Emergency. Storage access + JSON parse only; all validation
// lives in goalPlanLogic.js. Never render raw output from getGoalPlan().
export function getGoalPlan() {
  try {
    const raw = window.localStorage.getItem(GOAL_PLAN_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function adoptGoalPlan(plan) {
  try {
    window.localStorage.setItem(GOAL_PLAN_KEY, JSON.stringify(plan))
  } catch {
    /* ignore */
  }
}

export function removeGoalPlan() {
  try {
    window.localStorage.removeItem(GOAL_PLAN_KEY)
  } catch {
    /* ignore */
  }
}

const RETIREMENT_PLAN_KEY = 'fine-companion.plan.retirement.v1'

// Retirement Planning Tool — adopted plan. Separate namespace from Cash Flow,
// Debt, Emergency, and Goal. Storage access + JSON parse only; validation lives
// in retirementPlanLogic.js. Never render raw output from getRetirementPlan().
export function getRetirementPlan() {
  try {
    const raw = window.localStorage.getItem(RETIREMENT_PLAN_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function adoptRetirementPlan(plan) {
  try {
    window.localStorage.setItem(RETIREMENT_PLAN_KEY, JSON.stringify(plan))
  } catch {
    /* ignore */
  }
}

export function removeRetirementPlan() {
  try {
    window.localStorage.removeItem(RETIREMENT_PLAN_KEY)
  } catch {
    /* ignore */
  }
}

const INSURANCE_PLAN_KEY = 'fine-companion.plan.insurance.v1'

// Insurance Protection Planning Tool — adopted plan. Separate namespace from all
// other tools. Storage access + JSON parse only; validation lives in
// insurancePlanLogic.js. Never render raw output from getInsurancePlan().
export function getInsurancePlan() {
  try {
    const raw = window.localStorage.getItem(INSURANCE_PLAN_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function adoptInsurancePlan(plan) {
  try {
    window.localStorage.setItem(INSURANCE_PLAN_KEY, JSON.stringify(plan))
  } catch {
    /* ignore */
  }
}

export function removeInsurancePlan() {
  try {
    window.localStorage.removeItem(INSURANCE_PLAN_KEY)
  } catch {
    /* ignore */
  }
}
