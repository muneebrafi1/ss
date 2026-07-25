import { emptyEvidence, type Evidence } from '@/types'

/**
 * Per-tab evidence storage.
 *
 * MV3 service workers are terminated aggressively, so evidence must not live in
 * a module-level variable — it would silently vanish mid-browse and the panel
 * would open empty. Everything is persisted to `chrome.storage.session`, keyed
 * by tab id, which survives worker restarts and is dropped when the browser
 * closes.
 *
 * Writes are buffered behind a short debounce because a chatty page can fire
 * hundreds of requests per second and a write per request would be pathological.
 *
 * Navigation does NOT clear storage. An earlier version wrote an empty record
 * on each new page, which raced with the writes already in flight for that same
 * page and intermittently destroyed real evidence — response headers in
 * particular, since they arrive first and had the longest window to be lost.
 * Instead each patch carries a navigation token assigned synchronously when the
 * event fires, and the flush decides whether it belongs to the stored page or
 * starts a new one. Ordering is then a property of the data rather than of when
 * two promises happen to settle.
 */

const DEBOUNCE_MS = 250

/** Caps keep a long-lived tab from growing without bound. */
// Raised from 500 now that the page's own Resource Timing list and its markup
// URLs feed this alongside the webRequest observer.
const MAX_REQUESTS = 800
const MAX_HTML_CHARS = 250_000
const MAX_INLINE_SCRIPT_CHARS = 120_000
/** Per-host share of the request budget, so no one noisy host can fill it. */
const MAX_PER_HOST = 8
const MAX_PER_FIRST_PARTY = 60
const MAX_BUNDLE_CHARS = 3_000_000

const keyFor = (tabId: number) => `tab:${tabId}`

/** Stored shape: the evidence plus the navigation it belongs to. */
interface StoredRecord {
  token: string
  evidence: Evidence
}

/**
 * Current navigation token per tab.
 *
 * Absent when the worker has restarted without an intervening navigation. A
 * patch tagged `null` means "merge into whatever is stored" — the alternative,
 * treating unknown as new, would discard a page's evidence every time the
 * worker idled out, which happens constantly.
 */
const navTokens = new Map<number, string>()
let navCounter = 0

/** Pending merges per tab, flushed together. */
const pending = new Map<number, { token: string | null; patch: Partial<Evidence> }>()
const timers = new Map<number, ReturnType<typeof setTimeout>>()

/** Serializes storage work per tab so two flushes cannot interleave. */
const queues = new Map<number, Promise<unknown>>()

function enqueue<T>(tabId: number, operation: () => Promise<T>): Promise<T> {
  const previous = queues.get(tabId) ?? Promise.resolve()
  const next = previous.then(operation, operation)
  queues.set(
    tabId,
    next.catch(() => undefined),
  )
  return next
}

async function readRecord(tabId: number): Promise<StoredRecord | null> {
  const key = keyFor(tabId)
  const stored = await chrome.storage.session.get(key)
  return (stored[key] as StoredRecord | undefined) ?? null
}

export async function readEvidence(tabId: number): Promise<Evidence | null> {
  return (await readRecord(tabId))?.evidence ?? null
}

export async function clearEvidence(tabId: number): Promise<void> {
  const timer = timers.get(tabId)
  if (timer) clearTimeout(timer)
  timers.delete(tabId)
  pending.delete(tabId)
  navTokens.delete(tabId)
  await enqueue(tabId, () => chrome.storage.session.remove(keyFor(tabId)))
  queues.delete(tabId)
}

/**
 * Host portion of a normalized "host/path?query" request string.
 *
 * Deliberately not `new URL()`: these strings have no scheme, so parsing them
 * would need one bolted back on, and the host is everything before the first
 * slash by construction.
 */
function hostOfRequest(request: string): string {
  const slash = request.indexOf('/')
  return slash === -1 ? request : request.slice(0, slash)
}

/** Merges one patch into stored evidence, applying every cap. */
function merge(base: Evidence, patch: Partial<Evidence>): Evidence {
  const next: Evidence = { ...base, ...patch }

  if (patch.requests?.length) {
    /*
     * The request budget is spent per host, not first-come-first-served.
     *
     * Detection keys on hostnames and at most a path prefix, so the five
     * hundredth call to one API host adds nothing — but under a flat cap it
     * takes a slot from a host seen once, and hosts seen once are where almost
     * every detection comes from. A page making a thousand ad or telemetry
     * calls could fill the entire list before its payment provider was reached.
     *
     * The probe applies the same rule to what it collects, but it cannot be the
     * only place: `webRequest.onCompleted` feeds this list too, one request at a
     * time, and knows nothing about what came before. This is the one layer both
     * sources pass through.
     *
     * First-party gets a far larger share because that is where the specific
     * evidence lives — `/wp-json/`, `/socket.io/?EIO=`, `/_next/static/`.
     */
    const seen = new Set(base.requests)
    const perHost = new Map<string, number>()
    for (const request of seen) {
      const host = hostOfRequest(request)
      perHost.set(host, (perHost.get(host) ?? 0) + 1)
    }

    for (const request of patch.requests) {
      if (seen.size >= MAX_REQUESTS) break
      if (seen.has(request)) continue
      const host = hostOfRequest(request)
      const limit = host === next.hostname ? MAX_PER_FIRST_PARTY : MAX_PER_HOST
      const used = perHost.get(host) ?? 0
      if (used >= limit) continue
      perHost.set(host, used + 1)
      seen.add(request)
    }
    next.requests = [...seen]
  } else {
    next.requests = base.requests
  }

  if (patch.responseHeaders) {
    next.responseHeaders = { ...base.responseHeaders, ...patch.responseHeaders }
  }
  if (patch.cookieNames) {
    next.cookieNames = [...new Set([...base.cookieNames, ...patch.cookieNames])]
  }
  if (patch.scripts) {
    next.scripts = [...new Set([...base.scripts, ...patch.scripts])]
  }
  if (patch.metas) {
    next.metas = { ...base.metas }
    for (const [name, values] of Object.entries(patch.metas)) {
      next.metas[name] = [...new Set([...(base.metas[name] ?? []), ...values])]
    }
  }
  if (patch.globals) {
    next.globals = [...new Set([...base.globals, ...patch.globals])]
  }
  if (patch.globalValues) {
    next.globalValues = { ...base.globalValues, ...patch.globalValues }
  }
  if (patch.domMatches) {
    next.domMatches = [...new Set([...base.domMatches, ...patch.domMatches])]
  }
  if (patch.storageKeys) {
    next.storageKeys = [...new Set([...base.storageKeys, ...patch.storageKeys])]
  }
  if (patch.html !== undefined) {
    next.html = patch.html.slice(0, MAX_HTML_CHARS)
  }
  if (patch.inlineScripts !== undefined) {
    // Replaced rather than accumulated: the probe re-reads the whole document
    // each time it runs, so merging would stack duplicates of the same page.
    const kept: string[] = []
    let total = 0
    for (const script of patch.inlineScripts) {
      if (total >= MAX_INLINE_SCRIPT_CHARS) break
      const slice = script.slice(0, MAX_INLINE_SCRIPT_CHARS - total)
      kept.push(slice)
      total += slice.length
    }
    next.inlineScripts = kept
  } else {
    next.inlineScripts = base.inlineScripts ?? []
  }
  if (patch.bundles?.length) {
    const bundles = [...base.bundles]
    let total = bundles.reduce((n, b) => n + b.length, 0)
    for (const bundle of patch.bundles) {
      if (total + bundle.length > MAX_BUNDLE_CHARS) break
      bundles.push(bundle)
      total += bundle.length
    }
    next.bundles = bundles
  }

  // Never let a later patch blank out an already-known page identity.
  next.url = patch.url || base.url
  next.hostname = patch.hostname || base.hostname
  next.deepScanned = base.deepScanned || patch.deepScanned === true
  next.collectedAt = Date.now()
  return next
}

function flush(tabId: number): Promise<void> {
  const entry = pending.get(tabId)
  pending.delete(tabId)
  timers.delete(tabId)
  if (!entry) return Promise.resolve()

  return enqueue(tabId, async () => {
    const stored = await readRecord(tabId)
    const { token, patch } = entry

    // A patch from a different navigation starts a clean record; one with no
    // token belongs to whatever page is already stored.
    const samePage = stored !== null && (token === null || stored.token === token)
    const base = samePage ? stored.evidence : emptyEvidence(patch.url ?? '', patch.hostname ?? '')
    const nextToken = token ?? stored?.token ?? 'unknown'

    await chrome.storage.session.set({
      [keyFor(tabId)]: { token: nextToken, evidence: merge(base, patch) } satisfies StoredRecord,
    })
  })
}

/**
 * Queues a patch for a tab. Repeated calls within the debounce window collapse
 * into one storage write.
 */
export function recordEvidence(tabId: number, patch: Partial<Evidence>): void {
  const token = navTokens.get(tabId) ?? null
  const existing = pending.get(tabId)

  if (existing && existing.token === token) {
    // Accumulate array fields rather than letting the last patch win.
    pending.set(tabId, {
      token,
      patch: {
        ...existing.patch,
        ...patch,
        requests: [...(existing.patch.requests ?? []), ...(patch.requests ?? [])],
        bundles: [...(existing.patch.bundles ?? []), ...(patch.bundles ?? [])],
        responseHeaders: { ...existing.patch.responseHeaders, ...patch.responseHeaders },
      },
    })
  } else {
    // A token change mid-window means a navigation happened; the buffered patch
    // belongs to the previous page and is dropped rather than misattributed.
    pending.set(tabId, { token, patch })
  }

  if (!timers.has(tabId)) {
    timers.set(
      tabId,
      setTimeout(() => {
        void flush(tabId)
      }, DEBOUNCE_MS),
    )
  }
}

/** Forces any queued patch to disk immediately, then returns the evidence. */
export async function flushAndRead(tabId: number): Promise<Evidence | null> {
  const timer = timers.get(tabId)
  if (timer) clearTimeout(timer)
  await flush(tabId)
  return readEvidence(tabId)
}

/**
 * Marks the start of a new top-level document.
 *
 * Called from `webRequest.onBeforeRequest` for main-frame requests — the
 * earliest point a new page is known, and deliberately earlier than
 * `tabs.onUpdated`, which reports the new URL only after that page's response
 * headers have already been observed.
 *
 * This writes nothing. It only assigns the navigation token that subsequent
 * patches carry, so the reset can never race with collection.
 *
 * Client-side navigation inside a single-page app is intentionally not a reset
 * point: no new document loads, the scripts and globals are unchanged, and the
 * site's stack is by definition the same one.
 */
export function resetEvidence(tabId: number, url: string, _hostname: string): void {
  const timer = timers.get(tabId)
  if (timer) clearTimeout(timer)
  timers.delete(tabId)
  pending.delete(tabId)
  navTokens.set(tabId, `${url}|${++navCounter}`)
}
