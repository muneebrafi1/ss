import { iconEntry } from '@/assets/icons.generated'
import { STACKLENS_MARK_BODY, STACKLENS_NAME, stacklensLink } from '@/lib/brand'
import { groupDetections } from '@/lib/grouping'
import { cardLogoFill, luminanceOf } from '@/lib/logo-contrast'
import { countLabel, displayVersion, stackSummary } from '@/lib/summary'
import type { Detection } from '@/types'

/**
 * Renders a detected stack as a shareable card.
 *
 * This image is the only part of StackLens that travels: someone posts it, and
 * the people who see it are people who have never heard of the extension. So it
 * is built to be read by a stranger scrolling past, not to be a faithful dump of
 * the panel. That means three things the panel does not need — a one-line
 * summary of what the site is built on, visible category structure so the logos
 * mean something, and a signature so a viewer who wants it can find it.
 *
 * Everything is drawn from the same bundled artwork the panel uses, so the card
 * needs no network access and cannot differ from what the user just looked at.
 * `Path2D` is not sufficient — icons come from several sources and can be
 * multi-path, full-colour artwork on their own viewBox — so each mark is wrapped
 * in an SVG data URL and rasterized by the browser exactly as the panel does.
 */

export type ShareFormat = 'landscape' | 'square'

export interface ShareInput {
  hostname: string
  /** Full page URL, used only to look up the site's favicon locally. */
  url?: string
  detections: Detection[]
  format?: ShareFormat
}

/**
 * Device scale. The card is laid out in the CSS pixels below and rendered at
 * twice that, because the places these images get posted downscale them and a
 * 1x render arrives visibly soft.
 */
const SCALE = 2

const FONT = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

const INK = '#F2F2F5'
const MUTED = '#8B8B96'
const FAINT = '#6B6B76'
const BACKGROUND = '#0B0B0F'
const HAIRLINE = 'rgba(255,255,255,0.08)'
const TILE_FILL = 'rgba(255,255,255,0.045)'

interface Layout {
  width: number
  height: number
  padX: number
  headerTop: number
  faviconSize: number
  hostFont: number
  summaryFont: number
  headerDividerY: number
  bodyTop: number
  /** Also the y of the footer divider — the body ends where the footer begins. */
  bodyBottom: number
  columns: number
  toolsPerBlock: number
  labelFont: number
  labelHeight: number
  rowHeight: number
  /** Vertical space between two category blocks stacked in one column. */
  blockGap: number
  tile: number
  nameFont: number
  footerBaseline: number
  markSize: number
  footerFont: number
}

/**
 * Both formats are one code path with two constant sets. Forking the drawing
 * code per aspect ratio is how the two quietly stop matching.
 */
const LAYOUT: Record<ShareFormat, Layout> = {
  // 1200x630 — X, LinkedIn, Slack unfurls, Open Graph.
  landscape: {
    width: 1200,
    height: 630,
    padX: 64,
    headerTop: 56,
    faviconSize: 44,
    hostFont: 42,
    summaryFont: 21,
    headerDividerY: 150,
    bodyTop: 176,
    bodyBottom: 552,
    columns: 3,
    toolsPerBlock: 4,
    labelFont: 13,
    labelHeight: 26,
    rowHeight: 48,
    blockGap: 20,
    tile: 40,
    nameFont: 20,
    footerBaseline: 592,
    markSize: 30,
    footerFont: 19,
  },
  // 1080x1080 — Instagram and the LinkedIn feed.
  square: {
    width: 1080,
    height: 1080,
    padX: 64,
    headerTop: 64,
    faviconSize: 48,
    hostFont: 44,
    summaryFont: 22,
    headerDividerY: 180,
    bodyTop: 206,
    bodyBottom: 986,
    columns: 2,
    toolsPerBlock: 5,
    labelFont: 13,
    labelHeight: 26,
    rowHeight: 52,
    blockGap: 22,
    tile: 42,
    nameFont: 21,
    footerBaseline: 1024,
    markSize: 32,
    footerFont: 20,
  },
}

/* -------------------------------------------------------------------------- */
/* Primitives                                                                  */
/* -------------------------------------------------------------------------- */

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

/** `letterSpacing` is well supported in Chrome but absent from some DOM typings. */
function setLetterSpacing(ctx: CanvasRenderingContext2D, value: string): void {
  ;(ctx as unknown as { letterSpacing?: string }).letterSpacing = value
}

/** Clips text to a width with an ellipsis, so a long name never runs off. */
function truncate(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let low = 0
  let high = text.length
  while (low < high) {
    const mid = Math.ceil((low + high) / 2)
    if (ctx.measureText(`${text.slice(0, mid)}…`).width <= maxWidth) low = mid
    else high = mid - 1
  }
  return `${text.slice(0, low)}…`
}

/** Decodes an SVG body into an image, or null if it fails to parse. */
function svgImage(body: string, viewBox: string, size: number, fill?: string): Promise<HTMLImageElement | null> {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" ` +
    `width="${size}" height="${size}"${fill ? ` fill="${fill}"` : ''}>${body}</svg>`

  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  })
}

/**
 * Rasterizes a bundled logo at twice its drawn size, so it stays sharp once the
 * whole card is rendered at 2x.
 */
function logoImage(detection: Detection, size: number): Promise<HTMLImageElement | null> {
  const entry = iconEntry(detection.icon)
  if (!entry?.body) return Promise.resolve(null)

  // Monochrome marks that would vanish against the dark card are lifted to the
  // text colour; brand artwork keeps its own colours.
  const fill = entry.mono ? cardLogoFill(entry.hex) : undefined
  return svgImage(entry.body, entry.vb ?? '0 0 24 24', size * SCALE, fill)
}

/**
 * The site's own favicon, from Chrome's local favicon store.
 *
 * Served from the browser's cache under the extension's own origin, so it costs
 * no network request, leaks nothing about what is being scanned, and does not
 * taint the canvas.
 */
function faviconImage(url: string, size: number): Promise<HTMLImageElement | null> {
  if (!url || typeof chrome === 'undefined' || !chrome.runtime?.getURL) {
    return Promise.resolve(null)
  }
  const endpoint = new URL(chrome.runtime.getURL('/_favicon/'))
  endpoint.searchParams.set('pageUrl', url)
  endpoint.searchParams.set('size', String(size * SCALE))

  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = endpoint.toString()
  })
}

/** The recessed square every logo sits in, which evens out wildly uneven marks. */
function drawTile(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  roundedRect(ctx, x, y, size, size, size * 0.28)
  ctx.fillStyle = TILE_FILL
  ctx.fill()
  ctx.strokeStyle = HAIRLINE
  ctx.lineWidth = 1
  ctx.stroke()
}

/** Fallback mark: initials in the brand's own colour, matching the panel. */
function drawMonogram(
  ctx: CanvasRenderingContext2D,
  text: string,
  hex: string,
  x: number,
  y: number,
  size: number,
): void {
  ctx.save()
  ctx.globalAlpha = 0.3
  ctx.fillStyle = hex
  roundedRect(ctx, x, y, size, size, size * 0.28)
  ctx.fill()
  ctx.globalAlpha = 1
  ctx.fillStyle = luminanceOf(hex) < 70 ? '#B9B9C4' : hex
  ctx.font = `600 ${Math.round(size * 0.4)}px ${FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x + size / 2, y + size / 2 + 1)
  ctx.restore()
}

/* -------------------------------------------------------------------------- */
/* Card                                                                        */
/* -------------------------------------------------------------------------- */

export async function renderShareCard({
  hostname,
  url = '',
  detections,
  format = 'landscape',
}: ShareInput): Promise<HTMLCanvasElement> {
  const L = LAYOUT[format]
  const canvas = document.createElement('canvas')
  canvas.width = L.width * SCALE
  canvas.height = L.height * SCALE
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  ctx.scale(SCALE, SCALE)

  /* Ground ---------------------------------------------------------------- */

  ctx.fillStyle = BACKGROUND
  ctx.fillRect(0, 0, L.width, L.height)

  // A single, very faint falloff from the top-left. Flat black photographs as
  // cheap; this is barely perceptible on its own and reads as depth.
  const glow = ctx.createRadialGradient(
    L.width * 0.18,
    -L.height * 0.1,
    0,
    L.width * 0.18,
    -L.height * 0.1,
    L.width * 0.85,
  )
  glow.addColorStop(0, 'rgba(124,107,255,0.16)')
  glow.addColorStop(1, 'rgba(124,107,255,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, L.width, L.height)

  roundedRect(ctx, 20, 20, L.width - 40, L.height - 40, 26)
  ctx.strokeStyle = 'rgba(255,255,255,0.07)'
  ctx.lineWidth = 1
  ctx.stroke()

  /* Header ---------------------------------------------------------------- */

  const favicon = await faviconImage(url, L.faviconSize)
  const faviconY = L.headerTop
  if (favicon) {
    ctx.save()
    roundedRect(ctx, L.padX, faviconY, L.faviconSize, L.faviconSize, L.faviconSize * 0.28)
    ctx.clip()
    ctx.fillStyle = 'rgba(255,255,255,0.06)'
    ctx.fillRect(L.padX, faviconY, L.faviconSize, L.faviconSize)
    const inset = L.faviconSize * 0.18
    ctx.drawImage(
      favicon,
      L.padX + inset,
      faviconY + inset,
      L.faviconSize - inset * 2,
      L.faviconSize - inset * 2,
    )
    ctx.restore()
  } else {
    drawMonogram(
      ctx,
      (hostname.replace(/^www\./, '')[0] ?? '?').toUpperCase(),
      '#7C6BFF',
      L.padX,
      faviconY,
      L.faviconSize,
    )
  }

  const textX = L.padX + L.faviconSize + 18
  const contentWidth = L.width - L.padX * 2

  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = INK
  ctx.font = `600 ${L.hostFont}px ${FONT}`
  setLetterSpacing(ctx, '-0.02em')
  ctx.fillText(
    truncate(ctx, hostname.replace(/^www\./, '') || 'This site', L.width - textX - L.padX),
    textX,
    faviconY + L.hostFont * 0.78,
  )
  setLetterSpacing(ctx, '0px')

  const summary = stackSummary(detections)
  if (summary) {
    ctx.fillStyle = MUTED
    ctx.font = `400 ${L.summaryFont}px ${FONT}`
    ctx.fillText(truncate(ctx, summary, contentWidth), L.padX, L.headerDividerY - 22)
  }

  ctx.strokeStyle = HAIRLINE
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(L.padX, L.headerDividerY)
  ctx.lineTo(L.width - L.padX, L.headerDividerY)
  ctx.stroke()

  /* Body: category blocks -------------------------------------------------- */

  const { open, collapsed } = groupDetections(detections)
  const columnWidth = contentWidth / L.columns
  const bodyHeight = L.bodyBottom - L.bodyTop

  /*
   * Blocks are packed into whichever column is currently shortest rather than
   * laid into a fixed grid. Category sizes are wildly uneven — Hosting is
   * usually one tool, Analytics four — and a rigid grid sized for the largest
   * leaves most of the card empty, which reads as "this site uses six things"
   * when it uses nineteen. Packing fills the space and shows roughly twice as
   * much of the stack in the same area.
   *
   * Order is strictly by importance, and a category too tall for the space left
   * is trimmed to the rows that do fit rather than abandoned. Dropping it whole
   * would end the layout at the first four-tool category and leave a third of
   * the card blank while six lesser categories that would have fitted go
   * unmentioned.
   */
  const columnHeights = new Array<number>(L.columns).fill(0)
  const placed: { block: (typeof open)[number]; tools: Detection[]; column: number; y: number }[] =
    []

  for (const block of [...open, ...collapsed]) {
    let column = 0
    for (let i = 1; i < L.columns; i++) {
      if ((columnHeights[i] ?? 0) < (columnHeights[column] ?? 0)) column = i
    }
    const top = columnHeights[column] ?? 0

    // The shortest column is the best any block can do, so once a single row no
    // longer fits there, nothing more will fit anywhere.
    const fits = Math.floor((bodyHeight - top - L.labelHeight) / L.rowHeight)
    if (fits < 1) break

    const tools = block.detections.slice(0, Math.min(L.toolsPerBlock, fits))
    placed.push({ block, tools, column, y: top })
    columnHeights[column] = top + L.labelHeight + tools.length * L.rowHeight + L.blockGap
  }

  // Centred on the tallest column so a sparse card sits in the middle of the
  // body rather than in the top corner of an empty half-page.
  const usedHeight = Math.max(0, Math.max(...columnHeights) - L.blockGap)
  const gridTop = L.bodyTop + (bodyHeight - usedHeight) / 2

  const shownTools = placed.flatMap((entry) => entry.tools)
  // Decoded in parallel so one slow logo does not serialize the whole card.
  const images = await Promise.all(shownTools.map((detection) => logoImage(detection, L.tile)))
  const imageFor = new Map(shownTools.map((detection, i) => [detection.id, images[i] ?? null]))

  placed.forEach(({ block, tools, column, y: offset }) => {
    const x = L.padX + column * columnWidth
    const y = gridTop + offset

    ctx.fillStyle = FAINT
    ctx.font = `600 ${L.labelFont}px ${FONT}`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    setLetterSpacing(ctx, '0.09em')
    ctx.fillText(
      truncate(ctx, block.category.name.toUpperCase(), columnWidth - 24),
      x,
      y + L.labelFont,
    )
    setLetterSpacing(ctx, '0px')

    tools.forEach((detection, i) => {
      const rowY = y + L.labelHeight + i * L.rowHeight
      const image = imageFor.get(detection.id) ?? null

      if (image) {
        drawTile(ctx, x, rowY, L.tile)
        const inset = L.tile * 0.22
        ctx.drawImage(image, x + inset, rowY + inset, L.tile - inset * 2, L.tile - inset * 2)
      } else {
        drawMonogram(
          ctx,
          initials(detection.name),
          iconEntry(detection.icon)?.hex ?? '#6B6B76',
          x,
          rowY,
          L.tile,
        )
      }

      const nameX = x + L.tile + 14
      const available = columnWidth - L.tile - 14 - 24
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = INK
      ctx.font = `500 ${L.nameFont}px ${FONT}`

      const version = displayVersion(detection.version)
      if (version) {
        const suffixFont = `400 ${L.nameFont - 2}px ${FONT}`
        ctx.font = suffixFont
        const suffixWidth = ctx.measureText(` ${version}`).width
        ctx.font = `500 ${L.nameFont}px ${FONT}`
        const name = truncate(ctx, detection.name, available - suffixWidth)
        ctx.fillText(name, nameX, rowY + L.tile / 2 + 1)
        const nameWidth = ctx.measureText(name).width
        ctx.font = suffixFont
        ctx.fillStyle = FAINT
        ctx.fillText(` ${version}`, nameX + nameWidth, rowY + L.tile / 2 + 1)
      } else {
        ctx.fillText(truncate(ctx, detection.name, available), nameX, rowY + L.tile / 2 + 1)
      }
    })
  })

  /*
   * Anything that did not fit is acknowledged in the panel's own language,
   * tucked under the shortest column. A card that quietly shows nine of
   * nineteen would misrepresent the site.
   */
  const hidden = detections.length - shownTools.length
  let notedInGrid = false
  if (hidden > 0) {
    let shortest = 0
    for (let i = 1; i < L.columns; i++) {
      if ((columnHeights[i] ?? 0) < (columnHeights[shortest] ?? 0)) shortest = i
    }
    const y = gridTop + (columnHeights[shortest] ?? 0) - L.blockGap + L.labelFont + 14
    if (y < L.bodyBottom - 6) {
      ctx.fillStyle = FAINT
      ctx.font = `500 ${L.nameFont - 3}px ${FONT}`
      ctx.textAlign = 'left'
      ctx.textBaseline = 'alphabetic'
      ctx.fillText(`+${hidden} more`, L.padX + shortest * columnWidth, y)
      notedInGrid = true
    }
  }

  /* Footer ----------------------------------------------------------------- */

  ctx.strokeStyle = HAIRLINE
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(L.padX, L.bodyBottom)
  ctx.lineTo(L.width - L.padX, L.bodyBottom)
  ctx.stroke()

  const mark = await svgImage(STACKLENS_MARK_BODY, '0 0 128 128', L.markSize * SCALE)
  const markY = L.footerBaseline - L.markSize * 0.78
  if (mark) {
    ctx.drawImage(mark, L.padX, markY, L.markSize, L.markSize)
  }

  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = INK
  ctx.font = `600 ${L.footerFont}px ${FONT}`
  const brandX = L.padX + L.markSize + 12
  ctx.fillText(STACKLENS_NAME, brandX, L.footerBaseline)
  const brandWidth = ctx.measureText(STACKLENS_NAME).width

  ctx.fillStyle = FAINT
  ctx.font = `400 ${L.footerFont}px ${FONT}`
  ctx.fillText(`  ·  ${stacklensLink()}`, brandX + brandWidth, L.footerBaseline)

  ctx.textAlign = 'right'
  ctx.fillStyle = MUTED
  /*
   * The footer is the fallback when the grid could not say it.
   *
   * The "+N more" note is placed AFTER packing has consumed the body, so its
   * baseline only clears `bodyBottom` when the grid is sparse — meaning it was
   * suppressed on precisely the cards that hide the most. A site with fourteen
   * categories shipped a card showing eighteen tiles with nothing to suggest
   * twenty-seven were missing.
   *
   * Reserving space before packing would mean re-tuning every layout, and the
   * packer is the most load-bearing geometry in this file. The footer already
   * prints the true total, so "18 of 45 technologies" costs a string and gets
   * the honesty either way.
   */
  ctx.fillText(
    notedInGrid || hidden === 0
      ? countLabel(detections.length)
      : `${shownTools.length} of ${countLabel(detections.length)}`,
    L.width - L.padX,
    L.footerBaseline,
  )

  return canvas
}

/* -------------------------------------------------------------------------- */
/* Output                                                                      */
/* -------------------------------------------------------------------------- */

function toBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}

export async function copyShareCard(input: ShareInput): Promise<boolean> {
  try {
    const blob = await toBlob(await renderShareCard(input))
    if (!blob) return false
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    return true
  } catch {
    return false
  }
}

export async function downloadShareCard(input: ShareInput): Promise<void> {
  const blob = await toBlob(await renderShareCard(input))
  if (!blob) return
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const name = (input.hostname || 'stack').replace(/^www\./, '')
  link.href = url
  link.download = `${name}-stack-${input.format ?? 'landscape'}.png`
  link.click()
  URL.revokeObjectURL(url)
}
