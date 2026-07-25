import { useEffect, useState } from 'react'
import { sendMessage } from '@/messages'
import type { Settings } from '@/background/settings'

export function OptionsApp() {
  const [settings, setSettings] = useState<Settings | null>(null)

  async function refresh() {
    const response = await sendMessage({ type: 'GET_SETTINGS' })
    if ('settings' in response && response.ok) setSettings(response.settings)
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function setEnabled(enabled: boolean) {
    const response = await sendMessage({ type: 'SET_ENABLED', enabled })
    if ('settings' in response && response.ok) setSettings(response.settings)
  }

  async function reenable(hostname: string) {
    await sendMessage({ type: 'SET_HOST_ENABLED', hostname, enabled: true })
    await refresh()
  }

  return (
    <main className="mx-auto min-h-screen max-w-xl bg-bg px-6 py-12 text-ink dark:bg-bg-dark dark:text-ink-dark">
      <h1 className="text-xl font-semibold">StackLens settings</h1>

      <section className="mt-8">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={settings?.enabled ?? true}
            onChange={(event) => void setEnabled(event.target.checked)}
            className="mt-0.5 h-4 w-4 accent-ink dark:accent-ink-dark"
          />
          <span>
            <span className="block text-[14px] font-medium">Scan sites automatically</span>
            <span className="mt-0.5 block text-[13px] leading-relaxed text-muted dark:text-muted-dark">
              When off, StackLens collects nothing anywhere and the toolbar badge stays empty.
            </span>
          </span>
        </label>
      </section>

      <section className="mt-10">
        <h2 className="text-[14px] font-medium">Sites turned off</h2>
        {settings?.disabledHosts.length ? (
          <ul className="mt-3 divide-y divide-line rounded-card border border-line dark:divide-line-dark dark:border-line-dark">
            {settings.disabledHosts.map((hostname) => (
              <li key={hostname} className="flex items-center justify-between px-3.5 py-2.5">
                <span className="text-[13px]">{hostname}</span>
                <button
                  type="button"
                  onClick={() => void reenable(hostname)}
                  className="rounded-btn px-2 py-1 text-[12px] font-medium text-muted transition-colors hover:bg-card hover:text-ink dark:text-muted-dark dark:hover:bg-card-dark dark:hover:text-ink-dark"
                >
                  Turn back on
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[13px] text-muted dark:text-muted-dark">
            None. You can turn StackLens off for a site from the panel.
          </p>
        )}
      </section>

      <section className="mt-12 border-t border-line pt-6 text-[13px] leading-relaxed text-muted dark:border-line-dark dark:text-muted-dark">
        <h2 className="text-[14px] font-medium text-ink dark:text-ink-dark">Your data</h2>
        <p className="mt-2">
          Everything StackLens reads stays on this device. There is no account, no analytics, and
          no server — nothing about the sites you visit is ever transmitted anywhere. Detection
          results are held only for the current browsing session and are discarded when you close
          the browser.
        </p>
      </section>
    </main>
  )
}
