import type { Detection } from '@/types'
import type { DeepScanOutcome } from '@/background/deep-scan'
import type { Settings } from '@/background/settings'
import type { HistoryEntry } from '@/background/history'

/**
 * Message contract between the panel, the options page, and the service worker.
 *
 * Kept in one file so both sides fail to compile together if the shape drifts.
 */

export type ScanStatus =
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
  /**
   * What the last deep scan on this page actually did, or null if none has run.
   *
   * Carried so the panel can distinguish "read the scripts and found nothing
   * new" from "could not read the scripts at all". Without it both rendered as
   * "Nothing more", which asserts a fact about JavaScript that may never have
   * been downloaded.
   */
  deepScan: DeepScanOutcome | null
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

/**
 * Sends a message and always resolves.
 *
 * `chrome.runtime.sendMessage` REJECTS when the service worker cannot answer —
 * most commonly "Extension context invalidated", which every user hits the
 * moment the extension is reloaded or updated with a page already open. Every
 * caller here treats the result as a value and checks `ok`, so a rejection
 * escaped as an unhandled promise and left whichever surface asked parked on
 * its loading state for good. Turning the rejection into `{ ok: false }` means
 * the failure reaches the code that knows how to show it.
 */
export async function sendMessage(request: Request): Promise<Response> {
  try {
    const response = (await chrome.runtime.sendMessage(request)) as Response | undefined
    if (!response) return { ok: false, error: 'No response from StackLens' }
    return response
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'StackLens is not responding',
    }
  }
}
