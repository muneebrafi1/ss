import { describe, expect, it } from 'vitest'
import { detect } from '@/engine'
import { DATABASE_FINGERPRINTS } from '@/fingerprints'
import { groupDetections } from '@/lib/grouping'
import { formatExport, toCsv, toJson, toMarkdown } from '@/lib/export'
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

  it('writes csv with a header row and one line per technology', () => {
    const lines = toCsv('app.fixture.test', detections).split('\n')
    expect(lines[0]).toBe('Name,Category,Version,Description,Website')
    expect(lines.length).toBe(detections.length + 1)
  })

  it('escapes quotes in csv rather than corrupting the row', () => {
    const csv = toCsv('x', [
      { ...detections[0]!, name: 'A "quoted" name', description: 'has, a comma' },
    ])
    expect(csv).toContain('"A ""quoted"" name"')
    expect(csv).toContain('"has, a comma"')
  })

  it('routes every format through one entry point', () => {
    for (const format of ['markdown', 'json', 'csv'] as const) {
      expect(formatExport(format, 'app.fixture.test', detections).length).toBeGreaterThan(0)
    }
  })
})
