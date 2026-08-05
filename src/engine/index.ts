import { DISPLAY_THRESHOLD, type Detection, type Evidence, type Fingerprint } from '@/types'
import { matchedSignals } from './match'
import { combineWithImplications, impliedConfidence, noisyOr } from './score'
import { extractVersion } from './version'

export { matchSignal, matchedSignals, collectDomSelectors, collectGlobalPaths } from './match'
export { noisyOr, impliedConfidence, combineWithImplications } from './score'
export { extractVersion, extractOne } from './version'

/** Confidence a fingerprint earns from its own signals alone. */
function directConfidence(fingerprint: Fingerprint, evidence: Evidence): number {
  const matched = matchedSignals(fingerprint.signals, evidence)
  if (matched.length === 0) return 0
  return noisyOr(matched.map((s) => s.weight))
}

/**
 * Identifies every technology the evidence supports.
 *
 * Detections below `DISPLAY_THRESHOLD` are dropped rather than returned. The
 * panel shows no confidence indicator of any kind, so a shaky guess would be
 * indistinguishable from a certainty — the threshold is what keeps that from
 * happening, which makes it a correctness boundary rather than a display
 * preference.
 *
 * Implications are propagated a single hop, from impliers that independently
 * cleared the threshold. Chains are not followed: a fingerprint that needs to
 * imply something transitively lists it directly, which keeps propagation
 * predictable and makes cycles structurally impossible.
 */
export function detect(evidence: Evidence, database: Fingerprint[]): Detection[] {
  const direct = new Map<string, number>()
  for (const fingerprint of database) {
    const confidence = directConfidence(fingerprint, evidence)
    if (confidence > 0) direct.set(fingerprint.id, confidence)
  }

  // Only confidently detected technologies get to vouch for others.
  const implications = new Map<string, number[]>()
  for (const fingerprint of database) {
    if (!fingerprint.implies?.length) continue
    const confidence = direct.get(fingerprint.id) ?? 0
    if (confidence < DISPLAY_THRESHOLD) continue
    for (const impliedId of fingerprint.implies) {
      if (impliedId === fingerprint.id) continue
      const list = implications.get(impliedId) ?? []
      list.push(impliedConfidence(confidence))
      implications.set(impliedId, list)
    }
  }

  const detections: Detection[] = []
  for (const fingerprint of database) {
    const confidence = combineWithImplications(
      direct.get(fingerprint.id) ?? 0,
      implications.get(fingerprint.id) ?? [],
    )
    if (confidence < DISPLAY_THRESHOLD) continue

    detections.push({
      id: fingerprint.id,
      name: fingerprint.name,
      category: fingerprint.category,
      description: fingerprint.description,
      icon: fingerprint.icon,
      url: fingerprint.referralUrl || fingerprint.website,
      version: extractVersion(fingerprint.version, evidence),
      confidence,
    })
  }

  return detections.sort(
    (a, b) => b.confidence - a.confidence || a.name.localeCompare(b.name),
  )
}
