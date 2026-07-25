import { useState } from 'react'
import type { CategoryGroup as Group } from '@/lib/grouping'
import { CategoryGroup } from './CategoryGroup'

/**
 * The collapsed half of the panel.
 *
 * With 26 categories a busy site would otherwise open to a wall of cards. The
 * six most-wanted categories stay open and everything else waits behind one
 * click, so the panel opens short on every site regardless of how much was
 * found.
 */
export function MoreSection({
  groups,
  count,
  startIndex,
}: {
  groups: Group[]
  count: number
  startIndex: number
}) {
  const [open, setOpen] = useState(false)
  if (groups.length === 0) return null

  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="mb-3 flex w-full items-center gap-1.5 border-t border-line pt-3 text-[12px] font-medium text-muted transition-colors hover:text-ink dark:border-line-dark dark:text-muted-dark dark:hover:text-ink-dark"
      >
        <svg
          viewBox="0 0 12 12"
          width="12"
          height="12"
          aria-hidden="true"
          className={`transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
        >
          <path d="M4.5 2.5L8 6l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {open ? 'Show less' : `${count} more ${count === 1 ? 'tool' : 'tools'}`}
      </button>

      {open &&
        groups.map((group, i) => (
          <CategoryGroup
            key={group.category.id}
            group={group}
            startIndex={
              startIndex + groups.slice(0, i).reduce((n, g) => n + g.detections.length, 0)
            }
          />
        ))}
    </div>
  )
}
