import type { CategoryGroup as Group } from '@/lib/grouping'
import { ToolCard, type CardVariant } from './ToolCard'

/**
 * A category label above its tools.
 *
 * The label is deliberately quiet — small, uppercase, muted — so it reads as
 * structure rather than as content competing with the logos. The count sits
 * beside it for scanning, which matters once the collapsed half is open and
 * there are twenty of these.
 *
 * The grid adapts to the category rather than the category being poured into a
 * fixed grid: one tool fills the row, two split it, three or more fall back to
 * the tile grid the panel was designed around. A three-wide grid applied to
 * every category left most of the panel empty, because most categories hold one
 * or two things.
 */
function layoutFor(count: number): { variant: CardVariant; columns: string } {
  if (count === 1) return { variant: 'wide', columns: 'grid-cols-1' }
  if (count === 2) return { variant: 'half', columns: 'grid-cols-2' }
  return { variant: 'tile', columns: 'grid-cols-3' }
}

export function CategoryGroup({ group, startIndex }: { group: Group; startIndex: number }) {
  const { variant, columns } = layoutFor(group.detections.length)

  return (
    <section className="mb-3.5">
      <div className="mb-1.5 flex items-baseline gap-1.5">
        <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted dark:text-muted-dark">
          {group.category.name}
        </h2>
        {group.detections.length > 1 && (
          <span className="text-2xs font-medium tabular-nums text-muted dark:text-muted-dark">
            {group.detections.length}
          </span>
        )}
      </div>
      <div className={`grid gap-2 ${columns}`}>
        {group.detections.map((detection, i) => (
          <ToolCard
            key={detection.id}
            detection={detection}
            index={startIndex + i}
            column={i % 3}
            variant={variant}
          />
        ))}
      </div>
    </section>
  )
}
