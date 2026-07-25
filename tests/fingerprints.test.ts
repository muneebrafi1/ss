import { describe, expect, it } from 'vitest'
import { CATEGORIES, DATABASE_FINGERPRINTS, validateDatabase } from '@/fingerprints'
import { emptyEvidence } from '@/types'
import { detect } from '@/engine'
import { ICONS } from '@/assets/icons.generated'

describe('fingerprint database', () => {
  it('has no structural problems', () => {
    // Reported as a list so one run surfaces every issue, not just the first.
    expect(validateDatabase()).toEqual([])
  })

  it('covers every declared category', () => {
    const used = new Set(DATABASE_FINGERPRINTS.map((f) => f.category))
    const empty = CATEGORIES.filter((c) => !used.has(c.id)).map((c) => c.id)
    expect(empty).toEqual([])
  })

  it('is large enough to be useful on real sites', () => {
    expect(DATABASE_FINGERPRINTS.length).toBeGreaterThanOrEqual(180)
  })

  it('detects nothing at all from empty evidence', () => {
    // The most important guarantee in the product: a page we learned nothing
    // about must produce an empty panel rather than a plausible-looking guess.
    expect(detect(emptyEvidence(), DATABASE_FINGERPRINTS)).toEqual([])
  })

  it('keeps patterns over large haystacks specific enough', () => {
    // Applies only to signals matched against a big blob of text. `header` and
    // `meta` patterns are scoped to one named field, so /PHP/ on `x-powered-by`
    // is precise where the same pattern over page HTML would match anything.
    const tooLoose: string[] = []
    for (const f of DATABASE_FINGERPRINTS) {
      for (const s of f.signals) {
        const broad =
          s.type === 'request' || s.type === 'script' || s.type === 'html' || s.type === 'bundle'
        if (broad && s.pattern.source.length < 8) {
          tooLoose.push(`${f.id}: /${s.pattern.source}/`)
        }
      }
    }
    expect(tooLoose).toEqual([])
  })

  it('rests every entry on two signals, or one that is proof on its own', () => {
    /*
     * The rule that stops a detection from being one coincidence away from
     * wrong. Under noisy-OR a lone 0.6 signal lands exactly on the display
     * threshold, so a single change in how a site loads that service drops the
     * detection entirely — and because the panel shows no confidence, nobody
     * would ever see that it had. Either corroborate it, or use a signal strong
     * enough to be proof by itself: a scoped package specifier, a branded
     * cookie, a vendor's own hostname.
     *
     * `scripts/audit-signals.mjs` reports which entries fall short and what
     * they already carry, which a failing assertion cannot.
     */
    const thin: string[] = []
    for (const f of DATABASE_FINGERPRINTS) {
      const strongest = f.signals.reduce((max, s) => Math.max(max, s.weight), 0)
      if (f.signals.length < 2 && strongest < 0.9) {
        thin.push(`${f.id} (${f.signals.length} signal, strongest ${strongest})`)
      }
    }
    expect(thin).toEqual([])
  })

  it('anchors every cookie and storage key pattern', () => {
    // These match short strings, so an unanchored fragment collides easily —
    // /session/ would hit half the cookies on the web.
    const unanchored: string[] = []
    for (const f of DATABASE_FINGERPRINTS) {
      for (const s of f.signals) {
        if ((s.type === 'cookie' || s.type === 'storage') && !/^\^|\$$/.test(s.pattern.source)) {
          unanchored.push(`${f.id}: /${s.pattern.source}/`)
        }
      }
    }
    expect(unanchored).toEqual([])
  })

  it('has a bundled icon entry for every fingerprint', () => {
    // Guards the generated icon map against drift: adding a fingerprint with a
    // new slug without regenerating would otherwise ship a blank card.
    const unresolved = DATABASE_FINGERPRINTS.filter((f) => !ICONS[f.icon]).map(
      (f) => `${f.id} -> ${f.icon}`,
    )
    expect(unresolved).toEqual([])
  })

  it('never assigns a global-path signal an empty path', () => {
    const bad = DATABASE_FINGERPRINTS.flatMap((f) =>
      f.signals
        .filter((s) => s.type === 'global' && !s.path.trim())
        .map(() => f.id),
    )
    expect(bad).toEqual([])
  })
})
