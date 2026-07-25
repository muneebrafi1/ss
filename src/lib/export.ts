import { CATEGORY_BY_ID } from '@/fingerprints'
import type { Detection } from '@/types'
import { STACKLENS_NAME } from './brand'
import { groupDetections } from './grouping'
import { stackSummary } from './summary'

/**
 * Export formats.
 *
 * Two, not three. A single site's stack is around fifteen rows, which nobody
 * opens in a spreadsheet — Markdown covers pasting it somewhere a person will
 * read it, JSON covers feeding it to something that won't, and a third path to
 * the same data only added an item to every export menu.
 *
 * Confidence is deliberately absent from both. It is an internal filter that
 * decides what appears at all, and exporting it would reintroduce exactly the
 * uncertainty signal the panel is designed not to show.
 */

export type ExportFormat = 'markdown' | 'json'

function categoryName(id: string): string {
  return CATEGORY_BY_ID.get(id as never)?.name ?? id
}

function displayName(detection: Detection): string {
  return detection.version ? `${detection.name} ${detection.version}` : detection.name
}

export function toMarkdown(hostname: string, detections: Detection[]): string {
  const { open, collapsed } = groupDetections(detections)
  const lines = [`# ${hostname || 'Tech stack'}`, '']

  // The takeaway first: a pasted export should lead with the sentence, not with
  // a heading and a bullet list the reader has to assemble themselves.
  const summary = stackSummary(detections)
  if (summary) lines.push(summary, '')

  for (const group of [...open, ...collapsed]) {
    lines.push(`## ${group.category.name}`, '')
    for (const detection of group.detections) {
      lines.push(`- **${displayName(detection)}** — ${detection.description}`)
    }
    lines.push('')
  }

  lines.push(`_${detections.length} technologies detected by ${STACKLENS_NAME}._`)
  return lines.join('\n')
}

export function toJson(hostname: string, detections: Detection[]): string {
  return JSON.stringify(
    {
      site: hostname,
      summary: stackSummary(detections),
      count: detections.length,
      technologies: detections.map((detection) => ({
        name: detection.name,
        category: categoryName(detection.category),
        description: detection.description,
        version: detection.version,
        website: detection.url,
      })),
    },
    null,
    2,
  )
}

export function formatExport(
  format: ExportFormat,
  hostname: string,
  detections: Detection[],
): string {
  switch (format) {
    case 'markdown':
      return toMarkdown(hostname, detections)
    case 'json':
      return toJson(hostname, detections)
  }
}

export const FILE_EXTENSION: Record<ExportFormat, string> = {
  markdown: 'md',
  json: 'json',
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/** Triggers a download without needing the `downloads` permission. */
export function downloadText(filename: string, text: string, mime = 'text/plain'): void {
  const url = URL.createObjectURL(new Blob([text], { type: `${mime};charset=utf-8` }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
