import { ICONS } from '@/assets/icons.generated'

/**
 * Renders a tool's logo.
 *
 * Two cases, and the second matters more than it sounds: Simple Icons has
 * removed a number of major brands at their trademark holders' request — AWS,
 * LinkedIn, Salesforce and OpenAI among them — so roughly a third of the
 * database has no logo path available. Those render as a letter badge in the
 * brand's real colour, which keeps a grid of mixed logos and badges reading as
 * one designed set rather than as a set with holes in it.
 */

/** Marks this close to the page background disappear, so they get flipped. */
function isNearMonochrome(hex: string): boolean {
  const value = hex.replace('#', '')
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  if ([r, g, b].some(Number.isNaN)) return false
  const spread = Math.max(r, g, b) - Math.min(r, g, b)
  const luminance = (r * 299 + g * 587 + b * 114) / 1000
  return spread < 24 && (luminance < 48 || luminance > 210)
}

/**
 * One letter for a single-word name, two for a multi-word one.
 *
 * "OpenAI" reads better as "O" than as "OP" — the second letter of a word adds
 * noise, whereas the initials of two words genuinely identify the brand.
 */
function initials(name: string): string {
  const cleaned = name.replace(/[^A-Za-z0-9 ]/g, ' ').trim()
  const words = cleaned.split(/\s+/).filter(Boolean)
  if (words.length >= 2) return `${words[0]![0]}${words[1]![0]}`.toUpperCase()
  return (words[0]?.[0] ?? '?').toUpperCase()
}

export function ToolLogo({ icon, name, size = 28 }: { icon: string; name: string; size?: number }) {
  const entry = ICONS[icon]

  if (entry?.path) {
    const monochrome = isNearMonochrome(entry.hex)
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        role="img"
        aria-label={name}
        className={monochrome ? 'fill-ink dark:fill-ink-dark' : undefined}
        style={monochrome ? undefined : { fill: entry.hex }}
      >
        <path d={entry.path} />
      </svg>
    )
  }

  const hex = entry?.hex ?? '#6B6B76'
  return (
    <span
      role="img"
      aria-label={name}
      className="grid place-items-center rounded-[7px] font-semibold text-white"
      style={{
        width: size,
        height: size,
        background: hex,
        fontSize: Math.round(size * 0.36),
        letterSpacing: '0.01em',
      }}
    >
      {initials(name)}
    </span>
  )
}
