import type { Detection } from '@/types'
import type { Settings } from '@/background/settings'
import type { HistoryEntry } from '@/background/history'

/**
 * Message contract between the panel, the options page, and the service worker.
 *
 * Kept in one file so both sides fail to compile together if the shape drifts.
 */

export type ScanStatus =
  /** Evidence is still being gathered for this page. */
  | 'scanning'
  /** Detection finished. */
  | 'ready'
  /** Scanning is switched off for this site or globally. */
  | 'disabled'
  /** A page the extension cannot read: chrome://, the Web Store, a PDF. */
  | 'unsupported'

export interface PanelState {
  status: ScanStatus
  /** Tab this state describes, so the panel can watch it for late evidence. */
  tabId: number | null
  /** Hostname of the current tab, shown in the header. */
  hostname: string
  url: string
  detections: Detection[]
  deepScanned: boolean
  /** False when the current site is on the disabled list. */
  hostEnabled: boolean
  settings: Settings
}

export type Request =
  /**
   * `refresh: true` reads and re-detects without re-running the in-page probes.
   * The full form writes evidence, so using it for the panel's live refresh
   * would retrigger the storage listener that asked for it and spin forever.
   */
  | { type: 'GET_PANEL_STATE'; refresh?: boolean }
  | { type: 'RUN_DEEP_SCAN' }
  | { type: 'SET_HOST_ENABLED'; hostname: string; enabled: boolean }
  | { type: 'SET_ENABLED'; enabled: boolean }
  | { type: 'SET_HISTORY_ENABLED'; enabled: boolean }
  | { type: 'GET_SETTINGS' }
  | { type: 'GET_HISTORY' }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'FORGET_SITE'; hostname: string }

export type Response =
  | { ok: true; state: PanelState }
  | { ok: true; settings: Settings }
  | { ok: true; history: HistoryEntry[] }
  | { ok: false; error: string }

export function sendMessage(request: Request): Promise<Response> {
  return chrome.runtime.sendMessage(request) as Promise<Response>
}
