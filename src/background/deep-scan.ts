import type { Evidence } from '@/types'
import { recordEvidence } from './store'

/**
 * Deep scan: downloads the page's JavaScript bundles and pattern-matches them.
 *
 * This is the only way to recover model names like `gpt-4o` and SDK identifiers
 * from a site whose AI calls happen server-side, which is most of them — so it
 * is where the AI categories earn most of their detections.
 *
 * It is opt-in for two reasons: it costs real bandwidth, and it should be the
 * user's choice to make the extension fetch anything at all.
 *
 * IMPORTANT: bundles are downloaded as TEXT and matched with regular
 * expressions. Nothing fetched here is ever executed, injected, or evaluated.
 * That distinction matters for Chrome Web Store review, where fetching remote
 * JavaScript is otherwise a common rejection trigger, and it is stated
 * explicitly in the store submission.
 */

/** Most bundles worth reading; beyond this the returns fall off sharply. */
const MAX_FILES = 12
/** Total download ceiling across a single scan. */
const MAX_TOTAL_BYTES = 3_000_000
/** Per-file ceiling — a single huge vendor chunk should not consume the budget. */
const MAX_FILE_BYTES = 1_200_000
/** Parallel fetches. Enough to be quick, few enough to avoid hammering a host. */
const CONCURRENCY = 4
/** Per-file timeout, so one hanging asset cannot stall the whole scan. */
const TIMEOUT_MS = 8000

export interface DeepScanOutcome {
  scanned: number
  bytes: number
  /** Files skipped because a cap was reached, reported rather than hidden. */
  skipped: number
}

/**
 * Chooses which scripts to download.
 *
 * First-party bundles are prioritized because third-party scripts are already
 * identified by their URL alone — fetching `js.stripe.com` would tell us
 * nothing that the script tag has not already proven.
 */
export function selectBundleUrls(evidence: Evidence): string[] {
  const pageOrigin = (() => {
    try {
      return new URL(evidence.url).origin
    } catch {
      return null
    }
  })()

  const seen = new Set<string>()
  const firstParty: string[] = []
  const thirdParty: string[] = []

  for (const src of evidence.scripts) {
    let absolute: URL
    try {
      absolute = new URL(src, evidence.url || undefined)
    } catch {
      continue
    }
    if (absolute.protocol !== 'https:' && absolute.protocol !== 'http:') continue

    const href = absolute.href
    if (seen.has(href)) continue
    seen.add(href)

    if (pageOrigin && absolute.origin === pageOrigin) firstParty.push(href)
    else thirdParty.push(href)
  }

  return [...firstParty, ...thirdParty].slice(0, MAX_FILES)
}

async function fetchText(url: string): Promise<string | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const response = await fetch(url, { signal: controller.signal, credentials: 'omit' })
    if (!response.ok) return null

    const declared = Number(response.headers.get('content-length') ?? '0')
    if (declared > MAX_FILE_BYTES) return null

    const text = await response.text()
    return text.slice(0, MAX_FILE_BYTES)
  } catch {
    // A blocked, CORS-restricted, or offline asset is an expected outcome.
    return null
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Downloads and stores bundle text for a tab, then marks the evidence scanned.
 *
 * `deepScanned` gates every `bundle` signal in the engine, so it is only set
 * once the fetching has actually finished — a half-finished scan must not make
 * bundle-only detections appear and then vanish.
 */
export async function runDeepScan(tabId: number, evidence: Evidence): Promise<DeepScanOutcome> {
  const urls = selectBundleUrls(evidence)
  const bundles: string[] = []
  let bytes = 0
  let skipped = 0

  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = urls.slice(i, i + CONCURRENCY)
    const texts = await Promise.all(batch.map((url) => fetchText(url)))

    for (const text of texts) {
      if (!text) {
        skipped += 1
        continue
      }
      if (bytes + text.length > MAX_TOTAL_BYTES) {
        skipped += 1
        continue
      }
      bundles.push(text)
      bytes += text.length
    }
  }

  recordEvidence(tabId, { bundles, deepScanned: true })
  return { scanned: bundles.length, bytes, skipped }
}
