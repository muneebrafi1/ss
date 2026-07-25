import { describe, expect, it } from 'vitest'
import {
  DISPLAY_THRESHOLD,
  IMPLICATION_CEILING,
  MAX_WEIGHT,
  emptyEvidence,
  type Evidence,
  type Fingerprint,
} from '@/types'
import { combineWithImplications, detect, matchSignal, noisyOr } from '@/engine'

function evidence(overrides: Partial<Evidence> = {}): Evidence {
  return { ...emptyEvidence('https://example.com', 'example.com'), ...overrides }
}

function fingerprint(over: Partial<Fingerprint> & Pick<Fingerprint, 'id'>): Fingerprint {
  return {
    name: over.id,
    category: 'auth',
    description: 'test entry',
    icon: over.id,
    website: `https://${over.id}.com`,
    signals: [],
    ...over,
  }
}

describe('noisyOr', () => {
  it('returns 0 for no signals', () => {
    expect(noisyOr([])).toBe(0)
  })

  it('returns the single weight unchanged', () => {
    expect(noisyOr([0.8])).toBeCloseTo(0.8)
  })

  it('combines independent signals above either alone', () => {
    const combined = noisyOr([0.5, 0.5])
    expect(combined).toBeCloseTo(0.75)
    expect(combined).toBeGreaterThan(0.5)
  })

  it('never reaches certainty', () => {
    expect(noisyOr([0.95, 0.95, 0.95, 0.95, 0.95])).toBeLessThan(1)
  })

  it('clamps any single weight to MAX_WEIGHT', () => {
    expect(noisyOr([1])).toBeCloseTo(MAX_WEIGHT)
    expect(noisyOr([5])).toBeCloseTo(MAX_WEIGHT)
  })

  it('is monotone — adding a signal never lowers confidence', () => {
    expect(noisyOr([0.6, 0.3])).toBeGreaterThan(noisyOr([0.6]))
  })
})

describe('combineWithImplications', () => {
  it('is a no-op without implications', () => {
    expect(combineWithImplications(0.7, [])).toBeCloseTo(0.7)
  })

  it('reinforces a technology that already has direct evidence', () => {
    const combined = combineWithImplications(0.5, [0.45])
    expect(combined).toBeGreaterThan(0.5)
    expect(combined).toBeGreaterThanOrEqual(DISPLAY_THRESHOLD)
  })

  it('caps the aggregate of many implications below the display threshold', () => {
    // Without an aggregate cap these would noisy-OR to ~0.83 and cross the line.
    const combined = combineWithImplications(0, [0.45, 0.45, 0.45, 0.45])
    expect(combined).toBeLessThanOrEqual(IMPLICATION_CEILING)
    expect(combined).toBeLessThan(DISPLAY_THRESHOLD)
  })
})

describe('matchSignal', () => {
  it('matches a request by hostname and path', () => {
    const ev = evidence({ requests: ['api.openai.com/v1/chat/completions'] })
    expect(matchSignal({ type: 'request', pattern: /api\.openai\.com/, weight: 0.9 }, ev)).toBe(true)
    expect(matchSignal({ type: 'request', pattern: /api\.anthropic\.com/, weight: 0.9 }, ev)).toBe(false)
  })

  it('matches a header by presence when no pattern is given', () => {
    const ev = evidence({ responseHeaders: { 'x-vercel-id': 'iad1::abc' } })
    expect(matchSignal({ type: 'header', name: 'x-vercel-id', weight: 0.9 }, ev)).toBe(true)
  })

  it('matches a header name case-insensitively', () => {
    const ev = evidence({ responseHeaders: { server: 'Vercel' } })
    expect(matchSignal({ type: 'header', name: 'Server', pattern: /Vercel/, weight: 0.9 }, ev)).toBe(true)
  })

  it('matches a cookie name', () => {
    const ev = evidence({ cookieNames: ['__clerk_db_jwt', 'other'] })
    expect(matchSignal({ type: 'cookie', pattern: /^__clerk/, weight: 0.85 }, ev)).toBe(true)
  })

  it('matches a resolved global path', () => {
    const ev = evidence({ globals: ['Stripe'] })
    expect(matchSignal({ type: 'global', path: 'Stripe', weight: 0.95 }, ev)).toBe(true)
    expect(matchSignal({ type: 'global', path: 'Clerk', weight: 0.95 }, ev)).toBe(false)
  })

  it('matches any one of several tags sharing a name', () => {
    // WordPress sites routinely emit a generator tag per plugin.
    const many = evidence({ metas: { generator: ['WordPress 6.7.1', 'WooCommerce 9.4.2'] } })
    expect(matchSignal({ type: 'meta', name: 'generator', pattern: /WooCommerce/, weight: 0.9 }, many)).toBe(true)
    expect(matchSignal({ type: 'meta', name: 'generator', pattern: /WordPress/, weight: 0.9 }, many)).toBe(true)
    expect(matchSignal({ type: 'meta', name: 'generator', pattern: /Drupal/, weight: 0.9 }, many)).toBe(false)
  })

  it('matches a meta tag', () => {
    const ev = evidence({ metas: { generator: ['WordPress 6.4'] } })
    expect(matchSignal({ type: 'meta', name: 'generator', pattern: /WordPress/, weight: 0.9 }, ev)).toBe(true)
  })

  it('ignores bundle signals until a deep scan has run', () => {
    const signal = { type: 'bundle', pattern: /gpt-4o/, weight: 0.7 } as const
    const notScanned = evidence({ bundles: ['const m = "gpt-4o"'], deepScanned: false })
    const scanned = evidence({ bundles: ['const m = "gpt-4o"'], deepScanned: true })

    expect(matchSignal(signal, notScanned)).toBe(false)
    expect(matchSignal(signal, scanned)).toBe(true)
  })
})

describe('detect', () => {
  const stripe = fingerprint({
    id: 'stripe',
    name: 'Stripe',
    category: 'payments',
    signals: [
      { type: 'global', path: 'Stripe', weight: 0.95 },
      { type: 'script', pattern: /js\.stripe\.com/, weight: 0.9 },
    ],
  })

  it('surfaces a technology with strong evidence', () => {
    const found = detect(evidence({ globals: ['Stripe'] }), [stripe])
    expect(found.map((d) => d.id)).toEqual(['stripe'])
  })

  it('drops a technology whose evidence sits below the threshold', () => {
    const weak = fingerprint({
      id: 'weak',
      signals: [{ type: 'html', pattern: /maybe/, weight: 0.4 }],
    })
    const found = detect(evidence({ html: '<p>maybe</p>' }), [weak])
    expect(found).toEqual([])
  })

  it('returns nothing when there is no evidence at all', () => {
    expect(detect(evidence(), [stripe])).toEqual([])
  })

  it('links to the referral url when one is set, else the website', () => {
    const plain = detect(evidence({ globals: ['Stripe'] }), [stripe])
    expect(plain[0]?.url).toBe('https://stripe.com')

    const affiliate = detect(evidence({ globals: ['Stripe'] }), [
      { ...stripe, referralUrl: 'https://stripe.com?ref=stacklens' },
    ])
    expect(affiliate[0]?.url).toBe('https://stripe.com?ref=stacklens')
  })

  it('sorts by confidence descending', () => {
    const strong = fingerprint({
      id: 'strong',
      signals: [{ type: 'global', path: 'A', weight: 0.95 }],
    })
    const weaker = fingerprint({
      id: 'weaker',
      signals: [{ type: 'global', path: 'B', weight: 0.7 }],
    })
    const found = detect(evidence({ globals: ['A', 'B'] }), [weaker, strong])
    expect(found.map((d) => d.id)).toEqual(['strong', 'weaker'])
  })

  describe('implications', () => {
    const supabaseAuth = fingerprint({
      id: 'supabase-auth',
      signals: [{ type: 'cookie', pattern: /^sb-.*-auth-token$/, weight: 0.9 }],
      implies: ['supabase'],
    })
    const supabase = fingerprint({
      id: 'supabase',
      category: 'database',
      signals: [{ type: 'request', pattern: /\.supabase\.co/, weight: 0.9 }],
    })

    it('never surfaces an implied technology on implication alone', () => {
      const found = detect(evidence({ cookieNames: ['sb-abc-auth-token'] }), [
        supabaseAuth,
        supabase,
      ])
      expect(found.map((d) => d.id)).toEqual(['supabase-auth'])
    })

    it('reinforces an implied technology that has weak direct evidence', () => {
      const weaklySeen = { ...supabase, signals: [{ type: 'html' as const, pattern: /supabase/, weight: 0.45 }] }
      const ev = evidence({ cookieNames: ['sb-abc-auth-token'], html: 'supabase' })

      // 0.45 alone is below the threshold.
      expect(detect(evidence({ html: 'supabase' }), [weaklySeen])).toEqual([])
      // With the implication behind it, it clears.
      expect(detect(ev, [supabaseAuth, weaklySeen]).map((d) => d.id)).toContain('supabase')
    })

    it('ignores implications from an implier that did not clear the threshold', () => {
      const shaky = { ...supabaseAuth, signals: [{ type: 'html' as const, pattern: /sb-/, weight: 0.3 }] }
      const weaklySeen = { ...supabase, signals: [{ type: 'html' as const, pattern: /supabase/, weight: 0.45 }] }
      const found = detect(evidence({ html: 'sb- supabase' }), [shaky, weaklySeen])
      expect(found).toEqual([])
    })

    it('does not follow implication chains', () => {
      const a = fingerprint({ id: 'a', signals: [{ type: 'global', path: 'A', weight: 0.9 }], implies: ['b'] })
      const b = fingerprint({ id: 'b', signals: [{ type: 'html', pattern: /bbb/, weight: 0.45 }], implies: ['c'] })
      const c = fingerprint({ id: 'c', signals: [{ type: 'html', pattern: /ccc/, weight: 0.45 }] })

      const found = detect(evidence({ globals: ['A'], html: 'bbb ccc' }), [a, b, c])
      // b is reinforced by a. c is not reinforced by b, because propagation is
      // single-hop from directly detected impliers only.
      expect(found.map((d) => d.id).sort()).toEqual(['a', 'b'])
    })
  })

  describe('versions', () => {
    it('shows a version only when a matcher captures one exactly', () => {
      const next = fingerprint({
        id: 'nextjs',
        category: 'frameworks',
        signals: [{ type: 'header', name: 'x-powered-by', pattern: /Next\.js/, weight: 0.9 }],
        version: [{ from: 'header', name: 'x-powered-by', pattern: /Next\.js\s+([\d.]+)/ }],
      })

      const withVersion = detect(
        evidence({ responseHeaders: { 'x-powered-by': 'Next.js 15.1.0' } }),
        [next],
      )
      expect(withVersion[0]?.version).toBe('15.1.0')

      const withoutVersion = detect(
        evidence({ responseHeaders: { 'x-powered-by': 'Next.js' } }),
        [next],
      )
      expect(withoutVersion[0]?.version).toBeNull()
    })

    it('rejects implausible captures rather than displaying junk', () => {
      const junk = fingerprint({
        id: 'junk',
        signals: [{ type: 'html', pattern: /marker/, weight: 0.9 }],
        version: [{ from: 'html', pattern: /marker(.{0,60})/ }],
      })
      const found = detect(evidence({ html: 'marker !!! not a version at all here' }), [junk])
      expect(found[0]?.version).toBeNull()
    })
  })
})
