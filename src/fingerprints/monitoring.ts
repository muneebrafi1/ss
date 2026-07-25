import type { Fingerprint } from '@/types'

/**
 * Frontend error monitoring.
 *
 * Reliable: catching browser errors requires a client-side agent that installs
 * global handlers and beacons out, so these are unmissable when present.
 */
export const MONITORING: Fingerprint[] = [
  {
    id: 'sentry',
    name: 'Sentry',
    category: 'monitoring',
    description: 'Error tracking and performance monitoring',
    icon: 'sentry',
    website: 'https://sentry.io',
    signals: [
      { type: 'global', path: 'Sentry', weight: 0.95 },
      { type: 'global', path: '__SENTRY__', weight: 0.95 },
      { type: 'request', pattern: /[\w-]*\.?ingest\.(?:us\.|de\.)?sentry\.io|\/envelope\/\?sentry_key/, weight: 0.95 },
      { type: 'script', pattern: /browser\.sentry-cdn\.com|@sentry\/browser/, weight: 0.9 },
      { type: 'bundle', pattern: /@sentry\/(?:browser|react|nextjs)/, weight: 0.8 },
    ],
  },
  {
    id: 'logrocket',
    name: 'LogRocket',
    category: 'monitoring',
    description: 'Session replay and error tracking',
    icon: 'logrocket',
    website: 'https://logrocket.com',
    signals: [
      { type: 'global', path: 'LogRocket', weight: 0.95 },
      { type: 'script', pattern: /cdn\.(?:lr-)?logrocket|logrocket\.com/, weight: 0.95 },
      { type: 'request', pattern: /r\.(?:lr-)?[\w-]*\.?logrocket\.(?:io|com)/, weight: 0.9 },
    ],
  },
  {
    id: 'bugsnag',
    name: 'Bugsnag',
    category: 'monitoring',
    description: 'Error monitoring and stability scores',
    icon: 'smartbear',
    website: 'https://bugsnag.com',
    signals: [
      { type: 'global', path: 'Bugsnag', weight: 0.95 },
      { type: 'request', pattern: /(?:notify|sessions)\.bugsnag\.com|d2wy8f7a9ursnm\.cloudfront\.net/, weight: 0.95 },
    ],
  },
  {
    id: 'rollbar',
    name: 'Rollbar',
    category: 'monitoring',
    description: 'Error tracking',
    icon: 'rollbar',
    website: 'https://rollbar.com',
    signals: [
      { type: 'global', path: 'Rollbar', weight: 0.95 },
      { type: 'request', pattern: /(^|\.)api\.rollbar\.com|cdn\.rollbar\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'highlight',
    name: 'Highlight',
    category: 'monitoring',
    description: 'Open-source session replay and monitoring',
    icon: 'highlight',
    website: 'https://highlight.io',
    signals: [
      { type: 'global', path: 'H', weight: 0.7 },
      { type: 'request', pattern: /pub\.highlight\.(?:run|io)|(^|\.)api\.highlight\.run/, weight: 0.95 },
      { type: 'bundle', pattern: /highlight\.run|@highlight-run\//, weight: 0.85 },
    ],
  },
  {
    id: 'raygun',
    name: 'Raygun',
    category: 'monitoring',
    description: 'Crash and performance reporting',
    icon: 'raygun',
    website: 'https://raygun.com',
    signals: [
      { type: 'global', path: 'rg4js', weight: 0.95 },
      { type: 'script', pattern: /cdn\.raygun\.io/, weight: 0.95 },
    ],
  },
  {
    id: 'trackjs',
    name: 'TrackJS',
    category: 'monitoring',
    description: 'JavaScript error tracking',
    icon: 'trackjs',
    website: 'https://trackjs.com',
    signals: [
      { type: 'global', path: 'trackJs', weight: 0.95 },
      { type: 'script', pattern: /cdn\.trackjs\.com/, weight: 0.95 },
    ],
  },
]
