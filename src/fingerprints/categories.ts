import type { Category, CategoryId } from '@/types'

/**
 * Every category, in the order the panel renders them.
 *
 * The order is identical on every site so the layout becomes learnable, and it
 * is ranked by how much people care rather than by how a site is assembled.
 * The first six render as open card grids; the rest sit behind "N more tools".
 */
export const CATEGORIES: Category[] = [
  // Core — expanded by default.
  { id: 'ai-models', name: 'AI Models', core: true },
  { id: 'frameworks', name: 'Frontend', core: true },
  { id: 'hosting', name: 'Hosting & CDN', core: true },
  { id: 'database', name: 'Database', core: true },
  { id: 'auth', name: 'Authentication', core: true },
  { id: 'payments', name: 'Payments', core: true },

  // Collapsed.
  { id: 'ai-sdks', name: 'AI SDKs', core: false },
  { id: 'vector-search', name: 'Vector DB & Search', core: false },
  { id: 'ai-voice', name: 'AI Voice', core: false },
  { id: 'ai-video', name: 'AI Video', core: false },
  { id: 'backend', name: 'Backend', core: false },
  { id: 'analytics', name: 'Analytics', core: false },
  { id: 'email', name: 'Email', core: false },
  { id: 'monitoring', name: 'Error Monitoring', core: false },
  { id: 'observability', name: 'Observability & APM', core: false },
  { id: 'flags', name: 'Feature Flags & Experiments', core: false },
  { id: 'realtime', name: 'Realtime & Collaboration', core: false },
  { id: 'media', name: 'Video & Media', core: false },
  { id: 'storage', name: 'Storage & Assets', core: false },
  { id: 'cms', name: 'CMS & Docs', core: false },
  { id: 'ecommerce', name: 'Ecommerce', core: false },
  { id: 'marketing', name: 'Marketing & CRM', core: false },
  { id: 'chat', name: 'Chat & Support', core: false },
  { id: 'forms', name: 'Forms & Scheduling', core: false },
  { id: 'maps', name: 'Maps', core: false },
  { id: 'consent', name: 'Consent & Privacy', core: false },
]

/** Rank of a category in the fixed display order. */
export const CATEGORY_ORDER = new Map<CategoryId, number>(
  CATEGORIES.map((c, index) => [c.id, index]),
)

export const CATEGORY_BY_ID = new Map<CategoryId, Category>(
  CATEGORIES.map((c) => [c.id, c]),
)

/**
 * How many categories the panel opens with.
 *
 * Used by the promotion rule: when a core category turns up empty, the next
 * non-empty category is pulled up so the opening view is never sparse.
 */
export const OPEN_CATEGORY_COUNT = CATEGORIES.filter((c) => c.core).length
