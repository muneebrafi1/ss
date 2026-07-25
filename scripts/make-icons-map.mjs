/**
 * Generates src/assets/icons.generated.ts from the icon slugs the fingerprint
 * database references.
 *
 * Logos are bundled rather than fetched at runtime. Pulling them from a CDN
 * would reveal every site the user scans to a third party, require a privacy
 * disclosure, and break on pages with a strict content security policy — so the
 * extension makes no external requests at all.
 *
 * Only referenced slugs are emitted, so the bundle stays proportional to the
 * database rather than shipping thousands of unused icons.
 *
 * Sources, in priority order — all freely licensed:
 *   1. simple-icons (current)      CC0
 *   2. simple-icons v11            CC0 — carries brands since removed at their
 *                                  trademark holders' request (AWS, LinkedIn,
 *                                  Salesforce, Microsoft, Twilio, OpenAI…)
 *   3. @lobehub/icons-static-svg   MIT — AI-ecosystem brands the others lack
 *
 * Brands with no freely licensed mark anywhere fall back to a monogram, which
 * is designed to look deliberate rather than like a missing image.
 */
import * as simpleIcons from 'simple-icons'
import * as simpleIconsV11 from 'simple-icons-v11'
import iconifyLogos from '@iconify-json/logos/icons.json' with { type: 'json' }
import iconifySelfhst from '@iconify-json/selfhst/icons.json' with { type: 'json' }
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const LOBE_DIR = resolve(root, 'node_modules/@lobehub/icons-static-svg/icons')

/**
 * Where a slug is named differently by a source, or where the closest
 * equivalent mark lives under another name.
 */
const ALIASES = {
  amazonwebservices: ['amazonaws', 'aws'],
  amazons3: ['amazons3', 'aws'],
  stabilityai: ['stability'],
  blackforestlabs: ['bfl'],
  meta: ['meta'],
  'googlegemini': ['googlegemini', 'gemini'],
  perplexity: ['perplexity'],
  cohere: ['cohere'],
  groq: ['groq'],
  together: ['together'],
  fireworks: ['fireworks'],
  openrouter: ['openrouter'],
  huggingface: ['huggingface'],
  llamaindex: ['llamaindex'],
  langchain: ['langchain'],
  copilotkit: ['copilotkit'],
  mastra: ['mastra'],
  assemblyai: ['assemblyai'],
  livekit: ['livekit'],
  luma: ['luma', 'dreammachine'],
  runway: ['runway'],
  openai: ['openai'],
  anthropic: ['anthropic', 'claude'],
  deepseek: ['deepseek'],
  mistralai: ['mistral'],
  x: ['xai', 'x'],
  onnx: ['onnx'],
  tesseract: ['tesseract'],
  front: ['front', 'frontapp'],
  videodotjs: ['videodotjs', 'videojs'],
  hlsjs: ['hlsjs', 'hls'],
  did: ['did', 'd-id'],
  amazons3: ['amazons3', 'aws-s3'],
}

/** Brand colours for anything that still resolves to a monogram. */
const BRAND_COLORS = {
  ably: '#ED760D', abtasty: '#F04E4E', affirm: '#4A4AF4', amplitude: '#1E61F0',
  attio: '#1E1E1E', axeptio: '#F5D200', axiom: '#4B5FE3', beehiiv: '#FFC117',
  braze: '#801ED7', canny: '#2B53F5', cartesia: '#1A1A1A', chargebee: '#FF7846',
  chilipiper: '#E23D3D', chroma: '#FF6B4A', cookiebot: '#1A73E8',
  cookieyes: '#0056D2', crisp: '#1972F5', customerio: '#FFCD00',
  daily: '#1BEBB9', descope: '#1E64FF', did: '#E6407A', drift: '#1B9AF7',
  front: '#001B38', growthbook: '#7B45E5', hcaptcha: '#0074BF', heap: '#3D4CF5',
  heygen: '#7857FF', highlight: '#5B31F5', hlsjs: '#E4453A',
  honeycomb: '#F5C244', imagekit: '#1E92F0', instantdb: '#1A1A1A',
  iterable: '#3D3AE0', june: '#4F46E5', kinde: '#0F1015', klaviyo: '#1A1A1A',
  koala: '#5A3DF5', launchdarkly: '#3DD6F5', liveblocks: '#1A1A1A',
  logrocket: '#764ABC', logto: '#5D34F2', mollie: '#0077FF', mux: '#FA50B5',
  onetrust: '#7A2E8C', optimizely: '#0037FF', orama: '#8B5CF6',
  partykit: '#FF5C00', pinecone: '#1A7BF5', plain: '#1A1A1A', playht: '#7C3AED',
  polar: '#1A1A1A', postmark: '#FFDE00', pylon: '#4F46E5', raygun: '#00A8E0',
  rb2b: '#FF4A3D', retell: '#5A3DF5', segment: '#52BD95', sendgrid: '#51A9E3',
  smartbear: '#1A6FB4', snipcart: '#153D8A', speechify: '#5A3DF5',
  split: '#3DA4F5', statsig: '#194BFB', stytch: '#19303D', swell: '#1A1A1A',
  synthesia: '#FF5C5C', tally: '#1A1A1A', tavus: '#3D5AFE', termly: '#2B6FE3',
  tesseract: '#4A90D9', tidio: '#4A90E2', tinybird: '#25283D',
  trackjs: '#00A0DF', turbopuffer: '#1A1A1A', typesense: '#D63384',
  unleash: '#1A1A1A', uploadthing: '#E91569', usercentrics: '#0044CC',
  vapi: '#12A594', videodotjs: '#911A16', vwo: '#E4002B', weaviate: '#00C9A7',
  workos: '#6363F1', xata: '#1A1A1A', yjs: '#3D8B40',
}

const NEUTRAL = '#6B6B76'

function luminanceOf(hex) {
  const value = hex.replace('#', '')
  const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16))
  return [r, g, b].some(Number.isNaN) ? 128 : (r * 299 + g * 587 + b * 114) / 1000
}

/**
 * Collapses artwork that is entirely dark into a recolourable silhouette.
 *
 * A brand mark drawn only in near-black is invisible against a dark card. When
 * every colour in the artwork is dark there is nothing to preserve by keeping
 * them, so the explicit fills are stripped and the mark becomes monochrome —
 * which lets the panel lift it to a legible tone in dark mode. Artwork with any
 * genuine colour is left exactly as the brand draws it.
 */
function flattenIfAllDark(icon) {
  if (icon.mono) return icon
  const colors = [...icon.body.matchAll(/(?:fill|stroke)="(#[0-9a-f]{3,8})"/gi)].map((m) => m[1])
  if (colors.length === 0) return icon
  if (!colors.every((hex) => luminanceOf(hex) < 70)) return icon
  return {
    ...icon,
    body: icon.body.replace(/\s(?:fill|stroke)="#[0-9a-f]{3,8}"/gi, ''),
    mono: true,
    hex: colors[0],
  }
}

/* -------------------------------------------------------------------------- */

function indexSimpleIcons(module) {
  const map = new Map()
  for (const key of Object.keys(module)) {
    const icon = module[key]
    if (icon?.slug && icon.path) map.set(icon.slug, icon)
  }
  return map
}

const siLatest = indexSimpleIcons(simpleIcons)
const siV11 = indexSimpleIcons(simpleIconsV11)

const lobeFiles = existsSync(LOBE_DIR) ? new Set(await readdir(LOBE_DIR)) : new Set()

/** Strips the wrapper so only drawable children remain. */
function innerSvg(markup) {
  const opened = markup.replace(/^[\s\S]*?<svg[^>]*>/i, '')
  const body = opened.replace(/<\/svg>\s*$/i, '')
  return body
    .replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function viewBoxOf(markup) {
  return /viewBox="([^"]+)"/i.exec(markup)?.[1] ?? '0 0 24 24'
}

async function fromLobe(name) {
  // Prefer the full-colour variant: a real brand mark beats a silhouette.
  for (const candidate of [`${name}-color.svg`, `${name}.svg`]) {
    if (!lobeFiles.has(candidate)) continue
    const markup = await readFile(resolve(LOBE_DIR, candidate), 'utf8')
    const body = innerSvg(markup)
    if (!body) continue
    const mono = candidate.endsWith('-color.svg')
      ? false
      : /currentColor/i.test(markup) || !/fill="#/i.test(markup)
    return { vb: viewBoxOf(markup), body, mono, hex: NEUTRAL, source: 'lobehub' }
  }
  return null
}

/**
 * Widest an icon may be relative to its height before it is treated as a
 * wordmark rather than a mark.
 *
 * The Iconify "logos" set carries both: `braze` is the full lockup at 512x237,
 * while `braze-icon` is the square glyph. Squeezing a lockup into a 28px square
 * renders an illegible smear, which is worse than an honest monogram — so
 * anything this wide is rejected and the next source is tried.
 */
const MAX_ASPECT = 1.6

/**
 * Iconify sets store artwork with per-icon dimensions, so the viewBox has to be
 * reconstructed rather than assumed to be 24x24.
 */
function fromIconify(set, name, source) {
  const icon = set.icons?.[name]
  if (!icon?.body) return null

  const width = icon.width ?? set.width ?? 24
  const height = icon.height ?? set.height ?? 24
  if (width / height > MAX_ASPECT || height / width > MAX_ASPECT) return null

  const left = icon.left ?? 0
  const top = icon.top ?? 0
  return {
    vb: `${left} ${top} ${width} ${height}`,
    body: icon.body.replace(/\s+/g, ' ').trim(),
    // These are brand artwork in their real colours; recolouring would be wrong.
    mono: !/(fill|stroke)="(?!none|currentColor)/i.test(icon.body),
    hex: NEUTRAL,
    source,
  }
}

function fromSimpleIcons(map, slug, source) {
  const icon = map.get(slug)
  if (!icon) return null
  return {
    vb: '0 0 24 24',
    body: `<path d="${icon.path}"/>`,
    mono: true,
    hex: `#${icon.hex}`,
    source,
  }
}

async function resolveIcon(slug) {
  const icon = await findIcon(slug)
  return icon ? flattenIfAllDark(icon) : null
}

async function findIcon(slug) {
  const candidates = [slug, ...(ALIASES[slug] ?? [])]
  for (const name of candidates) {
    const latest = fromSimpleIcons(siLatest, name, 'simple-icons')
    if (latest) return latest
  }
  for (const name of candidates) {
    const legacy = fromSimpleIcons(siV11, name, 'simple-icons-v11')
    if (legacy) return legacy
  }
  for (const name of candidates) {
    const lobe = await fromLobe(name)
    if (lobe) return lobe
  }
  // `-icon` first: that is Iconify's name for the square mark, where the bare
  // name is usually the full wordmark lockup.
  for (const name of candidates) {
    for (const variant of [`${name}-icon`, name]) {
      const logos = fromIconify(iconifyLogos, variant, 'iconify-logos')
      if (logos) return logos
    }
  }
  for (const name of candidates) {
    // Self-hosted app icons: real product marks for a handful of tools the
    // brand-icon sets never picked up.
    for (const variant of [`${name}-icon`, name]) {
      const selfhst = fromIconify(iconifySelfhst, variant, 'iconify-selfhst')
      if (selfhst) return selfhst
    }
  }
  return null
}

/* -------------------------------------------------------------------------- */

const dir = resolve(root, 'src/fingerprints')
const slugs = new Set()
for (const file of await readdir(dir)) {
  if (!file.endsWith('.ts')) continue
  const source = await readFile(resolve(dir, file), 'utf8')
  for (const match of source.matchAll(/^\s+icon: '([^']+)'/gm)) slugs.add(match[1])
}

const sorted = [...slugs].sort()
const entries = []
const counts = {
  'simple-icons': 0,
  'simple-icons-v11': 0,
  lobehub: 0,
  'iconify-logos': 0,
  'iconify-selfhst': 0,
  monogram: 0,
}
const monograms = []

for (const slug of sorted) {
  const icon = await resolveIcon(slug)
  if (icon) {
    counts[icon.source] += 1
    const body = icon.body.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
    entries.push(
      `  '${slug}': { vb: '${icon.vb}', mono: ${icon.mono}, hex: '${icon.hex}', body: '${body}' },`,
    )
  } else {
    counts.monogram += 1
    monograms.push(slug)
    entries.push(`  '${slug}': { hex: '${BRAND_COLORS[slug] ?? NEUTRAL}' },`)
  }
}

const output = `// Generated by scripts/make-icons-map.mjs — do not edit by hand.
// Regenerate with \`npm run icons:map\` (runs automatically on build).
//
// Sources: simple-icons (CC0), simple-icons v11 (CC0, for brands since removed
// at their trademark holders' request), @lobehub/icons-static-svg (MIT).
// Entries with no \`body\` have no freely licensed mark available and render as
// a brand-coloured monogram.

export interface IconEntry {
  /** Brand colour: the logo fill for monochrome marks, or the monogram ground. */
  hex: string
  /** viewBox of the source artwork. */
  vb?: string
  /** Inner SVG markup, bundled at build time. Absent when no logo exists. */
  body?: string
  /** True when the mark is a single-colour silhouette that may be recoloured. */
  mono?: boolean
}

export const ICONS: Record<string, IconEntry> = {
${entries.join('\n')}
}
`

await writeFile(resolve(root, 'src/assets/icons.generated.ts'), output)

const withLogos = sorted.length - counts.monogram
console.log(
  `icons.generated.ts — ${sorted.length} slugs, ${withLogos} with real logos ` +
    `(${Math.round((withLogos / sorted.length) * 100)}%)`,
)
console.log(
  `  simple-icons ${counts['simple-icons']} · v11 ${counts['simple-icons-v11']} · ` +
    `lobehub ${counts.lobehub} · iconify-logos ${counts['iconify-logos']} · ` +
    `selfhst ${counts['iconify-selfhst']} · monogram ${counts.monogram}`,
)
if (monograms.length) console.log(`  monograms: ${monograms.join(' ')}`)
