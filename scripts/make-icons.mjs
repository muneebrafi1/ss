/**
 * Rasterizes icons/icon.svg into the PNG sizes Chrome requires.
 *
 * Chrome does not accept SVG for extension icons, so the PNGs are build
 * artifacts of the single SVG source. Regenerate with `npm run icons` after
 * editing the SVG rather than hand-editing any PNG.
 */
import sharp from 'sharp'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = await readFile(resolve(root, 'icons/icon.svg'))

for (const size of [16, 32, 48, 128]) {
  const out = resolve(root, `icons/icon-${size}.png`)
  await sharp(source, { density: 384 }).resize(size, size).png().toFile(out)
  console.log(`icons/icon-${size}.png`)
}
