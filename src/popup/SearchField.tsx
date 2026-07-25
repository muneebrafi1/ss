import { useEffect, useRef } from 'react'

/**
 * Filters the results.
 *
 * Only rendered once a site has enough detections that scanning the grid gets
 * slower than typing. Below that it would be UI for its own sake.
 */
export function SearchField({
  value,
  onChange,
  matchCount,
}: {
  value: string
  onChange: (value: string) => void
  matchCount: number
}) {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      // "/" is the search convention on sites full of results; Escape clears.
      if (event.key === '/' && document.activeElement !== ref.current) {
        event.preventDefault()
        ref.current?.focus()
      }
      if (event.key === 'Escape' && document.activeElement === ref.current) {
        if (ref.current?.value) onChange('')
        else ref.current?.blur()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onChange])

  return (
    <div className="relative px-3.5 pt-3">
      <svg
        viewBox="0 0 16 16"
        width="13"
        height="13"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="pointer-events-none absolute left-[26px] top-[21px] text-muted dark:text-muted-dark"
      >
        <circle cx="7" cy="7" r="4.6" />
        <path d="M10.4 10.4 14 14" />
      </svg>

      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Filter technologies"
        aria-label="Filter technologies"
        className="h-8 w-full rounded-btn border border-line bg-card pl-7 pr-3 text-[12px] text-ink placeholder:text-muted focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/15 dark:border-line-dark dark:bg-card-dark dark:text-ink-dark dark:placeholder:text-muted-dark dark:focus:border-accent-dark/40 dark:focus:ring-accent-dark/20 [&::-webkit-search-cancel-button]:hidden"
      />

      {value && (
        <p className="mt-1.5 text-[11px] text-muted dark:text-muted-dark">
          {matchCount === 0
            ? 'No match'
            : `${matchCount} ${matchCount === 1 ? 'match' : 'matches'}`}
        </p>
      )}
    </div>
  )
}
