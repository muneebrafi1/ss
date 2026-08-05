/**
 * Core types for StackLens.
 *
 * The detection engine is deliberately free of any `chrome.*` dependency: it
 * consumes an `Evidence` object and returns `Detection[]`. Everything in this
 * file is shared by both sides of that boundary.
 */

export type CategoryId =
  // Core — expanded by default in the panel.
  | 'ai-models'
  | 'frameworks'
  | 'hosting'
  | 'database'
  | 'auth'
  | 'payments'
  // Collapsed behind "N more tools", in this order.
  | 'ai-sdks'
  | 'vector-search'
  | 'ai-voice'
  | 'ai-video'
  | 'backend'
  | 'analytics'
  | 'email'
  | 'monitoring'
  | 'observability'
  | 'flags'
  | 'realtime'
  | 'media'
  | 'storage'
  | 'cms'
  | 'ecommerce'
  | 'marketing'
  | 'chat'
  | 'forms'
  | 'maps'
  | 'consent'

export interface Category {
  id: CategoryId
  /** Display label shown above the card grid. */
  name: string
  /** Core categories render expanded; the rest sit behind "N more tools". */
  core: boolean
}

/* -------------------------------------------------------------------------- */
/* Signals                                                                     */
/* -------------------------------------------------------------------------- */

export type SignalType =
  | 'request'
  | 'header'
  | 'cookie'
  | 'global'
  | 'script'
  | 'meta'
  | 'dom'
  | 'storage'
  | 'html'
  | 'bundle'

/**
 * A single piece of evidence that a technology is present, with the weight it
 * contributes. Weights are combined with noisy-OR, so several independent
 * mid-weight signals corroborate into a confident detection while no single
 * weak signal can carry one alone.
 */
export type Signal =
  /** Matches against "hostname/path" of any request the page made. */
  | { type: 'request'; pattern: RegExp; weight: number }
  /** Matches a main-document response header, optionally on its value. */
  | { type: 'header'; name: string; pattern?: RegExp; weight: number }
  /** Matches a cookie NAME on the page origin. Values are never read. */
  | { type: 'cookie'; pattern: RegExp; weight: number }
  /** A dotted path on `window` that resolves to something defined. */
  | { type: 'global'; path: string; weight: number }
  /** Matches the `src` of a script tag on the page. */
  | { type: 'script'; pattern: RegExp; weight: number }
  /** Matches a `<meta>` tag's content by name or property. */
  | { type: 'meta'; name: string; pattern?: RegExp; weight: number }
  /** A CSS selector that matches at least one element. */
  | { type: 'dom'; selector: string; weight: number }
  /** Matches a localStorage or sessionStorage KEY. Values are never read. */
  | { type: 'storage'; pattern: RegExp; weight: number }
  /** Matches the captured sample of document HTML. */
  | { type: 'html'; pattern: RegExp; weight: number }
  /** Matches deep-scanned JS bundle text. Only evaluated after a deep scan. */
  | { type: 'bundle'; pattern: RegExp; weight: number }

/**
 * Extracts a version or model name. Runs only when the pattern matches and
 * captures group 1 — a version is never inferred heuristically, because being
 * confidently wrong costs more trust than staying general.
 */
export type VersionMatcher =
  | { from: 'bundle'; pattern: RegExp }
  | { from: 'script'; pattern: RegExp }
  | { from: 'html'; pattern: RegExp }
  | { from: 'global'; path: string; pattern?: RegExp }
  | { from: 'meta'; name: string; pattern?: RegExp }
  | { from: 'header'; name: string; pattern?: RegExp }

export interface Fingerprint {
  /** Stable unique key, kebab-case. */
  id: string
  name: string
  category: CategoryId
  /** One line, shown as a tooltip on the card. Sentence case, no trailing period. */
  description: string
  /** Bundled icon key; falls back to a generated letter badge when absent. */
  icon: string
  website: string
  /** Reserved for affiliate links. Unused in v1 so monetization is data-only. */
  referralUrl?: string | null
  signals: Signal[]
  version?: VersionMatcher[]
  /** Ids of technologies this one implies, propagated at a discount. */
  implies?: string[]
}

/* -------------------------------------------------------------------------- */
/* Evidence                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Everything observed about one page. Deliberately narrow: hostnames and paths
 * but never request bodies, cookie and storage KEYS but never their values.
 */
export interface Evidence {
  url: string
  hostname: string
  /**
   * Deduped "hostname/path" strings for everything the page loaded.
   *
   * Fed from three places: the webRequest observer, the page's own Resource
   * Timing list, and the URLs declared in markup (`<link>`, `<img>`,
   * `<iframe>`). The last two matter because a service worker that was asleep
   * when the navigation began misses events outright, while the page keeps a
   * complete record either way.
   */
  requests: string[]
  /** Lowercased main-document response headers. */
  responseHeaders: Record<string, string>
  /** Cookie names only. */
  cookieNames: string[]
  /** `src` values of script tags. */
  scripts: string[]
  /**
   * Meta tag name/property to every content value seen under that name.
   *
   * A list rather than a single value because pages routinely repeat a name —
   * a WordPress site with WooCommerce and Elementor emits three separate
   * `<meta name="generator">` tags, and keeping only the last one silently
   * loses the version of everything but the last plugin to write one.
   */
  metas: Record<string, string[]>
  /** Dotted global paths that resolved to something defined. */
  globals: string[]
  /** Stringified primitive values for those paths, for version extraction. */
  globalValues: Record<string, string>
  /** Selectors from the database that matched at least one element. */
  domMatches: string[]
  /** localStorage and sessionStorage keys. */
  storageKeys: string[]
  /** Capped sample of document HTML. */
  html: string
  /**
   * Text of the page's inline `<script>` tags, capped.
   *
   * Kept apart from `html` rather than folded into it because the snippets that
   * identify a service — a GTM container id, an Intercom settings object — sit
   * far down a long document, past the point where the HTML sample is cut off.
   * `html` signals are matched against both.
   */
  inlineScripts: string[]
  /** Deep-scanned JS bundle text. Empty until a deep scan runs. */
  bundles: string[]
  deepScanned: boolean
  collectedAt: number
}

export function emptyEvidence(url = '', hostname = ''): Evidence {
  return {
    url,
    hostname,
    requests: [],
    responseHeaders: {},
    cookieNames: [],
    scripts: [],
    metas: {},
    globals: [],
    globalValues: {},
    domMatches: [],
    storageKeys: [],
    html: '',
    inlineScripts: [],
    bundles: [],
    deepScanned: false,
    collectedAt: 0,
  }
}

/* -------------------------------------------------------------------------- */
/* Detections                                                                  */
/* -------------------------------------------------------------------------- */

export interface Detection {
  id: string
  name: string
  category: CategoryId
  description: string
  icon: string
  /** Where the card links to — `referralUrl` when set, else `website`. */
  url: string
  /** Present only when a version matcher fired; never guessed. */
  version: string | null
  /**
   * Internal only. Decides whether a detection is shown at all and is never
   * rendered in the UI — with no badge to warn the user, a weak guess would
   * look identical to a certainty, so weak detections are dropped instead.
   */
  confidence: number
}

/* -------------------------------------------------------------------------- */
/* Tuning constants                                                            */
/* -------------------------------------------------------------------------- */

/** No single signal may claim certainty. */
export const MAX_WEIGHT = 0.95

/** Below this, a detection is dropped rather than shown unqualified. */
export const DISPLAY_THRESHOLD = 0.6

/** Implied technologies inherit this fraction of the implier's confidence. */
export const IMPLICATION_DISCOUNT = 0.5

/**
 * Ceiling on the AGGREGATE of all implications pointing at one technology,
 * strictly below `DISPLAY_THRESHOLD`. Without an aggregate cap, three separate
 * technologies each implying the same tool would combine to 0.83 under noisy-OR
 * and surface it with no direct evidence at all. Implication may reinforce
 * something real; it may never conjure a detection on its own.
 */
export const IMPLICATION_CEILING = 0.5
