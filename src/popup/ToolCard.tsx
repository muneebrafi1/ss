import { displayVersion } from '@/lib/summary'
import type { Detection } from '@/types'
import { ToolLogo } from './ToolLogo'

/**
 * One tool in a category.
 *
 * The card comes in three widths, chosen by how many tools its category holds.
 * That exists because the fixed three-column grid left most of the panel empty:
 * on a typical site four of the six open categories contain exactly one tool,
 * and each of those printed one square card into a three-wide row, wasting
 * two-thirds of it. Sizing the card to the row means nothing is ever part-empty
 * and the panel shows roughly twice as much before the first scroll.
 *
 * The two wider variants print the description inline instead of on hover. They
 * have the horizontal room the tile never had, and a category holding a single
 * tool is precisely where a reader wants to know what that tool is. Tiles keep
 * the tooltip, so the dense case stays visual rather than turning into prose.
 */

export type CardVariant = 'wide' | 'half' | 'tile'

export function ToolCard({
  detection,
  index,
  column,
  variant,
}: {
  detection: Detection
  index: number
  /** Column in the tile grid, used to keep the tooltip inside the panel. */
  column: number
  variant: CardVariant
}) {
  const version = displayVersion(detection.version)

  function open() {
    void chrome.tabs.create({ url: detection.url })
  }

  const shell =
    'sl-rise sl-card w-full cursor-pointer rounded-card border border-line bg-card hover:bg-card-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 dark:border-line-dark dark:bg-card-dark dark:hover:bg-card-hover-dark dark:focus-visible:ring-accent-dark/40'

  /*
   * What the card says, as one string on the element itself.
   *
   * The end-to-end suites used to read card names out of a styling class, which
   * meant a layout change silently broke every detection assertion. This is a
   * contract with the tests rather than an accident of the markup.
   */
  const label = version ? `${detection.name} ${version}` : detection.name

  if (variant !== 'tile') {
    return (
      <button
        type="button"
        onClick={open}
        data-tool={label}
        style={{ '--i': index } as React.CSSProperties}
        className={`${shell} flex items-center gap-2.5 px-2.5 py-2 text-left`}
      >
        <ToolLogo icon={detection.icon} name={detection.name} size={26} />
        <span className="min-w-0 flex-1">
          {/*
            The name gets the first line to itself. Trailing the version after it
            was what pushed "Anthropic claude-…" off the edge of a half-width
            card — the name is the thing that must always be complete, and a
            model id leading the second line reads as the more specific answer
            rather than as an interruption.
          */}
          <span className="block truncate text-[12.5px] font-medium leading-tight text-ink dark:text-ink-dark">
            {detection.name}
          </span>
          <span className="mt-0.5 block truncate text-[11px] leading-tight text-muted dark:text-muted-dark">
            {version && (
              <span className="font-medium text-ink/70 dark:text-ink-dark/70">{version} · </span>
            )}
            {detection.description}
          </span>
        </span>
      </button>
    )
  }

  // Edge columns anchor their tooltip inward so it cannot overflow the popup.
  const tooltipPosition =
    column === 0 ? 'left-0' : column === 2 ? 'right-0' : 'left-1/2 -translate-x-1/2'

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={open}
        data-tool={label}
        style={{ '--i': index } as React.CSSProperties}
        className={`${shell} flex h-[88px] flex-col items-center justify-center gap-1.5 px-1.5`}
      >
        <ToolLogo icon={detection.icon} name={detection.name} />
        <span className="w-full px-0.5 text-center leading-tight">
          {/*
            The version sits on its own line rather than flowing after the name.
            Inline, a long model id dragged the name into a mid-word break and
            clipped both; stacked, the name is always readable and the id
            truncates on its own.
          */}
          <span className="block truncate text-[12.5px] font-medium text-ink dark:text-ink-dark">
            {detection.name}
          </span>
          {version && (
            <span className="mt-px block truncate text-[10.5px] font-normal text-muted dark:text-muted-dark">
              {version}
            </span>
          )}
        </span>
      </button>

      <span
        role="tooltip"
        className={`sl-tip pointer-events-none absolute bottom-full z-10 mb-1.5 w-max max-w-[190px] rounded-btn bg-ink px-2 py-1.5 text-[11px] leading-snug text-bg opacity-0 group-hover:opacity-100 dark:bg-ink-dark dark:text-bg-dark ${tooltipPosition}`}
      >
        {detection.description}
      </span>
    </div>
  )
}
