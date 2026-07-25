# StackLens Privacy Policy

_Last updated: 2026-07-25_

## The short version

StackLens does not collect, transmit, or sell any data. There is no account, no
server, and no analytics. Everything it reads is analysed on your own device.

One feature stores data beyond the current session: **scan history**, which
remembers what each site you visit was built with. It is stored only on your
device, is never transmitted, can be cleared at any time, and can be switched
off entirely. It is described in full below.

## What StackLens reads

To identify the technologies a website is built with, StackLens observes the
following about pages you visit, all of which is information any visitor can see
using the browser's built-in developer tools:

- **Request URLs** the page makes — the host, path, and query string. Request
  and response bodies are never read.
- **Response headers** of the main document, such as `Server` and `X-Powered-By`.
- **Cookie names** for the site's own origin. Cookie **values are never read or
  stored** — only the name is needed to identify a service.
- **Script URLs, meta tags, and page markup**.
- **Names of JavaScript variables** the page defines on `window`.
- **Keys** stored in local and session storage. Stored **values are never read**.

## Deep scan

The "Deep scan" button is optional and never runs on its own. When you press it,
StackLens downloads the JavaScript files the page already loaded and searches
that text for identifying strings, such as a package name or a model name.

That downloaded code is **only ever read as text**. It is never executed,
evaluated, or injected into any page.

## What StackLens sends

Nothing.

There is no remote server, no telemetry, no crash reporting, and no advertising
identifier. The extension makes no network requests of its own except:

1. The optional deep scan described above, which fetches files from the site you
   are already viewing.
2. A single cache-first request for the current page's headers, used only when
   the browser started the page load before the extension was ready to observe
   it. This is served from your browser cache in the normal case.

Brand logos are bundled inside the extension rather than fetched from a CDN,
specifically so that no third party ever learns which sites you scan.

## Where data is stored

Detection results are held in your browser's session storage, scoped to the tab
they belong to. They are deleted when you close the tab and when you close the
browser.

**Scan history**, when enabled, is stored in local extension storage and
persists until cleared. Each entry holds a site's domain and origin, the time it
was last scanned, and the names of the technologies detected. It does **not**
store page paths, page content, request logs, cookies, or anything you typed —
only what the panel already showed you. One entry is kept per site rather than
one per visit, so it is a record of what sites are built with rather than a log
of your browsing.

History is on by default, can be switched off in Settings or on the History
page, and switching it off deletes everything already stored. Individual sites
can be forgotten, and the whole list cleared, from the History page.

Your settings — whether scanning is on, whether history is on, and which sites
you have turned scanning off for — are stored locally on your device.

None of this is ever transmitted anywhere.

## Your controls

- Turn scanning off entirely from the settings page.
- Turn it off for individual sites; StackLens then collects nothing on them and
  discards anything it had already collected for that site.
- Turn scan history off, clear it entirely, or forget individual sites.
- Uninstalling the extension removes all stored data.

## Permissions and why each is needed

See `permissions.md` in this directory for the justification of each permission
requested.

## Contact

Questions about this policy can be raised as an issue on the project repository.
