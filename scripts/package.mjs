/**
 * Builds the upload-ready zip for the Chrome Web Store.
 *
 * Zips `dist/` and nothing else, then checks the archive against the things
 * that actually get a submission rejected or delayed — a stale version, a
 * source map, a permission nobody uses, a policy file that was never compiled
 * in. Better to fail here than in a review queue.
 *
 *   npm run package
 */
import { execSync } from 'node:child_process'
import { existsSync, readFileSync, rmSync, statSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const OUT_DIR = 'release'

if (!existsSync('dist/manifest.json')) {
  console.error('dist/ is missing or unbuilt — run `npm run build` first.')
  process.exit(1)
}

const manifest = JSON.parse(readFileSync('dist/manifest.json', 'utf8'))
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))

const problems = []

/* The store's own hard limits. ------------------------------------------- */
if (manifest.name.length > 75) problems.push(`name is ${manifest.name.length} chars, max 75`)
if (manifest.description.length > 132) {
  problems.push(`description is ${manifest.description.length} chars, max 132`)
}
if (!/^\d+(\.\d+){0,3}$/.test(manifest.version)) {
  problems.push(`version "${manifest.version}" is not a valid store version`)
}
if (manifest.version !== pkg.version) {
  problems.push(`manifest version ${manifest.version} != package.json ${pkg.version}`)
}
for (const size of ['16', '32', '48', '128']) {
  if (!existsSync(resolve('dist', manifest.icons?.[size] ?? ''))) {
    problems.push(`missing ${size}px icon`)
  }
}

/* Things that should never be inside the archive. ------------------------- */
const stray = execSync(
  'find dist -type f \\( -name "*.map" -o -name "*.ts" -o -name "*.tsx" -o -name ".DS_Store" \\)',
)
  .toString()
  .trim()
if (stray) problems.push(`dev artifacts in dist:\n    ${stray.split('\n').join('\n    ')}`)

/* Every declared permission must be reachable in the shipped code. -------- */
const code = execSync('cat dist/*.js dist/chunks/*.js').toString()
const USES = {
  webRequest: 'webRequest',
  storage: 'storage',
  cookies: 'cookies',
  scripting: 'scripting',
  tabs: 'tabs',
  favicon: '_favicon',
}
for (const permission of manifest.permissions ?? []) {
  /*
   * An unknown permission is itself the failure.
   *
   * The first version skipped anything absent from this map, which meant the
   * likeliest mistake — adding a permission and never using it — slid straight
   * through whenever the permission was one the map had not heard of. Verified
   * by adding `bookmarks` to a built manifest: it packaged without complaint.
   * Now a new permission has to be declared here with the API it implies, which
   * is the moment to ask whether it is really needed.
   */
  const needle = USES[permission]
  if (needle === undefined) {
    problems.push(
      `permission "${permission}" is not in this script's known list — ` +
        'add it with the API string it implies, or remove it from the manifest',
    )
  } else if (!code.includes(needle)) {
    problems.push(`permission "${permission}" is declared but never used — reviewers reject this`)
  }
}

/* The policy has to be in the package, not behind a link. ----------------- */
if (!existsSync('dist/privacy.html')) {
  problems.push('privacy.html is not in the build — the in-product policy link would 404')
}

/* Remote code is the single most common rejection reason. ----------------- */
if (/\beval\s*\(|new\s+Function\s*\(|importScripts\s*\(/.test(code)) {
  problems.push('shipped code contains eval, new Function, or importScripts')
}

if (problems.length > 0) {
  console.error('\nNot ready to package:\n')
  for (const problem of problems) console.error(`  - ${problem}`)
  console.error('')
  process.exit(1)
}

await mkdir(OUT_DIR, { recursive: true })
const zip = resolve(OUT_DIR, `stacklens-${manifest.version}.zip`)
rmSync(zip, { force: true })
// `-X` drops extra file attributes, so the archive is reproducible across machines.
execSync(`cd dist && zip -qrX "${zip}" .`)

const bytes = statSync(zip).size
console.log(`
StackLens ${manifest.version}
  ${zip}
  ${(bytes / 1024 / 1024).toFixed(2)} MB  (store limit 2 GB)

  name          ${manifest.name.length}/75 chars
  description   ${manifest.description.length}/132 chars
  permissions   ${(manifest.permissions ?? []).join(', ')}
  host access   ${(manifest.host_permissions ?? []).join(', ')}
  min Chrome    ${manifest.minimum_chrome_version ?? 'unset'}

Next: store/SUBMISSION.md walks the dashboard fields.
`)
