/**
 * Functions injected into the page by `chrome.scripting.executeScript`.
 *
 * These are serialized with `Function.prototype.toString`, so each one must be
 * completely self-contained: no imports, no module-scope constants, no shared
 * helpers. Anything they need is passed through `args`. Keeping every branch
 * inline is deliberate — a bundler that hoisted a shared helper out would
 * produce a function that throws a ReferenceError once injected.
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
}

export interface GlobalsProbeResult {
  globals: string[]
  globalValues: Record<string, string>
}

/**
 * Runs in the ISOLATED world: reads the DOM, scripts, meta tags, and the KEYS
 * of local and session storage. Storage and cookie values are never read.
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

  return { scripts, metas, domMatches, storageKeys, html }
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
