import { CATEGORY_BY_ID } from '@/fingerprints'
import type { Detection } from '@/types'
import { groupDetections } from './grouping'

/**
 * Export formats.
 *
 * Confidence is deliberately absent from all three. It is an internal filter
 * that decides what appears at all, and exporting it would reintroduce exactly
 * the uncertainty signal the panel is designed not to show.
 */

export type ExportFormat = 'markdown' | 'json' | 'csv'

function categoryName(id: string): string {
  return CATEGORY_BY_ID.get(id as never)?.name ?? id
}

function displayName(detection: Detection): string {
  return detection.version ? `${detection.name} ${detection.version}` : detection.name
}

export function toMarkdown(hostname: string, detections: Detection[]): string {
  const { open, collapsed } = groupDetections(detections)
  const lines = [`# ${hostname || 'Tech stack'}`, '']

  for (const group of [...open, ...collapsed]) {
    lines.push(`## ${group.category.name}`, '')
    for (const detection of group.detections) {
      lines.push(`- **${displayName(detection)}** — ${detection.description}`)
    }
    lines.push('')
  }

  lines.push(`_${detections.length} technologies detected by StackLens._`)
  return lines.join('\n')
}

export function toJson(hostname: string, detections: Detection[]): string {
  return JSON.stringify(
    {
      site: hostname,
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

export function toCsv(_hostname: string, detections: Detection[]): string {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`
  const rows = [['Name', 'Category', 'Version', 'Description', 'Website'].join(',')]

  for (const detection of detections) {
    rows.push(
      [
        escape(detection.name),
        escape(categoryName(detection.category)),
        escape(detection.version ?? ''),
        escape(detection.description),
        escape(detection.url),
      ].join(','),
    )
  }

  return rows.join('\n')
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
    case 'csv':
      return toCsv(hostname, detections)
  }
}

export const FILE_EXTENSION: Record<ExportFormat, string> = {
  markdown: 'md',
  json: 'json',
  csv: 'csv',
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
