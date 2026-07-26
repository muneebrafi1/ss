import { useEffect, useState } from 'react'
import type { Settings } from '@/background/settings'
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
      className={`relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 dark:focus-visible:ring-accent-dark/40 ${
        checked ? 'bg-accent dark:bg-accent-dark' : 'bg-line dark:bg-line-dark'
      }`}
    >
      {/*
        `left-0` is load-bearing. Without it the knob keeps its static position,
        and because a button centres its content that position is the middle of
        the track — so `translate-x-[19px]` pushed a white circle clean off the
        right-hand edge onto a white page. Both switches rendered as featureless
        pills and there was no way to tell on from off. `aria-checked` was
        correct throughout, which is exactly why nothing caught it; the
        end-to-end suite now checks the knob's box against the track's.
      */}
      <span
        className={`absolute left-0 top-[3px] h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
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
    // No subtitle: the database size is a fact about the Technologies page, and
    // that page already states it.
    <Page current="options" title="Settings">
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

      {/* In a card like the switches above it, so the page reads as one thing. */}
      <section className="mt-6 rounded-card border border-line px-4 py-4 dark:border-line-dark">
        <h2 className="text-[14px] font-medium">Sites turned off</h2>
        {settings?.disabledHosts.length ? (
          <ul className="mt-3 divide-y divide-line dark:divide-line-dark">
            {settings.disabledHosts.map((hostname) => (
              <li key={hostname} className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                <span className="truncate text-[13px]">{hostname}</span>
                <Button onClick={() => void reenable(hostname)}>Turn back on</Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-[13px] text-muted dark:text-muted-dark">
            None. You can turn StackLens off for a site from the panel&apos;s menu.
          </p>
        )}
      </section>

      {/*
        Three lines, not three paragraphs. This was the longest block of prose in
        the product, and a privacy statement nobody finishes reading protects
        nobody — the specifics that matter are the ones a reader can take in at a
        glance. The full policy is one click away for anyone who wants it.
      */}
      <section className="mt-6 rounded-card border border-line px-4 py-4 dark:border-line-dark">
        <h2 className="text-[14px] font-medium">Your data</h2>
        <ul className="mt-3 space-y-1.5 text-[13px] leading-relaxed text-muted dark:text-muted-dark">
          {[
            'Nothing leaves this device. No account, no server, no analytics.',
            'Detections last only for the browsing session. History, when on, is local and clearable.',
            'Cookie and storage names are read to identify services — their values never are.',
          ].map((line) => (
            <li key={line} className="flex gap-2">
              <span aria-hidden="true" className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-muted/50 dark:bg-muted-dark/50" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
        <a
          href="https://github.com/muneebrafi1/ss/blob/main/store/privacy-policy.md"
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-[13px] text-accent no-underline hover:underline dark:text-accent-dark"
        >
          Full privacy policy
        </a>
      </section>

      <Toast message={toast} />
    </Page>
  )
}
