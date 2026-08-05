import { describe, expect, it } from 'vitest'
import { headersToRecord, normalizeRequest } from '@/background/collector'
import { selectBundleUrls } from '@/background/deep-scan'
import { emptyEvidence, type Evidence } from '@/types'
import { collectDomSelectors, collectGlobalPaths } from '@/engine'
import { DATABASE_FINGERPRINTS } from '@/fingerprints'

describe('normalizeRequest', () => {
  it('keeps host, path, and query', () => {
    // Several fingerprints genuinely need the query string, so it is retained.
    expect(normalizeRequest('https://cdn.example.com/socket.io/?EIO=4')).toBe(
      'cdn.example.com/socket.io/?EIO=4',
    )
  })

  it('drops the fragment', () => {
    expect(normalizeRequest('https://example.com/app#/private/route')).toBe('example.com/app')
  })

  it('rejects non-http protocols', () => {
    expect(normalizeRequest('data:text/html,hi')).toBeNull()
    expect(normalizeRequest('chrome-extension://abc/page.html')).toBeNull()
    expect(normalizeRequest('not a url')).toBeNull()
  })

  it('caps very long urls', () => {
    const long = `https://example.com/${'a'.repeat(500)}`
    expect(normalizeRequest(long)!.length).toBeLessThanOrEqual(300)
  })
})

describe('headersToRecord', () => {
  it('lowercases names so lookups are case-insensitive', () => {
    expect(headersToRecord([{ name: 'X-Vercel-ID', value: 'iad1::abc' }])).toEqual({
      'x-vercel-id': 'iad1::abc',
    })
  })

  it('ignores headers with no value', () => {
    expect(headersToRecord([{ name: 'X-Empty' }])).toEqual({})
  })

  it('handles a missing header array', () => {
    expect(headersToRecord(undefined)).toEqual({})
  })
})

describe('selectBundleUrls', () => {
  function withScripts(scripts: string[], url = 'https://app.example.com/dashboard'): Evidence {
    return { ...emptyEvidence(url, 'app.example.com'), scripts }
  }

  it('resolves relative script sources against the page url', () => {
    expect(selectBundleUrls(withScripts(['/_next/static/chunk.js']))).toEqual([
      'https://app.example.com/_next/static/chunk.js',
    ])
  })

  it('puts first-party bundles first', () => {
    // Third-party scripts are already identified by their URL alone, so
    // downloading them would spend the budget learning nothing new.
    const urls = selectBundleUrls(
      withScripts(['https://js.stripe.com/v3', '/_next/static/app.js']),
    )
    expect(urls[0]).toBe('https://app.example.com/_next/static/app.js')
    expect(urls[1]).toBe('https://js.stripe.com/v3')
  })

  it('deduplicates and skips unusable sources', () => {
    const urls = selectBundleUrls(
      withScripts(['/a.js', '/a.js', 'data:text/javascript,void 0', 'javascript:void(0)']),
    )
    expect(urls).toEqual(['https://app.example.com/a.js'])
  })

  it('caps how many files a scan will fetch', () => {
    const many = Array.from({ length: 40 }, (_, i) => `/chunk-${i}.js`)
    expect(selectBundleUrls(withScripts(many)).length).toBeLessThanOrEqual(12)
  })
})

describe('probe inputs derived from the database', () => {
  const signals = DATABASE_FINGERPRINTS.flatMap((f) => f.signals)

  it('collects every dom selector exactly once', () => {
    const selectors = collectDomSelectors(signals)
    expect(selectors.length).toBe(new Set(selectors).size)
    expect(selectors.length).toBeGreaterThan(0)
  })

  it('collects every global path exactly once', () => {
    const paths = collectGlobalPaths(signals)
    expect(paths.length).toBe(new Set(paths).size)
    expect(paths).toContain('Stripe')
    expect(paths).toContain('__NEXT_DATA__')
  })

  it('keeps the probe payloads small enough to pass to executeScript', () => {
    // These are serialized into the injected call, so an unbounded list here
    // would show up as injection latency on every page load.
    const payload = JSON.stringify([collectDomSelectors(signals), collectGlobalPaths(signals)])
    expect(payload.length).toBeLessThan(20_000)
  })
})
