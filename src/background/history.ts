import type { Detection } from '@/types'

/**
 * Scan history, stored locally on the device.
 *
 * Nothing here is ever transmitted — it is the same data the panel already
 * showed, kept so a site can be looked at again without revisiting it. It is
 * still a record of sites visited, so it is disclosed plainly in the privacy
 * policy, switchable off, and clearable in one click from the history page.
 *
 * Only the technology names are kept, not the underlying evidence: the point is
 * to remember what a site used, and storing request logs would be a much larger
 * claim on the user's trust for no extra benefit.
 */

export interface HistoryEntry {
  hostname: string
  url: string
  /** When this site was last scanned. */
  at: number
  technologies: {
    id: string
    name: string
    category: string
    icon: string
    version: string | null
  }[]
}

const KEY = 'history'

/** Older entries fall off the end; a browser session can visit a great many sites. */
const MAX_ENTRIES = 250

export async function getHistory(): Promise<HistoryEntry[]> {
  const stored = await chrome.storage.local.get(KEY)
  return (stored[KEY] as HistoryEntry[] | undefined) ?? []
}

export async function clearHistory(): Promise<void> {
  await chrome.storage.local.remove(KEY)
}

export async function removeFromHistory(hostname: string): Promise<HistoryEntry[]> {
  const next = (await getHistory()).filter((entry) => entry.hostname !== hostname)
  await chrome.storage.local.set({ [KEY]: next })
  return next
}

/**
 * Records a scan, replacing any earlier entry for the same host.
 *
 * One entry per site rather than one per visit: a history that lists the same
 * domain forty times is a browsing log, which is both less useful and a good
 * deal more sensitive than a list of what each site is built with.
 */
export async function recordScan(
  hostname: string,
  url: string,
  detections: Detection[],
): Promise<void> {
  if (!hostname || detections.length === 0) return

  const entries = (await getHistory()).filter((entry) => entry.hostname !== hostname)
  entries.unshift({
    hostname,
    // Only the origin is kept, never the full path — the path is the part that
    // says what someone was reading.
    url: (() => {
      try {
        return new URL(url).origin
      } catch {
        return ''
      }
    })(),
    at: Date.now(),
    technologies: detections.map((detection) => ({
      id: detection.id,
      name: detection.name,
      category: detection.category,
      icon: detection.icon,
      version: detection.version,
    })),
  })

  await chrome.storage.local.set({ [KEY]: entries.slice(0, MAX_ENTRIES) })
}
