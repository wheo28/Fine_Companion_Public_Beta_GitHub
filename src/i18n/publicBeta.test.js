import { describe, it, expect } from 'vitest'
import { publicBeta, RELEASE } from './publicBeta.js'

const langs = ['en', 'ko']

describe('public-beta copy', () => {
  it('exposes a release label', () => {
    expect(RELEASE).toMatch(/RC6\.7/)
    for (const l of langs) expect(publicBeta[l].release).toBe(RELEASE)
  })

  it('has matching top-level keys across EN and KO', () => {
    const keys = (o) => Object.keys(o).sort()
    expect(keys(publicBeta.en)).toEqual(keys(publicBeta.ko))
    for (const section of ['notice', 'footer', 'about', 'privacy', 'clearData']) {
      expect(keys(publicBeta.en[section])).toEqual(keys(publicBeta.ko[section]))
    }
  })

  it('English Public Beta label and Korean 공개 베타 label', () => {
    expect(publicBeta.en.betaLabel).toBe('Public Beta')
    expect(publicBeta.ko.betaLabel).toBe('공개 베타')
  })

  it('notice states non-advice and non-guarantee, both languages', () => {
    expect(publicBeta.en.notice.body).toMatch(/does not provide individualized/i)
    expect(publicBeta.en.notice.body).toMatch(/not recommendations, forecasts, or guarantees/i)
    expect(publicBeta.ko.notice.body).toMatch(/조언을 제공하지 않아요/)
    expect(publicBeta.ko.notice.body).toMatch(/추천, 예측 또는 보장이 아니에요/)
  })

  it('About affirms non-advice and includes the Purdue non-endorsement statement', () => {
    for (const l of langs) {
      const body = publicBeta[l].about.what.join(' ')
      expect(body).toMatch(l === 'en' ? /does not recommend products/i : /추천하지 않아요/)
    }
    expect(publicBeta.en.about.affiliation).toMatch(/not an official Purdue University service or an endorsement by Purdue University/i)
    expect(publicBeta.ko.about.affiliation).toMatch(/Purdue University의 공식 서비스나 대학의 보증을 의미하지 않아요/)
    // never claims Purdue endorsement/affiliation as a positive
    for (const l of langs) {
      expect(publicBeta[l].about.affiliation).not.toMatch(/endorsed by Purdue|official Purdue University service\.?$/i)
    }
  })

  it('About scope lists the six planning tools and notes missing modules are intentional', () => {
    const en = publicBeta.en.about
    for (const tool of ['Cash Flow Planning', 'Debt Repayment Planning', 'Emergency Fund Planning', 'Goal / Education Planning', 'Retirement Planning', 'Insurance Protection Planning']) {
      expect(en.scope).toContain(tool)
    }
    expect(en.scopeNote).toMatch(/not an error/i)
  })

  it('Privacy does NOT claim zero hosting-provider processing', () => {
    for (const l of langs) {
      const hosting = publicBeta[l].privacy.hosting.join(' ')
      // must acknowledge the hosting provider may process ordinary request info
      expect(hosting).toMatch(l === 'en' ? /may process ordinary web-request information/i : /처리할 수 있어요/)
      // must not claim absolutely nothing is processed
      expect(hosting).not.toMatch(/no information of any kind|absolutely no|nothing at all is processed/i)
    }
  })

  it('Privacy warns against sensitive data and states adult-use', () => {
    for (const l of langs) {
      const s = publicBeta[l].privacy.sensitive.join(' ')
      expect(s.length).toBeGreaterThan(0)
    }
    expect(publicBeta.en.privacy.adults).toMatch(/intended for adults and is not designed for children under 13/i)
    expect(publicBeta.ko.privacy.adults).toMatch(/13세 미만/)
  })

  it('Feedback guidance excludes sensitive info and no auto state attachment', () => {
    for (const l of langs) {
      const fb = publicBeta[l].privacy.feedback.join(' ')
      expect(fb).toMatch(l === 'en' ? /not.*automatically attached/i : /자동으로 첨부되지 않아요/)
    }
  })

  it('clear-data labels match the required EN/KO strings', () => {
    expect(publicBeta.en.clearData.button).toBe('Clear FinE Companion data on this device')
    expect(publicBeta.ko.clearData.button).toBe('이 기기의 FinE Companion 데이터 지우기')
  })
})
