import { useCallback, useEffect, useState } from 'react'
import { groupDetections } from '@/lib/grouping'
import { sendMessage, type PanelState } from '@/messages'
import { CategoryGroup } from './CategoryGroup'
import { EmptyState } from './EmptyState'
import { Footer } from './Footer'
import { Header } from './Header'
import { MoreSection } from './MoreSection'
import { Skeleton } from './Skeleton'

/** Centred one-line message for the states that have nothing to render. */
function Notice({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-10 text-center">
      <p className="text-[13px] font-medium text-ink dark:text-ink-dark">{title}</p>
      <p className="mt-1.5 text-[12px] leading-relaxed text-muted dark:text-muted-dark">{body}</p>
      {action}
    </div>
  )
}

export function App() {
  const [state, setState] = useState<PanelState | null>(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const response = await sendMessage({ type: 'GET_PANEL_STATE' })
    if ('state' in response && response.ok) setState(response.state)
    else if (!response.ok) setError(response.error)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function runDeepScan() {
    setScanning(true)
    const response = await sendMessage({ type: 'RUN_DEEP_SCAN' })
    if ('state' in response && response.ok) setState(response.state)
    setScanning(false)
  }

  async function enableHost() {
    if (!state) return
    const response = await sendMessage({
      type: 'SET_HOST_ENABLED',
      hostname: state.hostname,
      enabled: true,
    })
    if ('state' in response && response.ok) setState(response.state)
  }

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
    return (
      <Shell>
        <Header hostname={state.hostname} url={state.url} count={null} />
        <Notice
          title={state.settings.enabled ? 'Scanning is off for this site' : 'Scanning is off'}
          body={
            state.settings.enabled
              ? 'Nothing is being collected here.'
              : 'StackLens is switched off in settings.'
          }
          action={
            state.settings.enabled ? (
              <button
                type="button"
                onClick={() => void enableHost()}
                className="mt-4 rounded-btn border border-line px-3 py-1.5 text-[12px] font-medium text-ink transition-colors hover:bg-card dark:border-line-dark dark:text-ink-dark dark:hover:bg-card-dark"
              >
                Turn on for {state.hostname}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void chrome.runtime.openOptionsPage()}
                className="mt-4 rounded-btn border border-line px-3 py-1.5 text-[12px] font-medium text-ink transition-colors hover:bg-card dark:border-line-dark dark:text-ink-dark dark:hover:bg-card-dark"
              >
                Open settings
              </button>
            )
          }
        />
      </Shell>
    )
  }

  const grouped = groupDetections(state.detections)
  const openCount = grouped.open.reduce((n, group) => n + group.detections.length, 0)

  return (
    <Shell>
      <Header hostname={state.hostname} url={state.url} count={grouped.total} />

      {grouped.total === 0 ? (
        <EmptyState
          found={0}
          onDeepScan={() => void runDeepScan()}
          deepScanned={state.deepScanned}
          scanning={scanning}
        />
      ) : (
        <div className="flex-1 overflow-y-auto px-4 pt-4">
          {grouped.open.map((group, i) => (
            <CategoryGroup
              key={group.category.id}
              group={group}
              startIndex={grouped.open
                .slice(0, i)
                .reduce((n, g) => n + g.detections.length, 0)}
            />
          ))}
          <MoreSection
            groups={grouped.collapsed}
            count={grouped.collapsedCount}
            startIndex={openCount}
          />
        </div>
      )}

      <Footer
        hostname={state.hostname}
        detections={state.detections}
        deepScanned={state.deepScanned}
        scanning={scanning}
        onDeepScan={() => void runDeepScan()}
      />
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[600px] w-[400px] flex-col bg-bg text-ink dark:bg-bg-dark dark:text-ink-dark">
      {children}
    </div>
  )
}
