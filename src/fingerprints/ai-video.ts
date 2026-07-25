import type { Fingerprint } from '@/types'

/**
 * AI video generation and avatars.
 *
 * Mostly detected through embedded players and CDN delivery domains rather than
 * API calls — generation happens asynchronously on the provider's side and the
 * browser only ever sees the finished asset.
 */
export const AI_VIDEO: Fingerprint[] = [
  {
    id: 'tavus',
    name: 'Tavus',
    category: 'ai-video',
    description: 'AI video avatars and conversational video',
    icon: 'tavus',
    website: 'https://tavus.io',
    signals: [
      { type: 'request', pattern: /tavusapi\.com|(^|\.)api\.tavus\.io/, weight: 0.95 },
      { type: 'script', pattern: /tavus.*embed|cvi-embed/, weight: 0.85 },
    ],
  },
  {
    id: 'synthesia',
    name: 'Synthesia',
    category: 'ai-video',
    description: 'AI avatar video generation',
    icon: 'synthesia',
    website: 'https://synthesia.io',
    signals: [
      { type: 'request', pattern: /(^|\.)api\.synthesia\.io/, weight: 0.95 },
      { type: 'request', pattern: /share\.synthesia\.io|synthesia-videos/, weight: 0.85 },
      { type: 'script', pattern: /synthesia.*embed/, weight: 0.8 },
    ],
  },
  {
    id: 'heygen',
    name: 'HeyGen',
    category: 'ai-video',
    description: 'AI avatar and video translation',
    icon: 'heygen',
    website: 'https://heygen.com',
    signals: [
      { type: 'request', pattern: /(^|\.)api\.heygen\.com/, weight: 0.95 },
      { type: 'request', pattern: /resource[\w.-]*\.heygen\.(?:ai|com)/, weight: 0.85 },
      { type: 'bundle', pattern: /@heygen\/streaming-avatar/, weight: 0.85 },
    ],
  },
  {
    id: 'did',
    name: 'D-ID',
    category: 'ai-video',
    description: 'Talking-head avatar video',
    icon: 'did',
    website: 'https://d-id.com',
    signals: [
      { type: 'request', pattern: /(^|\.)api\.d-id\.com/, weight: 0.95 },
      { type: 'script', pattern: /d-id.*agent|did-agent/, weight: 0.85 },
    ],
  },
  {
    id: 'runway',
    name: 'Runway',
    category: 'ai-video',
    description: 'AI video generation and editing',
    icon: 'runway',
    website: 'https://runwayml.com',
    signals: [
      { type: 'request', pattern: /(^|\.)api\.(?:dev\.)?runwayml\.com/, weight: 0.95 },
      { type: 'bundle', pattern: /@runwayml\/sdk|gen[34][a-z]?_turbo/, weight: 0.7 },
    ],
  },
  {
    id: 'luma-ai',
    name: 'Luma AI',
    category: 'ai-video',
    description: 'Dream Machine video generation',
    icon: 'luma',
    website: 'https://lumalabs.ai',
    signals: [
      { type: 'request', pattern: /(^|\.)api\.lumalabs\.ai/, weight: 0.95 },
      { type: 'bundle', pattern: /lumaai|ray-?[12](?:-flash)?\b.{0,20}luma/i, weight: 0.65 },
    ],
  },
]
