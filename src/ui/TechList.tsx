import { CATEGORIES } from '@/fingerprints'
import { displayVersion } from '@/lib/summary'
import { ToolLogo } from '@/popup/ToolLogo'

/**
 * A category-grouped list of technologies for the full-page views.
 *
 * Unlike the panel's card grid, descriptions are visible here. The panel hides
 * them to stay visual in a 400px box; a page has the room, and reading is what
 * a page is for.
 *
 * The column count is a prop because the two callers are doing different jobs.
 * The report shows one site's stack — a dozen or so rows, read top to bottom, so
 * one column is right. The technologies page is the whole 532-entry catalogue
 * being scanned for a name, and a single column there spends 850px on a logo, a
 * name and a two-word description while doubling the scrolling.
 */

export interface TechItem {
  id: string
  name: string
  category: string
  icon: string
  description?: string
  version?: string | null
  url?: string
}

export function TechList({
  items,
  emptyLabel,
  columns = 1,
}: {
  items: TechItem[]
  emptyLabel?: string
  columns?: 1 | 2
}) {
  const byCategory = new Map<string, TechItem[]>()
  for (const item of items) {
    const list = byCategory.get(item.category) ?? []
    list.push(item)
    byCategory.set(item.category, list)
  }

  const groups = CATEGORIES.filter((category) => byCategory.has(category.id)).map((category) => ({
    category,
    items: (byCategory.get(category.id) ?? []).sort((a, b) => a.name.localeCompare(b.name)),
  }))

  if (groups.length === 0) {
    return (
      <p className="py-10 text-center text-[13px] text-muted dark:text-muted-dark">
        {emptyLabel ?? 'Nothing to show.'}
      </p>
    )
  }

  return (
    <div className="space-y-7">
      {groups.map((group) => (
        <section key={group.category.id}>
          <div className="mb-2 flex items-baseline gap-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted dark:text-muted-dark">
              {group.category.name}
            </h2>
            <span className="text-[10px] tabular-nums text-muted/70 dark:text-muted-dark/70">
              {group.items.length}
            </span>
          </div>

          <ul className={`grid gap-2 ${columns === 2 ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
            {group.items.map((item) => {
              const Row = item.url ? 'a' : 'div'
              const version = displayVersion(item.version ?? null)
              return (
                <li key={item.id}>
                  <Row
                    {...(item.url ? { href: item.url, target: '_blank', rel: 'noreferrer' } : {})}
                    className={`flex h-full items-center gap-3 rounded-card border border-line px-3 py-2.5 no-underline transition-colors dark:border-line-dark ${
                      item.url ? 'hover:bg-card dark:hover:bg-card-dark' : ''
                    }`}
                  >
                    <ToolLogo icon={item.icon} name={item.name} size={30} tile />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-[13px] font-medium text-ink dark:text-ink-dark">
                          {item.name}
                        </span>
                        {version && (
                          <span className="shrink-0 text-[12px] font-normal text-muted dark:text-muted-dark">
                            {version}
                          </span>
                        )}
                        {/*
                          Next to the name rather than pinned to the far edge.
                          Across an 850px row the arrow was marooned so far from
                          the text that it read as belonging to nothing.
                        */}
                        {item.url && (
                          <svg
                            viewBox="0 0 14 14"
                            width="11"
                            height="11"
                            aria-hidden="true"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            className="shrink-0 text-muted/70 dark:text-muted-dark/70"
                          >
                            <path d="M5 2.5h6.5V9M11.5 2.5 4 10" />
                          </svg>
                        )}
                      </span>
                      {item.description && (
                        <span className="mt-0.5 block truncate text-[12px] text-muted dark:text-muted-dark">
                          {item.description}
                        </span>
                      )}
                    </span>
                  </Row>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
