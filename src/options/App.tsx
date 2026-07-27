import { useEffect, useState } from 'react'
import type { Settings } from '@/background/settings'
import { sendMessage } from '@/messages'
import { Button, Page, Toast, useToast } from '@/ui/Page'

/** The frame's one section style, shared with TechList and the report page. */
function SectionHeading({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <h2
      className={`mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted dark:text-muted-dark ${className}`}
    >
      {children}
    </h2>
  )
}

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
        <p className="text-lg font-medium">{title}</p>
        <p className="mt-0.5 text-base leading-relaxed text-muted dark:text-muted-dark">{body}</p>
      </div>
      <div className="shrink-0 pt-0.5">{children}</div>
    </div>
  )
}

function Switch({
  checked,
  onChange,
  label,
  pending = false,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  /** Settings have not loaded: show neither state rather than guessing one. */
  pending?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={pending ? 'false' : checked}
      aria-busy={pending || undefined}
      aria-label={label}
      disabled={pending}
      onClick={() => onChange(!checked)}
      className={`relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg dark:focus-visible:ring-accent-dark dark:focus-visible:ring-offset-bg-dark ${
        pending
          ? 'bg-line opacity-50 dark:bg-line-dark'
          : checked
            ? 'bg-accent dark:bg-accent-dark'
            : 'bg-line dark:bg-line-dark'
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
      <SectionHeading>Scanning</SectionHeading>
      <section className="rounded-card border border-line px-4 dark:border-line-dark">
        <Row
          title="Scan sites automatically"
          body="When off, StackLens collects nothing anywhere and the toolbar badge stays empty."
        >
          <Switch
            checked={settings?.enabled ?? false}
            pending={settings === null}
            onChange={(value) => void setEnabled(value)}
            label="Scan sites automatically"
          />
        </Row>
        <Row
          title="Remember scanned sites"
          body="Keeps a list of what each site was built with, on this device only. Turning it off clears everything already stored."
        >
          <Switch
            checked={settings?.historyEnabled ?? false}
            pending={settings === null}
            onChange={(value) => void setHistoryEnabled(value)}
            label="Remember scanned sites"
          />
        </Row>
      </section>

      <SectionHeading className="mt-7">Sites turned off</SectionHeading>
      <section className="rounded-card border border-line px-4 py-4 dark:border-line-dark">
        {settings?.disabledHosts.length ? (
          <ul className="mt-3 divide-y divide-line dark:divide-line-dark">
            {settings.disabledHosts.map((hostname) => (
              <li key={hostname} className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                <span className="truncate text-base">{hostname}</span>
                <Button onClick={() => void reenable(hostname)}>Turn back on</Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-base text-muted dark:text-muted-dark">
            {settings === null
              ? 'Loading\u2026'
              : "None. You can turn StackLens off for a site from the panel's menu."}
          </p>
        )}
      </section>

      {/*
        Three lines, not three paragraphs. This was the longest block of prose in
        the product, and a privacy statement nobody finishes reading protects
        nobody — the specifics that matter are the ones a reader can take in at a
        glance. The full policy is one click away for anyone who wants it.
      */}
      <SectionHeading className="mt-7">Your data</SectionHeading>
      <section className="rounded-card border border-line px-4 py-4 dark:border-line-dark">
        <ul className=" space-y-1.5 text-base leading-relaxed text-muted dark:text-muted-dark">
          {[
            'No account, no server, no analytics. Nothing about the sites you visit is transmitted anywhere.',
            'Detections last only for the browsing session. History, when on, is local and clearable.',
            'Cookie and storage names are read to identify services — their values never are.',
            'Deep scan is the one thing that uses the network, only when you press it: it downloads scripts the page already loaded and reads them as text.',
          ].map((line) => (
            <li key={line} className="flex gap-2">
              <span aria-hidden="true" className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-muted/50 dark:bg-muted-dark/50" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
        {/*
          An in-extension page, not a link off to a repository. This pointed at
          a file in a private GitHub repo — a 404 for every user who clicked it,
          on the one page where trust is the entire point.
        */}
        <a
          href="privacy.html"
          className="mt-3 inline-block text-base text-accent no-underline hover:underline dark:text-accent-dark"
        >
          Full privacy policy
        </a>
      </section>

      <Toast message={toast} />
    </Page>
  )
}
