import type { Fingerprint } from '@/types'

/**
 * Hosting platforms and CDNs.
 *
 * The most reliable category in the database. Platforms stamp identifying
 * response headers on every request they serve, so a single header read on the
 * main document usually settles it outright — no scripts, cookies, or deep
 * scan required.
 *
 * A site can legitimately match several: a CDN in front of an application
 * host is the normal arrangement, not a contradiction, so nothing here
 * suppresses anything else.
 */
export const HOSTING: Fingerprint[] = [
  {
    id: 'vercel',
    name: 'Vercel',
    category: 'hosting',
    description: 'Frontend hosting and edge network',
    icon: 'vercel',
    website: 'https://vercel.com',
    signals: [
      { type: 'header', name: 'x-vercel-id', weight: 0.95 },
      { type: 'header', name: 'server', pattern: /^Vercel$/i, weight: 0.95 },
      { type: 'header', name: 'x-vercel-cache', weight: 0.9 },
      { type: 'request', pattern: /[\w-]+\.vercel\.app\//, weight: 0.8 },
    ],
  },
  {
    id: 'netlify',
    name: 'Netlify',
    category: 'hosting',
    description: 'Frontend hosting and edge network',
    icon: 'netlify',
    website: 'https://netlify.com',
    signals: [
      { type: 'header', name: 'x-nf-request-id', weight: 0.95 },
      { type: 'header', name: 'server', pattern: /Netlify/i, weight: 0.95 },
      { type: 'request', pattern: /[\w-]+\.netlify\.app\//, weight: 0.8 },
    ],
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    category: 'hosting',
    description: 'CDN, DNS, and edge compute',
    icon: 'cloudflare',
    website: 'https://cloudflare.com',
    signals: [
      { type: 'header', name: 'cf-ray', weight: 0.95 },
      { type: 'header', name: 'server', pattern: /^cloudflare$/i, weight: 0.9 },
      { type: 'header', name: 'cf-cache-status', weight: 0.85 },
      { type: 'request', pattern: /[\w-]+\.pages\.dev\//, weight: 0.85 },
      { type: 'request', pattern: /[\w-]+\.workers\.dev\//, weight: 0.85 },
    ],
  },
  {
    id: 'aws',
    name: 'AWS',
    category: 'hosting',
    description: 'Amazon Web Services infrastructure',
    icon: 'amazonwebservices',
    website: 'https://aws.amazon.com',
    signals: [
      { type: 'header', name: 'x-amz-cf-id', weight: 0.9 },
      { type: 'header', name: 'x-amz-request-id', weight: 0.85 },
      { type: 'header', name: 'server', pattern: /AmazonS3|CloudFront/i, weight: 0.9 },
      { type: 'request', pattern: /[\w.-]+\.cloudfront\.net\//, weight: 0.8 },
      { type: 'request', pattern: /[\w-]+\.execute-api\.[\w-]+\.amazonaws\.com/, weight: 0.85 },
    ],
  },
  {
    id: 'railway',
    name: 'Railway',
    category: 'hosting',
    description: 'Application hosting platform',
    icon: 'railway',
    website: 'https://railway.app',
    signals: [
      { type: 'header', name: 'x-railway-request-id', weight: 0.95 },
      { type: 'header', name: 'server', pattern: /railway/i, weight: 0.9 },
      { type: 'request', pattern: /[\w-]+\.up\.railway\.app\//, weight: 0.9 },
    ],
  },
  {
    id: 'flyio',
    name: 'Fly.io',
    category: 'hosting',
    description: 'Application hosting close to users',
    icon: 'flydotio',
    website: 'https://fly.io',
    signals: [
      { type: 'header', name: 'fly-request-id', weight: 0.95 },
      { type: 'header', name: 'server', pattern: /^Fly\b/i, weight: 0.9 },
      { type: 'request', pattern: /[\w-]+\.fly\.dev\//, weight: 0.9 },
    ],
  },
  {
    id: 'render',
    name: 'Render',
    category: 'hosting',
    description: 'Application and static site hosting',
    icon: 'render',
    website: 'https://render.com',
    signals: [
      { type: 'header', name: 'x-render-origin-server', weight: 0.95 },
      { type: 'request', pattern: /[\w-]+\.onrender\.com\//, weight: 0.9 },
    ],
  },
  {
    id: 'heroku',
    name: 'Heroku',
    category: 'hosting',
    description: 'Application hosting platform',
    icon: 'heroku',
    website: 'https://heroku.com',
    signals: [
      { type: 'header', name: 'via', pattern: /vegur/i, weight: 0.9 },
      { type: 'header', name: 'server', pattern: /^Cowboy$/i, weight: 0.8 },
      { type: 'request', pattern: /[\w-]+\.herokuapp\.com\//, weight: 0.9 },
    ],
  },
  {
    id: 'github-pages',
    name: 'GitHub Pages',
    category: 'hosting',
    description: 'Static hosting from a repository',
    icon: 'github',
    website: 'https://pages.github.com',
    signals: [
      { type: 'header', name: 'server', pattern: /GitHub\.com/i, weight: 0.95 },
      { type: 'header', name: 'x-github-request-id', weight: 0.9 },
      { type: 'request', pattern: /[\w-]+\.github\.io\//, weight: 0.85 },
    ],
  },
  {
    id: 'fastly',
    name: 'Fastly',
    category: 'hosting',
    description: 'Edge cloud and CDN',
    icon: 'fastly',
    website: 'https://fastly.com',
    signals: [
      { type: 'header', name: 'x-served-by', pattern: /cache-/i, weight: 0.85 },
      { type: 'header', name: 'x-fastly-request-id', weight: 0.95 },
      { type: 'header', name: 'via', pattern: /varnish/i, weight: 0.6 },
    ],
  },
  {
    id: 'akamai',
    name: 'Akamai',
    category: 'hosting',
    description: 'Enterprise CDN',
    icon: 'akamai',
    website: 'https://akamai.com',
    signals: [
      { type: 'header', name: 'x-akamai-transformed', weight: 0.95 },
      { type: 'header', name: 'server', pattern: /AkamaiGHost|AkamaiNetStorage/i, weight: 0.95 },
      { type: 'request', pattern: /[\w.-]+\.akamaized\.net|[\w.-]+\.akamaihd\.net/, weight: 0.85 },
    ],
  },
  {
    id: 'bunny-net',
    name: 'Bunny.net',
    category: 'hosting',
    description: 'CDN and edge storage',
    icon: 'bunnydotnet',
    website: 'https://bunny.net',
    signals: [
      { type: 'header', name: 'server', pattern: /BunnyCDN/i, weight: 0.95 },
      { type: 'request', pattern: /[\w-]+\.b-cdn\.net\//, weight: 0.9 },
    ],
  },
  {
    id: 'deno-deploy',
    name: 'Deno Deploy',
    category: 'hosting',
    description: 'Edge hosting for JavaScript',
    icon: 'deno',
    website: 'https://deno.com/deploy',
    signals: [
      { type: 'header', name: 'server', pattern: /^deno\b/i, weight: 0.95 },
      { type: 'request', pattern: /[\w-]+\.deno\.dev\//, weight: 0.9 },
    ],
  },
  {
    id: 'firebase-hosting',
    name: 'Firebase Hosting',
    category: 'hosting',
    description: 'Static and dynamic hosting by Google',
    icon: 'firebase',
    website: 'https://firebase.google.com/products/hosting',
    signals: [
      { type: 'request', pattern: /[\w-]+\.(?:web|firebaseapp)\.app\//, weight: 0.85 },
      { type: 'header', name: 'x-firebase-hosting-response', weight: 0.95 },
    ],
  },
  {
    id: 'nginx',
    name: 'nginx',
    category: 'hosting',
    description: 'Web server and reverse proxy',
    icon: 'nginx',
    website: 'https://nginx.org',
    signals: [{ type: 'header', name: 'server', pattern: /^nginx/i, weight: 0.9 }],
    version: [{ from: 'header', name: 'server', pattern: /nginx\/([\d.]+)/ }],
  },
  {
    id: 'apache',
    name: 'Apache',
    category: 'hosting',
    description: 'Web server',
    icon: 'apache',
    website: 'https://httpd.apache.org',
    signals: [{ type: 'header', name: 'server', pattern: /^Apache/i, weight: 0.9 }],
    version: [{ from: 'header', name: 'server', pattern: /Apache\/([\d.]+)/ }],
  },
  {
    id: 'caddy',
    name: 'Caddy',
    category: 'hosting',
    description: 'Web server with automatic HTTPS',
    icon: 'caddy',
    website: 'https://caddyserver.com',
    signals: [{ type: 'header', name: 'server', pattern: /^Caddy$/i, weight: 0.95 }],
  },
]
