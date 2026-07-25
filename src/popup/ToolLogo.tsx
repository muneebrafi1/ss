import { ICONS } from '@/assets/icons.generated'

/**
 * Renders a tool's logo.
 *
 * Three cases, and the third matters more than it sounds. Around a fifth of the
 * database has no freely licensed brand mark in any offline source — Simple
 * Icons has removed many at their trademark holders' request, and newer SaaS
 * brands were never added anywhere. Those render as a tinted monogram in the
 * brand's own colour, which reads as a deliberate treatment rather than as a
 * hole in the grid.
 *
 * The tint is the same pattern avatars use in Linear or Notion: the brand
 * colour at low opacity behind the same colour at full strength. It sits
 * comfortably beside real logos, which are mostly colour-on-transparent, in a
 * way a solid block of colour does not.
 */

/**
 * Marks close to the page background disappear against it, so they adopt the
 * text colour instead. Judged on both spread and luminance, so a genuinely
 * coloured mark is never flattened to grey.
 */
function channels(hex: string): [number, number, number] {
  const value = hex.replace('#', '')
  const full = value.length === 3 ? value.replace(/./g, (c) => c + c) : value
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number]
}

function luminanceOf(hex: string): number {
  const [r, g, b] = channels(hex)
  return [r, g, b].some(Number.isNaN) ? 128 : (r * 299 + g * 587 + b * 114) / 1000
}

function isNearMonochrome(hex: string): boolean {
  const [r, g, b] = channels(hex)
  if ([r, g, b].some(Number.isNaN)) return false
  const spread = Math.max(r, g, b) - Math.min(r, g, b)
  const luminance = luminanceOf(hex)
  return spread < 24 && (luminance < 48 || luminance > 210)
}

/**
 * A coloured mark dark enough to disappear against the dark card.
 *
 * OpenAI's brand purple is the clearest case: perfectly legible on white, close
 * to invisible on near-black. Lifting it in dark mode keeps the brand's hue
 * while restoring contrast, which is better than either flattening it to grey
 * or leaving it unreadable.
 */
function needsDarkLift(hex: string): boolean {
  return luminanceOf(hex) < 90
}

/**
 * One letter for a single-word name, two for a multi-word one.
 *
 * "OpenAI" reads better as "O" than as "OP" — a word's second letter is noise,
 * whereas the initials of two words genuinely identify the brand.
 */
function initials(name: string): string {
  const cleaned = name.replace(/[^A-Za-z0-9 ]/g, ' ').trim()
  const words = cleaned.split(/\s+/).filter(Boolean)
  if (words.length >= 2) return `${words[0]![0]}${words[1]![0]}`.toUpperCase()
  return (words[0]?.[0] ?? '?').toUpperCase()
}

export function ToolLogo({ icon, name, size = 28 }: { icon: string; name: string; size?: number }) {
  const entry = ICONS[icon]

  if (entry?.body) {
    // Monochrome silhouettes may be recoloured for contrast; full-colour brand
    // artwork is left exactly as the brand draws it.
    const recolour = entry.mono && isNearMonochrome(entry.hex)
    const lift = entry.mono && !recolour && needsDarkLift(entry.hex)
    return (
      <svg
        viewBox={entry.vb ?? '0 0 24 24'}
        width={size}
        height={size}
        role="img"
        aria-label={name}
        className={
          recolour ? 'fill-ink dark:fill-ink-dark' : lift ? 'sl-logo-lift' : undefined
        }
        style={
          recolour
            ? undefined
            : entry.mono
              ? ({ ['--sl-logo' as string]: entry.hex, fill: lift ? undefined : entry.hex })
              : undefined
        }
        dangerouslySetInnerHTML={{ __html: entry.body }}
      />
    )
  }

  return (
    <span
      role="img"
      aria-label={name}
      className="sl-monogram grid shrink-0 place-items-center rounded-[8px] font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.42),
        ['--sl-brand' as string]: entry?.hex ?? '#6B6B76',
      }}
    >
      {initials(name)}
    </span>
  )
}
