import { CATEGORIES, CATEGORY_ORDER, OPEN_CATEGORY_COUNT } from '@/fingerprints'
import type { Category, Detection } from '@/types'

export interface CategoryGroup {
  category: Category
  detections: Detection[]
}

export interface GroupedDetections {
  /** Rendered expanded when the panel opens. */
  open: CategoryGroup[]
  /** Behind "N more tools". */
  collapsed: CategoryGroup[]
  /** How many detections sit in the collapsed half. */
  collapsedCount: number
  total: number
}

/**
 * Groups detections into the panel's fixed category order.
 *
 * The order never varies between sites so the layout becomes learnable, and it
 * is ranked by what people care about rather than by how a site is assembled.
 *
 * Empty categories disappear entirely, and the open section is filled by
 * promotion rather than by position: if a site has no AI or database, the next
 * non-empty categories move up. Without that, a site whose stack happens to sit
 * in the lower categories would open to a nearly blank panel with everything
 * hidden behind "more".
 */
export function groupDetections(detections: Detection[]): GroupedDetections {
  const byCategory = new Map<string, Detection[]>()
  for (const detection of detections) {
    const list = byCategory.get(detection.category) ?? []
    list.push(detection)
    byCategory.set(detection.category, list)
  }

  const populated: CategoryGroup[] = CATEGORIES.filter((category) =>
    byCategory.has(category.id),
  ).map((category) => ({
    category,
    detections: (byCategory.get(category.id) ?? []).sort(
      (a, b) => b.confidence - a.confidence || a.name.localeCompare(b.name),
    ),
  }))

  populated.sort(
    (a, b) =>
      (CATEGORY_ORDER.get(a.category.id) ?? 0) - (CATEGORY_ORDER.get(b.category.id) ?? 0),
  )

  const open = populated.slice(0, OPEN_CATEGORY_COUNT)
  const collapsed = populated.slice(OPEN_CATEGORY_COUNT)

  return {
    open,
    collapsed,
    collapsedCount: collapsed.reduce((n, group) => n + group.detections.length, 0),
    total: detections.length,
  }
}
