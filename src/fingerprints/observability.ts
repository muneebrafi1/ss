import type { Fingerprint } from '@/types'

/**
 * Observability, APM, and real-user monitoring.
 *
 * A useful maturity signal: these tools cost real money and take effort to
 * wire up, so their presence says something about the engineering team behind
 * a site. Detected through their browser RUM agents, since the server-side half
 * is invisible.
 */
export const OBSERVABILITY: Fingerprint[] = [
  {
    id: 'datadog',
    name: 'Datadog',
    category: 'observability',
    description: 'Monitoring and real-user monitoring',
    icon: 'datadog',
    website: 'https://datadoghq.com',
    signals: [
      { type: 'global', path: 'DD_RUM', weight: 0.95 },
      { type: 'global', path: 'DD_LOGS', weight: 0.95 },
      { type: 'script', pattern: /datadog-rum|www\.datadoghq-browser-agent\.com/, weight: 0.95 },
      { type: 'request', pattern: /browser-intake-datadoghq\.(?:com|eu)/, weight: 0.95 },
    ],
  },
  {
    id: 'new-relic',
    name: 'New Relic',
    category: 'observability',
    description: 'Application performance monitoring',
    icon: 'newrelic',
    website: 'https://newrelic.com',
    signals: [
      { type: 'global', path: 'newrelic', weight: 0.95 },
      { type: 'global', path: 'NREUM', weight: 0.95 },
      { type: 'request', pattern: /(?:bam|js-agent)\.(?:eu01\.)?nr-data\.net/, weight: 0.95 },
    ],
  },
  {
    id: 'grafana-faro',
    name: 'Grafana',
    category: 'observability',
    description: 'Dashboards and frontend observability',
    icon: 'grafana',
    website: 'https://grafana.com',
    signals: [
      { type: 'request', pattern: /faro-collector-[\w-]+\.grafana\.net/, weight: 0.95 },
      { type: 'bundle', pattern: /@grafana\/faro-web-sdk/, weight: 0.85 },
    ],
  },
  {
    id: 'axiom',
    name: 'Axiom',
    category: 'observability',
    description: 'Log management and event data',
    icon: 'axiom',
    website: 'https://axiom.co',
    signals: [
      { type: 'request', pattern: /(^|\.)api\.axiom\.co|cdn\.axiom\.co/, weight: 0.95 },
      { type: 'bundle', pattern: /next-axiom|@axiomhq\//, weight: 0.85 },
    ],
  },
  {
    id: 'honeycomb',
    name: 'Honeycomb',
    category: 'observability',
    description: 'Observability for distributed systems',
    icon: 'honeycomb',
    website: 'https://honeycomb.io',
    signals: [
      { type: 'request', pattern: /(^|\.)api\.honeycomb\.io/, weight: 0.95 },
      { type: 'bundle', pattern: /@honeycombio\/opentelemetry-web/, weight: 0.85 },
    ],
  },
  {
    id: 'opentelemetry',
    name: 'OpenTelemetry',
    category: 'observability',
    description: 'Vendor-neutral tracing and metrics',
    icon: 'opentelemetry',
    website: 'https://opentelemetry.io',
    signals: [
      { type: 'request', pattern: /\/v1\/traces(?:$|\?)/, weight: 0.7 },
      { type: 'bundle', pattern: /@opentelemetry\/(?:sdk-trace-web|instrumentation)/, weight: 0.85 },
      { type: 'header', name: 'traceparent', weight: 0.5 },
    ],
  },
  {
    id: 'dynatrace',
    name: 'Dynatrace',
    category: 'observability',
    description: 'Enterprise application monitoring',
    icon: 'dynatrace',
    website: 'https://dynatrace.com',
    signals: [
      { type: 'global', path: 'dtrum', weight: 0.95 },
      { type: 'script', pattern: /ruxitagentjs|dynatrace\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'elastic-apm',
    name: 'Elastic APM',
    category: 'observability',
    description: 'Application performance monitoring',
    icon: 'elastic',
    website: 'https://elastic.co/observability',
    signals: [
      { type: 'global', path: 'elasticApm', weight: 0.95 },
      { type: 'bundle', pattern: /@elastic\/apm-rum/, weight: 0.85 },
    ],
  },
]
