import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * Last line of defence for every surface.
 *
 * A render error in an extension page produces a blank white rectangle with no
 * explanation and no way out — worse than an error message, because the user
 * cannot tell a crash from a page that found nothing. This turns that into
 * something readable and recoverable.
 */
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { message: string | null }
> {
  state = { message: null as string | null }

  static getDerivedStateFromError(error: unknown) {
    return { message: error instanceof Error ? error.message : 'Unexpected error' }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Local only; nothing is reported anywhere.
    console.error('StackLens render error', error, info.componentStack)
  }

  render() {
    if (this.state.message === null) return this.props.children

    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 bg-bg px-8 py-10 text-center text-ink dark:bg-bg-dark dark:text-ink-dark">
        <p className="text-[13px] font-medium">Something went wrong</p>
        <p className="max-w-xs text-[12px] leading-relaxed text-muted dark:text-muted-dark">
          {this.state.message}
        </p>
        <button
          type="button"
          onClick={() => location.reload()}
          className="rounded-btn border border-line px-3 py-1.5 text-[12px] font-medium transition-colors hover:bg-card dark:border-line-dark dark:hover:bg-card-dark"
        >
          Reload
        </button>
      </div>
    )
  }
}
