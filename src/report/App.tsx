import { useEffect, useState } from 'react'
import {
  FILE_EXTENSION,
  copyToClipboard,
  downloadText,
  formatExport,
  type ExportFormat,
} from '@/lib/export'
import { downloadShareCard, renderShareCard } from '@/lib/share-image'
import { sendMessage, type PanelState } from '@/messages'
import { Button, EmptyPanel, Page, Toast, useToast } from '@/ui/Page'
import { TechList } from '@/ui/TechList'

/**
 * The current site's stack as a full page.
 *
 * Everything the panel shows, with the room to read it: descriptions visible
 * rather than on hover, a preview of the share card, and exports without a
 * dropdown. This is where someone goes to study a stack rather than glance at
 * one.
 */
export function ReportApp() {
  const [state, setState] = useState<PanelState | null>(null)
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
    void (async () => {
      const canvas = await renderShareCard(state.hostname, state.detections)
      setPreview(canvas.toDataURL('image/png'))
    })()
  }, [state])

  function exportAs(format: ExportFormat) {
    if (!state) return
    downloadText(
      `${state.hostname || 'stack'}.${FILE_EXTENSION[format]}`,
      formatExport(format, state.hostname, state.detections),
    )
  }

  const detections = state?.detections ?? []
  const unsupported = state && state.status !== 'ready'

  return (
    <Page
      current="report"
      title={state?.hostname || 'This site'}
      subtitle={
        unsupported
          ? undefined
          : `${detections.length} ${detections.length === 1 ? 'technology' : 'technologies'} detected`
      }
      actions={
        detections.length > 0 ? (
          <>
            <Button
              onClick={() =>
                void copyToClipboard(
                  formatExport('markdown', state?.hostname ?? '', detections),
                ).then((ok) => flash(ok ? 'Copied as Markdown' : 'Copy failed'))
              }
            >
              Copy
            </Button>
            <Button onClick={() => exportAs('markdown')}>Markdown</Button>
            <Button onClick={() => exportAs('json')}>JSON</Button>
            <Button onClick={() => exportAs('csv')}>CSV</Button>
            <Button
              variant="primary"
              onClick={() => void downloadShareCard(state?.hostname ?? '', detections)}
            >
              Download image
            </Button>
          </>
        ) : undefined
      }
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
          {preview && (
            <figure className="mb-8">
              <img
                src={preview}
                alt={`Stack card for ${state.hostname}`}
                className="w-full rounded-card border border-line dark:border-line-dark"
              />
              <figcaption className="mt-2 text-[12px] text-muted dark:text-muted-dark">
                Shareable card — the same image the panel copies.
              </figcaption>
            </figure>
          )}

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
