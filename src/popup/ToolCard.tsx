import type { Detection } from '@/types'
import { ToolLogo } from './ToolLogo'

/**
 * One tool in the grid: logo, name, and — on hover — a one-line description.
 *
 * Keeping the description in a tooltip rather than printing it under every name
 * is what holds the panel visual instead of textual. Twenty cards each carrying
 * two lines of prose reads as a spreadsheet; twenty logos reads as a stack.
 */
export function ToolCard({
  detection,
  index,
  column,
}: {
  detection: Detection
  index: number
  /** Column in the 3-wide grid, used to keep the tooltip inside the panel. */
  column: number
}) {
  // Edge columns anchor their tooltip inward so it cannot overflow the popup.
  const tooltipPosition =
    column === 0
      ? 'left-0'
      : column === 2
        ? 'right-0'
        : 'left-1/2 -translate-x-1/2'

  function open() {
    void chrome.tabs.create({ url: detection.url })
  }

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={open}
        style={{ '--i': index } as React.CSSProperties}
        className="sl-rise flex h-[88px] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-card border border-line bg-card px-1.5 transition-colors duration-150 hover:bg-card-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 dark:border-line-dark dark:bg-card-dark dark:hover:bg-card-hover-dark dark:focus-visible:ring-ink-dark/40"
      >
        <ToolLogo icon={detection.icon} name={detection.name} />
        <span className="line-clamp-2 text-center text-[13px] font-medium leading-tight text-ink dark:text-ink-dark">
          {detection.name}
          {detection.version && (
            <span className="font-normal text-muted dark:text-muted-dark"> {detection.version}</span>
          )}
        </span>
      </button>

      <span
        role="tooltip"
        className={`pointer-events-none absolute bottom-full z-10 mb-1.5 w-max max-w-[190px] rounded-btn bg-ink px-2 py-1.5 text-[11px] leading-snug text-bg opacity-0 transition-opacity duration-150 group-hover:opacity-100 dark:bg-ink-dark dark:text-bg-dark ${tooltipPosition}`}
      >
        {detection.description}
      </span>
    </div>
  )
}
