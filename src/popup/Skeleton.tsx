/**
 * Loading state.
 *
 * Mirrors the real layout — a category label above a three-wide grid — so the
 * panel does not visibly jump when results arrive.
 */
export function Skeleton() {
  return (
    <div className="px-4 pt-4" aria-busy="true" aria-label="Scanning">
      {[0, 1].map((section) => (
        <div key={section} className="mb-4">
          <div className="sl-shimmer mb-1.5 h-2.5 w-20 rounded bg-gradient-to-r from-line via-card to-line dark:from-line-dark dark:via-card-dark dark:to-line-dark" />
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((card) => (
              <div
                key={card}
                className="sl-shimmer h-[88px] rounded-card bg-gradient-to-r from-card via-line to-card dark:from-card-dark dark:via-line-dark dark:to-card-dark"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
