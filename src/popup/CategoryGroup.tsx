import type { CategoryGroup as Group } from '@/lib/grouping'
import { ToolCard } from './ToolCard'

/**
 * A category label above a three-wide grid of tools.
 *
 * The label is deliberately quiet — small, uppercase, muted — so it reads as
 * structure rather than as content competing with the logos. The count sits
 * beside it for scanning, which matters once the collapsed half is open and
 * there are twenty of these.
 */
export function CategoryGroup({ group, startIndex }: { group: Group; startIndex: number }) {
  return (
    <section className="mb-4">
      <div className="mb-1.5 flex items-baseline gap-1.5">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted dark:text-muted-dark">
          {group.category.name}
        </h2>
        {group.detections.length > 1 && (
          <span className="text-[10px] font-medium tabular-nums text-muted/70 dark:text-muted-dark/70">
            {group.detections.length}
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {group.detections.map((detection, i) => (
          <ToolCard
            key={detection.id}
            detection={detection}
            index={startIndex + i}
            column={i % 3}
          />
        ))}
      </div>
    </section>
  )
}
