import { useEffect, useRef, useState } from 'react'
import { SiteIcon } from '@/ui/Page'

/**
 * Panel header: which site is being described, how much was found, and the
 * controls that act on the site as a whole.
 *
 * The overflow menu closes a real gap — the per-site switch previously lived
 * only in settings, so a user could turn a site back on from the panel but had
 * no way to turn one off from the place they were actually looking at it.
 */

/** Names match what each destination calls itself in src/ui/Page.tsx. */
const PAGES = [
  { file: 'report.html', label: 'This site' },
  { file: 'history.html', label: 'History' },
  { file: 'technologies.html', label: 'Technologies' },
] as const

function MenuItem({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full px-3 py-1.5 text-left text-sm text-ink transition-colors hover:bg-card dark:text-ink-dark dark:hover:bg-card-hover-dark"
    >
      {children}
    </button>
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
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function onDocumentClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    function onEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      // Closing unmounts the focused item; without handing focus back to the
      // trigger it fell to <body>, and in a 400px popup that means starting
      // the tab order over to reach anything at all.
      setMenuOpen(false)
      triggerRef.current?.focus()
    }
    function onFocusOut(event: FocusEvent) {
      const next = event.relatedTarget as Node | null
      if (next && !menuRef.current?.contains(next)) setMenuOpen(false)
    }

    const node = menuRef.current
    // Deferred so the click that opened the menu does not immediately close it.
    const timer = setTimeout(() => document.addEventListener('click', onDocumentClick))
    document.addEventListener('keydown', onEscape)
    node?.addEventListener('focusout', onFocusOut)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', onDocumentClick)
      document.removeEventListener('keydown', onEscape)
      node?.removeEventListener('focusout', onFocusOut)
    }
  }, [menuOpen])

  return (
    <header className="relative flex items-center gap-2.5 border-b border-line px-3.5 py-2.5 dark:border-line-dark">
      <SiteIcon url={url} size={18} />

      <p className="min-w-0 flex-1 truncate text-base font-medium text-ink dark:text-ink-dark">
        {hostname || 'No site'}
      </p>

      {count !== null && count > 0 && (
        <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold tabular-nums text-accent dark:bg-accent-dark/15 dark:text-accent-dark">
          {count}
        </span>
      )}

      <div className="relative shrink-0" ref={menuRef}>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          data-menu="pages"
          aria-label="More options and pages"
          title="Pages and settings"
          aria-haspopup="menu"
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
