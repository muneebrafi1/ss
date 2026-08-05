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
        className="h-8 w-full rounded-btn border border-line bg-card pl-7 pr-3 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 dark:border-line-dark dark:bg-card-dark dark:text-ink-dark dark:placeholder:text-muted-dark dark:focus:border-accent-dark dark:focus:ring-accent-dark/35 [&::-webkit-search-cancel-button]:hidden"
      />

      {/*
        Two things here, both about not moving the content underneath.

        The zero case is gone: App already replaces the whole list with a
        centred notice titled "No match", so this printed the identical two
        words a second time, in a different type style, twenty pixels away.

        And the line reserves its height whether or not it has anything to say.
        Mounting it on the first keystroke shoved the entire results list down
        by ~20px at exactly the moment the user's eyes were on it.
      */}
      <p className="mt-1.5 h-[15px] text-xs text-muted dark:text-muted-dark" aria-live="polite">
        {value && matchCount > 0
          ? `${matchCount} ${matchCount === 1 ? 'match' : 'matches'}`
          : ''}
      </p>
    </div>
  )
}
