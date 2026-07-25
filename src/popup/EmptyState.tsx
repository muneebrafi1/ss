/**
 * Shown when a page yields little or nothing.
 *
 * The wording carries a load the UI otherwise could not: since the panel shows
 * no confidence indicator anywhere, and weak detections are dropped rather than
 * flagged, this is the one place the user is told that "nothing found" means
 * "nothing we could see" and not "this site is simple".
 */
export function EmptyState({
  found,
  onDeepScan,
  deepScanned,
  scanning,
}: {
  found: number
  onDeepScan: () => void
  deepScanned: boolean
  scanning: boolean
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-10 text-center">
      <p className="text-[13px] font-medium text-ink dark:text-ink-dark">
        {found === 0 ? 'Nothing detected here' : `Only ${found} found`}
      </p>
      <p className="mt-1.5 text-[12px] leading-relaxed text-muted dark:text-muted-dark">
        This site may use tools we can&apos;t detect from the browser.
      </p>
      {!deepScanned && (
        <button
          type="button"
          onClick={onDeepScan}
          disabled={scanning}
          className="mt-4 rounded-btn border border-line px-3 py-1.5 text-[12px] font-medium text-ink transition-colors hover:bg-card disabled:opacity-50 dark:border-line-dark dark:text-ink-dark dark:hover:bg-card-dark"
        >
          {scanning ? 'Scanning…' : 'Try a deep scan'}
        </button>
      )}
    </div>
  )
}
