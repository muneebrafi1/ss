import { useEffect, useMemo, useState } from 'react'
import type { HistoryEntry } from '@/background/history'
import type { Settings } from '@/background/settings'
import { sendMessage } from '@/messages'
import { ToolLogo } from '@/popup/ToolLogo'
import { Button, EmptyPanel, Page, SearchInput, Toast, useToast } from '@/ui/Page'

/**
 * Locally stored record of what each site was built with.
 *
 * One entry per site, newest first. Searching matches the domain and the
 * technologies, which is what makes this more than a browsing log: "who else
 * uses Clerk" is a question the panel alone cannot answer.
 */

function relativeTime(at: number): string {
  const seconds = Math.round((Date.now() - at) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(at).toLocaleDateString()
}

export function HistoryApp() {
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [query, setQuery] = useState('')
  const [toast, flash] = useToast()

  async function load() {
    const [history, config] = await Promise.all([
      sendMessage({ type: 'GET_HISTORY' }),
      sendMessage({ type: 'GET_SETTINGS' }),
    ])
    if (history.ok && 'history' in history) setEntries(history.history)
    if (config.ok && 'settings' in config) setSettings(config.settings)
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle || !entries) return entries ?? []
    return entries.filter(
      (entry) =>
        entry.hostname.toLowerCase().includes(needle) ||
        entry.technologies.some((tech) => tech.name.toLowerCase().includes(needle)),
    )
  }, [entries, query])

  async function clearAll() {
    const response = await sendMessage({ type: 'CLEAR_HISTORY' })
    if (response.ok && 'history' in response) {
      setEntries(response.history)
      flash('History cleared')
    }
  }

  async function forget(hostname: string) {
    const response = await sendMessage({ type: 'FORGET_SITE', hostname })
    if (response.ok && 'history' in response) setEntries(response.history)
  }

  async function toggleHistory(enabled: boolean) {
    const response = await sendMessage({ type: 'SET_HISTORY_ENABLED', enabled })
    if (response.ok && 'settings' in response) {
      setSettings(response.settings)
      if (!enabled) setEntries([])
    }
  }

  const total = entries?.length ?? 0

  return (
    <Page
      current="history"
      title="History"
      subtitle={
        settings && !settings.historyEnabled
          ? 'History is switched off. Nothing is being recorded.'
          : `${total} ${total === 1 ? 'site' : 'sites'} remembered on this device`
      }
      actions={
        <>
          <SearchInput value={query} onChange={setQuery} placeholder="Search sites and tools" />
          {settings?.historyEnabled ? (
            <Button onClick={() => void toggleHistory(false)}>Turn off</Button>
          ) : (
            <Button onClick={() => void toggleHistory(true)} variant="primary">
              Turn on
            </Button>
          )}
          {total > 0 && (
            <Button onClick={() => void clearAll()} variant="danger">
              Clear all
            </Button>
          )}
        </>
      }
    >
      {entries === null ? (
        <p className="py-10 text-center text-[13px] text-muted dark:text-muted-dark">Loading…</p>
      ) : total === 0 ? (
        <EmptyPanel
          title={settings?.historyEnabled ? 'No sites yet' : 'History is off'}
          body={
            settings?.historyEnabled
              ? 'Visit a website and StackLens will remember what it found, so you can come back to it here.'
              : 'Turn history on to remember what each site you visit is built with. It stays on this device and is never sent anywhere.'
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyPanel title="No match" body={`Nothing in your history matches “${query.trim()}”.`} />
      ) : (
        <ul className="space-y-2">
          {filtered.map((entry) => (
            <li
              key={entry.hostname}
              className="rounded-card border border-line px-4 py-3 dark:border-line-dark"
            >
              <div className="flex items-center gap-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium">
                    {entry.url ? (
                      <a
                        href={entry.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-ink no-underline hover:underline dark:text-ink-dark"
                      >
                        {entry.hostname}
                      </a>
                    ) : (
                      entry.hostname
                    )}
                  </span>
                  <span className="text-[12px] text-muted dark:text-muted-dark">
                    {entry.technologies.length}{' '}
                    {entry.technologies.length === 1 ? 'technology' : 'technologies'} ·{' '}
                    {relativeTime(entry.at)}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => void forget(entry.hostname)}
                  aria-label={`Forget ${entry.hostname}`}
                  className="shrink-0 rounded-btn px-2 py-1 text-[12px] text-muted transition-colors hover:bg-card hover:text-ink dark:text-muted-dark dark:hover:bg-card-dark dark:hover:text-ink-dark"
                >
                  Forget
                </button>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                {entry.technologies.slice(0, 14).map((tech) => (
                  <span
                    key={tech.id}
                    title={tech.version ? `${tech.name} ${tech.version}` : tech.name}
                    className="flex items-center gap-1.5 rounded-btn border border-line px-1.5 py-1 dark:border-line-dark"
                  >
                    <ToolLogo icon={tech.icon} name={tech.name} size={14} />
                    <span className="text-[11px] text-muted dark:text-muted-dark">{tech.name}</span>
                  </span>
                ))}
                {entry.technologies.length > 14 && (
                  <span className="text-[11px] text-muted dark:text-muted-dark">
                    +{entry.technologies.length - 14}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Toast message={toast} />
    </Page>
  )
}
