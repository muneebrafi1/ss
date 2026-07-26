import { useEffect, useState } from 'react'
import {
  FILE_EXTENSION,
  copyToClipboard,
  downloadText,
  formatExport,
  type ExportFormat,
} from '@/lib/export'
import { downloadShareCard, renderShareCard, type ShareFormat } from '@/lib/share-image'
import { stackSummary } from '@/lib/summary'
import { sendMessage, type PanelState } from '@/messages'
import { Button, EmptyPanel, Page, Toast, useToast } from '@/ui/Page'
import { TechList } from '@/ui/TechList'

/**
 * The current site's stack as a full page.
 *
 * Everything the panel shows, with the room to read it: descriptions visible
 * rather than on hover, a preview of the share card in either shape, and
 * exports without a dropdown. This is where someone goes to study a stack
 * rather than glance at one.
 */

const FORMATS: { id: ShareFormat; label: string; hint: string }[] = [
  { id: 'landscape', label: 'Wide', hint: 'X, LinkedIn, Slack' },
  { id: 'square', label: 'Square', hint: 'Instagram, LinkedIn feed' },
]

export function ReportApp() {
  const [state, setState] = useState<PanelState | null>(null)
  const [format, setFormat] = useState<ShareFormat>('landscape')
  const [preview, setPreview] = useState<string | null>(null)
  const [toast, flash] = useToast()

  useEffect(() => {
    void (async () => {
      const response = await sendMessage({ type: 'GET_PANEL_STATE' })
      if (response.ok && 'state' in response) setState(response.state)
    })()
  }, [])

  // The share card is drawn from the same bundled artwork as the page, so the
  // preview is the actual output rather than an impression of it.
  useEffect(() => {
    if (!state?.detections.length) return
    let stale = false
    void (async () => {
      const canvas = await renderShareCard({
        hostname: state.hostname,
        url: state.url,
        detections: state.detections,
        format,
      })
      if (!stale) setPreview(canvas.toDataURL('image/png'))
    })()
    return () => {
      stale = true
    }
  }, [state, format])

  function exportAs(exportFormat: ExportFormat) {
    if (!state) return
    downloadText(
      `${state.hostname || 'stack'}.${FILE_EXTENSION[exportFormat]}`,
      formatExport(exportFormat, state.hostname, state.detections),
    )
  }

  const detections = state?.detections ?? []
  const unsupported = state && state.status !== 'ready'
  const summary = stackSummary(detections)
  const countLabel = `${detections.length} ${detections.length === 1 ? 'technology' : 'technologies'}`

  return (
    <Page
      current="report"
      title={state?.hostname || 'This site'}
      subtitle={unsupported ? undefined : summary ? `${summary} · ${countLabel}` : countLabel}
    >
      {!state ? (
        <p className="py-10 text-center text-[13px] text-muted dark:text-muted-dark">Loading…</p>
      ) : unsupported ? (
        <EmptyPanel
          title={state.status === 'disabled' ? 'Scanning is off here' : 'No site to report on'}
          body={
            state.status === 'disabled'
              ? 'Turn StackLens back on for this site to see its stack.'
              : 'Open a website in the active tab, then come back to this page.'
          }
        />
      ) : detections.length === 0 ? (
        <EmptyPanel
          title="Nothing detected here"
          body="This site may use tools we can't detect from the browser. Try a deep scan from the panel."
        />
      ) : (
        <>
          {/*
            The card and the things you do with it, side by side. The exports
            used to sit in the page header, the full width of the page away from
            the image they act on, while the preview left a 430px void beside it.
          */}
          <section className="mb-9 grid gap-6 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <figure className="m-0">
              {preview ? (
                <img
                  src={preview}
                  alt={`Stack card for ${state.hostname}`}
                  className="w-full rounded-card border border-line dark:border-line-dark"
                />
              ) : (
                <div
                  className={`w-full rounded-card border border-line bg-card dark:border-line-dark dark:bg-card-dark ${
                    format === 'square' ? 'aspect-square' : 'aspect-[1200/630]'
                  }`}
                />
              )}
              <figcaption className="mt-2 text-[12px] text-muted dark:text-muted-dark">
                The same image the panel copies.
              </figcaption>
            </figure>

            <div>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted dark:text-muted-dark">
                Share
              </h2>

              {/* A real segmented control, rather than two bare words. */}
              <div className="mt-2 inline-flex rounded-btn border border-line p-0.5 dark:border-line-dark">
                {FORMATS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    title={option.hint}
                    aria-pressed={format === option.id}
                    onClick={() => setFormat(option.id)}
                    className={`rounded-[5px] px-3 py-1 text-[12px] font-medium transition-colors ${
                      format === option.id
                        ? 'bg-ink text-bg dark:bg-ink-dark dark:text-bg-dark'
                        : 'text-muted hover:text-ink dark:text-muted-dark dark:hover:text-ink-dark'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[12px] text-muted dark:text-muted-dark">
                {FORMATS.find((option) => option.id === format)?.hint}
              </p>

              <div className="mt-3">
                <Button
                  variant="primary"
                  onClick={() =>
                    void downloadShareCard({
                      hostname: state.hostname,
                      url: state.url,
                      detections,
                      format,
                    })
                  }
                >
                  Download image
                </Button>
              </div>

              <h2 className="mt-7 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted dark:text-muted-dark">
                Export
              </h2>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  onClick={() =>
                    void copyToClipboard(formatExport('markdown', state.hostname, detections)).then(
                      (ok) => flash(ok ? 'Copied as Markdown' : 'Copy failed'),
                    )
                  }
                >
                  Copy
                </Button>
                <Button onClick={() => exportAs('markdown')}>Markdown</Button>
                <Button onClick={() => exportAs('json')}>JSON</Button>
              </div>
            </div>
          </section>

          <TechList
            items={detections.map((detection) => ({
              id: detection.id,
              name: detection.name,
              category: detection.category,
              icon: detection.icon,
              description: detection.description,
              version: detection.version,
              url: detection.url,
            }))}
          />

          <p className="mt-8 border-t border-line pt-5 text-[12px] leading-relaxed text-muted dark:border-line-dark dark:text-muted-dark">
            StackLens shows a technology only when there is real evidence for it. Tools a site
            uses only on its servers — most AI model calls among them — cannot be seen from the
            browser at all, so this is what the page reveals rather than everything it runs.
          </p>
        </>
      )}

      <Toast message={toast} />
    </Page>
  )
}
