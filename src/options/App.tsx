import { useEffect, useState } from 'react'
import type { Settings } from '@/background/settings'
import { DATABASE_FINGERPRINTS, CATEGORIES } from '@/fingerprints'
import { sendMessage } from '@/messages'
import { Button, Page, Toast, useToast } from '@/ui/Page'

function Row({
  title,
  body,
  children,
}: {
  title: string
  body: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-line py-4 last:border-0 dark:border-line-dark">
      <div className="min-w-0">
        <p className="text-[14px] font-medium">{title}</p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-muted dark:text-muted-dark">{body}</p>
      </div>
      <div className="shrink-0 pt-0.5">{children}</div>
    </div>
  )
}

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-[22px] w-[38px] rounded-full transition-colors ${
        checked ? 'bg-accent dark:bg-accent-dark' : 'bg-line dark:bg-line-dark'
      }`}
    >
      <span
        className={`absolute top-[3px] h-4 w-4 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-[19px]' : 'translate-x-[3px]'
        }`}
      />
    </button>
  )
}

export function OptionsApp() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [toast, flash] = useToast()

  async function refresh() {
    const response = await sendMessage({ type: 'GET_SETTINGS' })
    if (response.ok && 'settings' in response) setSettings(response.settings)
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function setEnabled(enabled: boolean) {
    const response = await sendMessage({ type: 'SET_ENABLED', enabled })
    if (response.ok && 'settings' in response) setSettings(response.settings)
  }

  async function setHistoryEnabled(enabled: boolean) {
    const response = await sendMessage({ type: 'SET_HISTORY_ENABLED', enabled })
    if (response.ok && 'settings' in response) {
      setSettings(response.settings)
      flash(enabled ? 'History on' : 'History off and cleared')
    }
  }

  async function reenable(hostname: string) {
    await sendMessage({ type: 'SET_HOST_ENABLED', hostname, enabled: true })
    await refresh()
  }

  return (
    <Page
      current="options"
      title="Settings"
      subtitle={`${DATABASE_FINGERPRINTS.length} technologies across ${CATEGORIES.length} categories`}
    >
      <section className="rounded-card border border-line px-4 dark:border-line-dark">
        <Row
          title="Scan sites automatically"
          body="When off, StackLens collects nothing anywhere and the toolbar badge stays empty."
        >
          <Switch
            checked={settings?.enabled ?? true}
            onChange={(value) => void setEnabled(value)}
            label="Scan sites automatically"
          />
        </Row>
        <Row
          title="Remember scanned sites"
          body="Keeps a list of what each site was built with, on this device only. Turning it off clears everything already stored."
        >
          <Switch
            checked={settings?.historyEnabled ?? true}
            onChange={(value) => void setHistoryEnabled(value)}
            label="Remember scanned sites"
          />
        </Row>
      </section>

      <section className="mt-8">
        <h2 className="mb-2 text-[14px] font-medium">Sites turned off</h2>
        {settings?.disabledHosts.length ? (
          <ul className="divide-y divide-line rounded-card border border-line dark:divide-line-dark dark:border-line-dark">
            {settings.disabledHosts.map((hostname) => (
              <li key={hostname} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-[13px]">{hostname}</span>
                <Button onClick={() => void reenable(hostname)}>Turn back on</Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] text-muted dark:text-muted-dark">
            None. You can turn StackLens off for a site from the panel&apos;s menu.
          </p>
        )}
      </section>

      <section className="mt-10 border-t border-line pt-6 dark:border-line-dark">
        <h2 className="text-[14px] font-medium">Your data</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-muted dark:text-muted-dark">
          Everything StackLens reads stays on this device. There is no account, no analytics, and
          no server — nothing about the sites you visit is ever transmitted anywhere. Detection
          results are held only for the current browsing session; scan history, when enabled, is
          stored locally and can be cleared at any time from the History page.
        </p>
        <p className="mt-3 text-[13px] leading-relaxed text-muted dark:text-muted-dark">
          Cookie and storage <strong className="font-medium text-ink dark:text-ink-dark">names</strong> are
          read to identify services. Their{' '}
          <strong className="font-medium text-ink dark:text-ink-dark">values are never read</strong>.
        </p>
      </section>

      <Toast message={toast} />
    </Page>
  )
}
