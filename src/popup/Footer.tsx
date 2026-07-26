import { useEffect, useRef, useState } from 'react'
import {
  FILE_EXTENSION,
  copyToClipboard,
  downloadText,
  formatExport,
  type ExportFormat,
} from '@/lib/export'
import { copyShareCard, downloadShareCard } from '@/lib/share-image'
import type { DeepScanOutcome } from '@/background/deep-scan'
import type { Detection } from '@/types'

function FooterButton({
  onClick,
  disabled,
  title,
  active,
  dimWhenDisabled = true,
  buttonRef,
  expanded,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  title: string
  active?: boolean
  /**
   * Whether being disabled should also mean being faint.
   *
   * For Export and Share, dim correctly means unavailable. For the deep-scan
   * button once it has run, "disabled" means "already done" and the label is a
   * result worth reading — dimming it hid the payoff of the action.
   */
  dimWhenDisabled?: boolean
  buttonRef?: React.RefObject<HTMLButtonElement>
  expanded?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      {...(expanded === undefined
        ? {}
        : { 'aria-haspopup': 'menu' as const, 'aria-expanded': expanded })}
      className={`flex items-center gap-1.5 rounded-btn px-2 py-1.5 text-sm font-medium transition-colors disabled:hover:bg-transparent ${dimWhenDisabled ? 'disabled:opacity-40' : ''} ${
        active
          ? 'text-accent dark:text-accent-dark'
          : 'text-muted hover:bg-card hover:text-ink dark:text-muted-dark dark:hover:bg-card-dark dark:hover:text-ink-dark'
      }`}
    >
      {children}
    </button>
  )
}

function Menu({
  items,
  onClose,
  returnFocusTo,
}: {
  items: { label: string; run: () => void }[]
  onClose: () => void
  /** The control that opened this menu, so focus can be handed back to it. */
  returnFocusTo: React.RefObject<HTMLButtonElement>
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDocumentClick(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) onClose()
    }
    function onEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      /*
       * Closing unmounts whichever item the user is standing on, so without
       * handing focus back to the trigger it fell to <body> — and in a 400px
       * popup that means tabbing from the very top again to reach anything.
       */
      onClose()
      returnFocusTo.current?.focus()
    }
    function onFocusOut(event: FocusEvent) {
      // Tabbing past the last item used to leave an open popover behind the
      // focus ring, with no pointer nearby to dismiss it.
      const next = event.relatedTarget as Node | null
      if (next && !ref.current?.contains(next) && next !== returnFocusTo.current) onClose()
    }

    const node = ref.current
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
  }, [onClose, returnFocusTo])

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-0 z-20 mb-1.5 min-w-[160px] overflow-hidden rounded-btn border border-line bg-bg py-1 dark:border-line-dark dark:bg-card-dark"
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={() => {
            item.run()
            onClose()
          }}
          className="block w-full px-3 py-1.5 text-left text-sm text-ink transition-colors hover:bg-card dark:text-ink-dark dark:hover:bg-card-hover-dark"
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

/**
 * Footer bar: deep scan, export, and share.
 *
 * Deep scan is a button rather than automatic behaviour because it is the only
 * thing StackLens does that reaches out to the network at all. When it finishes
 * it reports what it added, so pressing it never looks like it did nothing.
 */
export function Footer({
  hostname,
  url,
  detections,
  deepScanned,
  scanning,
  scanGain,
  scanFailed,
  outcome,
  onDeepScan,
}: {
  hostname: string
  /** Full page URL — the share card uses it to look up the site's favicon. */
  url: string
  detections: Detection[]
  deepScanned: boolean
  scanning: boolean
  /** How many technologies the last deep scan added, or null if it has not run. */
  scanGain: number | null
  /** The last attempt could not complete at all. */
  scanFailed: boolean
  /** What the last scan actually read, or null if none has run. */
  outcome: DeepScanOutcome | null
  onDeepScan: () => void
}) {
  const [menu, setMenu] = useState<'export' | 'share' | null>(null)
  const exportRef = useRef<HTMLButtonElement>(null)
  const shareRef = useRef<HTMLButtonElement>(null)
  const [toast, setToast] = useState<string | null>(null)

  function flash(message: string) {
    setToast(message)
    setTimeout(() => setToast(null), 1700)
  }

  function exportAs(format: ExportFormat) {
    const text = formatExport(format, hostname, detections)
    downloadText(`${hostname || 'stack'}.${FILE_EXTENSION[format]}`, text)
  }

  const hasResults = detections.length > 0

  /*
   * What the scan actually did, rather than what its effect on the count was.
   *
   * "Nothing more" used to be derived purely from the detection delta, so a
   * scan in which every bundle was CORS-blocked, 404'd or timed out rendered
   * identically to one that read every file and genuinely found nothing new —
   * and the tooltip went further, asserting the site's JavaScript "held nothing
   * StackLens could not already see" about scripts it may never have
   * downloaded. The outcome object was being computed and thrown away.
   */
  const readNothing = outcome !== null && outcome.scanned === 0
  const unreadable = scanFailed || (readNothing && outcome.skipped > 0)
  const nothingToRead = readNothing && outcome.skipped === 0

  const scanLabel = scanning
    ? 'Scanning…'
    : unreadable
      ? "Couldn't read scripts"
      : nothingToRead
        ? 'No scripts to scan'
        : deepScanned
          ? scanGain === null
            ? 'Scanned'
            : scanGain > 0
              ? `Found ${scanGain} more`
              : 'Nothing more'
          : 'Deep scan'

  const scanTitle = scanning
    ? 'Downloading and searching this page\u2019s scripts'
    : unreadable
      ? 'This page\u2019s scripts could not be downloaded \u2014 they may be blocked, or the network may be unavailable. Press to try again.'
      : nothingToRead
        ? 'This page loads no first-party JavaScript for StackLens to search'
        : deepScanned
          ? scanGain === 0
            ? 'The scripts were read in full and held nothing new'
            : 'Deep scan already run for this page'
          : "Download and search this site's JavaScript for more tools"

  // A scan that read nothing must stay retryable — the failure is usually
  // transient, and it was previously latched forever by `deepScanned`.
  const scanSpent = deepScanned && !unreadable && !nothingToRead

  return (
    <footer className="relative flex items-center gap-0.5 border-t border-line px-2 py-1.5 dark:border-line-dark">
      {toast && (
        <div className="absolute inset-x-0 -top-9 mx-auto w-max rounded-btn bg-ink px-2.5 py-1.5 text-xs text-bg dark:bg-ink-dark dark:text-bg-dark">
          {toast}
        </div>
      )}

      {/*
        The one live region in the panel.
        
        Everything asynchronous here changes a button label or paints a toast —
        both silent to a screen reader, and the deep-scan outcome is the single
        thing a user pressed a button specifically to learn. `sr-only` rather
        than hidden, because an aria-live region has to be in the accessibility
        tree to announce anything.
      */}
      <p role="status" aria-live="polite" className="sr-only">
        {toast ?? (scanning ? 'Deep scan running' : deepScanned || scanFailed ? scanLabel : '')}
      </p>

      <FooterButton
        onClick={onDeepScan}
        disabled={scanning || scanSpent}
        active={scanning || (scanSpent && (scanGain ?? 0) > 0)}
        // The result is the string the user pressed the button to read, so it
        // must not inherit `disabled:opacity-40`. At 40% the accent computes to
        // ~2:1 — the least legible text in a bar where "Export" and "Share" are
        // fully readable.
        dimWhenDisabled={!scanSpent}
        title={scanTitle}
      >
        <svg
          viewBox="0 0 14 14"
          width="13"
          height="13"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          className={scanning ? 'animate-spin' : undefined}
        >
          <circle cx="6.2" cy="6.2" r="4.2" />
          <path d="M9.4 9.4L12 12" />
        </svg>
        {scanLabel}
      </FooterButton>

      <div className="relative">
        <FooterButton
          onClick={() => setMenu(menu === 'export' ? null : 'export')}
          disabled={!hasResults}
          title="Export the detected stack"
          buttonRef={exportRef}
          expanded={menu === 'export'}
        >
          <svg viewBox="0 0 14 14" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 1.8v7M4.2 6.2L7 9l2.8-2.8M2 11.2h10" />
          </svg>
          Export
        </FooterButton>
        {menu === 'export' && (
          <Menu
            returnFocusTo={exportRef}
            onClose={() => setMenu(null)}
            items={[
              {
                label: 'Copy as Markdown',
                run: () =>
                  void copyToClipboard(formatExport('markdown', hostname, detections)).then((ok) =>
                    flash(ok ? 'Copied' : 'Copy failed'),
                  ),
              },
              { label: 'Download Markdown', run: () => exportAs('markdown') },
              { label: 'Download JSON', run: () => exportAs('json') },
            ]}
          />
        )}
      </div>

      <div className="relative">
        <FooterButton
          onClick={() => setMenu(menu === 'share' ? null : 'share')}
          disabled={!hasResults}
          title="Share this stack as an image"
          buttonRef={shareRef}
          expanded={menu === 'share'}
        >
          <svg viewBox="0 0 14 14" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1.8" y="2.6" width="10.4" height="8.8" rx="1.4" />
            <path d="M1.8 9l2.8-2.6 2.2 2 2-1.8 2.4 2.2" />
          </svg>
          Share
        </FooterButton>
        {menu === 'share' && (
          <Menu
            returnFocusTo={shareRef}
            onClose={() => setMenu(null)}
            items={[
              {
                label: 'Copy image',
                run: () =>
                  void copyShareCard({ hostname, url, detections }).then((ok) =>
                    flash(ok ? 'Image copied' : 'Copy failed'),
                  ),
              },
              {
                label: 'Download wide',
                run: () => void downloadShareCard({ hostname, url, detections }),
              },
              {
                label: 'Download square',
                run: () =>
                  void downloadShareCard({ hostname, url, detections, format: 'square' }),
              },
            ]}
          />
        )}
      </div>
    </footer>
  )
}
