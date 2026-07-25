import { CATEGORIES } from '@/fingerprints'
import { ToolLogo } from '@/popup/ToolLogo'
import type { CategoryId } from '@/types'

/**
 * A category-grouped list of technologies for the full-page views.
 *
 * Unlike the panel's card grid, descriptions are visible here. The panel hides
 * them to stay visual in a 400px box; a page has the room, and reading is what
 * a page is for.
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

export function TechList({ items, emptyLabel }: { items: TechItem[]; emptyLabel?: string }) {
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

          <ul className="divide-y divide-line overflow-hidden rounded-card border border-line dark:divide-line-dark dark:border-line-dark">
            {group.items.map((item) => {
              const Row = item.url ? 'a' : 'div'
              return (
                <li key={item.id}>
                  <Row
                    {...(item.url
                      ? { href: item.url, target: '_blank', rel: 'noreferrer' }
                      : {})}
                    className={`flex items-center gap-3 px-3.5 py-2.5 no-underline transition-colors ${
                      item.url ? 'hover:bg-card dark:hover:bg-card-dark' : ''
                    }`}
                  >
                    <ToolLogo icon={item.icon} name={item.name} size={24} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-ink dark:text-ink-dark">
                        {item.name}
                        {item.version && (
                          <span className="font-normal text-muted dark:text-muted-dark">
                            {' '}
                            {item.version}
                          </span>
                        )}
                      </span>
                      {item.description && (
                        <span className="block truncate text-[12px] text-muted dark:text-muted-dark">
                          {item.description}
                        </span>
                      )}
                    </span>
                    {item.url && (
                      <svg
                        viewBox="0 0 14 14"
                        width="12"
                        height="12"
                        aria-hidden="true"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        className="shrink-0 text-muted dark:text-muted-dark"
                      >
                        <path d="M5 2.5h6.5V9M11.5 2.5 4 10" />
                      </svg>
                    )}
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

export const isCategoryId = (value: string): value is CategoryId =>
  CATEGORIES.some((category) => category.id === value)
