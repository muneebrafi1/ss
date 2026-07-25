import type { Evidence, Signal } from '@/types'

/**
 * Resolves whether a single signal is present in the collected evidence.
 *
 * Pure and synchronous — every branch reads from `Evidence` and nothing else,
 * which is what lets the whole matching layer be tested in Node without a
 * browser.
 */
export function matchSignal(signal: Signal, evidence: Evidence): boolean {
  switch (signal.type) {
    case 'request':
      return evidence.requests.some((r) => signal.pattern.test(r))

    case 'header': {
      const value = evidence.responseHeaders[signal.name.toLowerCase()]
      if (value === undefined) return false
      return signal.pattern ? signal.pattern.test(value) : true
    }

    case 'cookie':
      return evidence.cookieNames.some((c) => signal.pattern.test(c))

    case 'global':
      return evidence.globals.includes(signal.path)

    case 'script':
      return evidence.scripts.some((s) => signal.pattern.test(s))

    case 'meta': {
      const values = evidence.metas[signal.name.toLowerCase()]
      if (values === undefined || values.length === 0) return false
      if (!signal.pattern) return true
      const pattern = signal.pattern
      return values.some((value) => pattern.test(value))
    }

    case 'dom':
      return evidence.domMatches.includes(signal.selector)

    case 'storage':
      return evidence.storageKeys.some((k) => signal.pattern.test(k))

    case 'html':
      return signal.pattern.test(evidence.html)

    case 'bundle':
      // Only meaningful once the user has opted into a deep scan.
      if (!evidence.deepScanned) return false
      return evidence.bundles.some((b) => signal.pattern.test(b))
  }
}

/** Every signal in the list that the evidence supports. */
export function matchedSignals(signals: Signal[], evidence: Evidence): Signal[] {
  return signals.filter((s) => matchSignal(s, evidence))
}

/**
 * Every `dom` selector referenced anywhere in the database.
 *
 * The in-page probe is a self-contained function with no access to this module,
 * so the selectors it should test are passed to it as an argument. Collecting
 * them here keeps that list derived from the database rather than duplicated.
 */
export function collectDomSelectors(signals: Signal[]): string[] {
  const out = new Set<string>()
  for (const s of signals) if (s.type === 'dom') out.add(s.selector)
  return [...out]
}

/** Every `global` path referenced anywhere in the database, for the same reason. */
export function collectGlobalPaths(signals: Signal[]): string[] {
  const out = new Set<string>()
  for (const s of signals) if (s.type === 'global') out.add(s.path)
  return [...out]
}
