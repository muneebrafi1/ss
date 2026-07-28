# Chrome Web Store submission

Everything the developer dashboard asks for, in the order it asks. Fields marked
**you** need something only a human with the account can do.

```bash
npm run verify     # 82 unit tests + 188 browser checks
npm run package    # → release/stacklens-1.0.0.zip
```

`npm run package` refuses to build the archive if the version is malformed or
out of step with `package.json`, an icon is missing, a source map or `.ts` file
made it into `dist/`, a declared permission is unused or unrecognised, the
in-extension privacy page is absent, or the bundle contains `eval`,
`new Function` or `importScripts`. Those are the mechanical rejection causes;
the judgement calls are below.

---

## 1. Before you start — **you**

- A Chrome Web Store developer account (one-time **$5** registration fee).
- **Somewhere to host `landing/`.** The store requires a publicly reachable
  privacy-policy URL, and this repository is private, so a GitHub link satisfies
  nobody. `landing/privacy.html` is generated for exactly this — any static host
  (GitHub Pages, Netlify, Cloudflare Pages, Vercel) gives you the URL. The same
  text also ships inside the extension at `privacy.html`, so the in-product link
  works offline and regardless of hosting.

---

## 2. Package

Upload `release/stacklens-1.0.0.zip` (~0.26 MB).

## 3. Store listing

| Field | Value |
|---|---|
| Name | StackLens |
| Summary (132 max) | See what any website is built with — AI tools, hosting, database, auth, payments, analytics and more, in one click. |
| Description | The "Detailed description" section of `listing.md` |
| Category | Developer Tools |
| Language | English |
| Screenshots | `store/screenshots/1-panel.png` … `5-catalogue.png`, all 1280×800 |
| Small promo tile | `store/screenshots/promo-440x280.png` |
| Support / homepage URL | **you** — wherever `landing/` ends up |

Regenerate the artwork with `npm run store:shots` after any UI change. It
composes captures taken from the real extension in real Chrome, so the listing
cannot show something the product does not do.

## 4. Privacy practices

This is the section that causes most rejections, because it is the one where a
vague answer reads as an evasive one. Every answer below is in
`store/permissions.md` in full; paste from there.

**Single purpose**

> Identify the technologies a website is built with, and show them to the user.

**Permission justifications** — one paragraph each for `webRequest`,
`host_permissions`, `scripting`, `cookies`, `storage`, `tabs`, `favicon`. All
seven are written out in `permissions.md`.

**Remote code: No.** Say so explicitly, and be ready for the follow-up, because
Deep scan *does* fetch JavaScript. The distinction that matters: the fetched
text is searched with regular expressions and is never executed, evaluated,
injected, or passed to any dynamic-evaluation function. `permissions.md` states
this, and the packaging script proves the bundle contains no dynamic evaluation.

**Data usage** — tick only:

- *Web history* → **collected**, and in the explanation: stored locally only,
  never transmitted; one entry per visited site holding its domain and the
  technology names found; no paths, no page content; user-disableable and
  clearable in one click.

Everything else — PII, health, financial, authentication, personal
communications, location, user activity, website content — is **not collected**.
Cookie *names* are read; values never are, which is enforced in code and
asserted by a browser test that fails if any cookie value reaches storage.

**Certifications** — all three apply: no sale or transfer of user data to third
parties, no use unrelated to the single purpose, no use for creditworthiness or
lending.

---

## 5. After the listing is live — **you**

Two constants exist to be filled in the moment there is a store URL, and both
are one line:

- `STACKLENS_URL` in `src/lib/brand.ts` — the share card signs itself
  "Chrome extension" until this is set. Since that image is the extension's only
  organic distribution, this is the highest-value line in the file.
- The `Add to Chrome` href in `landing/index.html`, currently `#`.

Then `npm run package` again and ship 1.0.1.

---

## 6. Known gaps, stated plainly

- **The extension has never run against a real website.** Every check is against
  fifteen local fixtures — four of them written specifically to break detection,
  which did find three false positives. But they are pages written by the same
  process that wrote the detector, so they cannot surprise it the way a live
  site would. Load `dist/` unpacked at `chrome://extensions` and visit a dozen
  sites whose stack you already know before submitting.
- **The stress-page cost is real.** See the numbers below: on ordinary pages the
  cost is not measurable, but a page issuing 1,500 requests pays a consistent
  ~9%. That is the shape you would expect from per-request observation, and it
  is the number to watch if the evidence caps are ever raised.
- **The 150 fingerprints added in one batch** have had far less scrutiny than
  the original 383. The two-signal rule and the fixture suite cover the
  structural risks; individual patterns have not each been checked against a
  real site.

---

## 7. What it costs a page

`npm run perf` launches two Chrome contexts from identical flags, differing only
in whether `dist/` is loaded, and alternates the same page between them load by
load. Taking the difference within each pair cancels machine drift; the spread of
those differences is the noise floor. Nine measured loads per page per context,
two more discarded as warmup.

| Page | Load without | Load with | Difference |
|---|---|---|---|
| Plain HTML | ~15ms | ~15ms | below noise (±4ms) |
| Modern SaaS | ~37ms | ~41ms | below noise (±10ms) |
| Publisher + ad tech | ~30ms | ~34ms | below noise (±9ms) |
| Stress: 1,500 requests | ~1.8s | ~2.0s | **+150–260ms (~8–14%)** |

**On ordinary pages the cost is below what the measurement can resolve.** Three
of the four pages produce a difference smaller than the run-to-run spread, which
means the honest answer is "not measurable" — not "zero", and certainly not a
percentage.

The stress fixture is the exception, and it needs stating carefully. Across five
runs the difference came out **positive every time** (+156, +159, +162, +224,
+263ms), which random noise does not do. But that page's own variance is large
enough that on any single run the delta may land inside its own noise band, so
the harness will sometimes print "below noise" for it. The consistent sign across
runs is the evidence that the cost is real; no single run's percentage is worth
quoting as a figure. Roughly: 1,500 requests through the webRequest listener cost
on the order of a tenth of a second.

**Main-thread blocking is the number that matters more**, because load time can
stay flat while a page stutters. Sampling frame gaps at 60Hz, the paired
difference on every ordinary page is **exactly 0.0ms with 0.0ms of noise** —
observation happens in the service worker, on its own thread, and the page never
feels it. Opening the panel is the one moment StackLens runs code inside the
page, and on the stress fixture that costs 235ms to render detections while never
blocking the page for even one dropped frame.

Session storage holds **0.7–2.4 KB per ordinary tab** (366 KB for the stress
page, where every evidence cap is saturated at once). Thirty ordinary tabs
project to 0.07 MB against a ~10 MB budget.

Two caveats, since a number invites more trust than a paragraph. The fixture
server is on loopback, so network time is near zero and CPU cost is the entire
signal — real pages are dominated by network, so these percentages are upper
bounds. And this is headless Chrome on one machine; the absolute milliseconds
will differ elsewhere, which is why the checks assert against a noise floor
computed in the same run rather than against numbers baked into the file.
