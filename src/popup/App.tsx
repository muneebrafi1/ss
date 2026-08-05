import { useCallback, useEffect, useMemo, useState } from 'react'
import { CATEGORY_BY_ID } from '@/fingerprints'
import { groupDetections } from '@/lib/grouping'
import { sendMessage, type PanelState } from '@/messages'
import type { Detection } from '@/types'
import { CategoryGroup } from './CategoryGroup'
import { EmptyState } from './EmptyState'
import { Footer } from './Footer'
import { Header } from './Header'
import { MoreSection } from './MoreSection'
import { SearchField } from './SearchField'
import { Skeleton } from './Skeleton'

/** Below this, scanning the grid is faster than typing into a filter. */
const SEARCH_THRESHOLD = 10

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[600px] w-[400px] flex-col bg-bg text-ink dark:bg-bg-dark dark:text-ink-dark">
      {children}
    </div>
  )
}

/** Centred message for the states that have nothing to render. */
function Notice({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-10 pb-6 text-center">
      <p className="text-base font-medium text-ink dark:text-ink-dark">{title}</p>
      <p className="mt-1.5 max-w-[250px] text-sm leading-relaxed text-muted dark:text-muted-dark">
        {body}
      </p>
      {action}
    </div>
  )
}

function OutlineButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void
  title?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="mt-4 rounded-btn border border-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-card dark:border-line-dark dark:text-ink-dark dark:hover:bg-card-dark"
    >
      {children}
    </button>
  )
}

/** Matches a detection against the filter text, including its category name. */
function matches(detection: Detection, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  const category = CATEGORY_BY_ID.get(detection.category)?.name ?? ''
  return (
    detection.name.toLowerCase().includes(needle) ||
    detection.description.toLowerCase().includes(needle) ||
    category.toLowerCase().includes(needle)
  )
}

export function App() {
  const [state, setState] = useState<PanelState | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanGain, setScanGain] = useState<number | null>(null)
  const [scanFailed, setScanFailed] = useState(false)
  /*
   * Latched here rather than read off `state` on every render.
   *
   * The outcome describes the scan this popup just ran, not the tab. Reading it
   * from `PanelState` meant the very next refresh — and the storage listener
   * fires one within 400ms of any evidence change — replaced it with the `null`
   * that `buildPanelState` always returns, so the honest label appeared and
   * vanished before it could be read.
   */
  const [scanOutcome, setScanOutcome] = useState<PanelState['deepScan']>(null)
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (refresh = false) => {
    const response = await sendMessage({ type: 'GET_PANEL_STATE', refresh })
    if (response.ok && 'state' in response) {
      setState(response.state)
      setError(null)
    } else if (!response.ok) {
      setError(response.error)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  /**
   * Keeps the panel current as late evidence arrives.
   *
   * A page's background requests can still be in flight when the panel opens,
   * and reading once meant a panel opened a second too early showed an
   * incomplete stack with nothing to indicate it. Watching the tab's own record
   * makes the panel fill in as the page settles instead.
   */
  const tabId = state?.tabId ?? null
  useEffect(() => {
    if (tabId === null) return
    const key = `tab:${tabId}`
    let timer: ReturnType<typeof setTimeout> | undefined

    function onChanged(changes: Record<string, chrome.storage.StorageChange>, area: string) {
      if (area !== 'session' || !(key in changes)) return
      // Debounced: a busy page rewrites this record many times a second.
      clearTimeout(timer)
      timer = setTimeout(() => void load(true), 400)
    }

    chrome.storage.onChanged.addListener(onChanged)
    return () => {
      clearTimeout(timer)
      chrome.storage.onChanged.removeListener(onChanged)
    }
  }, [tabId, load])

  async function runDeepScan() {
    if (!state || scanning) return
    setScanning(true)
    setScanFailed(false)
    const before = state.detections.length
    try {
      const response = await sendMessage({ type: 'RUN_DEEP_SCAN' })
      if (response.ok && 'state' in response) {
        setState(response.state)
        setScanGain(response.state.detections.length - before)
        setScanOutcome(response.state.deepScan)
      } else {
        // Without this branch a failure reverted to a state pixel-identical to
        // before the click, so the one control that reaches the network gave no
        // feedback whatsoever when it did not work.
        setScanFailed(true)
      }
    } catch {
      setScanFailed(true)
    } finally {
      // `finally`, because a rejected message used to leave the spinner turning
      // for the life of the popup.
      setScanning(false)
    }
  }

  async function setSiteEnabled(enabled: boolean) {
    if (!state) return
    const response = await sendMessage({
      type: 'SET_HOST_ENABLED',
      hostname: state.hostname,
      enabled,
    })
    if (response.ok && 'state' in response) {
      setState(response.state)
      setQuery('')
    }
  }

  /*
   * Everything below describes a specific page, so it is cleared when the page
   * changes.
   *
   * The panel stays open across a redirect, a meta refresh or a client-side
   * route change to a different host: `tabId` does not change, so the storage
   * listener above refreshes `state` in place and the popup never remounts.
   * Four pieces of state survived that and went on describing the previous
   * page — the panel would render "Nothing here matches 'stripe'" for a site
   * with no search box on screen to clear it and no keyboard route to one, and
   * the footer would assert "Couldn't read scripts" about a page StackLens had
   * never touched.
   */
  const pageKey = state ? `${state.tabId}|${state.hostname}` : null
  useEffect(() => {
    setQuery('')
    setScanGain(null)
    setScanFailed(false)
    setScanOutcome(null)
  }, [pageKey])

  const detections = state?.detections ?? []
  /*
   * A query can only narrow the list while the field that owns it is on screen.
   * Below the threshold there is no way to see or clear the text, so letting it
   * filter would hide cards with nothing to explain why — the reset effect above
   * covers the navigation case, and this makes the state unreachable rather
   * than merely unlikely.
   */
  const canFilter = detections.length >= SEARCH_THRESHOLD
  const filtered = useMemo(
    () => (canFilter ? detections.filter((detection) => matches(detection, query)) : detections),
    [detections, query, canFilter],
  )
  const grouped = useMemo(() => groupDetections(filtered), [filtered])

  if (error) {
    return (
      <Shell>
        {/*
          The header keeps the site it already knows — passing empty strings made
          the panel claim "No site" about a page it could name. And the body is a
          fixed sentence: `error` carries internal strings like "No active tab",
          which are diagnostics, not prose. It is kept as the button's title so
          it is still recoverable when someone needs it.
        */}
        <Header hostname={state?.hostname ?? ''} url={state?.url ?? ''} count={null} />
        <Notice
          title="StackLens couldn't read this page"
          body="This usually clears by itself — the extension may have just been updated or reloaded."
          action={
            <OutlineButton onClick={() => void load(true)} title={error}>
              Try again
            </OutlineButton>
          }
        />
      </Shell>
    )
  }

  if (!state) {
    return (
      <Shell>
        <Header hostname="" url="" count={null} />
        <Skeleton />
      </Shell>
    )
  }

  if (state.status === 'unsupported') {
    return (
      <Shell>
        <Header hostname={state.hostname} url={state.url} count={null} />
        <Notice
          title="Nothing to scan here"
          body="Open a website and StackLens will show what it's built with."
        />
      </Shell>
    )
  }

  if (state.status === 'disabled') {
    const globallyOff = !state.settings.enabled
    return (
      <Shell>
        <Header hostname={state.hostname} url={state.url} count={null} />
        <Notice
          title={globallyOff ? 'Scanning is off' : 'Scanning is off for this site'}
          body={
            globallyOff
              ? 'StackLens is switched off in settings.'
              : 'Nothing is being collected here.'
          }
          action={
            globallyOff ? (
              <OutlineButton onClick={() => void chrome.runtime.openOptionsPage()}>
                Open settings
              </OutlineButton>
            ) : (
              <OutlineButton onClick={() => void setSiteEnabled(true)}>
                Turn on for {state.hostname}
              </OutlineButton>
            )
          }
        />
      </Shell>
    )
  }

  const showSearch = canFilter
  const openCount = grouped.open.reduce((n, group) => n + group.detections.length, 0)
  const searching = canFilter && query.trim().length > 0

  return (
    <Shell>
      <Header
        hostname={state.hostname}
        url={state.url}
        count={detections.length}
        onDisableSite={() => void setSiteEnabled(false)}
      />

      {showSearch && (
        <SearchField value={query} onChange={setQuery} matchCount={filtered.length} />
      )}

      {detections.length === 0 ? (
        <EmptyState
          onDeepScan={() => void runDeepScan()}
          deepScanned={state.deepScanned}
          scanning={scanning}
        />
      ) : filtered.length === 0 ? (
        <Notice title="No match" body={`Nothing here matches “${query.trim()}”.`} />
      ) : (
        <div className="sl-scroll flex-1 overflow-y-auto px-3.5 pt-3.5">
          {/*
            While filtering, the core/collapsed split is dropped and every match
            is shown at once. Hiding a search result behind "12 more tools"
            would defeat the search.
          */}
          {(searching ? [...grouped.open, ...grouped.collapsed] : grouped.open).map(
            (group, i, list) => (
              <CategoryGroup
                key={group.category.id}
                group={group}
                startIndex={list.slice(0, i).reduce((n, g) => n + g.detections.length, 0)}
              />
            ),
          )}

          {!searching && (
            <MoreSection
              groups={grouped.collapsed}
              count={grouped.collapsedCount}
              startIndex={openCount}
            />
          )}
        </div>
      )}

      <Footer
        hostname={state.hostname}
        url={state.url}
        detections={detections}
        deepScanned={state.deepScanned}
        scanning={scanning}
        scanGain={scanGain}
        scanFailed={scanFailed}
        outcome={scanOutcome}
        onDeepScan={() => void runDeepScan()}
      />
    </Shell>
  )
}
