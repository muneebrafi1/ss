import { useCallback, useEffect, useState } from 'react'
import {
  FILE_EXTENSION,
  copyToClipboard,
  downloadText,
  formatExport,
  type ExportFormat,
} from '@/lib/export'
import {
  copyShareCard,
  downloadShareCard,
  renderShareCard,
  type ShareFormat,
} from '@/lib/share-image'
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
  const [failed, setFailed] = useState(false)
  const [toast, flash] = useToast()

  const load = useCallback(async () => {
    setFailed(false)
    const response = await sendMessage({ type: 'GET_PANEL_STATE' })
    if (response.ok && 'state' in response) setState(response.state)
    // Without this branch `state` stays null — the same value that renders
    // "Loading…" — so a failed round-trip displayed forever as work in progress.
    else setFailed(true)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

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

  async function enableSite() {
    if (!state) return
    const response = await sendMessage({
      type: 'SET_HOST_ENABLED',
      hostname: state.hostname,
      enabled: true,
    })
    if (response.ok && 'state' in response) setState(response.state)
  }

  // Resolves through `resolveTargetTab` in the worker, which exists precisely so
  // the extension's own pages can act on the page the user came from.
  async function deepScan() {
    const response = await sendMessage({ type: 'RUN_DEEP_SCAN' })
    if (response.ok && 'state' in response) setState(response.state)
    else flash('Deep scan failed')
  }

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
      {failed ? (
        <EmptyPanel
          title="StackLens couldn't read this page"
          body="This usually clears by itself — the extension may have just been updated or reloaded."
          action={<Button onClick={() => void load()}>Try again</Button>}
        />
      ) : !state ? (
        <p className="py-10 text-center text-base text-muted dark:text-muted-dark">Loading…</p>
      ) : unsupported ? (
        /*
          Global-off and per-site-off used to collapse into one message, so a
          user who had switched StackLens off entirely was told to turn *this
          site* back on — and given nothing to click either way. `EmptyPanel`
          has taken an `action` since it was written; all four call sites
          ignored it.
        */
        state.status === 'disabled' && !state.settings.enabled ? (
          <EmptyPanel
            title="Scanning is off"
            body="StackLens is switched off everywhere. Turn it back on to see what this site is built with."
            action={
              <Button variant="primary" onClick={() => void chrome.runtime.openOptionsPage()}>
                Open settings
              </Button>
            }
          />
        ) : state.status === 'disabled' ? (
          <EmptyPanel
            title={`Scanning is off for ${state.hostname}`}
            body="Nothing is being collected here."
            action={
              <Button variant="primary" onClick={() => void enableSite()}>
                Turn on for {state.hostname}
              </Button>
            }
          />
        ) : (
          <EmptyPanel
            title="No site to report on"
            body="Open a website in the active tab, then come back to this page."
          />
        )
      ) : detections.length === 0 ? (
        <EmptyPanel
          title="Nothing detected here"
          body="This site may use tools we can't detect from the browser. A deep scan searches the page's own JavaScript."
          action={<Button variant="primary" onClick={() => void deepScan()}>Run deep scan</Button>}
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
              <figcaption className="mt-2 text-sm text-muted dark:text-muted-dark">
                {format === 'square' ? '1080 × 1080' : '1200 × 630'} · drawn from the same bundled
                logos as this page.
              </figcaption>
            </figure>

            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted dark:text-muted-dark">
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
                    className={`rounded-[5px] px-3 py-1 text-sm font-medium transition-colors ${
                      format === option.id
                        ? 'bg-ink text-bg dark:bg-ink-dark dark:text-bg-dark'
                        : 'text-muted hover:text-ink dark:text-muted-dark dark:hover:text-ink-dark'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-sm text-muted dark:text-muted-dark">
                {FORMATS.find((option) => option.id === format)?.hint}
              </p>

              {/*
                Copy lives here now. The caption used to send the reader to the
                panel for an action this page could perform all along —
                `copyShareCard` takes the same input the download already builds.
              */}
              <div className="mt-3 flex flex-wrap gap-2">
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
                  Download
                </Button>
                <Button
                  onClick={() =>
                    void copyShareCard({
                      hostname: state.hostname,
                      url: state.url,
                      detections,
                      format,
                    }).then((ok) => flash(ok ? 'Image copied' : 'Copy failed'))
                  }
                >
                  Copy image
                </Button>
              </div>

              <h2 className="mt-7 text-xs font-semibold uppercase tracking-[0.08em] text-muted dark:text-muted-dark">
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

          <p className="mt-8 border-t border-line pt-5 text-sm leading-relaxed text-muted dark:border-line-dark dark:text-muted-dark">
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
