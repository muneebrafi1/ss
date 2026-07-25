import { detect } from '@/engine'
import { DATABASE_FINGERPRINTS } from '@/fingerprints'
import type { PanelState, Request, Response } from '@/messages'
import { emptyEvidence, type Detection } from '@/types'
import {
  collectCookieNames,
  recoverResponseHeaders,
  registerNetworkListeners,
  runProbes,
} from './collector'
import { runDeepScan } from './deep-scan'
import {
  DEFAULT_SETTINGS,
  getSettings,
  isHostEnabled,
  saveSettings,
  setHostEnabled,
  type Settings,
} from './settings'
import { clearHistory, getHistory, recordScan, removeFromHistory } from './history'
import { clearEvidence, flushAndRead, recordEvidence } from './store'

/**
 * StackLens service worker.
 *
 * Listeners are registered synchronously at module load, which MV3 requires —
 * a worker that registers a listener inside a promise misses the very event
 * that woke it.
 */

/* -------------------------------------------------------------------------- */
/* Cached state                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Settings and tab hostnames are consulted from synchronous listeners, so they
 * are mirrored in memory. Both are rehydrated on worker start because a
 * terminated worker loses them, and both are kept current afterwards by event
 * listeners rather than being re-read on every event.
 */
let settings: Settings = DEFAULT_SETTINGS
const tabHosts = new Map<number, string>()

/**
 * The last ordinary web page the user was looking at.
 *
 * The full-page views run in their own tab, which makes them the active tab the
 * moment they open — so "describe the current page" has to mean the page the
 * user came from, not the report describing it.
 */
let lastWebTabId: number | null = null

function hostOf(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

/** Pages the extension can neither read nor meaningfully describe. */
function isScannable(url: string): boolean {
  return /^https?:\/\//.test(url)
}

async function hydrate(): Promise<void> {
  settings = await getSettings()
  try {
    const tabs = await chrome.tabs.query({})
    for (const tab of tabs) {
      if (tab.id !== undefined && tab.url) tabHosts.set(tab.id, hostOf(tab.url))
      if (tab.active && tab.id !== undefined && isScannable(tab.url ?? '')) lastWebTabId = tab.id
    }
  } catch {
    // Tab enumeration can fail during startup; navigation events refill it.
  }
}

void hydrate()

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.settings) {
    settings = { ...DEFAULT_SETTINGS, ...(changes.settings.newValue as Partial<Settings>) }
  }
})

/**
 * Whether this tab should be observed at all.
 *
 * Consulted before a request is ever recorded, so a site the user switched off
 * costs nothing rather than being collected and filtered out later.
 */
function shouldCollect(tabId: number): boolean {
  if (!settings.enabled) return false
  const hostname = tabHosts.get(tabId)
  if (hostname === undefined) return true
  return isHostEnabled(settings, hostname)
}

/* -------------------------------------------------------------------------- */
/* Badge                                                                       */
/* -------------------------------------------------------------------------- */

async function setBadge(tabId: number, count: number): Promise<void> {
  try {
    await chrome.action.setBadgeText({ tabId, text: count > 0 ? String(count) : '' })
    await chrome.action.setBadgeBackgroundColor({ tabId, color: '#16161C' })
    await chrome.action.setBadgeTextColor({ tabId, color: '#FFFFFF' })
  } catch {
    // The tab can close between detection and badge update.
  }
}

async function detectForTab(tabId: number): Promise<Detection[]> {
  const evidence = await flushAndRead(tabId)
  if (!evidence) return []
  return detect(evidence, DATABASE_FINGERPRINTS)
}

/* -------------------------------------------------------------------------- */
/* Navigation                                                                  */
/* -------------------------------------------------------------------------- */

registerNetworkListeners(shouldCollect)

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  const url = changeInfo.url ?? tab.url
  if (!url) return

  // Evidence is reset by the main-frame request listener, which runs earlier;
  // this only keeps the hostname cache and badge in step.
  if (changeInfo.url) {
    tabHosts.set(tabId, hostOf(url))
    void setBadge(tabId, 0)
    if (!isScannable(url)) void clearEvidence(tabId)
  }

  if (changeInfo.status !== 'complete') return
  if (!isScannable(url) || !shouldCollect(tabId)) return
  if (tab.active) lastWebTabId = tabId

  void (async () => {
    recordEvidence(tabId, { url, hostname: hostOf(url) })
    const [cookieNames] = await Promise.all([collectCookieNames(url), runProbes(tabId)])
    recordEvidence(tabId, { cookieNames })

    // Recover the main document's headers if the navigation outran this
    // worker's listeners. Done here rather than only when the panel opens so
    // the badge count is right too.
    const seen = await flushAndRead(tabId)
    if (seen && Object.keys(seen.responseHeaders).length === 0) {
      recordEvidence(tabId, { responseHeaders: await recoverResponseHeaders(url) })
    }

    const detections = await detectForTab(tabId)
    await setBadge(tabId, detections.length)
    if (settings.historyEnabled) await recordScan(hostOf(url), url, detections)
  })()
})

chrome.tabs.onActivated.addListener(({ tabId }) => {
  void (async () => {
    try {
      const tab = await chrome.tabs.get(tabId)
      if (isScannable(tab.url ?? '')) lastWebTabId = tabId
    } catch {
      // The tab can close between the event and the lookup.
    }
  })()
})

chrome.tabs.onRemoved.addListener((tabId) => {
  tabHosts.delete(tabId)
  if (lastWebTabId === tabId) lastWebTabId = null
  void clearEvidence(tabId)
})

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason !== 'install') return
  void (async () => {
    const current = await getSettings()
    if (current.welcomeShown) return
    await saveSettings({ welcomeShown: true })
    await chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') })
  })()
})

/* -------------------------------------------------------------------------- */
/* Panel state                                                                 */
/* -------------------------------------------------------------------------- */

const isExtensionPage = (url: string | undefined) => !!url?.startsWith('chrome-extension://')

/**
 * The tab the panel should describe.
 *
 * From the toolbar popup the active tab of the current window is exactly right.
 * When `popup.html` is opened as an ordinary page instead — from the extensions
 * page, or a bookmark — that query returns the panel itself, which would report
 * "nothing to scan here" about its own tab. Falling through to the most
 * recently focused real page makes that case behave sensibly.
 */
async function resolveTargetTab(): Promise<chrome.tabs.Tab | undefined> {
  const [active] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (active && !isExtensionPage(active.url)) return active

  // Asked from one of the extension's own pages: describe the page the user was
  // last on, which is what they opened the report or panel to look at.
  if (lastWebTabId !== null) {
    try {
      const remembered = await chrome.tabs.get(lastWebTabId)
      if (isScannable(remembered.url ?? '')) return remembered
    } catch {
      lastWebTabId = null
    }
  }

  const anyActive = await chrome.tabs.query({ active: true })
  const web = anyActive.find((candidate) => !isExtensionPage(candidate.url))
  if (web) return web

  // Last resort: any open web page at all, newest first.
  const all = await chrome.tabs.query({})
  return [...all].reverse().find((candidate) => isScannable(candidate.url ?? '')) ?? active
}

async function buildPanelState({ refresh = false } = {}): Promise<PanelState> {
  settings = await getSettings()
  const tab = await resolveTargetTab()

  const url = tab?.url ?? ''
  const hostname = hostOf(url)
  const base = {
    tabId: tab?.id ?? null,
    hostname,
    url,
    detections: [] as Detection[],
    deepScanned: false,
    settings,
  }

  if (!tab?.id || !isScannable(url)) return { ...base, status: 'unsupported' }
  if (!settings.enabled || !isHostEnabled(settings, hostname)) {
    return { ...base, status: 'disabled' }
  }

  // Probes re-run whenever the panel is opened. The panel can be opened before
  // a page finishes loading, and a single-page app can mount new widgets long
  // after it does, so reading the DOM then is the only way to be sure the panel
  // describes the page as it currently stands.
  //
  // Skipped on a refresh, which exists precisely because evidence changed — and
  // which must not write, or it would retrigger the listener that asked for it.
  if (!refresh) {
    await runProbes(tab.id)
    recordEvidence(tab.id, { url, hostname, cookieNames: await collectCookieNames(url) })

    // Recover main-document headers if the navigation outran the worker's
    // listeners. Without this the entire Hosting category silently disappears
    // on the first page viewed after the browser starts.
    const seen = await flushAndRead(tab.id)
    if (seen && Object.keys(seen.responseHeaders).length === 0) {
      recordEvidence(tab.id, { responseHeaders: await recoverResponseHeaders(url) })
    }
  }

  const current = (await flushAndRead(tab.id)) ?? emptyEvidence(url, hostname)
  const detections = detect(current, DATABASE_FINGERPRINTS)
  await setBadge(tab.id, detections.length)

  return {
    ...base,
    status: 'ready',
    detections,
    deepScanned: current.deepScanned,
  }
}

chrome.runtime.onMessage.addListener(
  (request: Request, _sender, sendResponse: (response: Response) => void) => {
    void (async () => {
      try {
        switch (request.type) {
          case 'GET_PANEL_STATE': {
            sendResponse({ ok: true, state: await buildPanelState({ refresh: request.refresh }) })
            return
          }
          case 'RUN_DEEP_SCAN': {
            const tab = await resolveTargetTab()
            if (!tab?.id) {
              sendResponse({ ok: false, error: 'No active tab' })
              return
            }
            const evidence = await flushAndRead(tab.id)
            if (evidence) await runDeepScan(tab.id, evidence)
            sendResponse({ ok: true, state: await buildPanelState() })
            return
          }
          case 'SET_HOST_ENABLED': {
            settings = await setHostEnabled(request.hostname, request.enabled)
            if (!request.enabled) {
              // Switching a site off discards what was already collected for it
              // rather than merely hiding it.
              const tabs = await chrome.tabs.query({})
              for (const tab of tabs) {
                if (tab.id !== undefined && hostOf(tab.url ?? '') === request.hostname) {
                  await clearEvidence(tab.id)
                  await setBadge(tab.id, 0)
                }
              }
            }
            sendResponse({ ok: true, state: await buildPanelState() })
            return
          }
          case 'SET_ENABLED': {
            settings = await saveSettings({ enabled: request.enabled })
            sendResponse({ ok: true, settings })
            return
          }
          case 'SET_HISTORY_ENABLED': {
            settings = await saveSettings({ historyEnabled: request.enabled })
            // Switching it off discards what was already kept, rather than
            // merely hiding it behind a preference.
            if (!request.enabled) await clearHistory()
            sendResponse({ ok: true, settings })
            return
          }
          case 'GET_HISTORY': {
            sendResponse({ ok: true, history: await getHistory() })
            return
          }
          case 'CLEAR_HISTORY': {
            await clearHistory()
            sendResponse({ ok: true, history: [] })
            return
          }
          case 'FORGET_SITE': {
            sendResponse({ ok: true, history: await removeFromHistory(request.hostname) })
            return
          }
          case 'GET_SETTINGS': {
            sendResponse({ ok: true, settings: await getSettings() })
            return
          }
        }
      } catch (error) {
        sendResponse({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' })
      }
    })()

    // Keeps the message channel open for the async work above.
    return true
  },
)
