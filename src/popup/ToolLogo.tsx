import { iconEntry } from '@/assets/icons.generated'

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

/**
 * Wraps a mark in a recessed square.
 *
 * The database holds 532 brand marks from five sources, and their aspect ratios
 * and visual weights are wildly uneven — a wordmark renders as a thin sliver
 * beside a letterform that fills its whole box. In a list that reads as broken
 * layout rather than as different brands. The share card solved this by drawing
 * every logo into a tile (`drawTile` in `src/lib/share-image.ts`); this is the
 * same treatment in the DOM, so the pages and the exported image agree.
 */
function Tile({ size, children }: { size: number; children: React.ReactNode }) {
  return (
    <span
      className="grid shrink-0 place-items-center border border-line bg-card dark:border-line-dark dark:bg-card-dark"
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.28) }}
    >
      {children}
    </span>
  )
}

export function ToolLogo({
  icon,
  name,
  size = 28,
  tile = false,
}: {
  icon: string
  name: string
  size?: number
  /** Renders the mark inside a recessed square, for lists of many brands. */
  tile?: boolean
}) {
  const entry = iconEntry(icon)
  // Inside a tile the mark is drawn smaller so the square, not the artwork,
  // sets the rhythm of the row.
  const markSize = tile ? Math.round(size * 0.62) : size

  if (entry?.body) {
    // Monochrome silhouettes may be recoloured for contrast; full-colour brand
    // artwork is left exactly as the brand draws it.
    const recolour = entry.mono && isNearMonochrome(entry.hex)
    const lift = entry.mono && !recolour && needsDarkLift(entry.hex)
    const mark = (
      <svg
        viewBox={entry.vb ?? '0 0 24 24'}
        width={markSize}
        height={markSize}
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
    return tile ? <Tile size={size}>{mark}</Tile> : mark
  }

  // A monogram already fills its own tinted square, so it never gets a second
  // one — nesting the two would read as a box inside a box.
  return (
    <span
      role="img"
      aria-label={name}
      className="sl-monogram grid shrink-0 place-items-center font-semibold"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * (tile ? 0.28 : 0.29)),
        fontSize: Math.round(size * 0.42),
        ['--sl-brand' as string]: entry?.hex ?? '#6B6B76',
      }}
    >
      {initials(name)}
    </span>
  )
}
