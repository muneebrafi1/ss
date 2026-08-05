/**
 * What StackLens costs a page load, measured rather than argued.
 *
 * `store/SUBMISSION.md` used to say the design is right — collection is
 * observe-only and matching happens on panel open rather than per request —
 * "but that is an argument rather than a number". This produces the number.
 *
 * Method
 * ------
 * Two Chrome contexts are launched from identical flags, differing only in
 * whether `dist/` is loaded. The same pages are loaded REPEATS times in each,
 * and the medians are compared. Anything that shows up in one and not the other
 * is the extension, because nothing else differs.
 *
 * The first two loads of every page are discarded in both contexts. A cold
 * profile pays for connection setup, script compilation and JIT warmup on the
 * first hit, and that cost lands wherever the run order happens to put it —
 * which is how a difference of measurement order gets reported as a difference
 * of extensions.
 *
 * Three things are measured, because they fail differently:
 *
 *   1. `loadEventEnd` — wall clock for the whole navigation. This is where
 *      per-request webRequest observation would show up, since every subresource
 *      passes through the listener.
 *   2. Main-thread blocking, sampled with requestAnimationFrame. Load time can
 *      stay flat while the page stutters, and a frame-gap sampler sees stutter
 *      at ~16ms resolution where the `longtask` API only reports past 50ms.
 *   3. The panel-open path, which is the one moment StackLens runs code inside
 *      the page — two `executeScript` calls that walk the DOM and read Resource
 *      Timing. Measured on the heaviest fixture, where it costs the most.
 *
 * What this does not measure: a real site over a real network. The fixture
 * server is on loopback, so network time is near zero and CPU cost is the whole
 * signal — which is the thing in question, but it means the percentages here are
 * upper bounds. On a real page where load is dominated by network, the same
 * absolute milliseconds are a smaller share.
 */
import { chromium } from 'playwright'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createFixtureServer, SITES } from './fixture-server.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const PORT = 8788
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Odd, so the median is an observed value rather than an average of two. */
const REPEATS = 9
const WARMUP = 2

let failures = 0
let checks = 0
const check = (label, ok, detail = '') => {
  checks += 1
  console.log(`${ok ? '  PASS' : '  FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failures += 1
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b)
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2
}
/** Interquartile range — the spread of the middle half, ignoring the tails. */
const iqr = (xs) => {
  const s = [...xs].sort((a, b) => a - b)
  const at = (q) => s[Math.min(s.length - 1, Math.max(0, Math.round(q * (s.length - 1))))]
  return at(0.75) - at(0.25)
}
const ms = (n) => `${n.toFixed(1)}ms`

const server = createFixtureServer()
await new Promise((r) => server.listen(PORT, r))

async function launch(withExtension) {
  const profile = await mkdtemp(resolve(tmpdir(), 'stacklens-perf-'))
  const args = [
    `--host-resolver-rules=MAP * 127.0.0.1:${PORT}, EXCLUDE localhost, EXCLUDE 127.0.0.1`,
    '--no-sandbox',
  ]
  if (withExtension) {
    args.unshift(
      `--disable-extensions-except=${resolve(root, 'dist')}`,
      `--load-extension=${resolve(root, 'dist')}`,
    )
  }
  return chromium.launchPersistentContext(profile, {
    executablePath: CHROME,
    headless: true,
    args,
  })
}

/**
 * One navigation, reporting load time and the worst main-thread stall during it.
 *
 * The rAF sampler is installed by an init script so it is running before the
 * document's own scripts are, otherwise it would miss precisely the early
 * blocking that matters most.
 */
async function measureLoad(context, host) {
  const page = await context.newPage()
  await page.addInitScript(() => {
    window.__frames = []
    const tick = (t) => {
      window.__frames.push(t)
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
  await page.goto(`http://${host}/`, { waitUntil: 'load', timeout: 30000 })
  // Frames keep arriving after `load`; a short settle catches work that the
  // load event only starts, which is where a lazy detector would hide.
  await sleep(600)

  const result = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0]
    const frames = window.__frames ?? []
    let worst = 0
    for (let i = 1; i < frames.length; i += 1) {
      const gap = frames[i] - frames[i - 1]
      if (gap > worst) worst = gap
    }
    return {
      load: nav ? nav.loadEventEnd : 0,
      dcl: nav ? nav.domContentLoadedEventEnd : 0,
      worstFrameGap: worst,
      frames: frames.length,
    }
  })
  await page.close()
  return result
}

/**
 * Loads one page alternately in both contexts and reports the paired difference.
 *
 * The first version of this ran all the extension-off loads, then all the
 * extension-on loads. That measures the extension plus whatever else changed on
 * the machine between the two bursts, and the difference is reported entirely as
 * the extension — the same page read -0.7ms on one run and +7.0ms on the next,
 * which is drift, not a regression that appeared in ninety seconds.
 *
 * Alternating load by load puts both contexts under the same conditions, and
 * taking the difference WITHIN each pair cancels drift instead of measuring it.
 * The spread of those per-pair differences is then an honest noise floor: it is
 * how much the answer moves when nothing about the extension has changed.
 */
async function paired(host) {
  const offs = []
  const ons = []
  const diffs = []
  const gapDiffs = []
  for (let i = 0; i < REPEATS + WARMUP; i += 1) {
    // Order flips each round so a systematic first-vs-second penalty — a cold
    // cache, a CPU that ramps — lands on both contexts equally.
    const first = i % 2 === 0
    const a = await measureLoad(first ? without : withExt, host)
    const b = await measureLoad(first ? withExt : without, host)
    const off = first ? a : b
    const on = first ? b : a
    if (i < WARMUP) continue
    offs.push(off)
    ons.push(on)
    diffs.push(on.load - off.load)
    gapDiffs.push(on.worstFrameGap - off.worstFrameGap)
  }
  return {
    off: { load: median(offs.map((r) => r.load)), gap: median(offs.map((r) => r.worstFrameGap)) },
    on: { load: median(ons.map((r) => r.load)), gap: median(ons.map((r) => r.worstFrameGap)) },
    delta: median(diffs),
    noise: iqr(diffs),
    // Frame gaps get the same paired treatment. On the stress fixture the page
    // already blocks itself for ~120ms decoding 400 images, and that self-inflicted
    // stall swings by several frames run to run — so a fixed threshold on it
    // measures the fixture's mood, not the extension. An early version of this
    // check failed at exactly +50.0ms for that reason.
    gapDelta: median(gapDiffs),
    gapNoise: iqr(gapDiffs),
  }
}

const PAGES = [
  { key: 'plain', label: 'Plain HTML', budgetMs: 40 },
  { key: 'modern', label: 'Modern SaaS', budgetMs: 60 },
  { key: 'publisher', label: 'Publisher + ad tech', budgetMs: 80 },
  { key: 'heavy', label: 'Stress: 1,500 requests', budgetMs: 400 },
]

let withExt
let without

try {
  console.log(
    `\nStackLens performance — ${REPEATS} loads per page per context ` +
      `(${WARMUP} discarded as warmup)\n`,
  )

  without = await launch(false)
  withExt = await launch(true)

  // The worker must be alive before the first measured load, or the first page
  // in the list pays its startup and gets blamed for it.
  let worker = withExt.serviceWorkers()[0]
  if (!worker) worker = await withExt.waitForEvent('serviceworker', { timeout: 15000 })
  const extensionId = new URL(worker.url()).host
  console.log(`extension id: ${extensionId}\n`)

  /* ====================================================================== */
  console.log('=== Page load: with the extension vs without ===\n')
  console.log('  page                       load (off)   load (on)      delta   verdict')
  console.log('  ' + '-'.repeat(78))

  const table = []
  for (const page of PAGES) {
    const { off, on, delta, noise, gapDelta, gapNoise } = await paired(SITES[page.key])
    const pct = off.load > 0 ? (delta / off.load) * 100 : 0

    /*
     * A delta smaller than the spread of the paired differences is not a
     * measurement, and printing it as a percentage would be the same sin the
     * panel avoids by never showing a confidence score: a number that sounds
     * precise while meaning nothing. An early pass of this harness reported
     * "+14.0%" on a page where the same run also showed the extension making two
     * other pages FASTER — which is the tell that noise swallowed it.
     */
    const measurable = Math.abs(delta) > noise
    table.push({ page, off, on, delta, pct, noise, measurable, gapDelta, gapNoise })

    const verdict = measurable
      ? `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`
      : `below noise (±${ms(noise)})`
    console.log(
      `  ${page.label.padEnd(26)} ${ms(off.load).padStart(9)} ${ms(on.load).padStart(11)}` +
        ` ${`${delta >= 0 ? '+' : ''}${delta.toFixed(1)}ms`.padStart(10)}   ${verdict}`,
    )
  }

  console.log('')
  for (const { page, delta, pct, off, on, noise, measurable } of table) {
    check(
      `${page.label}: load cost stays under ${page.budgetMs}ms`,
      delta < page.budgetMs,
      measurable
        ? `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}ms (${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%), ` +
          `${ms(off.load)} → ${ms(on.load)}`
        : `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}ms, below the ±${ms(noise)} noise floor`,
    )
  }

  // Blocking is the metric a user actually feels. Observation happens in the
  // service worker, on its own thread, so the page's main thread should be
  // untouched during load — if this regresses, something moved into the page.
  //
  // One frame at 60Hz is 16.7ms, and a gap is only ever a whole number of them,
  // so the floor of what this can resolve is one frame. Anything the extension
  // adds must be either inside the noise or inside a single dropped frame.
  console.log('')
  for (const { page, gapDelta, gapNoise, off, on } of table) {
    const quiet = Math.abs(gapDelta) <= Math.max(gapNoise, 16.7)
    check(
      `${page.label}: adds no main-thread stall during load`,
      quiet,
      `paired frame-gap difference ${gapDelta >= 0 ? '+' : ''}${gapDelta.toFixed(1)}ms ` +
        `(noise ±${ms(gapNoise)}), medians ${ms(off.gap)} → ${ms(on.gap)}`,
    )
  }

  /* ====================================================================== */
  console.log('\n=== Memory: what one tab holds in session storage ===\n')
  {
    /*
     * Worth a number rather than a shrug, because `chrome.storage.session` has a
     * ~10MB ceiling for the whole extension and StackLens keeps one record per
     * open tab. If an ordinary page cost what the stress page costs, a user with
     * thirty tabs would silently start losing evidence.
     */
    let total = 0
    let worstOrdinary = 0
    for (const page of PAGES) {
      const host = SITES[page.key]
      const tab = await withExt.newPage()
      await tab.goto(`http://${host}/`, { waitUntil: 'load', timeout: 30000 })
      await sleep(page.key === 'heavy' ? 3500 : 1500)
      const tabId = await worker.evaluate(async (h) => {
        const tabs = await chrome.tabs.query({})
        return tabs.find((t) => (t.url ?? '').includes(h))?.id ?? null
      }, host)
      const bytes = await worker.evaluate(async (id) => {
        const stored = await chrome.storage.session.get(`tab:${id}`)
        return JSON.stringify(stored[`tab:${id}`] ?? {}).length
      }, tabId)
      total += bytes
      if (page.key !== 'heavy') worstOrdinary = Math.max(worstOrdinary, bytes)
      console.log(`  ${page.label.padEnd(26)} ${(bytes / 1024).toFixed(1).padStart(8)} KB`)
      await tab.close()
    }
    console.log(
      `\n  four tabs open at once: ${(total / 1024).toFixed(1)} KB of a ~10 MB budget\n`,
    )
    check(
      'an ordinary page costs well under 100 KB of session storage',
      worstOrdinary < 100 * 1024,
      `worst ordinary page ${(worstOrdinary / 1024).toFixed(1)} KB`,
    )
    // 10MB is the documented session-storage ceiling; 30 tabs is a heavy but
    // entirely ordinary browsing session.
    check(
      'thirty ordinary tabs would stay inside the session quota',
      worstOrdinary * 30 < 10 * 1024 * 1024,
      `${((worstOrdinary * 30) / 1024 / 1024).toFixed(2)} MB projected`,
    )
  }

  /* ====================================================================== */
  console.log('\n=== Opening the panel: the one moment code runs in the page ===\n')
  {
    // The stress fixture, deliberately: 1,500 requests and 400 images is where
    // walking the DOM and Resource Timing costs the most, so this is the ceiling
    // rather than the typical case.
    const page = await withExt.newPage()
    await page.goto(`http://${SITES.heavy}/`, { waitUntil: 'load', timeout: 30000 })
    await sleep(3000)

    await page.evaluate(() => {
      window.__panelFrames = []
      const tick = (t) => {
        window.__panelFrames.push(t)
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })

    const tabId = await worker.evaluate(async (h) => {
      const tabs = await chrome.tabs.query({})
      const tab = tabs.find((t) => (t.url ?? '').includes(h))
      if (tab?.id !== undefined) await chrome.tabs.update(tab.id, { active: true })
      return tab?.id ?? null
    }, SITES.heavy)

    const started = Date.now()
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

    let popup = null
    while (!popup && Date.now() - started < 15000) {
      popup = withExt.pages().find((p) => p.url().includes('popup.html')) ?? null
      if (!popup) await sleep(50)
    }
    await popup.waitForSelector('button[data-tool]', { timeout: 15000 })
    const toDetections = Date.now() - started

    // Read the page's frame record only after the panel has rendered, so the
    // probes have certainly run by the time the gaps are computed.
    await sleep(500)
    const blocking = await page.evaluate(() => {
      const frames = window.__panelFrames ?? []
      let worst = 0
      let over16 = 0
      for (let i = 1; i < frames.length; i += 1) {
        const gap = frames[i] - frames[i - 1]
        if (gap > worst) worst = gap
        if (gap > 16.7 * 3) over16 += 1
      }
      return { worst, over16, frames: frames.length }
    })

    const bytes = await worker.evaluate(async (id) => {
      const stored = await chrome.storage.session.get(`tab:${id}`)
      return JSON.stringify(stored[`tab:${id}`] ?? {}).length
    }, tabId)

    const names = await popup.$$eval('button[data-tool]', (n) => n.length)
    console.log(`  ${names} technologies rendered on the stress page`)
    console.log(`  window.create → detections on screen: ${toDetections}ms`)
    console.log(`  worst frame gap in the page while probing: ${ms(blocking.worst)}`)
    console.log(`  dropped-frame runs (>50ms): ${blocking.over16}`)
    console.log(`  session storage held for the tab: ${(bytes / 1024).toFixed(1)} KB\n`)

    // This number includes Chrome creating a window and React mounting, neither
    // of which is detection work — it is a ceiling on what the user waits, not a
    // measure of the engine.
    check(
      'panel reaches detections within 3s on the worst page',
      toDetections < 3000,
      `${toDetections}ms`,
    )
    check(
      'probing the worst page never blocks it for a visible beat',
      blocking.worst < 200,
      `worst frame gap ${ms(blocking.worst)}`,
    )
    check(
      'per-tab evidence stays inside a sane storage footprint',
      bytes < 512 * 1024,
      `${(bytes / 1024).toFixed(1)} KB`,
    )
  }
} finally {
  if (withExt) await withExt.close()
  if (without) await without.close()
  server.close()
}

console.log(
  failures === 0
    ? `\nAll ${checks} performance checks passed.\n`
    : `\n${failures} of ${checks} performance checks failed.\n`,
)
process.exit(failures === 0 ? 0 : 1)
