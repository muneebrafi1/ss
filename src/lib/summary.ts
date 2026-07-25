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

/** Categories that can be the subject of the sentence, most telling first. */
const SUBJECT_ORDER: CategoryId[] = ['frameworks', 'cms', 'ecommerce', 'backend']

/** Categories that follow "with", in the order they are worth mentioning. */
const COMPANION_ORDER: CategoryId[] = [
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
function pick(detections: Detection[], category: CategoryId): Detection | null {
  let best: Detection | null = null
  for (const detection of detections) {
    if (detection.category !== category) continue
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

  const subjectCategory = SUBJECT_ORDER.find((category) => pick(detections, category) !== null)
  const subject = subjectCategory ? pick(detections, subjectCategory) : null
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
