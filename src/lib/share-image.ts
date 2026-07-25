import { ICONS } from '@/assets/icons.generated'
import type { Detection } from '@/types'

/**
 * Renders a detected stack as a shareable 1200x630 card.
 *
 * Drawn from the same bundled icon paths the panel uses, so it needs no network
 * access and cannot differ from what the user just looked at. `Path2D` takes
 * the Simple Icons path data directly; the 24x24 viewBox is scaled up with a
 * transform rather than by rewriting the path.
 */

const WIDTH = 1200
const HEIGHT = 630
const LOGO_SIZE = 72
const COLUMNS = 6
const GAP = 40

/** Fits the grid; beyond this the logos would be too small to recognise. */
const MAX_LOGOS = 18

function initials(name: string): string {
  const words = name.replace(/[^A-Za-z0-9 ]/g, ' ').trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) return `${words[0]![0]}${words[1]![0]}`.toUpperCase()
  return (words[0]?.slice(0, 2) ?? '?').toUpperCase()
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function luminanceOf(hex: string): number {
  const value = hex.replace('#', '')
  return (
    (parseInt(value.slice(0, 2), 16) * 299 +
      parseInt(value.slice(2, 4), 16) * 587 +
      parseInt(value.slice(4, 6), 16) * 114) /
    1000
  )
}

/**
 * Rasterizes a bundled logo.
 *
 * Icons now come from several sources and can be multi-path, full-colour
 * artwork on their own viewBox, so `Path2D` is no longer sufficient. Wrapping
 * the stored markup in an SVG data URL lets the browser draw it exactly as the
 * panel does, and keeps this renderer honest about what the user just saw.
 */
function logoImage(detection: Detection): Promise<HTMLImageElement | null> {
  const entry = ICONS[detection.icon]
  if (!entry?.body) return Promise.resolve(null)

  // Monochrome marks that would vanish against the dark card are lifted to the
  // text colour; brand artwork keeps its own colours.
  const fill = entry.mono
    ? luminanceOf(entry.hex) < 60
      ? '#F2F2F5'
      : entry.hex
    : undefined

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${entry.vb ?? '0 0 24 24'}" ` +
    `width="${LOGO_SIZE}" height="${LOGO_SIZE}"${fill ? ` fill="${fill}"` : ''}>` +
    `${entry.body}</svg>`

  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  })
}

function drawMonogram(
  ctx: CanvasRenderingContext2D,
  detection: Detection,
  x: number,
  y: number,
): void {
  const hex = ICONS[detection.icon]?.hex ?? '#6B6B76'
  ctx.save()
  // Mirrors the panel's tinted treatment rather than a solid block.
  ctx.globalAlpha = 0.26
  ctx.fillStyle = hex
  roundedRect(ctx, x, y, LOGO_SIZE, LOGO_SIZE, 16)
  ctx.fill()
  ctx.globalAlpha = 1
  ctx.fillStyle = luminanceOf(hex) < 70 ? '#B9B9C4' : hex
  ctx.font = `600 ${Math.round(LOGO_SIZE * 0.42)}px ui-sans-serif, system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(initials(detection.name), x + LOGO_SIZE / 2, y + LOGO_SIZE / 2 + 1)
  ctx.restore()
}

export async function renderShareCard(
  hostname: string,
  detections: Detection[],
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  ctx.fillStyle = '#0B0B0F'
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  ctx.fillStyle = '#F2F2F5'
  ctx.font = '600 52px ui-sans-serif, system-ui, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(hostname, 72, 118)

  ctx.fillStyle = '#8B8B96'
  ctx.font = '400 26px ui-sans-serif, system-ui, sans-serif'
  ctx.fillText(
    `${detections.length} ${detections.length === 1 ? 'technology' : 'technologies'}`,
    72,
    160,
  )

  const shown = detections.slice(0, MAX_LOGOS)
  const startY = 230
  // Decoded in parallel so one slow logo does not serialize the whole card.
  const images = await Promise.all(shown.map((detection) => logoImage(detection)))

  shown.forEach((detection, i) => {
    const x = 72 + (i % COLUMNS) * (LOGO_SIZE + GAP)
    const y = startY + Math.floor(i / COLUMNS) * (LOGO_SIZE + GAP)
    const image = images[i]
    if (image) ctx.drawImage(image, x, y, LOGO_SIZE, LOGO_SIZE)
    else drawMonogram(ctx, detection, x, y)
  })

  if (detections.length > MAX_LOGOS) {
    ctx.fillStyle = '#8B8B96'
    ctx.font = '400 22px ui-sans-serif, system-ui, sans-serif'
    ctx.fillText(`+${detections.length - MAX_LOGOS} more`, 72, HEIGHT - 92)
  }

  ctx.fillStyle = '#6B6B76'
  ctx.font = '500 22px ui-sans-serif, system-ui, sans-serif'
  ctx.fillText('Detected with StackLens', 72, HEIGHT - 48)

  return canvas
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}

export async function copyShareCard(hostname: string, detections: Detection[]): Promise<boolean> {
  try {
    const blob = await toBlob(await renderShareCard(hostname, detections))
    if (!blob) return false
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    return true
  } catch {
    return false
  }
}

export async function downloadShareCard(
  hostname: string,
  detections: Detection[],
): Promise<void> {
  const blob = await toBlob(await renderShareCard(hostname, detections))
  if (!blob) return
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${hostname || 'stack'}-stack.png`
  link.click()
  URL.revokeObjectURL(url)
}
