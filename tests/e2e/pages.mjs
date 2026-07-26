/**
 * Drives the full-page views: report, history, technologies, and settings.
 *
 * These pages are reachable from the panel menu and from each other, so a
 * broken link or a page that renders empty is invisible until someone clicks
 * through. This clicks through.
 */
import { chromium } from 'playwright'
import { mkdtemp } from 'node:fs/promises'
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

const profile = await mkdtemp(resolve(tmpdir(), 'stacklens-pg-'))
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

const errors = []

async function openPage(extensionId, file) {
  const page = await context.newPage()
  page.on('pageerror', (e) => errors.push(`${file}: ${e.message}`))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`${file}: ${m.text()}`)
  })
  await page.goto(`chrome-extension://${extensionId}/${file}`)
  await page.waitForTimeout(1400)
  return page
}

try {
  let [worker] = context.serviceWorkers()
  if (!worker) worker = await context.waitForEvent('serviceworker', { timeout: 15000 })
  const extensionId = new URL(worker.url()).host

  // Visit two sites so history has something in it.
  for (const host of [SITES.modern, SITES.wordpress]) {
    const page = await context.newPage()
    await page.goto(`http://${host}/`, { waitUntil: 'load' })
    await sleep(2200)
    await page.close()
  }
  // Leave the modern site as the active tab for the report page.
  const active = await context.newPage()
  await active.goto(`http://${SITES.modern}/`, { waitUntil: 'load' })
  await sleep(2400)

  console.log('\n=== Report page ===')
  {
    const page = await openPage(extensionId, 'report.html')
    const body = await page.textContent('body')
    check('names the site', body?.includes(SITES.modern) ?? false)
    check('lists technologies', body?.includes('Stripe') ?? false)
    check('shows descriptions, unlike the panel', body?.includes('Payments, billing') ?? false)
    check('renders the share card preview', (await page.$('figure img')) !== null)
    check('offers exports', (body?.includes('Markdown') && body?.includes('JSON')) ?? false)
    check(
      'leads with the stack summary rather than a bare count',
      /on Vercel with/.test(body ?? ''),
      body?.slice(0, 120).replace(/\s+/g, ' ').trim(),
    )
    check(
      'states what it cannot see',
      body?.includes('cannot be seen from the') ?? false,
    )

    // The two card shapes share one drawing path; switching must actually
    // re-render rather than leave the previous aspect ratio on screen.
    const wide = await page.getAttribute('figure img', 'src')
    await page.click('button:has-text("Square")')
    await page.waitForTimeout(1200)
    const square = await page.getAttribute('figure img', 'src')
    check('switching card format re-renders the preview', !!square && square !== wide)
    await page.screenshot({ path: resolve(root, 'screenshots/page-report.png'), fullPage: false })
    await page.close()
  }

  console.log('\n=== History page ===')
  {
    const page = await openPage(extensionId, 'history.html')
    const body = await page.textContent('body')
    check('lists visited sites', body?.includes(SITES.modern) ?? false)
    check('lists more than one site', body?.includes(SITES.wordpress) ?? false)

    await page.fill('input[type="search"]', 'wordpress')
    await page.waitForTimeout(400)
    const filtered = await page.textContent('body')
    check('search matches by technology', filtered?.includes(SITES.wordpress) ?? false)
    check('search excludes non-matches', !filtered?.includes(SITES.modern))

    await page.fill('input[type="search"]', '')
    await page.waitForTimeout(300)
    await page.screenshot({ path: resolve(root, 'screenshots/page-history.png') })

    // Forgetting one site leaves the other.
    await page.click(`button[aria-label="Forget ${SITES.wordpress}"]`)
    await page.waitForTimeout(700)
    const afterForget = await page.textContent('body')
    check('forgetting one site removes only that site',
      !afterForget?.includes(SITES.wordpress) && (afterForget?.includes(SITES.modern) ?? false))

    await page.click('button:has-text("Clear all")')
    await page.waitForTimeout(700)
    check('clear all empties the list', (await page.textContent('body'))?.includes('No sites yet'))
    await page.close()
  }

  console.log('\n=== Technologies page ===')
  {
    const page = await openPage(extensionId, 'technologies.html')
    const body = await page.textContent('body')
    check('states how many are detectable', /\d{3} detectable/.test(body ?? ''),
      /(\d+) detectable/.exec(body ?? '')?.[0])
    check('lists a known technology', body?.includes('Clerk') ?? false)

    await page.fill('input[type="search"]', 'stripe')
    await page.waitForTimeout(400)
    const searched = await page.textContent('body')
    check('search narrows the catalogue', searched?.includes('Stripe') && !searched?.includes('Clerk'))

    await page.fill('input[type="search"]', '')
    await page.waitForTimeout(300)
    await page.click('button:has-text("Payments")')
    await page.waitForTimeout(400)
    const byCategory = await page.textContent('body')
    check('category filter works', byCategory?.includes('Stripe') && !byCategory?.includes('Clerk'))
    await page.screenshot({ path: resolve(root, 'screenshots/page-technologies.png') })
    await page.close()
  }

  console.log('\n=== Settings page ===')
  {
    const page = await openPage(extensionId, 'options.html')
    const body = await page.textContent('body')
    check('shows both switches', body?.includes('Scan sites automatically') && body?.includes('Remember scanned sites'))
    check('states the privacy position', body?.includes('values never are') ?? false)
    check('links to the full policy', (await page.$('a[href*="privacy-policy"]')) !== null)

    const switches = await page.$$('button[role="switch"]')
    check('switches are real controls', switches.length === 2, `${switches.length}`)

    /*
     * The knob must sit inside its track — in both states.
     *
     * Both switches shipped as featureless pills: the knob had no `left`, so it
     * kept the button's centred static position and the transform pushed a white
     * circle off the right-hand edge onto a white page. There was no way to tell
     * on from off. `aria-checked` was correct the entire time, which is exactly
     * why every existing assertion passed. Only geometry catches this.
     */
    for (const state of ['as found', 'after toggling']) {
      const track = await (await page.$('button[role="switch"]')).boundingBox()
      const knob = await (await page.$('button[role="switch"] > span')).boundingBox()
      check(
        `switch knob is inside its track (${state})`,
        knob.x >= track.x - 1 &&
          knob.x + knob.width <= track.x + track.width + 1 &&
          knob.y >= track.y - 1 &&
          knob.y + knob.height <= track.y + track.height + 1,
        `knob ${Math.round(knob.x)}..${Math.round(knob.x + knob.width)} in track ` +
          `${Math.round(track.x)}..${Math.round(track.x + track.width)}`,
      )
      if (state === 'as found') {
        await page.click('button[role="switch"]')
        await page.waitForTimeout(400)
      }
    }
    // Leave scanning on for the checks that follow.
    if ((await page.getAttribute('button[role="switch"]', 'aria-checked')) === 'false') {
      await page.click('button[role="switch"]')
      await page.waitForTimeout(400)
    }
    await switches[1].click()
    await page.waitForTimeout(600)
    check('history switch toggles',
      (await switches[1].getAttribute('aria-checked')) === 'false')
    await switches[1].click()
    await page.waitForTimeout(600)
    await page.screenshot({ path: resolve(root, 'screenshots/page-settings.png') })

    // Both themes, same state. A white knob on a dark page is the case most
    // likely to hide the class of bug the light theme just revealed.
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.waitForTimeout(350)
    await page.screenshot({ path: resolve(root, 'screenshots/page-settings-dark.png') })
    await page.close()
  }

  console.log('\n=== Navigation between pages ===')
  {
    const page = await openPage(extensionId, 'report.html')
    await page.click('nav a:has-text("Technologies")')
    await page.waitForTimeout(1200)
    check('nav moves between pages', page.url().includes('technologies.html'), page.url())
    await page.click('nav a:has-text("History")')
    await page.waitForTimeout(1200)
    check('nav reaches history', page.url().includes('history.html'))
    await page.close()
  }

  console.log('\n=== Panel menu opens the pages ===')
  {
    await worker.evaluate(async (h) => {
      const tabs = await chrome.tabs.query({})
      const tab = tabs.find((t) => (t.url ?? '').includes(h))
      if (tab?.id !== undefined) await chrome.tabs.update(tab.id, { active: true })
    }, SITES.modern)
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
    await popup.waitForTimeout(2000)
    await popup.click('button[aria-label="More options"]')
    await popup.waitForTimeout(300)
    const menu = await popup.textContent('body')
    check('menu lists the pages',
      ['Full report', 'History', 'All technologies', 'Settings'].every((l) => menu?.includes(l)))

    const before = context.pages().length
    await popup.click('button:has-text("Full report")')
    await sleep(1200)
    check('menu opens the report page', context.pages().length > before)
  }

  console.log('\n=== Console health ===')
  check('no uncaught errors on any page', errors.length === 0, errors.slice(0, 3).join(' | '))
} finally {
  await context.close()
  server.close()
}

console.log(
  failures === 0
    ? `\nAll ${checks} page checks passed.\n`
    : `\n${failures} of ${checks} page checks failed.\n`,
)
process.exit(failures === 0 ? 0 : 1)
