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

/** Icon buttons keep the footer to one row; labels live in the menus. */
function FooterButton({
  onClick,
  disabled,
  title,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex items-center gap-1.5 rounded-btn px-2 py-1.5 text-[12px] font-medium text-muted transition-colors hover:bg-card hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent dark:text-muted-dark dark:hover:bg-card-dark dark:hover:text-ink-dark"
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
    // Deferred so the click that opened the menu does not immediately close it.
    const timer = setTimeout(() => document.addEventListener('click', onDocumentClick))
    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', onDocumentClick)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute bottom-full right-0 mb-1.5 min-w-[150px] overflow-hidden rounded-btn border border-line bg-bg py-1 dark:border-line-dark dark:bg-card-dark"
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
 * Footer bar: deep scan, export, share, and settings.
 *
 * Deep scan is a button rather than automatic behaviour because it is the only
 * thing StackLens does that reaches out to the network at all.
 */
export function Footer({
  hostname,
  detections,
  deepScanned,
  scanning,
  onDeepScan,
}: {
  hostname: string
  detections: Detection[]
  deepScanned: boolean
  scanning: boolean
  onDeepScan: () => void
}) {
  const [menu, setMenu] = useState<'export' | 'share' | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  function flash(message: string) {
    setToast(message)
    setTimeout(() => setToast(null), 1600)
  }

  function exportAs(format: ExportFormat) {
    const text = formatExport(format, hostname, detections)
    downloadText(`${hostname || 'stack'}.${FILE_EXTENSION[format]}`, text)
  }

  const hasResults = detections.length > 0

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
        title={
          deepScanned
            ? 'Deep scan already run for this page'
            : "Download and search this site's JavaScript for more tools"
        }
      >
        <svg viewBox="0 0 14 14" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <circle cx="6.2" cy="6.2" r="4.2" />
          <path d="M9.4 9.4L12 12" />
        </svg>
        {scanning ? 'Scanning…' : deepScanned ? 'Scanned' : 'Deep scan'}
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
              { label: 'Copy as Markdown', run: () => void copyToClipboard(formatExport('markdown', hostname, detections)).then(() => flash('Copied')) },
              { label: 'Download Markdown', run: () => exportAs('markdown') },
              { label: 'Download JSON', run: () => exportAs('json') },
              { label: 'Download CSV', run: () => exportAs('csv') },
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
              { label: 'Copy image', run: () => void copyShareCard(hostname, detections).then((ok) => flash(ok ? 'Image copied' : 'Copy failed')) },
              { label: 'Download image', run: () => void downloadShareCard(hostname, detections) },
            ]}
          />
        )}
      </div>

      <div className="flex-1" />

      <FooterButton onClick={() => void chrome.runtime.openOptionsPage()} title="Settings">
        <svg viewBox="0 0 14 14" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4">
          <circle cx="7" cy="7" r="2.1" />
          <path d="M7 1.4v1.4M7 11.2v1.4M1.4 7h1.4M11.2 7h1.4M3 3l1 1M10 10l1 1M11 3l-1 1M4 10l-1 1" strokeLinecap="round" />
        </svg>
      </FooterButton>
    </footer>
  )
}
