import type { Detection } from '@/types'
import type { Settings } from '@/background/settings'

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
  | { type: 'GET_PANEL_STATE' }
  | { type: 'RUN_DEEP_SCAN' }
  | { type: 'SET_HOST_ENABLED'; hostname: string; enabled: boolean }
  | { type: 'SET_ENABLED'; enabled: boolean }
  | { type: 'GET_SETTINGS' }

export type Response =
  | { ok: true; state: PanelState }
  | { ok: true; settings: Settings }
  | { ok: false; error: string }

export function sendMessage(request: Request): Promise<Response> {
  return chrome.runtime.sendMessage(request) as Promise<Response>
}
