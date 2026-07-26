import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Guards on the design system itself.
 *
 * Both rules here exist because the thing they check went wrong silently and
 * stayed wrong through several rounds of review: ten arbitrary font sizes
 * accumulated one surface at a time, and focus rings shipped at 2.03:1 because
 * an alpha suffix looks harmless in a class string. Neither is visible to a
 * test that drives the UI — the interface works perfectly, it is just not
 * readable — so they are checked at the source.
 */

const css = readFileSync('src/styles.css', 'utf8')

function tsxFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...tsxFiles(path))
    else if (entry.name.endsWith('.tsx')) out.push(path)
  }
  return out
}

/** Relative luminance per WCAG 2.1. */
function luminance(hex: string): number {
  const value = hex.replace('#', '')
  const full = value.length === 3 ? value.replace(/./g, (c) => c + c) : value
  const [r, g, b] = [0, 2, 4].map((i) => {
    const channel = parseInt(full.slice(i, i + 2), 16) / 255
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light! + 0.05) / (dark! + 0.05)
}

/** Reads a `--color-*` token out of the `@theme` block. */
function token(name: string): string {
  const match = new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{3,8});`).exec(css)
  if (!match) throw new Error(`missing --color-${name}`)
  return match[1]!
}

describe('colour tokens', () => {
  const pairs: [string, string, string, number][] = [
    // [label, foreground, background, minimum]
    ['ink on bg', 'ink', 'bg', 4.5],
    ['ink on card', 'ink', 'card', 4.5],
    ['muted on bg', 'muted', 'bg', 4.5],
    ['muted on card', 'muted', 'card', 4.5],
    ['ink-dark on bg-dark', 'ink-dark', 'bg-dark', 4.5],
    ['ink-dark on card-dark', 'ink-dark', 'card-dark', 4.5],
    ['muted-dark on bg-dark', 'muted-dark', 'bg-dark', 4.5],
    ['muted-dark on card-dark', 'muted-dark', 'card-dark', 4.5],
    // A focus indicator is a non-text element: WCAG 1.4.11 asks 3:1.
    ['accent on bg', 'accent', 'bg', 3],
    ['accent-dark on bg-dark', 'accent-dark', 'bg-dark', 3],
    ['accent on card', 'accent', 'card', 3],
    ['accent-dark on card-dark', 'accent-dark', 'card-dark', 3],
  ]

  for (const [label, fg, bg, min] of pairs) {
    it(`${label} clears ${min}:1`, () => {
      const ratio = contrast(token(fg), token(bg))
      expect(ratio, `${label} is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(min)
    })
  }

  it('gives every control that drops the UA outline an undiluted indicator', () => {
    /*
     * The real rule, rather than "no alpha anywhere". A soft translucent halo is
     * fine as decoration — the search inputs pair one with a full-strength
     * `focus:border-accent`, and the border is what carries the 3:1. What is not
     * fine is an element that removes the browser's own focus ring and replaces
     * it with `ring-accent/40`, which computes to 2.03:1 light and 1.87:1 dark.
     * That shipped on four controls, including the panel's primary one, and no
     * test could see it because the class name still says "accent".
     */
    const offenders: string[] = []
    for (const file of tsxFiles('src')) {
      const source = readFileSync(file, 'utf8')
      for (const match of source.matchAll(/(?:className=)(?:"([^"]*)"|\{`([^`]*)`\}|'([^']*)')/g)) {
        const classes = match[1] ?? match[2] ?? match[3] ?? ''
        if (!classes.includes('focus:outline-none')) continue
        const undiluted = /(?:ring|border)-accent(?:-dark)?(?![\w/-])/.test(classes)
        if (!undiluted) offenders.push(`${file}: ${classes.slice(0, 80)}…`)
      }
    }
    expect(offenders).toEqual([])
  })
})

describe('type scale', () => {
  it('defines every step it claims to', () => {
    for (const step of ['2xs', 'xs', 'sm', 'base', 'lg', '2xl', '3xl']) {
      expect(css, `--text-${step}`).toContain(`--text-${step}:`)
    }
  })

  it('has no arbitrary font sizes left anywhere in src', () => {
    /*
     * The interface reached ten distinct sizes — 10, 10.5, 11, 12, 12.5, 13,
     * 14, 15, 22, 28 — each added in isolation while tuning one surface. Half
     * a pixel apart is not a hierarchy, and nothing about a bracket value looks
     * wrong in a diff, so the scale only stays a scale if something enforces it.
     */
    const offenders: string[] = []
    for (const file of tsxFiles('src')) {
      for (const match of readFileSync(file, 'utf8').matchAll(/text-\[[\d.]+px\]/g)) {
        offenders.push(`${file}: ${match[0]}`)
      }
    }
    expect(offenders).toEqual([])
  })
})
