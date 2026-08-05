import { describe, expect, it } from 'vitest'
import { detect } from '@/engine'
import { DATABASE_FINGERPRINTS } from '@/fingerprints'
import { emptyEvidence, type Evidence } from '@/types'

/**
 * Sites that do not use the technology, and must not be told they do.
 *
 * Every case here was a real detection before this file existed. An audit ran
 * the shipped database against ordinary evidence — a pagination button, a
 * script called `support.js`, a plain GA4 install — and found eighteen entries
 * where a single generic signal cleared the 0.60 display threshold on its own.
 *
 * The rule they broke: a signal that can carry a detection by itself has to be
 * genuinely unambiguous — a vendor-namespaced global, a vendor hostname, a
 * vendor-specific header. A first-party path shape, an English word, or a
 * two-character global may corroborate, never carry.
 *
 * A false positive is the worst output this product has. An absent technology
 * is a gap the user can live with; a technology that isn't there is a confident
 * wrong answer they have no way to check, and it discredits every other row on
 * the card.
 */

const ev = (patch: Partial<Evidence>): Evidence => ({ ...emptyEvidence(), ...patch })
const detectedIds = (patch: Partial<Evidence>): string[] =>
  detect(ev(patch), DATABASE_FINGERPRINTS).map((d) => d.id)

/** Ordinary sites, and the technology each used to be accused of running. */
const MUST_NOT_DETECT: [string, string, Partial<Evidence>][] = [
  // Named element access: `<button id="next">` makes window.next an HTMLElement.
  ['a pagination or multi-step-form Next button', 'nextjs', { globals: ['next'] }],
  // "support.js" literally contains the substring "ort.js".
  ['a first-party support.js', 'onnx-runtime-web', { scripts: ['/assets/js/support.js'] }],
  ['a first-party report.js and export.js', 'onnx-runtime-web', {
    scripts: ['/js/report.js', '/js/export.js'],
  }],
  // The standard GA4 snippet defines window.dataLayer with no container.
  ['a plain GA4 install with no container', 'google-tag-manager', {
    globals: ['dataLayer', 'gtag'],
    scripts: ['https://www.googletagmanager.com/gtag/js?id=G-ABC123'],
    cookieNames: ['_ga', '_ga_ABC123'],
  }],
  // window.H is the HERE Maps namespace — this database matches H.Map for it.
  ['a page embedding HERE Maps', 'highlight', { globals: ['H'] }],
  // window.ko is Knockout.js.
  ['a legacy Knockout.js app', 'koala', { globals: ['ko'] }],
  ['a first-party hero-video.js', 'videojs', { scripts: ['/assets/hero-video.js'] }],
  ['a self-hosted Varnish cache', 'fastly', { responseHeaders: { via: '1.1 varnish' } }],
  // The servlet-spec session cookie: Tomcat, Jetty, JBoss, any Java web app.
  ['any Java servlet container', 'spring', { cookieNames: ['JSESSIONID'] }],
  // uvicorn serves Starlette, Litestar, Django-ASGI and anything else ASGI.
  ['any ASGI app behind uvicorn', 'fastapi', { responseHeaders: { server: 'uvicorn' } }],
  ['any OpenAPI generator serving /openapi.json', 'fastapi', {
    requests: ['example.com/openapi.json'],
  }],
  // Cowboy is the standard Erlang/Elixir HTTP server.
  ['a self-hosted Phoenix app', 'heroku', { responseHeaders: { server: 'Cowboy' } }],
  ["a site with its own window.analytics", 'segment', { globals: ['analytics'] }],
  ["a site with its own window.convert", 'convert-experiences', { globals: ['convert'] }],
  ['a page that merely mentions Livewire', 'laravel', {
    html: '<p>We migrated from livewire last year.</p>',
  }],
  ['a page that merely mentions WooCommerce', 'woocommerce', {
    html: '<p>woocommerce is great for small shops</p>',
  }],
  ['any storefront URL with a query string', 'medusa', {
    requests: ['shop.example.com/store/products?limit=10'],
  }],
  ['an ordinary first-party /auth/v1/token', 'supabase-auth', {
    requests: ['example.com/auth/v1/token'],
  }],
]

describe('sites that must not be misidentified', () => {
  for (const [site, wrongId, evidence] of MUST_NOT_DETECT) {
    it(`does not report ${wrongId} for ${site}`, () => {
      expect(detectedIds(evidence)).not.toContain(wrongId)
    })
  }

  /*
   * The other half of every fix above. Narrowing a pattern until nothing matches
   * is not a fix, it is a deletion — these are the real installs each narrowed
   * signal still has to catch.
   */
  const MUST_STILL_DETECT: [string, string, Partial<Evidence>][] = [
    ['onnx-runtime-web', 'onnx-runtime-web', {
      scripts: ['https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/ort.min.js'],
    }],
    ['videojs', 'videojs', { scripts: ['https://vjs.zencdn.net/8.10.0/video.min.js'] }],
    ['google-tag-manager', 'google-tag-manager', {
      scripts: ['https://www.googletagmanager.com/gtm.js?id=GTM-ABC123'],
      globals: ['dataLayer', 'google_tag_manager'],
    }],
    ['supabase-auth', 'supabase-auth', {
      requests: ['xyzcompany.supabase.co/auth/v1/token?grant_type=password'],
    }],
    ['laravel via wire: directives', 'laravel', {
      html: '<div wire:model="email" wire:click="save"></div>',
      cookieNames: ['laravel_session', 'XSRF-TOKEN'],
    }],
    ['woocommerce via its body class', 'woocommerce', {
      html: '<body class="woocommerce-page woocommerce-js">',
    }],
  ]

  for (const [label, id, evidence] of MUST_STILL_DETECT) {
    it(`still detects ${label}`, () => {
      expect(detectedIds(evidence)).toContain(id)
    })
  }

  // uvicorn is a real Python signal — it just is not a FastAPI signal. Cutting
  // its weight must not cost the detection that was always correct.
  it('still attributes uvicorn to Python', () => {
    expect(detectedIds({ responseHeaders: { server: 'uvicorn' } })).toContain('python')
  })
})
