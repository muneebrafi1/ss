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

function drawLogo(
  ctx: CanvasRenderingContext2D,
  detection: Detection,
  x: number,
  y: number,
): void {
  const entry = ICONS[detection.icon]

  if (entry?.path) {
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(LOGO_SIZE / 24, LOGO_SIZE / 24)
    ctx.fillStyle = entry.hex
    // Dark marks vanish against the dark card, so lift them to the text colour.
    const value = entry.hex.replace('#', '')
    const luminance =
      (parseInt(value.slice(0, 2), 16) * 299 +
        parseInt(value.slice(2, 4), 16) * 587 +
        parseInt(value.slice(4, 6), 16) * 114) /
      1000
    if (luminance < 60) ctx.fillStyle = '#F2F2F5'
    ctx.fill(new Path2D(entry.path))
    ctx.restore()
    return
  }

  ctx.save()
  ctx.fillStyle = entry?.hex ?? '#6B6B76'
  roundedRect(ctx, x, y, LOGO_SIZE, LOGO_SIZE, 16)
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ctx.font = `600 ${Math.round(LOGO_SIZE * 0.36)}px ui-sans-serif, system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(initials(detection.name), x + LOGO_SIZE / 2, y + LOGO_SIZE / 2 + 1)
  ctx.restore()
}

export function renderShareCard(hostname: string, detections: Detection[]): HTMLCanvasElement {
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
  shown.forEach((detection, i) => {
    const column = i % COLUMNS
    const row = Math.floor(i / COLUMNS)
    drawLogo(ctx, detection, 72 + column * (LOGO_SIZE + GAP), startY + row * (LOGO_SIZE + GAP))
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
    const blob = await toBlob(renderShareCard(hostname, detections))
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
  const blob = await toBlob(renderShareCard(hostname, detections))
  if (!blob) return
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${hostname || 'stack'}-stack.png`
  link.click()
  URL.revokeObjectURL(url)
}
