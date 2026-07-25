/**
 * A local stand-in for a real website, used by the end-to-end check.
 *
 * Outbound network access is blocked in this environment, so real sites are
 * unreachable. Chrome is launched with `--host-resolver-rules` mapping every
 * hostname to this server, which means the page genuinely requests
 * `api.openai.com` and `js.stripe.com` — the extension observes the real
 * hostnames rather than a rewritten path. That matters, because the request
 * patterns in the database are anchored to hostnames and would correctly refuse
 * to match a proxied URL.
 *
 * Every header, cookie, global and script URL below is the genuine article for
 * the service it represents.
 */
import { createServer } from 'node:http'

const PORT = Number(process.env.FIXTURE_PORT ?? 8787)
export const SITE_HOST = 'app.fixture.test'

/** Hosts the page calls, exactly as a real app on this stack would. */
const BACKGROUND_REQUESTS = [
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

const PAGE = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Fixture app</title>
  <script src="/_next/static/chunks/main-app.js"></script>
  <script src="http://js.stripe.com/v3"></script>
  <script src="http://static.hotjar.com/c/hotjar-123.js"></script>
</head>
<body>
  <div id="__next">
    <h1>Fixture</h1>
    <iframe name="__privateStripeFrame1234" src="about:blank" title="stripe"></iframe>
    <div class="intercom-lightweight-app"></div>
  </div>
</body>
</html>`

/**
 * The site's own bundle.
 *
 * Sets the page globals a real stack would set, and carries the model-name and
 * package strings that only a deep scan can recover — the signals that are
 * invisible to passive detection.
 */
const APP_BUNDLE = `
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

/* Strings a deep scan is meant to find. */
var MODEL = "gpt-4o-mini";
var CLAUDE = "claude-sonnet-4-5-20250929";
var PKGS = ["@clerk/nextjs", "@supabase/supabase-js", "@sentry/nextjs",
            "@pinecone-database/pinecone", "@ai-sdk/react", "@elevenlabs/react"];

${BACKGROUND_REQUESTS.map((u) => `fetch(${JSON.stringify(u)}, {mode:"no-cors"}).catch(function(){});`).join('\n')}
`

export function createFixtureServer() {
  return createServer((req, res) => {
    const path = (req.url ?? '/').split('?')[0] ?? '/'

    // Response headers a Vercel-hosted Next.js app actually sets.
    res.setHeader('server', 'Vercel')
    res.setHeader('x-vercel-id', 'iad1::fixture::abc123')
    res.setHeader('x-vercel-cache', 'HIT')
    res.setHeader('x-powered-by', 'Next.js 15.1.0')
    res.setHeader('access-control-allow-origin', '*')

    if (path.endsWith('.js')) {
      res.writeHead(200, { 'content-type': 'application/javascript' })
      res.end(APP_BUNDLE)
      return
    }

    if (path !== '/' && path !== '/index.html') {
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end('{}')
      return
    }

    res.setHeader('set-cookie', [
      '__stripe_mid=fixture; Path=/',
      '__clerk_db_jwt=fixture; Path=/',
      '_ga=GA1.1.fixture; Path=/',
    ])
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    res.end(PAGE)
  })
}

if (process.argv[1]?.endsWith('fixture-server.mjs')) {
  createFixtureServer().listen(PORT, () => {
    console.log(`fixture server on http://localhost:${PORT} (site: ${SITE_HOST})`)
  })
}
