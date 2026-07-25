/**
 * Shown when a page yields little or nothing.
 *
 * The wording carries a load the UI otherwise could not: since the panel shows
 * no confidence indicator anywhere, and weak detections are dropped rather than
 * flagged, this is the one place the user is told that "nothing found" means
 * "nothing we could see" and not "this site is simple".
 */
export function EmptyState({
  onDeepScan,
  deepScanned,
  scanning,
}: {
  onDeepScan: () => void
  deepScanned: boolean
  scanning: boolean
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-10 pb-6 text-center">
      <span className="mb-4 grid h-11 w-11 place-items-center rounded-card border border-line text-muted dark:border-line-dark dark:text-muted-dark">
        <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <circle cx="8.6" cy="8.6" r="5.6" />
          <path d="M12.9 12.9 17 17" />
        </svg>
      </span>

      <p className="text-[13px] font-medium text-ink dark:text-ink-dark">Nothing detected here</p>
      <p className="mt-1.5 max-w-[250px] text-[12px] leading-relaxed text-muted dark:text-muted-dark">
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
