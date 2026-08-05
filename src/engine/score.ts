import { IMPLICATION_CEILING, IMPLICATION_DISCOUNT, MAX_WEIGHT } from '@/types'

/**
 * Combines independent signal weights with noisy-OR:
 *
 *     confidence = 1 - Π(1 - wᵢ)
 *
 * Monotone, never reaches 1.0, and rewards corroboration from independent
 * sources — two mid-weight signals from different evidence types beat one
 * strong signal — without letting a pile of weak hints impersonate proof.
 */
export function noisyOr(weights: number[]): number {
  let inverse = 1
  for (const w of weights) {
    const clamped = Math.min(Math.max(w, 0), MAX_WEIGHT)
    inverse *= 1 - clamped
  }
  return 1 - inverse
}

/**
 * Confidence contributed to an implied technology by one implier.
 *
 * Deliberately lossy: "this site uses Supabase Auth" is good evidence for
 * Supabase, but it is not the same as observing Supabase directly.
 */
export function impliedConfidence(implierConfidence: number): number {
  return implierConfidence * IMPLICATION_DISCOUNT
}

/**
 * Folds implications into a technology's own confidence.
 *
 * The aggregate of all implications is capped strictly below the display
 * threshold before being combined, so implication can reinforce a technology
 * that has direct evidence but can never surface one that has none — no matter
 * how many other detections point at it.
 */
export function combineWithImplications(direct: number, implications: number[]): number {
  if (implications.length === 0) return direct
  const impliedTotal = Math.min(noisyOr(implications), IMPLICATION_CEILING)
  return noisyOr([direct, impliedTotal])
}
