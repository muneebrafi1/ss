import { MAX_WEIGHT, type Fingerprint } from '@/types'
import { CATEGORY_BY_ID } from './categories'

import { AI_MODELS } from './ai-models'
import { AI_SDKS } from './ai-sdks'
import { AI_VOICE } from './ai-voice'
import { AI_VIDEO } from './ai-video'
import { VECTOR_SEARCH } from './vector-search'
import { FRAMEWORKS } from './frameworks'
import { HOSTING } from './hosting'
import { BACKEND } from './backend'
import { DATABASE } from './database'
import { AUTH } from './auth'
import { PAYMENTS } from './payments'
import { ANALYTICS } from './analytics'
import { EMAIL } from './email'
import { MONITORING } from './monitoring'
import { OBSERVABILITY } from './observability'
import { FLAGS } from './flags'
import { REALTIME } from './realtime'
import { MEDIA } from './media'
import { STORAGE } from './storage'
import { CMS } from './cms'
import { ECOMMERCE } from './ecommerce'
import { MARKETING } from './marketing'
import { CHAT } from './chat'
import { FORMS } from './forms'
import { MAPS } from './maps'
import { CONSENT } from './consent'

export { CATEGORIES, CATEGORY_ORDER, CATEGORY_BY_ID, OPEN_CATEGORY_COUNT } from './categories'

export const DATABASE_FINGERPRINTS: Fingerprint[] = [
  ...AI_MODELS,
  ...AI_SDKS,
  ...VECTOR_SEARCH,
  ...AI_VOICE,
  ...AI_VIDEO,
  ...FRAMEWORKS,
  ...HOSTING,
  ...BACKEND,
  ...DATABASE,
  ...AUTH,
  ...PAYMENTS,
  ...ANALYTICS,
  ...EMAIL,
  ...MONITORING,
  ...OBSERVABILITY,
  ...FLAGS,
  ...REALTIME,
  ...MEDIA,
  ...STORAGE,
  ...CMS,
  ...ECOMMERCE,
  ...MARKETING,
  ...CHAT,
  ...FORMS,
  ...MAPS,
  ...CONSENT,
]

export interface ValidationIssue {
  id: string
  problem: string
}

/**
 * Structural checks over the whole database.
 *
 * A malformed fingerprint fails silently at runtime — it simply never matches
 * anything, and nobody notices a technology quietly missing from every scan.
 * Surfacing these as test failures is the only practical way to keep a database
 * this size honest.
 */
export function validateDatabase(database: Fingerprint[] = DATABASE_FINGERPRINTS): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const seenIds = new Set<string>()
  const knownIds = new Set(database.map((f) => f.id))

  for (const fingerprint of database) {
    const { id } = fingerprint

    if (seenIds.has(id)) issues.push({ id, problem: 'duplicate id' })
    seenIds.add(id)

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
      issues.push({ id, problem: 'id must be kebab-case' })
    }
    if (!fingerprint.name.trim()) issues.push({ id, problem: 'missing name' })
    if (!fingerprint.description.trim()) issues.push({ id, problem: 'missing description' })
    if (fingerprint.description.endsWith('.')) {
      issues.push({ id, problem: 'description should not end with a period' })
    }
    if (!fingerprint.icon.trim()) issues.push({ id, problem: 'missing icon' })
    if (!CATEGORY_BY_ID.has(fingerprint.category)) {
      issues.push({ id, problem: `unknown category "${fingerprint.category}"` })
    }
    if (!/^https:\/\//.test(fingerprint.website)) {
      issues.push({ id, problem: 'website must be an https url' })
    }
    if (fingerprint.signals.length === 0) {
      issues.push({ id, problem: 'has no signals and can never match' })
    }

    for (const signal of fingerprint.signals) {
      if (!(signal.weight > 0)) {
        issues.push({ id, problem: `signal weight must be above 0, got ${signal.weight}` })
      }
      if (signal.weight > MAX_WEIGHT) {
        issues.push({ id, problem: `signal weight ${signal.weight} exceeds MAX_WEIGHT` })
      }
      if (signal.type === 'dom') {
        try {
          // Throws on an invalid selector. `document` is absent under Node, so
          // this check only runs where the DOM exists; the test suite runs it
          // explicitly in a DOM environment.
          globalThis.document?.querySelector(signal.selector)
        } catch {
          issues.push({ id, problem: `invalid dom selector "${signal.selector}"` })
        }
      }
    }

    for (const impliedId of fingerprint.implies ?? []) {
      if (!knownIds.has(impliedId)) {
        issues.push({ id, problem: `implies unknown id "${impliedId}"` })
      }
      if (impliedId === id) issues.push({ id, problem: 'implies itself' })
    }
  }

  return issues
}
