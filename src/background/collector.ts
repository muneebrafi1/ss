import { collectDomSelectors, collectGlobalPaths } from '@/engine'
import { DATABASE_FINGERPRINTS } from '@/fingerprints'
import { domProbe, globalsProbe } from './probes'
import { recordEvidence, resetEvidence } from './store'

/**
 * Observes network activity and runs the in-page probes.
 *
 * `chrome.webRequest` is used in observe-only mode, which MV3 still permits —
 * only blocking and modifying moved to `declarativeNetRequest`, and StackLens
 * never alters a request.
 */

/** Longest request URL retained. Long URLs are almost always cache-busting noise. */
const MAX_URL_CHARS = 300

/** Derived once from the database so the probes stay in sync with it. */
const ALL_SIGNALS = DATABASE_FINGERPRINTS.flatMap((f) => f.signals)
const DOM_SELECTORS = collectDomSelectors(ALL_SIGNALS)
const GLOBAL_PATHS = collectGlobalPaths(ALL_SIGNALS)

/**
 * Normalizes a request URL for matching.
 *
 * Keeps host, path, and query — several fingerprints genuinely need the query
 * string, such as `/socket.io/?EIO=` and `gtag/js?id=AW-`. Drops the protocol
 * and fragment, and never touches request or response bodies.
 */
export function normalizeRequest(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
    return `${parsed.host}${parsed.pathname}${parsed.search}`.slice(0, MAX_URL_CHARS)
  } catch {
    return null
  }
}

/** Lowercased header map from a webRequest header array. */
export function headersToRecord(
  headers: chrome.webRequest.HttpHeader[] | undefined,
): Record<string, string> {
  const record: Record<string, string> = {}
  for (const header of headers ?? []) {
    if (header.name && header.value !== undefined) {
      record[header.name.toLowerCase()] = header.value
    }
  }
  return record
}

export function registerNetworkListeners(shouldCollect: (tabId: number) => boolean): void {
  // A new top-level document starts a fresh record. This fires before the
  // response headers for that document arrive, which is precisely why the reset
  // lives here rather than on `tabs.onUpdated` — that event reports the new URL
  // only after those headers have already been observed, so resetting there
  // destroyed them.
  chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
      if (details.tabId < 0) return undefined
      const parsed = (() => {
        try {
          return new URL(details.url)
        } catch {
          return null
        }
      })()
      if (parsed && (parsed.protocol === 'http:' || parsed.protocol === 'https:')) {
        resetEvidence(details.tabId, details.url, parsed.hostname)
      }
      return undefined
    },
    { urls: ['<all_urls>'], types: ['main_frame'] },
  )

  chrome.webRequest.onCompleted.addListener(
    (details) => {
      if (details.tabId < 0 || !shouldCollect(details.tabId)) return
      const request = normalizeRequest(details.url)
      if (request) recordEvidence(details.tabId, { requests: [request] })
    },
    { urls: ['<all_urls>'] },
  )

  chrome.webRequest.onHeadersReceived.addListener(
    (details) => {
      if (details.tabId >= 0 && shouldCollect(details.tabId)) {
        recordEvidence(details.tabId, {
          responseHeaders: headersToRecord(details.responseHeaders),
        })
      }
      // Observe-only: returning nothing leaves the response untouched. StackLens
      // never blocks or modifies a request.
      return undefined
    },
    { urls: ['<all_urls>'], types: ['main_frame'] },
    ['responseHeaders'],
  )
}

/**
 * Recovers the main document's response headers when webRequest missed them.
 *
 * MV3 service workers are started on demand, and a navigation that begins
 * before this worker's listeners are live has its main-frame events dropped
 * outright — verified in the end-to-end run, where a first page load produces no
 * `onBeforeRequest` or `onHeadersReceived` at all while a reload produces both.
 * Subresource requests arrive later and are unaffected, which makes the failure
 * quietly selective: every header-only detection disappears while everything
 * else looks fine. Vercel, Netlify, Cloudflare, nginx and Apache are all
 * header-only, so the whole Hosting category would silently vanish.
 *
 * The refetch is cache-first, so in the normal case it is served from the HTTP
 * cache the browser has just populated and costs no network traffic. It runs
 * only when the headers are genuinely absent.
 */
export async function recoverResponseHeaders(url: string): Promise<Record<string, string>> {
  try {
    const response = await fetch(url, { cache: 'force-cache', credentials: 'omit' })
    const headers: Record<string, string> = {}
    response.headers.forEach((value, name) => {
      headers[name.toLowerCase()] = value
    })
    // The body is never read; only the headers matter here.
    void response.body?.cancel()
    return headers
  } catch {
    return {}
  }
}

/**
 * Reads cookie NAMES for an origin. Values are deliberately never accessed —
 * the names alone identify a service, and reading session tokens would be both
 * unnecessary and indefensible in a store review.
 */
export async function collectCookieNames(url: string): Promise<string[]> {
  try {
    const cookies = await chrome.cookies.getAll({ url })
    return cookies.map((cookie) => cookie.name)
  } catch {
    return []
  }
}

/**
 * Runs both in-page probes and records what they find.
 *
 * Failures are swallowed per-probe: `chrome://` pages, the Web Store, and PDF
 * viewers all reject injection, and that is an expected state rather than an
 * error worth surfacing.
 */
export async function runProbes(tabId: number): Promise<void> {
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      world: 'ISOLATED',
      func: domProbe,
      args: [DOM_SELECTORS],
    })
    if (result?.result) {
      // The probe cannot call `normalizeRequest` — it is serialized and has no
      // module scope — so it hands back raw URLs and they are normalized here,
      // through the same function the webRequest listener uses. One
      // implementation, so the two paths cannot drift into producing strings
      // that match different patterns.
      const { resourceUrls, ...evidence } = result.result
      const requests: string[] = []
      for (const url of resourceUrls) {
        const request = normalizeRequest(url)
        if (request) requests.push(request)
      }
      recordEvidence(tabId, { ...evidence, requests })
    }
  } catch {
    // Injection is not permitted on this page.
  }

  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: globalsProbe,
      args: [GLOBAL_PATHS],
    })
    if (result?.result) recordEvidence(tabId, result.result)
  } catch {
    // Same.
  }
}
