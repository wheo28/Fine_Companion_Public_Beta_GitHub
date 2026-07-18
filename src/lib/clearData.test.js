import { describe, it, expect } from 'vitest'
import {
  isOwnedKey, planClear, clearOwnedData, OWNED_PREFIX, KNOWN_OWNED_KEYS,
  clearedMarkerFor, readClearedMarker, readClearedLang, stripClearedParam, clearedRedirectUrl, CLEARED_PARAM,
} from './clearData.js'

// Minimal Storage-like mock with length/key/removeItem, plus a clear() spy that
// must NEVER be called by clearOwnedData.
function makeStore(entries) {
  const m = new Map(Object.entries(entries))
  let clearCalled = false
  return {
    get length() { return m.size },
    key(i) { return Array.from(m.keys())[i] ?? null },
    getItem(k) { return m.has(k) ? m.get(k) : null },
    setItem(k, v) { m.set(k, String(v)) },
    removeItem(k) { m.delete(k) },
    clear() { clearCalled = true; m.clear() },
    _keys() { return Array.from(m.keys()) },
    _clearCalled() { return clearCalled },
  }
}

describe('clearData ownership', () => {
  it('recognizes only fine-companion.* keys as owned', () => {
    expect(isOwnedKey('fine-companion.checkup.v1')).toBe(true)
    expect(isOwnedKey('fine-companion.plan.cashflow.v1')).toBe(true)
    expect(isOwnedKey('fine-companion.lang')).toBe(true)
    expect(isOwnedKey('some-other-app.data')).toBe(false)
    expect(isOwnedKey('theme')).toBe(false)
    expect(isOwnedKey('')).toBe(false)
    expect(isOwnedKey(null)).toBe(false)
  })

  it('every known shipped key is under the owned prefix', () => {
    for (const k of KNOWN_OWNED_KEYS) expect(k.startsWith(OWNED_PREFIX)).toBe(true)
  })

  it('planClear splits owned vs foreign keys', () => {
    const { remove, keep } = planClear([
      'fine-companion.checkup.v1',
      'fine-companion.plan.goal.v1',
      'unrelated.site.session',
      'gdpr-consent',
    ])
    expect(remove.sort()).toEqual(['fine-companion.checkup.v1', 'fine-companion.plan.goal.v1'])
    expect(keep.sort()).toEqual(['gdpr-consent', 'unrelated.site.session'])
  })

  it('clearOwnedData removes ONLY fine-companion keys and preserves others', () => {
    const store = makeStore({
      'fine-companion.lang': 'ko',
      'fine-companion.checkup.v1': '{}',
      'fine-companion.plan.retirement.v1': '{}',
      'other-site.token': 'abc',
      'analytics_opt_out': '1',
    })
    const removed = clearOwnedData(store)
    expect(removed.sort()).toEqual([
      'fine-companion.checkup.v1',
      'fine-companion.lang',
      'fine-companion.plan.retirement.v1',
    ])
    expect(store._keys().sort()).toEqual(['analytics_opt_out', 'other-site.token'])
  })

  it('never calls storage.clear()', () => {
    const store = makeStore({ 'fine-companion.lang': 'en', 'x.y': '1' })
    clearOwnedData(store)
    expect(store._clearCalled()).toBe(false)
    expect(store.getItem('x.y')).toBe('1')
  })

  it('is a no-op when there is nothing owned', () => {
    const store = makeStore({ 'foreign.a': '1', 'foreign.b': '2' })
    expect(clearOwnedData(store)).toEqual([])
    expect(store._keys().length).toBe(2)
  })
})

describe('post-clear one-time marker', () => {
  it('marks removed vs none by removed count', () => {
    expect(clearedMarkerFor(3)).toBe('removed')
    expect(clearedMarkerFor(1)).toBe('removed')
    expect(clearedMarkerFor(0)).toBe('none')
  })

  it('reads only valid markers from a search string', () => {
    expect(readClearedMarker('?fc_cleared=removed')).toBe('removed')
    expect(readClearedMarker('?fc_cleared=none')).toBe('none')
    expect(readClearedMarker('?fc_cleared=bogus')).toBe(null)
    expect(readClearedMarker('?other=1')).toBe(null)
    expect(readClearedMarker('')).toBe(null)
  })

  it('strips only the markers, preserving other params', () => {
    expect(stripClearedParam('?fc_cleared=removed')).toBe('')
    expect(stripClearedParam('?a=1&fc_cleared=none&b=2')).toBe('?a=1&b=2')
    expect(stripClearedParam('?a=1')).toBe('?a=1')
    expect(stripClearedParam('?fc_cleared=removed&fc_lang=ko')).toBe('')
    expect(stripClearedParam('?x=1&fc_cleared=removed&fc_lang=ko&y=2')).toBe('?x=1&y=2')
  })

  it('reads a valid carried language or null', () => {
    expect(readClearedLang('?fc_cleared=removed&fc_lang=ko')).toBe('ko')
    expect(readClearedLang('?fc_cleared=none&fc_lang=en')).toBe('en')
    expect(readClearedLang('?fc_cleared=removed')).toBe(null)
    expect(readClearedLang('?fc_lang=zz')).toBe(null)
  })

  it('builds a root redirect URL under any base carrying marker + language', () => {
    expect(clearedRedirectUrl('/', 'removed')).toBe('/?fc_cleared=removed')
    expect(clearedRedirectUrl('/', 'removed', 'ko')).toBe('/?fc_cleared=removed&fc_lang=ko')
    expect(clearedRedirectUrl('/fine-companion-public-beta/', 'none', 'en'))
      .toBe('/fine-companion-public-beta/?fc_cleared=none&fc_lang=en')
    // invalid lang is omitted
    expect(clearedRedirectUrl('/', 'removed', 'zz')).toBe('/?fc_cleared=removed')
  })

  it('marker round-trip: set then read then strip clears both params', () => {
    const url = clearedRedirectUrl('/app/', 'removed', 'ko')
    const search = url.slice(url.indexOf('?'))
    expect(readClearedMarker(search)).toBe('removed')
    expect(readClearedLang(search)).toBe('ko')
    const stripped = stripClearedParam(search)
    expect(readClearedMarker(stripped)).toBe(null)
    expect(readClearedLang(stripped)).toBe(null)
  })

  it('does not use a localStorage key for the marker', () => {
    expect(CLEARED_PARAM).toBe('fc_cleared')
    expect(CLEARED_PARAM.startsWith(OWNED_PREFIX)).toBe(false)
  })
})

