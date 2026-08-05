# Permission justifications

For the Chrome Web Store submission form. Each entry states the narrowest
accurate reason the permission is required.

## Single purpose

> Identify the technologies a website is built with, and show them to the user.

Every permission below serves only that purpose.

---

## `webRequest`

Observes the URLs of requests a page makes and the response headers of the main
document. This is how hosting platforms and CDNs are identified — Vercel,
Netlify, Cloudflare, nginx and Apache announce themselves only in response
headers, and services like Stripe or Supabase are identified by the hosts the
page calls.

Used in **observe-only** mode. StackLens registers no blocking listener, and
never cancels, redirects, or modifies any request. Request and response bodies
are never read.

## `host_permissions: <all_urls>`

The extension's purpose is to describe whatever site the user is currently
looking at, which cannot be known in advance. Broad host access is required for
the same reason a "what is this page built with" tool must work on any page.

No data from any host leaves the device.

## `scripting`

Reads the page's own markup and the JavaScript variables it defines on `window`
— for example `window.Stripe` or `window.Shopify`, which are among the most
reliable identifiers available.

Injection is **programmatic and conditional**, not declarative: no content
script is registered in the manifest, so nothing is injected into pages when
scanning is switched off, or on sites the user has disabled. Both injected
functions only read; neither modifies the page.

## `cookies`

Reads the **names** of cookies set on the current site's origin. Cookie naming
is a strong service identifier — `__stripe_mid` means Stripe, `__clerk_db_jwt`
means Clerk.

Cookie **values are never accessed or stored**. Only `cookie.name` is read from
the API response; this is enforced in code and covered by an automated test that
fails if any cookie value appears in stored data.

## `storage`

Stores the user's settings locally, holds per-tab detection results in session
storage so the panel can display them, and — when the user leaves scan history
enabled — keeps a local list of which technologies each visited site uses.

Session storage is cleared when the browser closes. History is on by default,
switchable off, clearable in one click, and holds only domains and technology
names, never paths or page content. Nothing is synced or transmitted.

## `tabs`

Identifies which tab the panel should describe, and detects navigation so
results from a previous page are not shown for the current one. Also used to set
the per-tab badge count.

## `favicon`

Displays the current site's icon in the panel header. This uses Chrome's local
favicon cache and makes no network request.

---

## Remote code

**StackLens contains no remote code.** All executable code is bundled in the
package.

The optional "Deep scan" feature downloads JavaScript files that the page being
viewed has already loaded, and searches that text with regular expressions for
identifying strings such as package names. The downloaded text is **never
executed, evaluated, injected, or passed to any dynamic-evaluation function**.
It is treated purely as a string to search.

This feature is off by default and runs only when the user presses the button.

## Data usage disclosures

- Personally identifiable information: **not collected**
- Health information: **not collected**
- Financial and payment information: **not collected**
- Authentication information: **not collected** (cookie names only, never values)
- Personal communications: **not collected**
- Location: **not collected**
- Web history: **stored locally only, never transmitted.** With scan history
  enabled the extension keeps, on the user's own device, one entry per visited
  site holding its domain and the technology names detected. No paths, no page
  content, no request logs. The user can disable the feature, clear the list, or
  remove individual sites at any time, and disabling it erases what was stored
- User activity: **not collected**
- Website content: **not collected** — page content is read in memory to
  identify technologies and is never transmitted

Certifications:

- We do not sell or transfer user data to third parties.
- We do not use or transfer user data for purposes unrelated to the single
  purpose above.
- We do not use or transfer user data to determine creditworthiness or for
  lending purposes.
