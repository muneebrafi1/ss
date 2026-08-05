/**
 * Exercises every user-facing function inside the real panel.
 *
 * Rendering and download paths are easy to break silently — a refactor that
 * makes a canvas renderer async, or an export that throws only in a page
 * context, still typechecks and still passes unit tests. This drives them in
 * the browser and inspects the actual output.
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

const profile = await mkdtemp(resolve(tmpdir(), 'stacklens-fn-'))
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

try {
  let [worker] = context.serviceWorkers()
  if (!worker) worker = await context.waitForEvent('serviceworker', { timeout: 15000 })
  const extensionId = new URL(worker.url()).host

  const page = await context.newPage()
  await page.goto(`http://${SITES.modern}/`, { waitUntil: 'load' })
  await sleep(2200)
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
  await popup.waitForTimeout(2200)

  const errors = []
  popup.on('pageerror', (e) => errors.push(e.message))
  popup.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })

  console.log('\n=== Share image ===')
  {
    // Driven the way a user does, then the produced file is inspected — the
    // only way to catch a renderer that silently produces a blank canvas.
    await popup.click('button:has-text("Share")')
    await popup.waitForTimeout(300)
    const menu = await popup.textContent('body')
    check('share menu opens', menu?.includes('Download wide') ?? false)

    const sharp = (await import('sharp')).default
    const { readFile } = await import('node:fs/promises')

    // Both aspect ratios, because the two formats share one drawing path and a
    // layout constant wrong in only one of them would otherwise ship.
    for (const [label, item, width, height] of [
      ['wide', 'Download wide', 2400, 1260],
      ['square', 'Download square', 2160, 2160],
    ]) {
      if (label !== 'wide') {
        await popup.click('button:has-text("Share")')
        await popup.waitForTimeout(300)
      }
      const downloadPromise = popup.waitForEvent('download', { timeout: 20000 }).catch(() => null)
      await popup.click(`button:has-text("${item}")`)
      const download = await downloadPromise
      check(`${label} card downloads`, !!download, download?.suggestedFilename())
      if (!download) continue

      const bytes = await readFile(await download.path())
      check(`${label} card is a PNG`, bytes.subarray(1, 4).toString() === 'PNG')
      check(`${label} card is not blank`, bytes.length > 8000, `${bytes.length} bytes`)

      const meta = await sharp(bytes).metadata()
      check(
        `${label} card is ${width}x${height}`,
        meta.width === width && meta.height === height,
        `${meta.width}x${meta.height}`,
      )

      // A blank canvas compresses tiny and has no channel spread; real artwork
      // does. Checked over the whole card and again over the footer band alone,
      // because a grid that renders while the signature does not is precisely
      // the regression that makes the image useless as an advertisement.
      const stats = await sharp(bytes).stats()
      const spread = Math.max(...stats.channels.map((c) => c.max - c.min))
      check(`${label} card has drawn content`, spread > 40, `channel spread ${spread}`)

      const footerBand = await sharp(bytes)
        .extract({ left: 0, top: height - 150, width, height: 140 })
        .stats()
      const footerSpread = Math.max(...footerBand.channels.map((c) => c.max - c.min))
      check(`${label} card has a signed footer`, footerSpread > 40, `footer spread ${footerSpread}`)

      await sharp(bytes).toFile(resolve(root, `screenshots/share-card-${label}.png`))
    }
  }

  console.log('\n=== Exports ===')
  for (const [label, format] of [
    ['Markdown', 'Download Markdown'],
    ['JSON', 'Download JSON'],
  ]) {
    await popup.click('button:has-text("Export")')
    await popup.waitForTimeout(250)
    const downloadPromise = popup.waitForEvent('download', { timeout: 10000 }).catch(() => null)
    await popup.click(`button:has-text("${format}")`)
    const download = await downloadPromise
    check(`${label} export downloads`, !!download, download?.suggestedFilename())
    if (download) {
      const { readFile } = await import('node:fs/promises')
      const text = await readFile(await download.path(), 'utf8')
      check(`${label} export has content`, text.length > 50, `${text.length} chars`)
      check(`${label} export mentions a detected tool`, text.includes('Stripe'))
    }
  }

  console.log('\n=== Filter ===')
  {
    await popup.fill('input[type="search"]', 'stripe')
    await popup.waitForTimeout(400)
    const names = await popup.$$eval('button[data-tool]', (n) => n.map((x) => x.dataset.tool))
    check('filter narrows to matches', names.length > 0 && names.every((n) => /stripe/i.test(n)),
      names.join(', '))

    await popup.fill('input[type="search"]', 'zzzznope')
    await popup.waitForTimeout(400)
    check('filter shows a no-match state', (await popup.textContent('body'))?.includes('No match'))

    await popup.fill('input[type="search"]', 'payments')
    await popup.waitForTimeout(400)
    const byCategory = await popup.$$eval('button[data-tool]', (n) => n.map((x) => x.dataset.tool))
    check('filter matches on category name', byCategory.some((n) => n?.startsWith('Stripe')),
      byCategory.join(', '))

    await popup.fill('input[type="search"]', '')
    await popup.waitForTimeout(300)
  }

  console.log('\n=== Card links ===')
  {
    const pagesBefore = context.pages().length
    await popup.click('button[data-tool="Stripe"]')
    /*
     * Wait for the tab, not for a stopwatch. A fixed sleep here failed roughly
     * one run in ten — opening a tab means a round trip to the browser process
     * and a fresh renderer, which is not reliably under 900ms on a loaded
     * machine. The condition is what the check is about; the duration never was.
     */
    const deadline = Date.now() + 10000
    while (context.pages().length <= pagesBefore && Date.now() < deadline) await sleep(100)
    check('clicking a tool opens its site', context.pages().length > pagesBefore)
    for (const p of context.pages().slice(pagesBefore)) await p.close().catch(() => {})
  }

  console.log('\n=== Console health ===')
  check('no uncaught errors in the panel', errors.length === 0, errors.slice(0, 2).join(' | '))
} finally {
  await context.close()
  server.close()
}

console.log(
  failures === 0
    ? `\nAll ${checks} function checks passed.\n`
    : `\n${failures} of ${checks} function checks failed.\n`,
)
process.exit(failures === 0 ? 0 : 1)
