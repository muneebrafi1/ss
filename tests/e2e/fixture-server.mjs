/**
 * Local stand-ins for real websites, used by the end-to-end checks.
 *
 * Outbound network access is blocked in this environment, so real sites are
 * unreachable. Chrome is launched with `--host-resolver-rules` mapping every
 * hostname to this server, which means a page genuinely requests
 * `api.openai.com` or `cdn.shopify.com` and the extension observes the real
 * hostname. That matters: the request patterns in the database are anchored to
 * hostnames and would correctly refuse to match a rewritten path.
 *
 * Each site below reproduces a different shape of the real web, because a
 * detector that only ever sees one kind of page is a detector with untested
 * failure modes.
 */
import { createServer } from 'node:http'

const PORT = Number(process.env.FIXTURE_PORT ?? 8787)

export const SITES = {
  modern: 'app.fixture.test',
  wordpress: 'blog.fixture.test',
  shopify: 'shop.fixture.test',
  spa: 'spa.fixture.test',
  plain: 'plain.fixture.test',
  locked: 'locked.fixture.test',
  marketing: 'marketing.fixture.test',
  docs: 'docs.fixture.test',
  smallbiz: 'smallbiz.fixture.test',
  publisher: 'news.fixture.test',
  heavy: 'heavy.fixture.test',
}

/* -------------------------------------------------------------------------- */
/* A modern AI SaaS: Next.js on Vercel, Clerk, Supabase, Stripe, PostHog       */
/* -------------------------------------------------------------------------- */

const MODERN_REQUESTS = [
  'http://api.openai.com/v1/chat/completions',
  'http://app.posthog.com/e/?ip=1',
  'http://clerk.app.fixture.test.accounts.dev/v1/client',
  'http://abcdefgh.supabase.co/rest/v1/posts?select=*',
  'http://o12345.ingest.sentry.io/api/1/envelope/?sentry_key=abc',
  'http://widget.intercom.io/widget/abc123',
  'http://api.resend.com/emails',
  'http://gs1.svc.us-east-1.pinecone.io/query',
  'http://api.elevenlabs.io/v1/text-to-speech/voice',
  'http://res.cloudinary.com/demo/image/upload/sample.jpg',
]

const MODERN_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>Fixture app</title>
<!--
  Segment appears ONLY as a preconnect. A preconnect opens a connection and
  fetches nothing, so neither the webRequest observer nor Resource Timing will
  ever see it — detecting Segment here proves the probe is reading declared
  resource hosts out of the markup, which is the whole point of collecting them.
-->
<link rel="preconnect" href="http://cdn.segment.com">
<script src="/_next/static/chunks/main-app.js"></script>
<script src="http://js.stripe.com/v3"></script>
<script src="http://static.hotjar.com/c/hotjar-123.js"></script>
</head><body><div id="__next"><h1>Fixture</h1>
<iframe name="__privateStripeFrame1234" src="about:blank" title="stripe"></iframe>
<div class="intercom-lightweight-app"></div>
</div></body></html>`

const MODERN_BUNDLE = `
window.__NEXT_DATA__ = { props: {}, page: "/", buildId: "fixture" };
window.Stripe = function Stripe(){};
window.Clerk = { loaded: true };
window.posthog = { capture: function(){} };
window.Sentry = { captureException: function(){} };
window.__SENTRY__ = {};
window.Intercom = function(){};
window.hj = function(){};
window.React = { version: "18.3.1" };
try {
  localStorage.setItem("sb-abcdefgh-auth-token", "redacted");
  localStorage.setItem("ph_phc_demo_posthog", "redacted");
} catch (e) {}
var MODEL = "gpt-4o-mini";
var CLAUDE = "claude-sonnet-4-5-20250929";
var PKGS = ["@clerk/nextjs", "@supabase/supabase-js", "@sentry/nextjs",
            "@pinecone-database/pinecone", "@ai-sdk/react", "@elevenlabs/react"];
${MODERN_REQUESTS.map((u) => `fetch(${JSON.stringify(u)}, {mode:"no-cors"}).catch(function(){});`).join('\n')}
`

/* -------------------------------------------------------------------------- */
/* A WordPress blog: WooCommerce, Elementor, jQuery, GA, Mailchimp            */
/* -------------------------------------------------------------------------- */

const WORDPRESS_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="generator" content="WordPress 6.7.1">
<meta name="generator" content="WooCommerce 9.4.2">
<title>Fixture blog</title>
<link rel="stylesheet" href="/wp-content/themes/hello-elementor/style.css">
<script src="/wp-includes/js/jquery/jquery-3.7.1.min.js"></script>
<script src="/wp-content/plugins/elementor/assets/js/frontend.js"></script>
<script src="http://www.googletagmanager.com/gtag/js?id=G-ABC123"></script>
</head><body class="woocommerce elementor-page">
<div class="elementor-section"><h1>Blog</h1></div>
<form action="http://fixture.us1.list-manage.com/subscribe/post"><input name="EMAIL"></form>
</body></html>`

const WORDPRESS_BUNDLE = `
window.jQuery = function(){}; window.jQuery.fn = { jquery: "3.7.1" };
window.gtag = function(){}; window.dataLayer = [];
try { localStorage.setItem("wp-settings-time-1", "redacted"); } catch (e) {}
fetch("http://www.google-analytics.com/g/collect?v=2", {mode:"no-cors"}).catch(function(){});
fetch("/wp-json/wp/v2/posts", {mode:"no-cors"}).catch(function(){});
`

/* -------------------------------------------------------------------------- */
/* A Shopify store: Shop Pay, Klaviyo, Gorgias, consent banner                */
/* -------------------------------------------------------------------------- */

/*
 * Filler long enough to push what follows it past the 250,000-character HTML
 * sample. Real theme markup routinely runs this long, and it is exactly why
 * inline script text is collected separately: the tag manager snippet below
 * sits after the cut, so it is invisible to any `html` signal that only sees
 * the truncated document.
 */
const SHOPIFY_FILLER = `<!-- ${'shopify liquid section markup. '.repeat(9000)} -->`

const SHOPIFY_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>Fixture store</title>
<script src="http://cdn.shopify.com/s/files/1/assets/theme.js"></script>
<script src="http://static.klaviyo.com/onsite/js/klaviyo.js"></script>
<script src="http://config.gorgias.chat/bundle-loader.js"></script>
</head><body><h1>Store</h1>
${SHOPIFY_FILLER}
<script>
  var gtmFrame = "http://www.googletagmanager.com/ns.html?id=GTM-FIXTURE";
</script>
</body></html>`

const SHOPIFY_BUNDLE = `
window.Shopify = { shop: "fixture.myshopify.com", theme: { id: 1 } };
window.klaviyo = { push: function(){} };
window._learnq = [];
window.GorgiasChat = {};
fetch("http://portal.shop.app/pay/session", {mode:"no-cors"}).catch(function(){});
fetch("http://monorail-edge.shopifysvc.com/v1/produce", {mode:"no-cors"}).catch(function(){});
`

/* -------------------------------------------------------------------------- */
/* A single-page app that navigates with pushState                            */
/* -------------------------------------------------------------------------- */

const SPA_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>Fixture SPA</title><script src="/app.js"></script>
</head><body><div id="root"><div data-v-app></div>
<img src="http://res.cloudinary.com/demo/image/upload/hero.jpg" alt="">
<iframe src="http://calendly.com/fixture/30min" title="Book a call"></iframe>
</div></body></html>`

const SPA_BUNDLE = `
window.Vue = { version: "3.5.13" };
window.__SPA_READY__ = true;
fetch("http://api.mapbox.com/styles/v1", {mode:"no-cors"}).catch(function(){});
window.__navigate = function (path) { history.pushState({}, "", path); };
`

/* -------------------------------------------------------------------------- */
/* Bare HTML with nothing to find, and a page that refuses script downloads    */
/* -------------------------------------------------------------------------- */

const PLAIN_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>Plain page</title></head><body><h1>Just text</h1><p>No frameworks here.</p></body></html>`

const LOCKED_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>Locked page</title><script src="/locked.js"></script>
</head><body><h1>Locked</h1></body></html>`

/* -------------------------------------------------------------------------- */
/* A marketing site: Webflow, HubSpot, Calendly, consent banner               */
/* -------------------------------------------------------------------------- */

const MARKETING_HTML = `<!doctype html><html lang="en" data-wf-page="abc123"><head><meta charset="utf-8">
<meta name="generator" content="Webflow">
<title>Fixture marketing</title>
<link rel="preconnect" href="http://fonts.gstatic.com">
<link rel="stylesheet" href="http://fonts.googleapis.com/css2?family=Inter">
<script src="http://js.hs-scripts.com/1234567.js"></script>
<script src="http://assets.calendly.com/assets/external/widget.js"></script>
<script src="http://cdn.cookielaw.org/scripttemplates/otSDKStub.js"></script>
<script src="/site.js"></script>
</head><body class="w-body">
<div class="w-container"><h1>Marketing</h1></div>
<div class="calendly-inline-widget" data-url="http://calendly.com/fixture"></div>
<div id="onetrust-consent-sdk"></div>
</body></html>`

const MARKETING_BUNDLE = `
window.Webflow = window.Webflow || []; window.Webflow.push(function(){});
window._hsq = []; window.HubSpotConversations = { widget: {} };
window.Calendly = { initInlineWidget: function(){} };
window.OneTrust = { IsAlertBoxClosed: function(){ return true; } };
window.OptanonWrapper = function(){};
fetch("http://forms.hsforms.com/embed/v3/form", {mode:"no-cors"}).catch(function(){});
fetch("http://track.hubspot.com/__ptq.gif", {mode:"no-cors"}).catch(function(){});
`

/* -------------------------------------------------------------------------- */
/* A documentation site: Docusaurus on GitHub Pages with Algolia DocSearch    */
/* -------------------------------------------------------------------------- */

const DOCS_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="generator" content="Docusaurus v3.6.3">
<title>Fixture docs</title>
<script src="/assets/js/main.docusaurus.js"></script>
</head><body class="navigation-with-keyboard">
<div id="__docusaurus"><button class="DocSearch-Button">Search</button>
<nav class="navbar"><h1>Docs</h1></nav></div>
</body></html>`

const DOCS_BUNDLE = `
window.docusaurus = { prefetch: function(){} };
var pkgs = ["@docsearch/react", "@docusaurus/core"];
fetch("http://abc123-dsn.algolia.net/1/indexes/*/queries", {mode:"no-cors"}).catch(function(){});
`

/* -------------------------------------------------------------------------- */
/* A small-business site builder: Wix, Meta Pixel, reCAPTCHA                  */
/* -------------------------------------------------------------------------- */

const SMALLBIZ_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="generator" content="Wix.com Website Builder">
<title>Fixture small business</title>
<script src="http://static.parastorage.com/services/wix-thunderbolt/dist/main.js"></script>
<script src="http://www.google.com/recaptcha/api.js"></script>
<script src="http://code.jquery.com/jquery-3.6.0.min.js"></script>
<script src="/site.js"></script>
</head><body>
<div id="SITE_CONTAINER"><h1>Small business</h1></div>
<div class="g-recaptcha" data-sitekey="fixture"></div>
</body></html>`

const SMALLBIZ_BUNDLE = `
window.wixPerformanceMeasurements = {}; window.wixBiSession = { viewerSessionId: "fixture" };
window.jQuery = function(){}; window.jQuery.fn = { jquery: "3.6.0" };
window.grecaptcha = { render: function(){} };
window.fbq = function(){}; window._fbq = window.fbq;
fetch("http://www.facebook.com/tr/?id=123&ev=PageView", {mode:"no-cors"}).catch(function(){});
fetch("http://frog.wix.com/bi", {mode:"no-cors"}).catch(function(){});
`

/* -------------------------------------------------------------------------- */
/* A publisher: WordPress behind Cloudflare, heavy third-party ad tech        */
/* -------------------------------------------------------------------------- */

const PUBLISHER_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="generator" content="WordPress 6.7.1">
<title>Fixture news</title>
<script src="http://securepubads.g.doubleclick.net/tag/js/gpt.js"></script>
<script src="http://cdn.parsely.com/keys/fixture.test/p.js"></script>
<script src="http://cdn.taboola.com/libtrc/fixture/loader.js"></script>
<script src="http://content.jwplatform.com/libraries/abc123.js"></script>
<script src="/site.js"></script>
</head><body>
<div id="div-gpt-ad-1"></div>
<img src="http://i0.wp.com/fixture.test/hero.jpg" alt="">
</body></html>`

const PUBLISHER_BUNDLE = `
window.googletag = { cmd: [] };
window.PARSELY = { autotrack: true };
window._taboola = [];
window.jwplayer = function(){ return { setup: function(){} }; };
fetch("http://p1.parsely.com/plogger/", {mode:"no-cors"}).catch(function(){});
fetch("http://trc.taboola.com/fixture/log/3/init", {mode:"no-cors"}).catch(function(){});
`

/* -------------------------------------------------------------------------- */
/* A deliberate stress page                                                    */
/* -------------------------------------------------------------------------- */

/*
 * Nothing here is about detection. Every cap in `src/background/store.ts` is
 * recent code — the request ceiling, the inline-script budget, the per-host
 * image limit in the probe — and untested caps fail in the worst way, by
 * quietly discarding evidence on exactly the large real sites where the panel
 * most needs to be right. This page is bigger than any of them.
 */
const HEAVY_IMAGES = Array.from(
  { length: 400 },
  (_, i) => `<img src="http://img.heavycdn.test/photo-${i}.jpg" alt="">`,
).join('')

const HEAVY_FRAMES = Array.from(
  { length: 60 },
  (_, i) => `<iframe src="http://embed-${i}.heavyframe.test/widget" title="w${i}"></iframe>`,
).join('')

const HEAVY_INLINE = Array.from(
  { length: 20 },
  (_, i) => `<script>var block${i} = "${'x'.repeat(10000)}";</script>`,
).join('')

const HEAVY_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>Fixture heavy</title><script src="/heavy.js"></script>
</head><body><h1>Heavy</h1>
${HEAVY_IMAGES}
${HEAVY_FRAMES}
<!-- ${'filler markup to inflate the document. '.repeat(30000)} -->
${HEAVY_INLINE}
</body></html>`

// 1,500 subresource requests, so Resource Timing alone overruns the cap — and
// then one call to a host that matters, issued dead last. Under a flat
// first-come cap that call is dropped and the site's payment provider vanishes;
// under per-host budgeting it survives. That is the whole reason the cap is
// shaped the way it is, so the fixture states it as a fact to be checked.
const HEAVY_BUNDLE = `
window.React = { version: "18.3.1" };
for (var i = 0; i < 1500; i++) {
  fetch("http://api.heavyapi.test/item/" + i, {mode:"no-cors"}).catch(function(){});
}
setTimeout(function () {
  // An <img>, not a fetch. Chrome omits opaque no-cors fetches from Resource
  // Timing entirely — measured — so that version of this rode on a single
  // webRequest event and was order-dependent between runs. An image appears in
  // Resource Timing *and* in the DOM, both of which the probe reads, so what is
  // under test is the request budget rather than the browser's event timing.
  var late = document.createElement("img");
  late.src = "http://js.stripe.com/v3/late-arrival.png";
  document.body.appendChild(late);
}, 400);
`

/* -------------------------------------------------------------------------- */

const SITE_CONFIG = {
  [SITES.modern]: {
    html: MODERN_HTML,
    bundle: MODERN_BUNDLE,
    headers: {
      server: 'Vercel',
      'x-vercel-id': 'iad1::fixture::abc123',
      'x-vercel-cache': 'HIT',
      'x-powered-by': 'Next.js 15.1.0',
    },
    cookies: ['__stripe_mid=fixture; Path=/', '__clerk_db_jwt=fixture; Path=/', '_ga=GA1.1.fixture; Path=/'],
  },
  [SITES.wordpress]: {
    html: WORDPRESS_HTML,
    bundle: WORDPRESS_BUNDLE,
    headers: { server: 'Apache/2.4.62', 'x-powered-by': 'PHP/8.2.10' },
    cookies: ['PHPSESSID=fixture; Path=/', 'woocommerce_cart_hash=fixture; Path=/'],
  },
  [SITES.shopify]: {
    html: SHOPIFY_HTML,
    bundle: SHOPIFY_BUNDLE,
    headers: { server: 'cloudflare', 'cf-ray': 'abc123-IAD', 'x-shopid': '12345' },
    cookies: ['_shopify_y=fixture; Path=/', 'cart_currency=USD; Path=/'],
  },
  [SITES.spa]: {
    html: SPA_HTML,
    bundle: SPA_BUNDLE,
    headers: { server: 'nginx/1.25.3' },
    cookies: [],
  },
  [SITES.marketing]: {
    html: MARKETING_HTML,
    bundle: MARKETING_BUNDLE,
    headers: { server: 'Webflow', 'x-served-by': 'webflow' },
    cookies: ['hubspotutk=fixture; Path=/', 'OptanonConsent=fixture; Path=/'],
  },
  [SITES.docs]: {
    html: DOCS_HTML,
    bundle: DOCS_BUNDLE,
    headers: { server: 'GitHub.com', 'x-github-request-id': 'ABC:123' },
    cookies: [],
  },
  [SITES.smallbiz]: {
    html: SMALLBIZ_HTML,
    bundle: SMALLBIZ_BUNDLE,
    headers: { server: 'Pepyaka/1.21.0', 'x-wix-request-id': 'fixture' },
    cookies: ['_fbp=fb.1.fixture; Path=/', 'XSRF-TOKEN=fixture; Path=/'],
  },
  [SITES.publisher]: {
    html: PUBLISHER_HTML,
    bundle: PUBLISHER_BUNDLE,
    headers: { server: 'cloudflare', 'cf-ray': 'def456-IAD', 'x-powered-by': 'PHP/8.3.2' },
    cookies: ['wordpress_test_cookie=fixture; Path=/'],
  },
  [SITES.heavy]: { html: HEAVY_HTML, bundle: HEAVY_BUNDLE, headers: { server: 'nginx' }, cookies: [] },
  [SITES.plain]: { html: PLAIN_HTML, bundle: '', headers: {}, cookies: [] },
  [SITES.locked]: {
    html: LOCKED_HTML,
    bundle: null, // Script downloads are refused, to exercise deep-scan failure.
    headers: { 'content-security-policy': "default-src 'self'; script-src 'self'" },
    cookies: [],
  },
}

export function createFixtureServer() {
  return createServer((req, res) => {
    const host = (req.headers.host ?? '').split(':')[0] ?? ''
    const path = (req.url ?? '/').split('?')[0] ?? '/'
    const site = SITE_CONFIG[host]

    if (!site) {
      // A third-party host the page called: answer plausibly and move on.
      res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' })
      res.end('{}')
      return
    }

    for (const [name, value] of Object.entries(site.headers)) res.setHeader(name, value)
    res.setHeader('access-control-allow-origin', '*')

    if (path.endsWith('.js')) {
      if (site.bundle === null) {
        res.writeHead(403, { 'content-type': 'text/plain' })
        res.end('forbidden')
        return
      }
      res.writeHead(200, { 'content-type': 'application/javascript' })
      res.end(site.bundle)
      return
    }

    if (path.endsWith('.css')) {
      res.writeHead(200, { 'content-type': 'text/css' })
      res.end('body{margin:0}')
      return
    }

    // Any other path on a fixture host is treated as a page, so a single-page
    // app can navigate to /pricing and still be served.
    if (site.cookies.length) res.setHeader('set-cookie', site.cookies)
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    res.end(site.html)
  })
}

if (process.argv[1]?.endsWith('fixture-server.mjs')) {
  createFixtureServer().listen(PORT, () => {
    console.log(`fixture server on :${PORT} — ${Object.values(SITES).join(', ')}`)
  })
}
