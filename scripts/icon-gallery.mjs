/**
 * Renders every bundled icon into one page for visual QA.
 *
 * An icon set is only as good as its worst member, and problems — a mark that
 * is invisible against the card, artwork with the wrong viewBox, a silhouette
 * that should have been recoloured — only show up when the whole set is seen
 * side by side. Writes screenshots/icon-gallery.html, which tests/e2e/icons.mjs
 * screenshots in both themes.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const source = await readFile(resolve(root, 'src/assets/icons.generated.ts'), 'utf8')
const literal = source.slice(source.indexOf('= {') + 2, source.lastIndexOf('}') + 1)
// Our own generated content, evaluated by a dev-only script.
const ICONS = new Function(`return ${literal}`)()

const names = Object.keys(ICONS).sort()
const withLogo = names.filter((n) => ICONS[n].body)
const monograms = names.filter((n) => !ICONS[n].body)

function initials(name) {
  const words = name.replace(/[^A-Za-z0-9 ]/g, ' ').trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase()
  return (words[0]?.[0] ?? '?').toUpperCase()
}

function isNearMonochrome(hex) {
  const v = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16))
  if ([r, g, b].some(Number.isNaN)) return false
  const spread = Math.max(r, g, b) - Math.min(r, g, b)
  const lum = (r * 299 + g * 587 + b * 114) / 1000
  return spread < 24 && (lum < 48 || lum > 210)
}

function luminance(hex) {
  const v = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16))
  return [r, g, b].some(Number.isNaN) ? 128 : (r * 299 + g * 587 + b * 114) / 1000
}

function cell(slug) {
  const entry = ICONS[slug]
  if (entry.body) {
    const recolour = entry.mono && isNearMonochrome(entry.hex)
    const lift = entry.mono && !recolour && luminance(entry.hex) < 90
    const cls = ['mark', recolour ? 'recolour' : '', lift ? 'lift' : ''].filter(Boolean).join(' ')
    const style = recolour ? '' : entry.mono ? `--logo:${entry.hex}` : ''
    return `<div class="cell"><svg class="${cls}" style="${style}" viewBox="${entry.vb ?? '0 0 24 24'}" width="28" height="28">${entry.body}</svg><span>${slug}</span></div>`
  }
  return `<div class="cell"><span class="mono" style="--sl-brand:${entry.hex}">${initials(slug)}</span><span>${slug}</span></div>`
}

const html = `<!doctype html>
<meta charset="utf-8">
<title>StackLens icon gallery</title>
<style>
  :root { --bg:#fff; --card:#f7f7f9; --line:#e8e8ec; --ink:#16161c; --muted:#6b6b76; }
  body.dark { --bg:#0b0b0f; --card:#16161c; --line:#23232b; --ink:#f2f2f5; --muted:#8b8b96; }
  body { margin:0; background:var(--bg); color:var(--ink); font:13px/1.4 ui-sans-serif,system-ui,sans-serif; padding:20px; }
  h2 { font-size:12px; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); margin:24px 0 10px; }
  .grid { display:grid; grid-template-columns:repeat(12,1fr); gap:8px; }
  .cell { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px;
          height:82px; border:1px solid var(--line); border-radius:10px; background:var(--card); padding:4px; }
  .cell span:last-child { font-size:9px; color:var(--muted); text-align:center; word-break:break-all; line-height:1.15; }
  .mark { fill:var(--logo); }
  .recolour { fill:var(--ink); }
  body.dark .lift { fill:color-mix(in oklab, var(--logo) 52%, white); }
  .mono { display:grid; place-items:center; width:28px; height:28px; border-radius:8px; font-weight:600; font-size:12px;
          background:color-mix(in oklab, var(--sl-brand) 14%, transparent);
          color:color-mix(in oklab, var(--sl-brand) 82%, black); }
  body.dark .mono { background:color-mix(in oklab, var(--sl-brand) 26%, transparent);
                    color:color-mix(in oklab, var(--sl-brand) 58%, white); }
</style>
<h2>${withLogo.length} real logos</h2>
<div class="grid">${withLogo.map(cell).join('')}</div>
<h2>${monograms.length} monograms — no freely licensed mark exists</h2>
<div class="grid">${monograms.map(cell).join('')}</div>
`

await mkdir(resolve(root, 'screenshots'), { recursive: true })
await writeFile(resolve(root, 'screenshots/icon-gallery.html'), html)
console.log(`icon-gallery.html — ${withLogo.length} logos, ${monograms.length} monograms`)
