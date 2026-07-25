import type { CategoryGroup as Group } from '@/lib/grouping'
import { ToolCard } from './ToolCard'

/**
 * A category label above a three-wide grid of tools.
 *
 * The label is deliberately quiet — small, uppercase, muted — so it reads as
 * structure rather than as content competing with the logos.
 */
export function CategoryGroup({ group, startIndex }: { group: Group; startIndex: number }) {
  return (
    <section className="mb-4">
      <h2 className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted dark:text-muted-dark">
        {group.category.name}
      </h2>
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
