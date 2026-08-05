import type { Fingerprint } from '@/types'

/**
 * Feature flags and experimentation.
 *
 * Flag evaluation and A/B assignment both have to reach the browser to change
 * what a user sees, so these are consistently visible. Grouped together because
 * the two functions have largely merged — most flag tools now run experiments
 * and most experimentation tools now ship flags.
 */
export const FLAGS: Fingerprint[] = [
  {
    id: 'launchdarkly',
    name: 'LaunchDarkly',
    category: 'flags',
    description: 'Feature flag management',
    icon: 'launchdarkly',
    website: 'https://launchdarkly.com',
    signals: [
      { type: 'request', pattern: /(?:app|events|clientstream)\.launchdarkly\.com/, weight: 0.95 },
      { type: 'bundle', pattern: /launchdarkly-js-client-sdk|LDClient/, weight: 0.85 },
    ],
  },
  {
    id: 'statsig',
    name: 'Statsig',
    category: 'flags',
    description: 'Feature flags and experimentation',
    icon: 'statsig',
    website: 'https://statsig.com',
    signals: [
      { type: 'request', pattern: /(?:^|\.)(?:api|featureassets|events)\.statsig(?:api)?\.com/, weight: 0.95 },
      { type: 'bundle', pattern: /@statsig\/(?:js-client|react-bindings)|statsig-js/, weight: 0.85 },
    ],
  },
  {
    id: 'split-io',
    name: 'Split',
    category: 'flags',
    description: 'Feature delivery and experimentation',
    icon: 'split',
    website: 'https://split.io',
    signals: [
      { type: 'request', pattern: /(?:sdk|events|auth)\.split\.io/, weight: 0.95 },
      { type: 'bundle', pattern: /@splitsoftware\/splitio/, weight: 0.85 },
    ],
  },
  {
    id: 'unleash',
    name: 'Unleash',
    category: 'flags',
    description: 'Open-source feature flags',
    icon: 'unleash',
    website: 'https://getunleash.io',
    signals: [
      { type: 'request', pattern: /[\w-]+\.(?:app\.)?unleash-hosted\.com|\/api\/frontend\/(?:features|client)/, weight: 0.9 },
      { type: 'bundle', pattern: /unleash-proxy-client|@unleash\/proxy-client-react/, weight: 0.85 },
    ],
  },
  {
    id: 'growthbook',
    name: 'GrowthBook',
    category: 'flags',
    description: 'Open-source feature flags and experiments',
    icon: 'growthbook',
    website: 'https://growthbook.io',
    signals: [
      { type: 'request', pattern: /cdn\.growthbook\.io/, weight: 0.95 },
      { type: 'bundle', pattern: /@growthbook\/growthbook/, weight: 0.85 },
    ],
  },
  {
    id: 'optimizely',
    name: 'Optimizely',
    category: 'flags',
    description: 'Experimentation and personalization',
    icon: 'optimizely',
    website: 'https://optimizely.com',
    signals: [
      { type: 'global', path: 'optimizely', weight: 0.95 },
      { type: 'script', pattern: /cdn\.optimizely\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'vwo',
    name: 'VWO',
    category: 'flags',
    description: 'A/B testing and optimization',
    icon: 'vwo',
    website: 'https://vwo.com',
    signals: [
      { type: 'global', path: '_vwo_code', weight: 0.95 },
      { type: 'script', pattern: /dev\.visualwebsiteoptimizer\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'ab-tasty',
    name: 'AB Tasty',
    category: 'flags',
    description: 'Experimentation and personalization',
    icon: 'abtasty',
    website: 'https://abtasty.com',
    signals: [
      { type: 'global', path: 'ABTasty', weight: 0.95 },
      { type: 'script', pattern: /try\.abtasty\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'flagsmith',
    name: 'Flagsmith',
    category: 'flags',
    description: 'Open-source feature flag management',
    icon: 'flagsmith',
    website: 'https://flagsmith.com',
    signals: [
      { type: 'global', path: 'flagsmith', weight: 0.9 },
      { type: 'request', pattern: /(?:api|edge)\.flagsmith\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'configcat',
    name: 'ConfigCat',
    category: 'flags',
    description: 'Hosted feature flag service',
    icon: 'configcat',
    website: 'https://configcat.com',
    signals: [
      { type: 'request', pattern: /cdn-global\.configcat\.com|[\w-]*\.configcat\.com\/configuration-files/, weight: 0.95 },
      { type: 'bundle', pattern: /configcat-(?:js|common)-client/, weight: 0.85 },
    ],
  },
  {
    id: 'eppo',
    name: 'Eppo',
    category: 'flags',
    description: 'Experimentation and feature flags',
    icon: 'eppo',
    website: 'https://geteppo.com',
    signals: [
      { type: 'request', pattern: /fscdn\.eppo\.cloud|api\.geteppo\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'kameleoon',
    name: 'Kameleoon',
    category: 'flags',
    description: 'A/B testing and personalization',
    icon: 'kameleoon',
    website: 'https://kameleoon.com',
    signals: [
      { type: 'global', path: 'Kameleoon', weight: 0.95 },
      { type: 'script', pattern: /[\w-]*\.kameleoon\.(?:com|eu)/, weight: 0.95 },
    ],
  },
  {
    id: 'convert-experiences',
    name: 'Convert',
    category: 'flags',
    description: 'A/B testing for marketing sites',
    icon: 'convert',
    website: 'https://convert.com',
    signals: [
      // An ordinary English word, and a plausible name for any page's own
      // helper function or a `<button id="convert">`.
      { type: 'global', path: 'convert', weight: 0.35 },
      { type: 'script', pattern: /cdn-\d+\.convertexperiments\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'hypertune',
    name: 'Hypertune',
    category: 'flags',
    description: 'Type-safe feature flags and config',
    icon: 'hypertune',
    website: 'https://hypertune.com',
    signals: [
      { type: 'request', pattern: /edge\.hypertune\.com|api\.hypertune\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'amplitude-experiment',
    name: 'Amplitude Experiment',
    category: 'flags',
    description: 'Experimentation built on Amplitude',
    icon: 'amplitude',
    website: 'https://amplitude.com/experiment',
    signals: [
      { type: 'request', pattern: /api\.lab\.amplitude\.com|flag\.lab\.amplitude\.com/, weight: 0.95 },
    ],
    implies: ['amplitude'],
  },
]
