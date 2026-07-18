// Data-removal (RC6.7). FinE Companion stores everything under one namespace
// prefix. This module removes ONLY keys FinE Companion owns. It never calls
// storage.clear() and never touches unrelated site data.

export const OWNED_PREFIX = 'fine-companion.'

// The exact namespaces FinE Companion ships in RC6.6/RC6.7 (defense-in-depth
// documentation alongside the prefix rule). Adding a namespace is a deliberate act.
export const KNOWN_OWNED_KEYS = [
  'fine-companion.lang',
  'fine-companion.checkup.v1',
  'fine-companion.checkin.v1',
  'fine-companion.explored.v1',
  'fine-companion.plan.cashflow.v1',
  'fine-companion.plan.debt.v1',
  'fine-companion.plan.emergency.v1',
  'fine-companion.plan.goal.v1',
  'fine-companion.plan.insurance.v1',
  'fine-companion.plan.retirement.v1',
]

// A key is owned iff it is a string under the FinE Companion prefix. The prefix
// rule (not the fixed list) is authoritative so that versioned or future
// FinE Companion keys are cleared too — but strictly within our namespace.
export function isOwnedKey(key) {
  return typeof key === 'string' && key.startsWith(OWNED_PREFIX)
}

// Pure planner: split the current key list into { remove, keep }. No side
// effects, so it can be unit-tested directly.
export function planClear(allKeys) {
  const remove = []
  const keep = []
  for (const k of allKeys) (isOwnedKey(k) ? remove : keep).push(k)
  return { remove, keep }
}

// List all keys from a Storage-like object without assuming iteration support.
function listKeys(store) {
  const keys = []
  const n = typeof store.length === 'number' ? store.length : 0
  for (let i = 0; i < n; i++) {
    const k = store.key ? store.key(i) : null
    if (k != null) keys.push(k)
  }
  return keys
}

// Effectful clear against a Storage-like object (defaults to window.localStorage).
// NEVER calls store.clear(). Removes only owned keys. Returns the removed keys.
export function clearOwnedData(storage) {
  const store =
    storage || (typeof window !== 'undefined' ? window.localStorage : null)
  if (!store) return []
  const { remove } = planClear(listKeys(store))
  for (const k of remove) store.removeItem(k)
  return remove
}

// --- One-time post-clear confirmation marker (non-persistent) ---------------
// After clearing, the app reloads to a clean first-use state, so the "done" /
// "nothing" message can't be held in component state. It is carried across the
// reload in a single URL query parameter (NOT localStorage), read once, then
// stripped from the URL so a refresh never re-shows it.

export const CLEARED_PARAM = 'fc_cleared'
export const CLEARED_LANG_PARAM = 'fc_lang'

// Which marker to set based on how many owned keys were removed.
export function clearedMarkerFor(removedCount) {
  return removedCount > 0 ? 'removed' : 'none'
}

// Read the marker from a location.search string. Returns 'removed' | 'none' | null.
export function readClearedMarker(search) {
  const params = new URLSearchParams(search || '')
  const v = params.get(CLEARED_PARAM)
  return v === 'removed' || v === 'none' ? v : null
}

// Read the one-time display language carried alongside the marker. Because the
// clear removes the stored language preference, this lets the confirmation be
// shown in the language the user was using at the moment of clearing.
export function readClearedLang(search) {
  const params = new URLSearchParams(search || '')
  const v = params.get(CLEARED_LANG_PARAM)
  return v === 'en' || v === 'ko' ? v : null
}

// Return a search string with the one-time markers removed (other params preserved).
export function stripClearedParam(search) {
  const params = new URLSearchParams(search || '')
  params.delete(CLEARED_PARAM)
  params.delete(CLEARED_LANG_PARAM)
  const s = params.toString()
  return s ? '?' + s : ''
}

// Build the root URL (base path) carrying the one-time marker (+ optional lang).
export function clearedRedirectUrl(base, marker, lang) {
  const root = base || '/'
  const langPart = lang === 'en' || lang === 'ko' ? `&${CLEARED_LANG_PARAM}=${lang}` : ''
  return `${root}?${CLEARED_PARAM}=${marker}${langPart}`
}
