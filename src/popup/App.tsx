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
      <p className="text-[13px] font-medium text-ink dark:text-ink-dark">{title}</p>
      <p className="mt-1.5 max-w-[250px] text-[12px] leading-relaxed text-muted dark:text-muted-dark">
        {body}
      </p>
      {action}
    </div>
  )
}

function OutlineButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-4 rounded-btn border border-line px-3 py-1.5 text-[12px] font-medium text-ink transition-colors hover:bg-card dark:border-line-dark dark:text-ink-dark dark:hover:bg-card-dark"
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
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const response = await sendMessage({ type: 'GET_PANEL_STATE' })
    if (response.ok && 'state' in response) setState(response.state)
    else if (!response.ok) setError(response.error)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function runDeepScan() {
    if (!state) return
    setScanning(true)
    const before = state.detections.length
    const response = await sendMessage({ type: 'RUN_DEEP_SCAN' })
    if (response.ok && 'state' in response) {
      setState(response.state)
      setScanGain(response.state.detections.length - before)
    }
    setScanning(false)
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

  const detections = state?.detections ?? []
  const filtered = useMemo(
    () => detections.filter((detection) => matches(detection, query)),
    [detections, query],
  )
  const grouped = useMemo(() => groupDetections(filtered), [filtered])

  if (error) {
    return (
      <Shell>
        <Header hostname="" url="" count={null} />
        <Notice title="Something went wrong" body={error} />
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

  const showSearch = detections.length >= SEARCH_THRESHOLD
  const openCount = grouped.open.reduce((n, group) => n + group.detections.length, 0)
  const searching = query.trim().length > 0

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
        detections={detections}
        deepScanned={state.deepScanned}
        scanning={scanning}
        scanGain={scanGain}
        onDeepScan={() => void runDeepScan()}
      />
    </Shell>
  )
}
