import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// Privacy guard: the RC6.7 public beta must not transmit user data and must not
// embed analytics/tracking/error-reporting SDKs. This scans the product source
// for executable network/analytics tokens (not the words "analytics"/"tracking"
// that legitimately appear in privacy copy). Test files are excluded so the
// patterns below don't match themselves.

const here = dirname(fileURLToPath(import.meta.url))
const srcRoot = join(here, '..') // src/

function collect(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const s = statSync(p)
    if (s.isDirectory()) collect(p, acc)
    else if (/\.(js|jsx)$/.test(name) && !/\.test\.(js|jsx)$/.test(name)) acc.push(p)
  }
  return acc
}

// Executable patterns that would indicate outbound transmission or 3rd-party SDKs.
const FORBIDDEN = [
  /\bfetch\s*\(/,
  /\bXMLHttpRequest\b/,
  /\bnew\s+WebSocket\b/,
  /\baxios\b/,
  /\bsendBeacon\s*\(/,
  /\bgtag\s*\(/,
  /\bdataLayer\b/,
  /googletagmanager\.com/,
  /\bSentry\b/,
  /hotjar/i,
  /clarity\.ms/,
  /\bmixpanel\b/i,
  /\bamplitude\b/i,
]

describe('no network / analytics in product source', () => {
  const files = collect(srcRoot)

  it('finds source files to scan', () => {
    expect(files.length).toBeGreaterThan(20)
  })

  it('contains no outbound-transmission or analytics tokens', () => {
    const hits = []
    for (const f of files) {
      const text = readFileSync(f, 'utf8')
      for (const re of FORBIDDEN) {
        if (re.test(text)) hits.push(`${f.replace(srcRoot, 'src')} :: ${re}`)
      }
    }
    expect(hits).toEqual([])
  })

  it('index.html does not reference third-party font/CDN hosts', () => {
    const html = readFileSync(join(srcRoot, '..', 'index.html'), 'utf8')
    expect(html).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\./i)
  })
})
