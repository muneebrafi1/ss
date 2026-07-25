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
    check('share menu opens', menu?.includes('Download image') ?? false)

    // Downloading writes a real PNG; capture and measure it.
    const downloadPromise = popup.waitForEvent('download', { timeout: 15000 }).catch(() => null)
    await popup.click('button:has-text("Download image")')
    const download = await downloadPromise
    check('share image downloads', !!download, download?.suggestedFilename())

    if (download) {
      const path = await download.path()
      const { readFile } = await import('node:fs/promises')
      const bytes = await readFile(path)
      check('share image is a PNG', bytes.subarray(1, 4).toString() === 'PNG')
      check('share image is not blank', bytes.length > 8000, `${bytes.length} bytes`)

      // A blank 1200x630 canvas compresses tiny; real artwork does not.
      const sharp = (await import('sharp')).default
      const meta = await sharp(bytes).metadata()
      check('share image is 1200x630', meta.width === 1200 && meta.height === 630,
        `${meta.width}x${meta.height}`)
      const stats = await sharp(bytes).stats()
      const spread = Math.max(...stats.channels.map((c) => c.max - c.min))
      check('share image has drawn content', spread > 40, `channel spread ${spread}`)
      await sharp(bytes).toFile(resolve(root, 'screenshots/share-card.png'))
    }
  }

  console.log('\n=== Exports ===')
  for (const [label, format] of [
    ['Markdown', 'Download Markdown'],
    ['JSON', 'Download JSON'],
    ['CSV', 'Download CSV'],
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
    const names = await popup.$$eval('button[type="button"] span.line-clamp-2', (n) =>
      n.map((x) => x.textContent?.trim()),
    )
    check('filter narrows to matches', names.length > 0 && names.every((n) => /stripe/i.test(n)),
      names.join(', '))

    await popup.fill('input[type="search"]', 'zzzznope')
    await popup.waitForTimeout(400)
    check('filter shows a no-match state', (await popup.textContent('body'))?.includes('No match'))

    await popup.fill('input[type="search"]', 'payments')
    await popup.waitForTimeout(400)
    const byCategory = await popup.$$eval('button[type="button"] span.line-clamp-2', (n) =>
      n.map((x) => x.textContent?.trim()),
    )
    check('filter matches on category name', byCategory.some((n) => n?.startsWith('Stripe')),
      byCategory.join(', '))

    await popup.fill('input[type="search"]', '')
    await popup.waitForTimeout(300)
  }

  console.log('\n=== Card links ===')
  {
    const pagesBefore = context.pages().length
    await popup.click('button:has(span:text-is("Stripe"))')
    await sleep(900)
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
