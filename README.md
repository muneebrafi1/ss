# StackLens

A Chrome extension that shows what any website is built with — AI tools, hosting,
database, auth, payments, analytics and more — in one click.

Detects **383 technologies across 26 categories**, covering both the modern
AI/SaaS stack and the mainstream web, so it produces a useful answer on an AI
startup and on an ordinary business site alike.

## Getting started

```bash
npm install
npm run build          # → dist/
npm test               # unit + integration suite
npm run test:e2e       # loads the built extension into Chrome and drives it
```

Then load `dist/` as an unpacked extension at `chrome://extensions` with
Developer mode on.

## How it works

Two halves, deliberately separated.

```
webRequest observer  ─┐
response headers     ─┤
cookie names         ─┼─→ Evidence ─→ match ─→ score ─→ filter(≥0.60) ─→ panel
DOM probe            ─┤              (fingerprint DB)                     export
MAIN-world probe     ─┤
deep scan (opt-in)   ─┘
```

The **detection engine** (`src/engine/`) is pure functions with no `chrome.*`
dependency: it takes an `Evidence` object and returns `Detection[]`. Everything
browser-coupled lives on the other side of that boundary. That is what keeps a
383-entry database maintainable and lets the entire matching layer be tested in
Node without a browser.

### Scoring

Signals combine with noisy-OR:

```
confidence = 1 - Π(1 - wᵢ)
```

Monotone, never reaches 1.0, and rewards corroboration from independent evidence
types without letting a pile of weak hints impersonate proof.

Implications (Supabase Auth implies Supabase) propagate one hop at a 0.5
discount, with the aggregate capped strictly below the display threshold — so an
implication can reinforce a technology that has its own evidence but can never
conjure one that has none, no matter how many other detections point at it.

### Why confidence is never displayed

The panel shows no percentages and no "likely" badges. That is a product
decision with an engineering consequence: with no badge to warn anyone, a shaky
guess would look exactly as authoritative as a certainty. So **confidence became
the filter instead of a label** — anything below `0.60` is dropped silently
rather than shown with a caveat. The panel is shorter and more trustworthy, and
the empty state carries the honesty the badges would have.

### What it genuinely cannot see

Most production sites call model APIs from their backend, so the browser never
observes `api.openai.com` at all. AI models are therefore the *least* reliable
category, not the most — the opposite of what the idea suggests at first glance.

Usable signals are model-name and SDK strings left in JS bundles (deep scan),
streaming tells like `x-vercel-ai-data-stream`, and first-party proxy routes.
Hosting, payments, auth, analytics and support tools are near-perfect by
comparison, because they have to run in the browser to function.

## Layout

```
src/
  types.ts              Evidence, Signal, Fingerprint, Detection + tuning constants
  engine/               match · score · version · detect   (pure, no chrome.*)
  fingerprints/         26 category files + validation
  background/           service worker, collector, store, probes, deep scan
  popup/                the 400x600 panel
  options/  welcome/    settings and first-run pages
  lib/                  grouping, export, share image
tests/
  *.test.ts             unit + fixture replay
  e2e/                  Chrome integration, real extension, real panel
  fixtures/             Evidence captured by the e2e run
store/                  privacy policy, permission justifications, listing copy
landing/                one-page site
```

## Adding a technology

Add an entry to the relevant file in `src/fingerprints/`:

```ts
{
  id: 'clerk',
  name: 'Clerk',
  category: 'auth',
  description: 'User login and accounts',   // one line, shown on hover
  icon: 'clerk',                            // Simple Icons slug
  website: 'https://clerk.com',
  referralUrl: null,                        // reserved; unused in v1
  signals: [
    { type: 'global',  path: 'Clerk',                            weight: 0.95 },
    { type: 'cookie',  pattern: /^__clerk/,                      weight: 0.9  },
    { type: 'bundle',  pattern: /@clerk\/(?:nextjs|clerk-js)/,   weight: 0.8  },
  ],
  version: [{ from: 'bundle', pattern: /@clerk\/nextjs@([\d.]+)/ }],
}
```

Then run `npm test`. `tests/fingerprints.test.ts` enforces unique ids, valid
regexes, weight bounds, anchored cookie patterns, and that a bundled icon exists
— a malformed entry fails the suite instead of silently never matching.

Signal types: `request`, `header`, `cookie`, `global`, `script`, `meta`, `dom`,
`storage`, `html`, `bundle`. Only `bundle` requires a deep scan.

Logos regenerate with `npm run icons:map` (runs automatically on build). They
are resolved across four freely licensed sources — Simple Icons, Simple Icons
v11 (which still carries brands since removed at their trademark holders'
request, such as AWS, LinkedIn and OpenAI), the LobeHub AI set, and the Iconify
logo sets — reaching real artwork for about three quarters of the database.
Anything with no freely licensed mark anywhere renders as a tinted monogram in
the brand's own colour.

`npm run icons:gallery` renders every bundled icon to a single page and
screenshots it in both themes. That sweep is what caught wordmark lockups being
squashed into square tiles, and marks too dark to see against the dark card.

## Testing

`npm test` covers the scoring maths, the threshold boundary, implication limits,
version extraction, database validity, and a **fixture replay**: real `Evidence`
captured from a live Chrome session is run back through `detect()`, so a
careless pattern change makes a detection disappear in CI with no browser
involved.

`npm run test:e2e` loads the built extension into Chrome and drives the real
panel across six shapes of website — a modern AI SaaS, a WordPress blog with
WooCommerce, a Shopify store, a single-page app, a bare HTML page, and a page
that refuses script downloads — plus the per-site off switch and an unsupported
page. 59 checks in all, including the privacy guarantee that no cookie value is
ever stored.

Chrome is launched with `--host-resolver-rules` mapping every hostname to the
fixture server, so the page genuinely requests `api.openai.com` and the
extension observes the real hostname — the request patterns are anchored to
hostnames and would correctly refuse to match a rewritten path.

## Privacy

No account, no server, no analytics, no telemetry. Cookie and storage **names**
are read; **values never are**, which is enforced in code and asserted by the
e2e suite. Logos are bundled rather than fetched so no third party learns which
sites are scanned. See `store/privacy-policy.md`.
