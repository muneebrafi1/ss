# Chrome Web Store listing copy

## Name

StackLens

## Short description (132 characters max)

> See what any website is built with — AI tools, hosting, database, auth,
> payments, analytics and more, in one click.

(118 characters)

## Detailed description

**See what any website is built with.**

Click the StackLens icon on any site and see the tools behind it, grouped and
readable: hosting, database, authentication, payments, analytics, email,
support, and the AI services underneath modern products.

**532 technologies detected across 26 categories**

- **AI** — OpenAI, Anthropic, Gemini, Mistral, DeepSeek, Groq, Replicate,
  Hugging Face, and the SDKs that call them
- **Vector & search** — Pinecone, Weaviate, Qdrant, Algolia, Typesense
- **Voice & video** — ElevenLabs, Deepgram, Cartesia, HeyGen, Synthesia, Tavus
- **Hosting** — Vercel, Netlify, Cloudflare, AWS, Railway, Fly.io, Render
- **Database** — Supabase, Firebase, Convex, Neon, PlanetScale, Turso, Upstash
- **Auth** — Clerk, Auth0, Better Auth, Stytch, WorkOS, Okta, Cognito
- **Payments** — Stripe, Paddle, Lemon Squeezy, Polar, PayPal, Razorpay
- **Analytics** — PostHog, Mixpanel, Amplitude, Plausible, Segment, GA4
- **And the rest of the web** — WordPress, Shopify, Webflow, Framer, HubSpot,
  Intercom, Sentry, jQuery, and much more

**Built to be honest**

StackLens shows a technology only when there is real evidence for it. Weak
guesses are not displayed with a caveat — they are not displayed at all. When a
page yields little, it says so plainly rather than padding the list.

Some things genuinely cannot be seen from a browser: when a site asks GPT or
Claude a question, that happens between its servers and the model provider.
The optional Deep scan recovers what it can from the code the page already
loaded.

**Private by design**

- No account, no server, no analytics, no tracking of any kind
- Nothing about the sites you visit is ever transmitted anywhere
- Scan history is stored on your device only, and can be cleared or switched off
- Cookie and storage **names** are read to identify services; **values never are**
- Brand logos are bundled in the extension, so no third party learns what you scan
- Turn it off globally, or per site, whenever you like

**More than a popup**

- **Panel** — what this site is, at a glance
- **Share card** — the stack as a designed image, wide or square, with a one-line
  summary of what the site is built on
- **Full report** — the same stack as a page, with descriptions and exports
- **History** — every site you visit and what it uses, searchable, on your device only
- **Technologies** — browse everything StackLens can detect
- **Settings** — switches for scanning and history, and per-site exceptions

**Also useful for**

Founders researching competitors, agencies qualifying prospects, developers
deciding what to build with, and anyone who has ever wondered "how did they
build this?"

## Category

Developer Tools

## Language

English

## Screenshots needed (1280x800 or 640x400)

1. Panel open on a modern AI startup, showing the core stack
2. Expanded view with "12 more tools" revealed
3. Deep scan result surfacing model names
4. Dark theme
5. Settings page showing the privacy statement

`screenshots/` holds captures from the end-to-end run at the panel's true
400x600 size; these need to be composed onto a 1280x800 canvas before upload.

## Notes for the reviewer

- The extension makes no network requests except an optional, user-initiated
  "Deep scan" of the current page's own JavaScript, and a cache-first re-request
  of the current page's headers when the browser outran the extension's
  listeners at page load.
- Downloaded JavaScript is searched as **text only**. It is never executed,
  evaluated, or injected. There is no remote code.
- No content script is declared in the manifest. Scripts are injected
  programmatically only when scanning is enabled for the site in view.
- See `permissions.md` for a per-permission justification and
  `privacy-policy.md` for the published policy.
