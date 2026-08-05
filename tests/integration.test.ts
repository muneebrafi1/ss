import { describe, expect, it } from 'vitest'
import { detect } from '@/engine'
import { DATABASE_FINGERPRINTS } from '@/fingerprints'
import { groupDetections } from '@/lib/grouping'
import { formatExport, toJson, toMarkdown } from '@/lib/export'
import { stackSummary } from '@/lib/summary'
import type { Evidence } from '@/types'
import fixture from './fixtures/fixture-site.json'

/**
 * Fixture replay.
 *
 * `tests/fixtures/fixture-site.json` is real `Evidence`, captured by the
 * end-to-end run from a Chrome instance with the extension loaded — not
 * hand-written. That makes this a genuine regression test on the database and
 * the engine together: change a pattern carelessly and a detection disappears
 * here, with no browser needed to notice.
 *
 * Regenerate with `npm run test:e2e`.
 */
const evidence = fixture as unknown as Evidence

/** Passive detection only — the state before a deep scan is requested. */
const passive: Evidence = { ...evidence, deepScanned: false, bundles: [] }

const namesOf = (list: { name: string }[]) => list.map((d) => d.name)

describe('replaying captured evidence', () => {
  const detections = detect(passive, DATABASE_FINGERPRINTS)
  const names = namesOf(detections)

  it('identifies the stack from passive signals alone', () => {
    for (const expected of [
      'Vercel', // response header only
      'Next.js', // page global and build path
      'React',
      'Stripe',
      'Clerk',
      'Supabase',
      'Supabase Auth',
      'PostHog',
      'Sentry',
      'Intercom',
      'Hotjar',
      'Cloudinary',
      'Pinecone',
      'ElevenLabs',
      'Resend',
    ]) {
      expect(names, `expected to detect ${expected}`).toContain(expected)
    }
  })

  it('does not invent technologies that are not there', () => {
    for (const absent of [
      'WordPress',
      'Shopify',
      'Auth0',
      'Mapbox',
      'Drupal',
      'Magento',
      'Wix',
      'Webflow',
      'Django',
      'Laravel',
    ]) {
      expect(names, `did not expect ${absent}`).not.toContain(absent)
    }
  })

  it('reads a version only where one was genuinely published', () => {
    const next = detections.find((d) => d.name === 'Next.js')
    expect(next?.version).toBe('15.1.0')

    // Nothing in this page publishes a Stripe version, so none is shown.
    expect(detections.find((d) => d.name === 'Stripe')?.version).toBeNull()
  })

  it('keeps every surfaced detection above the display threshold', () => {
    // The panel shows no confidence indicator, so anything shown must have
    // cleared the bar rather than being displayed with a quiet caveat.
    expect(detections.every((d) => d.confidence >= 0.6)).toBe(true)
  })

  it('groups into the fixed category order with a collapsed remainder', () => {
    const grouped = groupDetections(detections)
    expect(grouped.total).toBe(detections.length)
    expect(grouped.open.length).toBeGreaterThan(0)
    expect(grouped.open.length).toBeLessThanOrEqual(6)
    expect(
      grouped.open.reduce((n, g) => n + g.detections.length, 0) + grouped.collapsedCount,
    ).toBe(detections.length)

    // AI Models ranks first in the fixed order, so it leads when present.
    expect(grouped.open[0]?.category.id).toBe('ai-models')
  })
})

describe('deep scan adds what passive detection cannot see', () => {
  const before = namesOf(detect(passive, DATABASE_FINGERPRINTS))
  const after = namesOf(detect(evidence, DATABASE_FINGERPRINTS))

  it('recovers model providers from bundle strings', () => {
    // The whole reason deep scan exists: these calls happen server-side, so
    // nothing in the request log reveals them.
    expect(before).not.toContain('Anthropic')
    expect(after).toContain('Anthropic')
    expect(after).toContain('Vercel AI SDK')
  })

  it('recovers a specific model name', () => {
    const openai = detect(evidence, DATABASE_FINGERPRINTS).find((d) => d.name === 'OpenAI')
    expect(openai?.version).toBe('gpt-4o-mini')
  })

  it('never loses a passive detection', () => {
    for (const name of before) expect(after).toContain(name)
  })
})

describe('exports', () => {
  const detections = detect(evidence, DATABASE_FINGERPRINTS)

  it('writes markdown grouped by category', () => {
    const markdown = toMarkdown('app.fixture.test', detections)
    expect(markdown).toContain('# app.fixture.test')
    expect(markdown).toContain('## Payments')
    expect(markdown).toContain('**Stripe**')
  })

  it('writes json without exposing internal confidence', () => {
    const parsed = JSON.parse(toJson('app.fixture.test', detections))
    expect(parsed.site).toBe('app.fixture.test')
    expect(parsed.technologies.length).toBe(detections.length)
    expect(parsed.technologies[0]).not.toHaveProperty('confidence')
  })

  it('leads the markdown with the summary sentence', () => {
    const summary = stackSummary(detections)
    expect(summary).not.toBeNull()
    const lines = toMarkdown('app.fixture.test', detections).split('\n')
    expect(lines[0]).toBe('# app.fixture.test')
    expect(lines[2]).toBe(summary)
  })

  it('routes every format through one entry point', () => {
    for (const format of ['markdown', 'json'] as const) {
      expect(formatExport(format, 'app.fixture.test', detections).length).toBeGreaterThan(0)
    }
  })
})

describe('stack summary', () => {
  const detections = detect(evidence, DATABASE_FINGERPRINTS)

  it('names the framework, the host and two companions', () => {
    // The captured fixture is a Next.js app on Vercel with Supabase and Clerk.
    expect(stackSummary(detections)).toBe('Next.js on Vercel with Supabase and Clerk')
  })

  it('says nothing when there is nothing to say', () => {
    expect(stackSummary([])).toBeNull()
  })

  it('names what there is when nothing structural was found', () => {
    const loose = detections.filter((d) => d.category === 'analytics' || d.category === 'chat')
    expect(loose.length).toBeGreaterThan(2)
    // No framework, host, CMS or backend: it lists rather than inventing a shape.
    expect(stackSummary(loose)).toMatch(/^\d+ tools including .+ and .+$/)
  })

  it('describes a store as a store', () => {
    const shop = detections.map((detection, i) =>
      i === 0
        ? { ...detection, category: 'ecommerce' as const, name: 'Shopify', id: 'shopify' }
        : detection,
    )
    const onlyShop = shop.filter((d) => d.category === 'ecommerce' || d.category === 'hosting')
    expect(stackSummary(onlyShop)).toMatch(/^Shopify store/)
  })

  /*
   * The most common shape on the web, and the one the sentence used to get
   * wrong. `frameworks` outranks `cms`, jQuery lives in `frameworks`, and most
   * WordPress sites load jQuery — so the headline read "jQuery on Cloudflare",
   * and WordPress could not appear anywhere in the sentence because `cms` was
   * missing from the companion list too.
   *
   * This string is the share-card headline, the first line of every Markdown
   * export, the `summary` field of every JSON export and the report subtitle.
   */
  const wordpressSite = [
    { id: 'jquery', name: 'jQuery', category: 'frameworks' as const, confidence: 0.9 },
    { id: 'wordpress', name: 'WordPress', category: 'cms' as const, confidence: 0.98 },
    { id: 'woocommerce', name: 'WooCommerce', category: 'ecommerce' as const, confidence: 0.95 },
    { id: 'cloudflare', name: 'Cloudflare', category: 'hosting' as const, confidence: 0.9 },
  ].map((d) => ({ ...d, description: '', icon: d.id, website: '', version: null, matched: [] }))

  it('names the CMS, not the DOM library it happens to load', () => {
    const summary = stackSummary(wordpressSite as never)
    expect(summary).toBe('WordPress on Cloudflare with WooCommerce')
    expect(summary).not.toMatch(/^jQuery/)
  })

  it('still prefers a real framework over the CMS category', () => {
    const nextOnWordpress = [
      ...wordpressSite,
      { id: 'nextjs', name: 'Next.js', category: 'frameworks' as const, confidence: 0.95,
        description: '', icon: 'nextdotjs', website: '', version: null, matched: [] },
    ]
    expect(stackSummary(nextOnWordpress as never)).toMatch(/^Next\.js/)
  })
})
