import { useEffect, useRef, useState } from 'react'

/**
 * Panel header: which site is being described, how much was found, and the
 * controls that act on the site as a whole.
 *
 * The overflow menu closes a real gap — the per-site switch previously lived
 * only in settings, so a user could turn a site back on from the panel but had
 * no way to turn one off from the place they were actually looking at it.
 *
 * The favicon comes from Chrome's own cached favicon service through the
 * extension origin, so it costs no network request and discloses nothing.
 */
function faviconUrl(pageUrl: string): string {
  const url = new URL(chrome.runtime.getURL('/_favicon/'))
  url.searchParams.set('pageUrl', pageUrl)
  url.searchParams.set('size', '32')
  return url.toString()
}

const PAGES = [
  { file: 'report.html', label: 'Full report' },
  { file: 'history.html', label: 'History' },
  { file: 'technologies.html', label: 'All technologies' },
] as const

function MenuItem({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full px-3 py-1.5 text-left text-[12px] text-ink transition-colors hover:bg-card dark:text-ink-dark dark:hover:bg-card-hover-dark"
    >
      {children}
    </button>
  )
}

function GlobeFallback() {
  return (
    <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[4px] bg-card text-muted dark:bg-card-dark dark:text-muted-dark">
      <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.3">
        <circle cx="8" cy="8" r="6" />
        <path d="M2.4 6.2h11.2M2.4 9.8h11.2M8 2a10 10 0 0 1 0 12A10 10 0 0 1 8 2Z" />
      </svg>
    </span>
  )
}

export function Header({
  hostname,
  url,
  count,
  onDisableSite,
}: {
  hostname: string
  url: string
  count: number | null
  onDisableSite?: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [iconFailed, setIconFailed] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function onDocumentClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    function onEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    // Deferred so the click that opened the menu does not immediately close it.
    const timer = setTimeout(() => document.addEventListener('click', onDocumentClick))
    document.addEventListener('keydown', onEscape)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', onDocumentClick)
      document.removeEventListener('keydown', onEscape)
    }
  }, [menuOpen])

  return (
    <header className="relative flex items-center gap-2.5 border-b border-line px-3.5 py-2.5 dark:border-line-dark">
      {url && !iconFailed ? (
        <img
          src={faviconUrl(url)}
          alt=""
          width={18}
          height={18}
          className="shrink-0 rounded-[4px]"
          onError={() => setIconFailed(true)}
        />
      ) : (
        <GlobeFallback />
      )}

      <p className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink dark:text-ink-dark">
        {hostname || 'No site'}
      </p>

      {count !== null && count > 0 && (
        <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-accent dark:bg-accent-dark/15 dark:text-accent-dark">
          {count}
        </span>
      )}

      <div className="relative shrink-0" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="More options"
          aria-expanded={menuOpen}
          className="grid h-6 w-6 place-items-center rounded-btn text-muted transition-colors hover:bg-card hover:text-ink dark:text-muted-dark dark:hover:bg-card-dark dark:hover:text-ink-dark"
        >
          <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
            <circle cx="8" cy="3.2" r="1.4" />
            <circle cx="8" cy="8" r="1.4" />
            <circle cx="8" cy="12.8" r="1.4" />
          </svg>
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full z-20 mt-1.5 min-w-[200px] overflow-hidden rounded-btn border border-line bg-bg py-1 dark:border-line-dark dark:bg-card-dark">
            {/*
              The full-page views live behind this menu. The panel answers "what
              is this site" at a glance; reading, searching and comparing belong
              on a page with room for them.
            */}
            {PAGES.map((page) => (
              <MenuItem
                key={page.file}
                onClick={() => {
                  void chrome.tabs.create({ url: chrome.runtime.getURL(page.file) })
                  setMenuOpen(false)
                }}
              >
                {page.label}
              </MenuItem>
            ))}

            <div className="my-1 border-t border-line dark:border-line-dark" />

            {onDisableSite && hostname && (
              <MenuItem
                onClick={() => {
                  onDisableSite()
                  setMenuOpen(false)
                }}
              >
                Turn off for this site
              </MenuItem>
            )}
            <MenuItem
              onClick={() => {
                void chrome.runtime.openOptionsPage()
                setMenuOpen(false)
              }}
            >
              Settings
            </MenuItem>
          </div>
        )}
      </div>
    </header>
  )
}
