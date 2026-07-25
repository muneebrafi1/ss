import type { Evidence, VersionMatcher } from '@/types'

/** Longest plausible version or model string; anything longer is a bad match. */
const MAX_VERSION_LENGTH = 32

/**
 * Rejects captures that are clearly not a version or model name.
 *
 * Regexes over minified bundles pick up junk surprisingly often, and a wrong
 * version shown with full confidence costs more trust than showing none — so
 * anything doubtful is discarded rather than displayed.
 */
function sanitize(raw: string | undefined): string | null {
  if (!raw) return null
  const value = raw.trim()
  if (value.length === 0 || value.length > MAX_VERSION_LENGTH) return null
  // Must start alphanumeric and contain no whitespace or quoting artifacts.
  if (!/^[A-Za-z0-9]/.test(value)) return null
  if (/[\s'"`<>{}()]/.test(value)) return null
  return value
}

/** First capture group of the first match across a list of haystacks. */
function firstCapture(haystacks: string[], pattern: RegExp): string | null {
  for (const hay of haystacks) {
    const m = pattern.exec(hay)
    if (m) return sanitize(m[1])
  }
  return null
}

/**
 * Resolves a single version matcher against the evidence, or null.
 *
 * `bundle` matchers require a completed deep scan, matching how `bundle`
 * signals behave.
 */
export function extractOne(matcher: VersionMatcher, evidence: Evidence): string | null {
  switch (matcher.from) {
    case 'bundle':
      if (!evidence.deepScanned) return null
      return firstCapture(evidence.bundles, matcher.pattern)

    case 'script':
      return firstCapture(evidence.scripts, matcher.pattern)

    case 'html':
      return firstCapture([evidence.html], matcher.pattern)

    case 'global': {
      const value = evidence.globalValues[matcher.path]
      if (value === undefined) return null
      return matcher.pattern ? firstCapture([value], matcher.pattern) : sanitize(value)
    }

    case 'meta': {
      const value = evidence.metas[matcher.name.toLowerCase()]
      if (value === undefined) return null
      return matcher.pattern ? firstCapture([value], matcher.pattern) : sanitize(value)
    }

    case 'header': {
      const value = evidence.responseHeaders[matcher.name.toLowerCase()]
      if (value === undefined) return null
      return matcher.pattern ? firstCapture([value], matcher.pattern) : sanitize(value)
    }
  }
}

/** First matcher that yields a usable value, in the order the database lists them. */
export function extractVersion(
  matchers: VersionMatcher[] | undefined,
  evidence: Evidence,
): string | null {
  if (!matchers) return null
  for (const matcher of matchers) {
    const found = extractOne(matcher, evidence)
    if (found) return found
  }
  return null
}
