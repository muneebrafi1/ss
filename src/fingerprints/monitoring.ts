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
      // `window.H` is the HERE Maps v3 namespace — this same database matches
      // `H.Map` for here-maps in maps.ts, so the database itself asserted that
      // H means HERE while claiming here it means Highlight. A single uppercase
      // letter cannot be vendor-namespaced.
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
  {
    id: 'airbrake',
    name: 'Airbrake',
    category: 'monitoring',
    description: 'Error and performance monitoring',
    icon: 'airbrake',
    website: 'https://airbrake.io',
    signals: [
      { type: 'global', path: 'Airbrake', weight: 0.9 },
      { type: 'request', pattern: /api\.airbrake\.io|\.airbrake\.io\/api/, weight: 0.95 },
    ],
  },
  {
    id: 'glitchtip',
    name: 'GlitchTip',
    category: 'monitoring',
    description: 'Open-source error tracking',
    icon: 'glitchtip',
    website: 'https://glitchtip.com',
    signals: [
      { type: 'request', pattern: /app\.glitchtip\.com\/api\/\d+\/envelope/, weight: 0.95 },
    ],
  },
  {
    id: 'instabug',
    name: 'Instabug',
    category: 'monitoring',
    description: 'Bug reporting and crash reporting',
    icon: 'instabug',
    website: 'https://instabug.com',
    signals: [
      { type: 'global', path: 'Instabug', weight: 0.9 },
      { type: 'request', pattern: /api\.instabug\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'datadog-rum',
    name: 'Datadog RUM',
    category: 'monitoring',
    description: 'Real user monitoring and session replay',
    icon: 'datadog',
    website: 'https://datadoghq.com/product/real-user-monitoring',
    signals: [
      { type: 'global', path: 'DD_RUM', weight: 0.95 },
      { type: 'request', pattern: /browser-intake-datadoghq\.(?:com|eu)/, weight: 0.95 },
      { type: 'script', pattern: /datadog-rum(?:-slim)?(?:\.min)?\.js/, weight: 0.9 },
    ],
    implies: ['datadog'],
  },
  {
    id: 'better-stack',
    name: 'Better Stack',
    category: 'monitoring',
    description: 'Uptime, logs, and incident response',
    icon: 'betterstack',
    website: 'https://betterstack.com',
    signals: [
      { type: 'request', pattern: /in\.logs\.betterstack\.com|uptime\.betterstack\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'embrace',
    name: 'Embrace',
    category: 'monitoring',
    description: 'Mobile and web performance monitoring',
    icon: 'embrace',
    website: 'https://embrace.io',
    signals: [
      { type: 'request', pattern: /\.data\.emb-api\.com|api\.embrace\.io/, weight: 0.95 },
    ],
  },
  {
    id: 'sentry-replay',
    name: 'Sentry Session Replay',
    category: 'monitoring',
    description: 'Recorded sessions attached to errors',
    icon: 'sentry',
    website: 'https://sentry.io/product/session-replay',
    signals: [
      { type: 'bundle', pattern: /@sentry\/replay|replayIntegration/, weight: 0.85 },
      { type: 'request', pattern: /\.ingest\.sentry\.io\/api\/\d+\/envelope.{0,60}replay/, weight: 0.9 },
    ],
    implies: ['sentry'],
  },
]
