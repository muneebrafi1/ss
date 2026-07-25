/**
 * Reports fingerprints that rest on too little evidence.
 *
 * Entry count is the number people quote, but it is the wrong measure. Under
 * noisy-OR a lone 0.6 signal sits exactly on the display threshold, so a single
 * change in how a site loads that service drops the detection entirely and
 * silently. Two independent mid-weight signals are both sturdier and more
 * honest, and one very strong signal — a page global, a branded cookie — is
 * proof on its own.
 *
 * That rule is enforced in `tests/fingerprints.test.ts`. This script exists to
 * show *which* entries need work and what they already have, which a failing
 * assertion does not.
 *
 * The database is TypeScript with regex literals and a path alias, so it cannot
 * simply be imported by plain Node. The entries have a rigidly consistent shape,
 * so the source is parsed directly — the test suite is the real guarantee, and
 * this only has to be right enough to point at the work.
 *
 *   node scripts/audit-signals.mjs           # entries below the bar
 *   node scripts/audit-signals.mjs --all     # every entry, weakest first
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const DIR = 'src/fingerprints'
const SKIP = new Set(['index.ts', 'categories.ts'])

/** One strong signal is enough; otherwise two are required. */
const STRONG = 0.9

function parseFile(path) {
  const source = readFileSync(path, 'utf8')
  const entries = []

  // Entries start at a two-space-indented brace and run to the matching one.
  const starts = [...source.matchAll(/^ {2}\{$/gm)].map((m) => m.index)
  for (const start of starts) {
    let depth = 0
    let end = start
    for (let i = start; i < source.length; i++) {
      const c = source[i]
      if (c === '{' || c === '[') depth++
      else if (c === '}' || c === ']') {
        depth--
        if (depth === 0) {
          end = i
          break
        }
      }
    }
    const chunk = source.slice(start, end + 1)
    const id = chunk.match(/\bid: '([^']+)'/)?.[1]
    if (!id) continue

    /*
     * Types and weights are scanned separately and zipped by order.
     *
     * Matching a whole signal object with one pattern does not work: a regex
     * literal in the middle of it can contain a brace — `/\bsvelte-[a-z0-9]{6,}\b/`
     * — and any non-greedy run up to `weight` stops there instead. That silently
     * under-counted three entries and sent me looking at fingerprints that were
     * already fine. Each signal has exactly one `type` and one `weight`, in that
     * order, so pairing by position is both simpler and correct.
     */
    const region = chunk.slice(chunk.indexOf('signals: ['))
    const types = [...region.matchAll(/\btype: '(\w+)'/g)].map((m) => m[1])
    const weights = [...region.matchAll(/\bweight: ([\d.]+)/g)].map((m) => Number(m[1]))
    const signals = types.map((type, i) => ({ type, weight: weights[i] ?? 0 }))
    entries.push({ id, signals })
  }
  return entries
}

const files = readdirSync(DIR).filter((f) => f.endsWith('.ts') && !SKIP.has(f))
const all = []
for (const file of files) {
  for (const entry of parseFile(join(DIR, file))) {
    all.push({ ...entry, category: file.replace('.ts', '') })
  }
}

const score = (entry) => ({
  count: entry.signals.length,
  max: entry.signals.reduce((m, s) => Math.max(m, s.weight), 0),
  types: new Set(entry.signals.map((s) => s.type)).size,
})

const weak = all.filter((entry) => {
  const { count, max } = score(entry)
  return count < 2 && max < STRONG
})

const showAll = process.argv.includes('--all')
const rows = showAll
  ? [...all].sort((a, b) => score(a).count - score(b).count || score(a).max - score(b).max)
  : weak

console.log(`\n${all.length} fingerprints across ${files.length} categories\n`)

if (rows.length === 0) {
  console.log('Every entry carries two signals or one weighted >= 0.9.\n')
} else {
  console.log('id'.padEnd(28), 'category'.padEnd(16), 'signals', 'types', 'strongest')
  for (const entry of rows) {
    const { count, max, types } = score(entry)
    console.log(
      entry.id.padEnd(28),
      entry.category.padEnd(16),
      String(count).padStart(7),
      String(types).padStart(5),
      String(max).padStart(9),
    )
  }
  console.log(`\n${weak.length} entry(s) below the bar.\n`)
}

// Category summary is what says where the next hour is best spent.
const byCategory = new Map()
for (const entry of all) {
  const bucket = byCategory.get(entry.category) ?? { entries: 0, signals: 0, weak: 0 }
  bucket.entries++
  bucket.signals += entry.signals.length
  if (weak.includes(entry)) bucket.weak++
  byCategory.set(entry.category, bucket)
}

console.log('category'.padEnd(16), 'entries', 'sig/entry', 'below bar')
for (const [category, b] of [...byCategory].sort((a, b) => a[1].entries - b[1].entries)) {
  console.log(
    category.padEnd(16),
    String(b.entries).padStart(7),
    (b.signals / b.entries).toFixed(1).padStart(9),
    String(b.weak).padStart(9),
  )
}
console.log()

process.exit(weak.length > 0 && !showAll ? 1 : 0)
