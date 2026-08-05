/**
 * The one place StackLens describes itself.
 *
 * The share card, the Markdown export and the report footer all sign their
 * output. Keeping the name, the URL and the mark here means publishing the
 * listing changes one line instead of five, and the mark on a card can never
 * drift from the icon in the toolbar.
 */

export const STACKLENS_NAME = 'StackLens'

/**
 * Public URL, shown on the share card so a stranger who sees it can find the
 * extension. Empty until the Chrome Web Store listing is live — set it to the
 * listing URL at publish and every surface picks it up.
 */
export const STACKLENS_URL = ''

/** Shown in place of the URL until there is one. */
export const STACKLENS_CALLOUT = 'Chrome extension'

/** URL or fallback, whichever is available. */
export const stacklensLink = (): string => STACKLENS_URL || STACKLENS_CALLOUT

/**
 * The toolbar mark, inline so it can be rasterized onto a canvas without a
 * fetch. Kept byte-identical to `icons/icon.svg`; `viewBox` is 0 0 128 128.
 */
export const STACKLENS_MARK_BODY =
  '<defs><linearGradient id="sl-bg" x1="0" y1="0" x2="1" y2="1">' +
  '<stop offset="0" stop-color="#7C6BFF"/><stop offset="1" stop-color="#4327D6"/>' +
  '</linearGradient></defs>' +
  '<rect width="128" height="128" rx="30" fill="url(#sl-bg)"/>' +
  '<path d="M64 20 L104 42 L64 64 L24 42 Z" fill="#fff"/>' +
  '<path d="M24 60 L64 82 L104 60 L104 73 L64 95 L24 73 Z" fill="#fff" opacity=".76"/>' +
  '<path d="M24 82 L64 104 L104 82 L104 95 L64 117 L24 95 Z" fill="#fff" opacity=".46"/>'
