/**
 * End-to-end check: loads the built extension into Chrome, visits the fixture
 * site, opens the real panel, and drives a deep scan by clicking the button.
 *
 * Mirrors what a user actually does — load a page, click the toolbar icon —
 * because that flow is also what triggers the probe refresh and the header
 * recovery path. Captures the resulting Evidence into tests/fixtures/ so the
 * detection half can be replayed in the unit suite without a browser.
 */
import { chromium } from 'playwright'
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createFixtureServer, SITE_HOST } from './fixture-server.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const PORT = 8787
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const server = createFixtureServer()
await new Promise((r) => server.listen(PORT, r))

const profile = await mkdtemp(resolve(tmpdir(), 'stacklens-'))
const context = await chromium.launchPersistentContext(profile, {
  executablePath: CHROME,
  headless: true,
  args: [
    `--disable-extensions-except=${resolve(root, 'dist')}`,
    `--load-extension=${resolve(root, 'dist')}`,
    // Every hostname resolves to the fixture server, so the page genuinely
    // requests api.openai.com and the extension observes the real hostname.
    // The request patterns are anchored to hostnames and would correctly refuse
    // to match a rewritten path.
    `--host-resolver-rules=MAP * 127.0.0.1:${PORT}, EXCLUDE localhost, EXCLUDE 127.0.0.1`,
    '--no-sandbox',
  ],
})

let failures = 0
const check = (label, ok, detail = '') => {
  console.log(`${ok ? '  PASS' : '  FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failures += 1
}

try {
  let [worker] = context.serviceWorkers()
  if (!worker) worker = await context.waitForEvent('serviceworker', { timeout: 15000 })
  const extensionId = new URL(worker.url()).host
  console.log(`\nextension id: ${extensionId}\n`)

  const page = await context.newPage()
  await page.goto(`http://${SITE_HOST}/`, { waitUntil: 'load', timeout: 20000 })
  await sleep(2500)

  // Look the fixture tab up by URL — the welcome page opens on install and
  // would otherwise be the active tab — then make it active, as it would be
  // when a user clicks the toolbar icon.
  const tabId = await worker.evaluate(async (host) => {
    const tabs = await chrome.tabs.query({})
    const tab = tabs.find((t) => (t.url ?? '').includes(host))
    if (tab?.id !== undefined) await chrome.tabs.update(tab.id, { active: true })
    return tab?.id ?? null
  }, SITE_HOST)
  check('fixture tab is visible to the service worker', tabId !== null)

  /* ---------------------------------------------------------------------- */
  /* The panel                                                              */
  /* ---------------------------------------------------------------------- */

  // Opened in its own window so the fixture tab stays the active tab of its
  // window, which is the arrangement a real toolbar popup sees.
  console.log('--- panel (real popup UI) ---')
  await worker.evaluate(
    (id) => chrome.windows.create({ url: `chrome-extension://${id}/popup.html`, type: 'popup', width: 420, height: 640 }),
    extensionId,
  )
  await sleep(500)
  const popup = context.pages().find((p) => p.url().includes('popup.html'))
  if (!popup) throw new Error('popup page did not open')
  await popup.waitForTimeout(2500)

  const readCards = () =>
    popup.$$eval('button[type="button"] span.line-clamp-2', (nodes) =>
      nodes.map((n) => n.textContent?.trim() ?? ''),
    )

  const headerText = (await popup.textContent('header'))?.trim()
  check('panel header names the site', headerText?.includes(SITE_HOST) ?? false, headerText)

  // Expand the collapsed half so every detection is present in the DOM.
  const more = await popup.$('button:has-text("more tool")')
  check('collapsed section exists', !!more)
  if (more) await more.click()
  await popup.waitForTimeout(400)

  const names = await readCards()
  console.log(`  detected (${names.length}): ${names.join(', ')}`)

  const expected = [
    'Vercel', // header-only, so this also proves header recovery worked
    'Next.js',
    'React',
    'Stripe',
    'Clerk',
    'Supabase',
    'PostHog',
    'Sentry',
    'Intercom',
    'Hotjar',
    'Cloudinary',
    'Pinecone',
    'ElevenLabs',
    'Resend',
  ]
  for (const name of expected) {
    check(`detects ${name}`, names.some((n) => n.startsWith(name)))
  }

  const falsePositives = ['WordPress', 'Shopify', 'Auth0', 'Mapbox', 'Drupal', 'Magento', 'Wix']
  const wrong = names.filter((n) => falsePositives.some((f) => n.startsWith(f)))
  check('no false positives', wrong.length === 0, wrong.join(', ') || 'none')

  check(
    'reads the Next.js version from its header',
    names.includes('Next.js 15.1.0'),
    names.find((n) => n.startsWith('Next.js')) ?? 'none',
  )

  // Screenshot the panel element itself: the toolbar popup is exactly this
  // 400x600 box, so capturing the whole window would be unrepresentative.
  await mkdir(resolve(root, 'screenshots'), { recursive: true })
  const panel = await popup.$('#root > div')
  const shot = async (name, scroll = 0) => {
    await popup.evaluate((y) => document.querySelector('.overflow-y-auto')?.scrollTo(0, y), scroll)
    await popup.waitForTimeout(250)
    await panel.screenshot({ path: resolve(root, `screenshots/${name}.png`) })
  }
  // Collapsed first: the view a user actually opens to.
  if (more) await more.click()
  await popup.waitForTimeout(400)
  await shot('popup-light')
  await popup.emulateMedia({ colorScheme: 'dark' })
  await popup.waitForTimeout(300)
  await shot('popup-dark')
  await popup.emulateMedia({ colorScheme: 'light' })
  await popup.waitForTimeout(200)
  if (more) await more.click()
  await popup.waitForTimeout(400)
  await shot('popup-expanded', 9999)
  console.log('  wrote popup-light.png, popup-dark.png, popup-expanded.png')

  /* ---------------------------------------------------------------------- */
  /* Evidence                                                               */
  /* ---------------------------------------------------------------------- */

  console.log('\n--- evidence collected ---')
  const evidence = await worker.evaluate(async (id) => {
    const stored = await chrome.storage.session.get(`tab:${id}`)
    // Records are stored as { token, evidence } so a navigation can be told
    // apart from the page already on disk.
    return stored[`tab:${id}`]?.evidence ?? null
  }, tabId)

  check('evidence was stored', !!evidence)
  if (evidence) {
    check('requests observed', evidence.requests.length > 0, `${evidence.requests.length}`)
    check('response headers captured', Object.keys(evidence.responseHeaders).length > 0)
    check('cookie names read', evidence.cookieNames.length > 0, evidence.cookieNames.join(', '))
    check('page globals resolved', evidence.globals.length > 0, evidence.globals.join(', '))
    check('dom selectors matched', evidence.domMatches.length > 0, `${evidence.domMatches.length}`)
    check('storage keys read', evidence.storageKeys.length > 0, evidence.storageKeys.join(', '))
    check('scripts collected', evidence.scripts.length > 0, `${evidence.scripts.length}`)
    check('html captured', evidence.html.length > 0)

    // The privacy guarantee, asserted rather than assumed.
    const serialized = JSON.stringify({ ...evidence, bundles: [] })
    check('no cookie VALUES stored anywhere in evidence', !serialized.includes('fixture; Path'))
  }

  const badge = await worker.evaluate((id) => chrome.action.getBadgeText({ tabId: id }), tabId)
  check('badge shows a count', /^\d+$/.test(badge), `"${badge}"`)

  /* ---------------------------------------------------------------------- */
  /* Deep scan                                                              */
  /* ---------------------------------------------------------------------- */

  console.log('\n--- deep scan (clicking the button) ---')
  await popup.click('button:has-text("Deep scan")')
  await popup.waitForTimeout(3500)
  const moreAfter = await popup.$('button:has-text("more tool")')
  if (moreAfter) await moreAfter.click()
  await popup.waitForTimeout(400)

  const deepNames = await readCards()
  console.log(`  detected (${deepNames.length}): ${deepNames.join(', ')}`)
  check('deep scan finds OpenAI from bundle strings', deepNames.some((n) => n.startsWith('OpenAI')))
  check('deep scan finds Anthropic from bundle strings', deepNames.some((n) => n.startsWith('Anthropic')))
  check('deep scan finds the Vercel AI SDK', deepNames.some((n) => n.startsWith('Vercel AI SDK')))
  check('deep scan never loses passive detections', deepNames.length >= names.length)
  check(
    'reads a model name from the bundle',
    deepNames.includes('OpenAI gpt-4o-mini'),
    deepNames.find((n) => n.startsWith('OpenAI')) ?? 'none',
  )
  await popup.evaluate(() => document.querySelector('.overflow-y-auto')?.scrollTo(0, 0))
  await popup.waitForTimeout(200)
  await panel.screenshot({ path: resolve(root, 'screenshots/popup-deep-scan.png') })

  const finalEvidence = await worker.evaluate(async (id) => {
    const stored = await chrome.storage.session.get(`tab:${id}`)
    return stored[`tab:${id}`]?.evidence ?? null
  }, tabId)
  await writeFile(
    resolve(root, 'tests/fixtures/fixture-site.json'),
    `${JSON.stringify(finalEvidence, null, 2)}\n`,
  )
  console.log('\nwrote tests/fixtures/fixture-site.json')
} finally {
  await context.close()
  server.close()
}

console.log(failures === 0 ? '\nAll end-to-end checks passed.\n' : `\n${failures} check(s) failed.\n`)
process.exit(failures === 0 ? 0 : 1)
