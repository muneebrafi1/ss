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
 * Whether the in-memory mirrors above can be trusted yet.
 *
 * MV3 wakes this worker *because* an event arrived, and dispatches that event
 * immediately after top-level evaluation — while `hydrate()` is still awaiting
 * `chrome.storage.local`. Until it resolves, `settings` is the DEFAULTS object,
 * which says scanning is on and no host is disabled. Reading it during that
 * window makes both off switches silently fail open on exactly the navigation
 * that woke the worker.
 *
 * So collection is closed until proven open. The cost is the first few hundred
 * milliseconds of a cold navigation; the alternative is collecting from a site
 * the user explicitly switched off, which the settings page, the panel and the
 * privacy policy all promise does not happen.
 */
let hydrated = false

/**
 * The last ordinary web page the user was looking at.
 *
 * The full-page views run in their own tab, which makes them the active tab the
 * moment they open — so "describe the current page" has to mean the page the
 * user came from, not the report describing it.
 */
let lastWebTabId: number | null = null

/**
 * Tabs belonging to an incognito window.
 *
 * The extension declares no `incognito` key, so it defaults to spanning mode:
 * tick "Allow in Incognito" — an ordinary thing to do for a browsing tool — and
 * this single worker starts receiving tab and request events for private
 * windows. History is written to `chrome.storage.local`, which outlives the
 * incognito session, so without this set a private browsing session leaves a
 * permanent on-disk record of every site visited. Nothing else in the product
 * would reveal it: the entry looks identical to an ordinary one.
 *
 * Evidence is deliberately still collected — it lives in `chrome.storage.session`,
 * dies with the browser, and is what makes the panel work at all. It is only the
 * durable record that incognito must not produce.
 */
const incognitoTabs = new Set<number>()

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
      if (tab.id !== undefined && tab.incognito) incognitoTabs.add(tab.id)
      if (tab.active && tab.id !== undefined && isScannable(tab.url ?? '')) lastWebTabId = tab.id
    }
  } catch {
    // Tab enumeration can fail during startup; navigation events refill it.
  }
  hydrated = true
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
  if (!hydrated) return false
  if (!settings.enabled) return false
  const hostname = tabHosts.get(tabId)
  // Fail closed. An unknown hostname used to mean "collect anyway", so a tab
  // whose host had not yet been cached — every tab, on every worker wake — was
  // collected regardless of whether the user had switched that site off.
  if (hostname === undefined) return false
  return isHostEnabled(settings, hostname)
}

/** Whether a durable record may be written for this tab. */
function mayRecordHistory(tabId: number, incognito: boolean): boolean {
  if (!settings.historyEnabled) return false
  return !incognito && !incognitoTabs.has(tabId)
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

registerNetworkListeners(shouldCollect, (tabId, hostname) => {
  tabHosts.set(tabId, hostname)
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  const url = changeInfo.url ?? tab.url
  if (!url) return
  if (tab.incognito) incognitoTabs.add(tabId)

  // Evidence is reset by the main-frame request listener, which runs earlier;
  // this only keeps the hostname cache and badge in step.
  if (changeInfo.url) {
    tabHosts.set(tabId, hostOf(url))
    /*
     * Only a real document load clears the count.
     *
     * `onUpdated` also fires with a new `url` and no `status` for
     * history.pushState and for plain `#anchor` clicks — and no `status:
     * 'complete'` ever follows a same-document navigation. Zeroing the badge
     * unconditionally meant clicking any in-page anchor, or any route change in
     * a single-page app, emptied the badge for good while the panel behind it
     * still held the full detection list.
     */
    if (changeInfo.status !== undefined) void setBadge(tabId, 0)
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
    if (mayRecordHistory(tabId, tab.incognito)) await recordScan(hostOf(url), url, detections)
  })()
})

chrome.tabs.onRemoved.addListener((tabId) => {
  // Both mirrors are keyed by tab id, and Chrome reuses ids freely. Leaving a
  // closed incognito tab's id in the set would make a later ordinary tab that
  // inherits it silently stop recording history.
  incognitoTabs.delete(tabId)
  tabHosts.delete(tabId)
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
  /*
   * Only real pages get a hostname. `new URL()` happily parses the authority of
   * a non-special scheme, so `chrome://newtab/` yielded "newtab" and every
   * surface presented it as a site — h1 on the report page, favicon in the
   * panel header. Blanking it lets the existing "No site" fallbacks fire.
   */
  const hostname = isScannable(url) ? hostOf(url) : ''
  const base = {
    tabId: tab?.id ?? null,
    hostname,
    url,
    detections: [] as Detection[],
    deepScanned: false,
    deepScan: null,
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
            const outcome = evidence ? await runDeepScan(tab.id, evidence) : null
            const state = await buildPanelState()

            /*
             * Deep scan's whole reason to exist is recovering detections that
             * passive collection cannot see — and those were the only ones the
             * product forgot. `recordScan` had exactly one call site, in the
             * navigation handler, using the pre-scan set, and the evidence
             * holding the bundle-only detections is discarded on the next
             * navigation. So the headline results never reached History.
             */
            if (
              mayRecordHistory(tab.id, tab.incognito) &&
              state.status === 'ready' &&
              state.hostname
            ) {
              await recordScan(state.hostname, state.url, state.detections)
            }

            sendResponse({ ok: true, state: { ...state, deepScan: outcome } })
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
