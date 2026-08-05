import { CATEGORY_ORDER } from '@/fingerprints'
import type { CategoryId, Detection } from '@/types'

/**
 * One plain sentence describing a site's stack.
 *
 * A list of eighteen logos is a lot to take in; a line like "Next.js on Vercel
 * with Supabase and Clerk" is the thing someone actually reads — in the report
 * header, at the top of an export, and above all on the share card, where it is
 * what a stranger scrolling past has time to absorb.
 *
 * Entirely deterministic: it picks from what was already detected using the
 * database's own importance order, and says nothing that is not in the list. No
 * model, no network, no inference. If there is nothing worth a sentence it
 * returns `null` and every caller omits the line rather than printing a hedge.
 */

/**
 * Shortens a version or model id for display.
 *
 * Model ids carry a dated build — `claude-sonnet-4-5-20250929`, `gpt-4o-2024-08-06`
 * — and that suffix is the least useful eight characters on the card. It pushed
 * "Anthropic claude-sonne…" past the edge of an 88px tile, so the one thing a
 * deep scan exists to reveal was the one thing that would not fit. The date is
 * dropped for display only; the captured value is untouched everywhere else.
 */
export function displayVersion(version: string | null): string | null {
  if (!version) return null
  return version.replace(/-(?:20\d{2})[-]?(?:\d{2})[-]?(?:\d{2})$/, '')
}

/**
 * "1 technology", "7 technologies".
 *
 * Lives here because three surfaces print this count and one of them — the
 * Markdown export — hardcoded the plural, so a single-detection site exported
 * "_1 technologies detected by StackLens._"
 */
export function countLabel(n: number): string {
  return `${n} ${n === 1 ? 'technology' : 'technologies'}`
}

/** Categories that can be the subject of the sentence, most telling first. */
const SUBJECT_ORDER: CategoryId[] = ['frameworks', 'cms', 'ecommerce', 'backend']

/**
 * Things in `frameworks` that are not what a site is *built on*.
 *
 * jQuery, Bootstrap and Tailwind are libraries a page includes, not the thing
 * that produced it — and because `frameworks` outranks `cms`, any WordPress
 * site that loads jQuery (which is most of them) was summarised as "jQuery on
 * Cloudflare". WordPress could not appear anywhere in the sentence, since `cms`
 * was absent from COMPANION_ORDER too. That sentence is the share-card headline,
 * the first line of every Markdown export and the report subtitle, so the most
 * common CMS on the web was invisible on the surface that matters most.
 *
 * A deny-list rather than a reordering: `frameworks` genuinely should outrank
 * `cms` when the framework is Next.js or Rails, and reordering would have
 * broken that to fix this.
 */
const NOT_A_SUBJECT = new Set(['jquery', 'bootstrap', 'tailwindcss'])

/** Categories that follow "with", in the order they are worth mentioning. */
const COMPANION_ORDER: CategoryId[] = [
  'cms',
  'ecommerce',
  'database',
  'auth',
  'payments',
  'ai-models',
  'analytics',
  'marketing',
  'chat',
]

/** How many technologies follow "with" before the sentence gets long. */
const MAX_COMPANIONS = 2

/** The strongest detection in a category, or null. */
function pick(
  detections: Detection[],
  category: CategoryId,
  exclude: Set<string> = new Set(),
): Detection | null {
  let best: Detection | null = null
  for (const detection of detections) {
    if (detection.category !== category) continue
    if (exclude.has(detection.id)) continue
    if (!best || detection.confidence > best.confidence) best = detection
  }
  return best
}

/** "A", "A and B" — never an Oxford list, because it never exceeds two. */
function join(names: string[]): string {
  if (names.length <= 1) return names[0] ?? ''
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

export function stackSummary(detections: Detection[]): string | null {
  if (detections.length === 0) return null

  const subjectCategory = SUBJECT_ORDER.find(
    (category) => pick(detections, category, NOT_A_SUBJECT) !== null,
  )
  const subject = subjectCategory ? pick(detections, subjectCategory, NOT_A_SUBJECT) : null
  const host = pick(detections, 'hosting')

  const used = new Set<string>()
  if (subject) used.add(subject.id)
  if (host) used.add(host.id)

  const companions: string[] = []
  for (const category of COMPANION_ORDER) {
    if (companions.length >= MAX_COMPANIONS) break
    const found = pick(detections, category)
    if (!found || used.has(found.id)) continue
    used.add(found.id)
    companions.push(found.name)
  }

  let head: string
  if (subject) {
    // "Shopify store" reads as a description; "Shopify" alone reads as a name.
    const noun = subjectCategory === 'ecommerce' ? `${subject.name} store` : subject.name
    head = host ? `${noun} on ${host.name}` : noun
  } else if (host) {
    head = `Hosted on ${host.name}`
  } else {
    // Nothing structural was found — name what there is rather than invent a
    // shape the evidence does not support.
    const ranked = [...detections].sort(
      (a, b) =>
        (CATEGORY_ORDER.get(a.category) ?? 0) - (CATEGORY_ORDER.get(b.category) ?? 0) ||
        b.confidence - a.confidence,
    )
    const named = ranked.slice(0, 2).map((detection) => detection.name)
    if (detections.length <= 2) return join(named)
    return `${detections.length} tools including ${join(named)}`
  }

  return companions.length > 0 ? `${head} with ${join(companions)}` : head
}

/**
 * What to tell the user about a deep scan that has finished.
 *
 * The panel derives a richer label from the same outcome — it also knows how
 * many detections the scan added — but the report page had no feedback at all:
 * a scan where every fetch was CORS-blocked rendered identically to one that
 * read every file and found nothing. These three cases are the distinction
 * that matters, and they belong somewhere both surfaces can reach.
 */
export function deepScanMessage(outcome: { scanned: number; skipped: number } | null): string {
  if (outcome === null) return 'Deep scan finished'
  if (outcome.scanned > 0) {
    return `Read ${outcome.scanned} ${outcome.scanned === 1 ? 'script' : 'scripts'}`
  }
  return outcome.skipped > 0 ? "Couldn't read this page's scripts" : 'No scripts to scan'
}
