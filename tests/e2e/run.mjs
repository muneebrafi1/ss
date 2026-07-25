/**
 * End-to-end checks: loads the built extension into Chrome and drives the real
 * panel across several shapes of website.
 *
 * Mirrors what a user actually does — load a page, click the toolbar icon —
 * because that flow is also what triggers the probe refresh and the header
 * recovery path. Captures Evidence into tests/fixtures/ so the detection half
 * can be replayed in the unit suite without a browser.
 */
import { chromium } from 'playwright'
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createFixtureServer, SITES } from './fixture-server.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const PORT = 8787
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let failures = 0
let checks = 0
const check = (label, ok, detail = '') => {
  checks += 1
  console.log(`${ok ? '  PASS' : '  FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failures += 1
}

const server = createFixtureServer()
await new Promise((r) => server.listen(PORT, r))

const profile = await mkdtemp(resolve(tmpdir(), 'stacklens-'))
const context = await chromium.launchPersistentContext(profile, {
  executablePath: CHROME,
  headless: true,
  args: [
    `--disable-extensions-except=${resolve(root, 'dist')}`,
    `--load-extension=${resolve(root, 'dist')}`,
    `--host-resolver-rules=MAP * 127.0.0.1:${PORT}, EXCLUDE localhost, EXCLUDE 127.0.0.1`,
    '--no-sandbox',
  ],
})

let worker
let extensionId

async function openPanel() {
  await worker.evaluate(
    (id) =>
      chrome.windows.create({
        url: `chrome-extension://${id}/popup.html`,
        type: 'popup',
        width: 420,
        height: 640,
      }),
    extensionId,
  )
  await sleep(700)
  const popup = context.pages().find((p) => p.url().includes('popup.html'))
  await popup.waitForTimeout(2200)
  return popup
}

/** Opens a site, then opens the panel in its own window and reads it. */
async function inspect(host, { path = '/', settle = 2200 } = {}) {
  const page = await context.newPage()
  await page.goto(`http://${host}${path}`, { waitUntil: 'load', timeout: 20000 })
  await sleep(settle)

  const tabId = await worker.evaluate(async (h) => {
    const tabs = await chrome.tabs.query({})
    const tab = tabs.find((t) => (t.url ?? '').includes(h))
    if (tab?.id !== undefined) await chrome.tabs.update(tab.id, { active: true })
    return tab?.id ?? null
  }, host)

  // The panel opens in its own window so the site tab stays the active tab of
  // its window — the arrangement a real toolbar popup sees.
  const popup = await openPanel()
  return { page, popup, tabId }
}

async function readCards(popup) {
  const more = await popup.$('button:has-text("more tool")')
  if (more) {
    await more.click()
    await popup.waitForTimeout(350)
  }
  return popup.$$eval('button[type="button"] span.line-clamp-2', (nodes) =>
    nodes.map((n) => n.textContent?.trim() ?? ''),
  )
}

const evidenceFor = (tabId) =>
  worker.evaluate(async (id) => {
    const stored = await chrome.storage.session.get(`tab:${id}`)
    // Records are stored as { token, evidence } so a navigation can be told
    // apart from the page already on disk.
    return stored[`tab:${id}`]?.evidence ?? null
  }, tabId)

async function closeExtras(keep = 1) {
  for (const page of context.pages().slice(keep)) {
    if (!page.isClosed()) await page.close().catch(() => {})
  }
}

try {
  ;[worker] = context.serviceWorkers()
  if (!worker) worker = await context.waitForEvent('serviceworker', { timeout: 15000 })
  extensionId = new URL(worker.url()).host
  console.log(`\nextension id: ${extensionId}`)

  /* ====================================================================== */
  console.log('\n=== 1. Modern AI SaaS ===')
  {
    const { popup, tabId } = await inspect(SITES.modern)
    const names = await readCards(popup)
    console.log(`  detected (${names.length}): ${names.join(', ')}`)

    for (const expected of [
      'Vercel', 'Next.js', 'React', 'Stripe', 'Clerk', 'Supabase',
      'PostHog', 'Sentry', 'Intercom', 'Hotjar', 'Cloudinary', 'Pinecone',
      'ElevenLabs', 'Resend',
    ]) {
      check(`detects ${expected}`, names.some((n) => n.startsWith(expected)))
    }
    check('reads the Next.js version', names.includes('Next.js 15.1.0'))
    // Segment is declared only as `<link rel="preconnect">`. A preconnect opens
    // a connection and fetches nothing, so it appears in neither the webRequest
    // log nor Resource Timing — detecting it proves resource hosts are being
    // read out of the page's markup.
    check(
      'detects a host declared only by preconnect (Segment)',
      names.some((n) => n.startsWith('Segment')),
    )
    for (const absent of ['WordPress', 'Shopify', 'Auth0', 'Drupal']) {
      check(`no false positive: ${absent}`, !names.some((n) => n.startsWith(absent)))
    }

    await mkdir(resolve(root, 'screenshots'), { recursive: true })
    const panel = await popup.$('#root > div')
    await panel.screenshot({ path: resolve(root, 'screenshots/popup-light.png') })
    await popup.emulateMedia({ colorScheme: 'dark' })
    await popup.waitForTimeout(350)
    await panel.screenshot({ path: resolve(root, 'screenshots/popup-dark.png') })
    await popup.emulateMedia({ colorScheme: 'light' })

    await popup.click('button:has-text("Deep scan")')
    await popup.waitForTimeout(3500)
    const deep = await readCards(popup)
    check('deep scan finds OpenAI', deep.some((n) => n.startsWith('OpenAI')))
    check('deep scan finds Anthropic', deep.some((n) => n.startsWith('Anthropic')))
    check('deep scan finds the Vercel AI SDK', deep.some((n) => n.startsWith('Vercel AI SDK')))
    check('deep scan keeps passive detections', deep.length >= names.length)
    check('reads a model name from the bundle', deep.includes('OpenAI gpt-4o-mini'))
    const footer = (await popup.textContent('footer'))?.trim()
    check('deep scan reports what it added', footer?.includes('Found') ?? false, footer)

    await popup.evaluate(() => document.querySelector('.overflow-y-auto')?.scrollTo(0, 0))
    await popup.waitForTimeout(200)
    await panel.screenshot({ path: resolve(root, 'screenshots/popup-deep-scan.png') })

    const evidence = await evidenceFor(tabId)
    check('response headers captured', Object.keys(evidence?.responseHeaders ?? {}).length > 0)
    check(
      "the page's own resource list is collected",
      (evidence?.requests ?? []).some((r) => r.startsWith('js.stripe.com')),
      `${(evidence?.requests ?? []).length} requests`,
    )
    check('cookie names read', (evidence?.cookieNames ?? []).length > 0)
    check(
      'no cookie VALUES stored anywhere',
      !JSON.stringify({ ...evidence, bundles: [] }).includes('fixture; Path'),
    )
    await writeFile(
      resolve(root, 'tests/fixtures/fixture-site.json'),
      `${JSON.stringify(evidence, null, 2)}\n`,
    )
  }
  await closeExtras()

  /* ====================================================================== */
  console.log('\n=== 2. WordPress blog ===')
  {
    const { popup } = await inspect(SITES.wordpress)
    const names = await readCards(popup)
    console.log(`  detected (${names.length}): ${names.join(', ')}`)
    for (const expected of ['WordPress', 'WooCommerce', 'jQuery', 'PHP', 'Apache', 'Elementor']) {
      check(`detects ${expected}`, names.some((n) => n.startsWith(expected)))
    }
    check('reads the WordPress version', names.includes('WordPress 6.7.1'))
    for (const absent of ['Next.js', 'Vercel', 'Stripe', 'Clerk', 'Supabase']) {
      check(`no false positive: ${absent}`, !names.some((n) => n.startsWith(absent)))
    }
    const panel = await popup.$('#root > div')
    await panel.screenshot({ path: resolve(root, 'screenshots/popup-wordpress.png') })
  }
  await closeExtras()

  /* ====================================================================== */
  console.log('\n=== 3. Shopify store ===')
  {
    const { popup, tabId } = await inspect(SITES.shopify)
    const names = await readCards(popup)
    console.log(`  detected (${names.length}): ${names.join(', ')}`)
    for (const expected of ['Shopify', 'Cloudflare', 'Klaviyo', 'Gorgias']) {
      check(`detects ${expected}`, names.some((n) => n.startsWith(expected)))
    }

    // The tag manager snippet on this page sits after 279,000 characters of
    // theme markup, well past where the HTML sample is truncated. It can only
    // be found by reading inline script text separately.
    const evidence = await evidenceFor(tabId)
    check(
      'the HTML sample really is truncated before the snippet',
      !(evidence?.html ?? '').includes('googletagmanager.com/ns.html'),
      `${(evidence?.html ?? '').length} chars`,
    )
    check(
      'detects a tool named only in an inline script past the HTML cut',
      names.some((n) => n.startsWith('Google Tag Manager')),
    )

    for (const absent of ['WordPress', 'Next.js', 'Django']) {
      check(`no false positive: ${absent}`, !names.some((n) => n.startsWith(absent)))
    }
  }
  await closeExtras()

  /* ====================================================================== */
  console.log('\n=== 4. Plain HTML page ===')
  {
    const { popup } = await inspect(SITES.plain, { settle: 1500 })
    const names = await readCards(popup)
    console.log(`  detected (${names.length}): ${names.join(', ') || '(none)'}`)
    check('stays quiet on a page with nothing to find', names.length <= 1, names.join(', '))
    const body = await popup.textContent('body')
    check(
      'says it may have missed things rather than implying the site is simple',
      body?.includes("can't detect") ?? false,
    )
    const panel = await popup.$('#root > div')
    await panel.screenshot({ path: resolve(root, 'screenshots/popup-empty.png') })
  }
  await closeExtras()

  /* ====================================================================== */
  console.log('\n=== 5. Page that refuses script downloads ===')
  {
    const { popup } = await inspect(SITES.locked, { settle: 1500 })
    const scanButton = await popup.$('button:has-text("Deep scan")')
    if (scanButton) {
      await scanButton.click()
      await popup.waitForTimeout(3000)
    }
    const body = await popup.textContent('body')
    check('deep scan fails gracefully rather than throwing', !!body && body.length > 0)
    check('panel is still usable after a failed scan', (await popup.$('footer')) !== null)
  }
  await closeExtras()

  /* ====================================================================== */
  console.log('\n=== 6. Single-page app navigation ===')
  {
    const { page, popup, tabId } = await inspect(SITES.spa, { settle: 1500 })
    const before = await readCards(popup)
    check('detects the SPA framework', before.some((n) => n.startsWith('Vue')), before.join(', '))
    // Declared in markup as an <img> and an <iframe> respectively.
    check('detects a host used only by an image', before.some((n) => n.startsWith('Cloudinary')))
    check('detects a host used only by an iframe', before.some((n) => n.startsWith('Calendly')))

    // Client-side route change: no new document, so the stack is unchanged and
    // evidence must survive rather than being wiped.
    await page.evaluate(() => window.__navigate('/pricing'))
    await page.waitForTimeout(900)
    const during = await evidenceFor(tabId)
    check('client-side navigation keeps evidence', (during?.globals ?? []).length > 0)

    // A real document load to another origin must start clean.
    await page.goto(`http://${SITES.plain}/`, { waitUntil: 'load' })
    await page.waitForTimeout(1800)
    const after = await evidenceFor(tabId)
    check(
      'cross-site navigation resets evidence',
      !(after?.globals ?? []).includes('Vue'),
      `globals now: ${(after?.globals ?? []).join(', ') || 'none'}`,
    )
  }
  await closeExtras()

  /* ====================================================================== */
  console.log('\n=== 7. Per-site off switch ===')
  {
    const { popup, tabId } = await inspect(SITES.modern, { settle: 1500 })
    await popup.click('button[aria-label="More options"]')
    await popup.waitForTimeout(300)
    await popup.click('button:has-text("Turn off for this site")')
    await popup.waitForTimeout(1200)

    const body = await popup.textContent('body')
    check('panel reports the site is off', body?.includes('off for this site') ?? false)

    const stored = await worker.evaluate(async (id) => {
      const all = await chrome.storage.session.get(`tab:${id}`)
      return all[`tab:${id}`] ?? null
    }, tabId)
    check('evidence for the site is discarded, not merely hidden', stored === null)

    const badge = await worker.evaluate((id) => chrome.action.getBadgeText({ tabId: id }), tabId)
    check('badge is cleared', badge === '', `"${badge}"`)

    await popup.click('button:has-text("Turn on for")')
    await popup.waitForTimeout(1500)
    check(
      'can be switched back on from the panel',
      !(await popup.textContent('body'))?.includes('off for this site'),
    )
  }
  await closeExtras()

  /* ====================================================================== */
  console.log('\n=== 8. Unsupported page ===')
  {
    const page = await context.newPage()
    await page.goto('about:blank')
    await sleep(500)
    const popup = await openPanel()
    const body = await popup.textContent('body')
    check(
      'shows a neutral message rather than an error',
      body?.includes('Nothing to scan here') ?? false,
      body?.slice(0, 70).trim(),
    )
  }
} finally {
  await context.close()
  server.close()
}

console.log(
  failures === 0
    ? `\nAll ${checks} end-to-end checks passed.\n`
    : `\n${failures} of ${checks} checks failed.\n`,
)
process.exit(failures === 0 ? 0 : 1)
