import { useEffect, useRef, useState } from 'react'
import {
  FILE_EXTENSION,
  copyToClipboard,
  downloadText,
  formatExport,
  type ExportFormat,
} from '@/lib/export'
import { copyShareCard, downloadShareCard } from '@/lib/share-image'
import type { Detection } from '@/types'

function FooterButton({
  onClick,
  disabled,
  title,
  active,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  title: string
  active?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex items-center gap-1.5 rounded-btn px-2 py-1.5 text-[12px] font-medium transition-colors disabled:opacity-40 disabled:hover:bg-transparent ${
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
}: {
  items: { label: string; run: () => void }[]
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDocumentClick(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) onClose()
    }
    function onEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    // Deferred so the click that opened the menu does not immediately close it.
    const timer = setTimeout(() => document.addEventListener('click', onDocumentClick))
    document.addEventListener('keydown', onEscape)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', onDocumentClick)
      document.removeEventListener('keydown', onEscape)
    }
  }, [onClose])

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
          className="block w-full px-3 py-1.5 text-left text-[12px] text-ink transition-colors hover:bg-card dark:text-ink-dark dark:hover:bg-card-hover-dark"
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
  onDeepScan: () => void
}) {
  const [menu, setMenu] = useState<'export' | 'share' | null>(null)
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
  const scanLabel = scanning
    ? 'Scanning…'
    : deepScanned
      ? scanGain === null
        ? 'Scanned'
        : scanGain > 0
          ? `Found ${scanGain} more`
          : 'Nothing more'
      : 'Deep scan'

  return (
    <footer className="relative flex items-center gap-0.5 border-t border-line px-2 py-1.5 dark:border-line-dark">
      {toast && (
        <div className="absolute inset-x-0 -top-9 mx-auto w-max rounded-btn bg-ink px-2.5 py-1.5 text-[11px] text-bg dark:bg-ink-dark dark:text-bg-dark">
          {toast}
        </div>
      )}

      <FooterButton
        onClick={onDeepScan}
        disabled={scanning || deepScanned}
        active={scanning || (deepScanned && (scanGain ?? 0) > 0)}
        title={
          deepScanned
            ? scanGain === 0
              ? "This site's JavaScript held nothing StackLens could not already see"
              : 'Deep scan already run for this page'
            : "Download and search this site's JavaScript for more tools"
        }
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
        >
          <svg viewBox="0 0 14 14" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 1.8v7M4.2 6.2L7 9l2.8-2.8M2 11.2h10" />
          </svg>
          Export
        </FooterButton>
        {menu === 'export' && (
          <Menu
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
        >
          <svg viewBox="0 0 14 14" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1.8" y="2.6" width="10.4" height="8.8" rx="1.4" />
            <path d="M1.8 9l2.8-2.6 2.2 2 2-1.8 2.4 2.2" />
          </svg>
          Share
        </FooterButton>
        {menu === 'share' && (
          <Menu
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
