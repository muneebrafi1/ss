/**
 * Panel header: which site is being described, and how much was found.
 *
 * The favicon comes from Chrome's own cached favicon service via the extension
 * origin, so it involves no network request to the site being scanned and
 * nothing is disclosed to a third party.
 */
function faviconUrl(pageUrl: string): string {
  const url = new URL(chrome.runtime.getURL('/_favicon/'))
  url.searchParams.set('pageUrl', pageUrl)
  url.searchParams.set('size', '32')
  return url.toString()
}

export function Header({
  hostname,
  url,
  count,
}: {
  hostname: string
  url: string
  count: number | null
}) {
  return (
    <header className="flex items-center gap-2.5 border-b border-line px-4 py-2.5 dark:border-line-dark">
      {url && (
        <img
          src={faviconUrl(url)}
          alt=""
          width={16}
          height={16}
          className="shrink-0 rounded-[3px]"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-ink dark:text-ink-dark">
          {hostname || 'No site'}
        </p>
      </div>
      {count !== null && (
        <span className="shrink-0 text-[11px] tabular-nums text-muted dark:text-muted-dark">
          {count} {count === 1 ? 'technology' : 'technologies'}
        </span>
      )}
    </header>
  )
}
