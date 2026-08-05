/**
 * Loading state.
 *
 * Its whole job is to occupy the shape the results will occupy, so the panel
 * does not jump when they arrive. That means it has to track the real layout:
 * cards now size to how many tools a category holds — one fills the row, two
 * split it, three or more fall back to the tile grid — so a skeleton of three
 * uniform tile rows describes a panel that no longer exists and produces the
 * exact jump it was built to prevent.
 *
 * The shape below is the common case on a real site: a couple of full-width
 * rows, a split pair, then a tile row.
 */

const ROWS = [
  { cols: 1, tall: false },
  { cols: 2, tall: false },
  { cols: 1, tall: false },
  { cols: 3, tall: true },
]

export function Skeleton() {
  return (
    <div className="px-3.5 pt-3.5" aria-busy="true" aria-label="Scanning this page">
      {ROWS.map((row, i) => (
        <div key={i} className="mb-3.5">
          <div className="sl-shimmer mb-1.5 h-2.5 w-20 rounded bg-gradient-to-r from-line via-card to-line dark:from-line-dark dark:via-card-dark dark:to-line-dark" />
          <div className={`grid gap-2 ${row.cols === 1 ? 'grid-cols-1' : row.cols === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {Array.from({ length: row.cols }, (_, card) => (
              <div
                key={card}
                className={`sl-shimmer rounded-card bg-gradient-to-r from-card via-line to-card dark:from-card-dark dark:via-line-dark dark:to-card-dark ${
                  row.tall ? 'h-[88px]' : 'h-[52px]'
                }`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
