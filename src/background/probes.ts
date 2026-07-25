/**
 * Functions injected into the page by `chrome.scripting.executeScript`.
 *
 * These are serialized with `Function.prototype.toString`, so each one must be
 * completely self-contained: no imports, no module-scope constants, no shared
 * helpers. Anything they need is passed through `args`. Keeping every branch
 * inline is deliberate — a bundler that hoisted a shared helper out would
 * produce a function that throws a ReferenceError once injected.
 *
 * That constraint is also why the probe returns *raw* resource URLs rather than
 * normalized ones: `normalizeRequest` lives in the collector and cannot be
 * called from here, so normalization happens on the other side of the boundary
 * where one implementation serves both the probe and the webRequest listener.
 *
 * Both return plain JSON-serializable objects, which `executeScript` hands back
 * directly. That is why no `postMessage` relay is needed even for the MAIN
 * world, where `chrome.runtime` is unavailable.
 */

export interface DomProbeResult {
  scripts: string[]
  metas: Record<string, string[]>
  domMatches: string[]
  storageKeys: string[]
  html: string
  /** Text of every inline `<script>`, capped. */
  inlineScripts: string[]
  /**
   * Absolute URLs of everything the page loaded or declared it would load:
   * Resource Timing entries, `<link>` hrefs, `<img>` and `<iframe>` srcs.
   * Normalized and folded into `Evidence.requests` by the collector.
   */
  resourceUrls: string[]
}

export interface GlobalsProbeResult {
  globals: string[]
  globalValues: Record<string, string>
}

/**
 * Runs in the ISOLATED world: reads the DOM, scripts, meta tags, the page's
 * resource list, and the KEYS of local and session storage. Storage and cookie
 * values are never read.
 */
export function domProbe(selectors: string[]): DomProbeResult {
  const scripts: string[] = []
  const scriptNodes = document.querySelectorAll('script[src]')
  for (let i = 0; i < scriptNodes.length; i++) {
    const src = scriptNodes[i]?.getAttribute('src')
    if (src) scripts.push(src)
  }

  const metas: Record<string, string[]> = {}
  const metaNodes = document.querySelectorAll('meta[name], meta[property]')
  for (let i = 0; i < metaNodes.length; i++) {
    const node = metaNodes[i]
    if (!node) continue
    const name = node.getAttribute('name') ?? node.getAttribute('property')
    const content = node.getAttribute('content')
    if (!name || !content) continue
    const key = name.toLowerCase()
    // Every value is kept: a name can legitimately repeat.
    const existing = metas[key]
    if (existing) existing.push(content)
    else metas[key] = [content]
  }

  const domMatches: string[] = []
  for (let i = 0; i < selectors.length; i++) {
    const selector = selectors[i]
    if (!selector) continue
    try {
      if (document.querySelector(selector)) domMatches.push(selector)
    } catch {
      // An invalid selector should never disqualify the rest of the probe.
    }
  }

  const storageKeys: string[] = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) storageKeys.push(key)
    }
  } catch {
    // Storage access throws when cookies are blocked for the origin.
  }
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key) storageKeys.push(key)
    }
  } catch {
    // Same.
  }

  let html = ''
  try {
    html = document.documentElement.outerHTML.slice(0, 250000)
  } catch {
    html = ''
  }

  /*
   * Inline script text.
   *
   * A great many services announce themselves only in a snippet the site pastes
   * into its own markup — a GTM container id, `window.intercomSettings`, the
   * Segment loader. Those live far down a long document and are routinely past
   * the point where the HTML sample above is truncated, so reading them
   * separately is the difference between detecting them and not.
   */
  const inlineScripts: string[] = []
  try {
    const inline = document.querySelectorAll('script:not([src])')
    let budget = 120000
    for (let i = 0; i < inline.length && budget > 0; i++) {
      const text = inline[i]?.textContent
      if (!text) continue
      const slice = text.slice(0, Math.min(20000, budget))
      inlineScripts.push(slice)
      budget -= slice.length
    }
  } catch {
    // Nothing here is load-bearing enough to fail the whole probe.
  }

  /*
   * Everything the page fetched or declared it would fetch.
   *
   * Resource Timing is the important half: it is a complete list held by the
   * page itself, so it does not depend on this extension's service worker
   * having been awake when the requests were made. `<link rel=preconnect>` is
   * the useful outlier in the other direction — it names a host before anything
   * is fetched from it at all, which identifies a checkout or embed provider on
   * a page where the widget was never opened.
   */
  const resourceUrls: string[] = []
  const seenUrls = new Set<string>()
  const perHost = new Map<string, number>()

  /*
   * Sampling is per host, and applies to every source including Resource
   * Timing.
   *
   * Detection keys on hostnames and at most a path prefix, so the four
   * hundredth image from one CDN adds nothing — but it does consume a slot that
   * a host seen only once would have used. A news page with a thousand ad
   * requests could otherwise crowd out its own payment provider entirely.
   *
   * The page's own host gets a far larger budget because first-party paths are
   * where the specific evidence lives: `/wp-json/`, `/socket.io/?EIO=`,
   * `/_next/static/`. Those are exactly the URLs that must not be sampled away.
   */
  let ownHost = ''
  try {
    ownHost = location.host
  } catch {
    ownHost = ''
  }

  function take(raw: string | null | undefined): void {
    if (!raw || seenUrls.size >= 600) return
    if (raw.lastIndexOf('http', 0) !== 0) return
    if (seenUrls.has(raw)) return
    let host = ''
    try {
      host = new URL(raw).host
    } catch {
      return
    }
    const limit = host === ownHost ? 60 : 8
    const used = perHost.get(host) ?? 0
    if (used >= limit) return
    perHost.set(host, used + 1)
    seenUrls.add(raw)
    resourceUrls.push(raw)
  }

  try {
    const entries = performance.getEntriesByType('resource')
    for (let i = 0; i < entries.length; i++) take(entries[i]?.name)
  } catch {
    // Resource Timing is unavailable in a few embedded contexts.
  }

  try {
    const links = document.querySelectorAll('link[href]')
    for (let i = 0; i < links.length; i++) {
      const node = links[i] as HTMLLinkElement | undefined
      if (!node) continue
      const rel = (node.getAttribute('rel') ?? '').toLowerCase()
      if (
        rel.indexOf('stylesheet') < 0 &&
        rel.indexOf('preconnect') < 0 &&
        rel.indexOf('dns-prefetch') < 0 &&
        rel.indexOf('preload') < 0 &&
        rel.indexOf('modulepreload') < 0
      ) {
        continue
      }
      take(node.href)
    }
  } catch {
    // Same.
  }

  try {
    const images = document.querySelectorAll('img[src]')
    for (let i = 0; i < images.length; i++) take((images[i] as HTMLImageElement).src)
  } catch {
    // Same.
  }

  try {
    const frames = document.querySelectorAll('iframe[src]')
    for (let i = 0; i < frames.length; i++) take((frames[i] as HTMLIFrameElement).src)
  } catch {
    // Same.
  }

  return { scripts, metas, domMatches, storageKeys, html, inlineScripts, resourceUrls }
}

/**
 * Runs in the MAIN world: resolves dotted paths against the page's own `window`.
 *
 * An ISOLATED-world script sees a different global object, so this cannot be
 * merged into `domProbe` — page globals like `Stripe` and `Shopify` are only
 * visible from here, and they are among the strongest signals in the database.
 */
export function globalsProbe(paths: string[]): GlobalsProbeResult {
  const globals: string[] = []
  const globalValues: Record<string, string> = {}

  for (let i = 0; i < paths.length; i++) {
    const path = paths[i]
    if (!path) continue
    try {
      let current: unknown = window
      const parts = path.split('.')
      for (let p = 0; p < parts.length; p++) {
        if (current === null || current === undefined) {
          current = undefined
          break
        }
        current = (current as Record<string, unknown>)[parts[p] as string]
      }
      if (current === undefined || current === null) continue

      globals.push(path)
      const kind = typeof current
      if (kind === 'string' || kind === 'number' || kind === 'boolean') {
        globalValues[path] = String(current).slice(0, 64)
      }
    } catch {
      // Property getters can throw; a single bad path must not end the sweep.
    }
  }

  return { globals, globalValues }
}
