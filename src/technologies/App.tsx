import { useMemo, useState } from 'react'
import { CATEGORIES, DATABASE_FINGERPRINTS } from '@/fingerprints'
import { Page, SearchInput } from '@/ui/Page'
import { TechList } from '@/ui/TechList'

/**
 * Everything StackLens can detect.
 *
 * Two jobs: it answers "would this even find X" before someone goes hunting for
 * it, and it makes the breadth of the database visible — which is otherwise
 * invisible, since any single site only exercises a small slice of it.
 */
export function TechnologiesApp() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('all')

  const all = useMemo(
    () =>
      DATABASE_FINGERPRINTS.map((fingerprint) => ({
        id: fingerprint.id,
        name: fingerprint.name,
        category: fingerprint.category as string,
        icon: fingerprint.icon,
        description: fingerprint.description,
        url: fingerprint.website,
      })),
    [],
  )

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return all.filter((item) => {
      if (category !== 'all' && item.category !== category) return false
      if (!needle) return true
      const categoryName = CATEGORIES.find((c) => c.id === item.category)?.name ?? ''
      return (
        item.name.toLowerCase().includes(needle) ||
        item.description.toLowerCase().includes(needle) ||
        categoryName.toLowerCase().includes(needle)
      )
    })
  }, [all, query, category])

  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of all) map.set(item.category, (map.get(item.category) ?? 0) + 1)
    return map
  }, [all])

  return (
    <Page
      current="technologies"
      title="Technologies"
      subtitle={`${all.length} detectable across ${CATEGORIES.length} categories`}
      actions={
        <SearchInput value={query} onChange={setQuery} placeholder="Search technologies" />
      }
    >
      {/*
        Twenty-seven chips fill four rows before any content, so they are set
        inside one bordered field rather than floating loose on the page. That
        reads as a single control someone is choosing within, instead of
        twenty-seven separate buttons competing with the list below them.
      */}
      <div className="mb-6 flex flex-wrap gap-1.5 rounded-card border border-line p-2.5 dark:border-line-dark">
        <button
          type="button"
          onClick={() => setCategory('all')}
          className={`rounded-full border px-2.5 py-1 text-[12px] transition-colors ${
            category === 'all'
              ? 'border-transparent bg-ink text-bg dark:bg-ink-dark dark:text-bg-dark'
              : 'border-line text-muted hover:text-ink dark:border-line-dark dark:text-muted-dark dark:hover:text-ink-dark'
          }`}
        >
          All {all.length}
        </button>
        {CATEGORIES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setCategory(item.id)}
            className={`rounded-full border px-2.5 py-1 text-[12px] transition-colors ${
              category === item.id
                ? 'border-transparent bg-ink text-bg dark:bg-ink-dark dark:text-bg-dark'
                : 'border-line text-muted hover:text-ink dark:border-line-dark dark:text-muted-dark dark:hover:text-ink-dark'
            }`}
          >
            {item.name}{' '}
            <span className="tabular-nums opacity-60">{counts.get(item.id) ?? 0}</span>
          </button>
        ))}
      </div>

      {query.trim() && (
        <p className="mb-4 text-[12px] text-muted dark:text-muted-dark">
          {filtered.length} {filtered.length === 1 ? 'match' : 'matches'}
        </p>
      )}

      {/* Two columns: this is the whole catalogue being scanned, not read. */}
      <TechList items={filtered} columns={2} emptyLabel={`Nothing matches “${query.trim()}”.`} />
    </Page>
  )
}
