import { useEffect, useState } from 'react'

/**
 * Shared chrome for the full-page views: report, history, technologies, and
 * settings.
 *
 * These are separate pages rather than more panel states because they are
 * different jobs. The panel answers "what is this site" in a glance; a page is
 * where you read, search, compare and export without a 400px box in the way.
 * Giving them one frame is what makes them feel like one product instead of
 * four screens that happen to ship together.
 */

const NAV = [
  { id: 'report', label: 'This site', href: 'report.html' },
  { id: 'history', label: 'History', href: 'history.html' },
  { id: 'technologies', label: 'Technologies', href: 'technologies.html' },
  { id: 'options', label: 'Settings', href: 'options.html' },
] as const

export type PageId = (typeof NAV)[number]['id']

function Logo() {
  return (
    <svg viewBox="0 0 128 128" width="22" height="22" aria-hidden="true" className="shrink-0">
      <defs>
        <linearGradient id="sl-nav" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7C6BFF" />
          <stop offset="1" stopColor="#4327D6" />
        </linearGradient>
      </defs>
      <rect width="128" height="128" rx="30" fill="url(#sl-nav)" />
      <path d="M64 20 L104 42 L64 64 L24 42 Z" fill="#fff" />
      <path d="M24 60 L64 82 L104 60 L104 73 L64 95 L24 73 Z" fill="#fff" opacity=".76" />
      <path d="M24 82 L64 104 L104 82 L104 95 L64 117 L24 95 Z" fill="#fff" opacity=".46" />
    </svg>
  )
}

export function Page({
  current,
  title,
  subtitle,
  actions,
  children,
}: {
  current: PageId
  title: string
  subtitle?: string
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-bg text-ink dark:bg-bg-dark dark:text-ink-dark">
      <nav className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur dark:border-line-dark dark:bg-bg-dark/85">
        <div className="mx-auto flex max-w-4xl items-center gap-6 px-6 py-3">
          <a href="report.html" className="flex items-center gap-2 no-underline">
            <Logo />
            <span className="text-[14px] font-semibold tracking-[-0.01em] text-ink dark:text-ink-dark">
              StackLens
            </span>
          </a>
          <div className="flex items-center gap-1">
            {NAV.map((item) => (
              <a
                key={item.id}
                href={item.href}
                aria-current={item.id === current ? 'page' : undefined}
                className={`rounded-btn px-2.5 py-1.5 text-[13px] no-underline transition-colors ${
                  item.id === current
                    ? 'bg-card font-medium text-ink dark:bg-card-dark dark:text-ink-dark'
                    : 'text-muted hover:text-ink dark:text-muted-dark dark:hover:text-ink-dark'
                }`}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-[22px] font-semibold tracking-[-0.02em]">{title}</h1>
            {subtitle && (
              <p className="mt-1 text-[13px] text-muted dark:text-muted-dark">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
        {children}
      </main>
    </div>
  )
}

export function Button({
  onClick,
  children,
  variant = 'secondary',
  disabled,
}: {
  onClick: () => void
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
}) {
  const styles = {
    primary:
      'bg-ink text-bg hover:opacity-90 dark:bg-ink-dark dark:text-bg-dark border-transparent',
    secondary:
      'border-line text-ink hover:bg-card dark:border-line-dark dark:text-ink-dark dark:hover:bg-card-dark',
    danger:
      'border-line text-[#C0392B] hover:bg-[#C0392B]/8 dark:border-line-dark dark:text-[#FF6B5E] dark:hover:bg-[#FF6B5E]/10',
  }[variant]

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-btn border px-3 py-1.5 text-[13px] font-medium transition-colors disabled:opacity-40 ${styles}`}
    >
      {children}
    </button>
  )
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <div className="relative">
      <svg
        viewBox="0 0 16 16"
        width="14"
        height="14"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted dark:text-muted-dark"
      >
        <circle cx="7" cy="7" r="4.6" />
        <path d="M10.4 10.4 14 14" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-8 w-full min-w-[220px] rounded-btn border border-line bg-card pl-8 pr-3 text-[13px] text-ink placeholder:text-muted focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/15 dark:border-line-dark dark:bg-card-dark dark:text-ink-dark dark:placeholder:text-muted-dark dark:focus:border-accent-dark/40 dark:focus:ring-accent-dark/20 [&::-webkit-search-cancel-button]:hidden"
      />
    </div>
  )
}

export function EmptyPanel({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-card border border-line px-6 py-16 text-center dark:border-line-dark">
      <p className="text-[14px] font-medium">{title}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted dark:text-muted-dark">
        {body}
      </p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}

/** Brief confirmation for actions with no other visible result. */
export function useToast(): [string | null, (message: string) => void] {
  const [toast, setToast] = useState<string | null>(null)
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 1800)
    return () => clearTimeout(timer)
  }, [toast])
  return [toast, setToast]
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-btn bg-ink px-3 py-2 text-[12px] text-bg dark:bg-ink-dark dark:text-bg-dark"
    >
      {message}
    </div>
  )
}
