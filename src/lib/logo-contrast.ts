/**
 * Whether a bundled brand mark needs lifting to stay visible on a dark surface.
 *
 * This existed twice — once in `popup/ToolLogo.tsx` and once in
 * `lib/share-image.ts` — and the two copies disagreed in two ways that both
 * showed up as a logo the user could not see:
 *
 *   - The card lifted below luminance 60, the panel below 90. Thirty-four of
 *     the 273 monochrome marks land in that gap, so Elastic, Datadog, Fireworks
 *     and Algolia were painted at raw brand hex on `#0B0B0F` — between 2.1:1
 *     and 2.9:1, under the 3:1 floor the rest of the product is held to.
 *   - The card parsed hex with `slice`, which cannot read the 3-digit form.
 *     One icon ships `#000`: every channel came back `NaN`, `NaN < 60` is
 *     false, so it drew pure black on near-black — an empty tile.
 *
 * One implementation, imported by both, so the panel and the card can no longer
 * disagree about whether a logo is visible.
 */

/** The dark surfaces both renderers draw onto. */
export const DARK_LIFT_THRESHOLD = 90

export function channels(hex: string): [number, number, number] {
  const value = hex.replace('#', '')
  // `#abc` is shorthand for `#aabbcc`. Expanding first is what makes the
  // 3-digit form parseable at all.
  const full = value.length === 3 ? value.replace(/./g, (c) => c + c) : value
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number]
}

/**
 * Perceived brightness, 0–255.
 *
 * An unparseable colour returns the midpoint rather than NaN, because NaN
 * silently fails every comparison it is used in — which is exactly how a black
 * mark ended up drawn on a black card.
 */
export function luminanceOf(hex: string): number {
  const [r, g, b] = channels(hex)
  return [r, g, b].some(Number.isNaN) ? 128 : (r * 299 + g * 587 + b * 114) / 1000
}

/**
 * A mark dark enough to disappear against a dark background.
 *
 * OpenAI's brand purple is the clearest case: legible on white, close to
 * invisible on near-black.
 */
export function needsDarkLift(hex: string): boolean {
  return luminanceOf(hex) < DARK_LIFT_THRESHOLD
}

/* -------------------------------------------------------------------------- */
/* The share card, where the background is known exactly                       */
/* -------------------------------------------------------------------------- */

/** Kept in step with share-image.ts. The tile sits on the card background. */
export const CARD_INK = '#F2F2F5'
export const CARD_TILE = '#15151A'

/** WCAG 2.1 relative luminance — the perceptual curve, not the 299/587/114 proxy. */
function relativeLuminance(hex: string): number {
  const [r, g, b] = channels(hex).map((c) => {
    const channel = (Number.isNaN(c) ? 128 : c) / 255
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05)
}

/**
 * The colour a monochrome mark is actually drawn in on the card.
 *
 * Decided by measuring contrast rather than by a brightness threshold, because
 * the two disagree. Raising the old luminance cut from 60 to 90 fixed 29 of the
 * 34 unreadable marks and left five — #4F46E5, #5C4C9F and friends sit above
 * any sensible brightness line while still landing at 2.6–3.0:1 on the tile,
 * since perceived brightness and WCAG relative luminance weight the channels
 * differently. Testing the property we care about has no such gap.
 */
export function cardLogoFill(hex: string): string {
  return contrastRatio(hex, CARD_TILE) >= 3 ? hex : CARD_INK
}
