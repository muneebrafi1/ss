import { POLICY, type Block, type Span } from './policy.generated'

/**
 * The privacy policy, shipped inside the extension.
 *
 * It used to be a link to a file in a private GitHub repository — a 404 for
 * every user who clicked it, on the one page where trust is the entire point.
 * Hosting it would fix the link and still leave it unreadable offline, and
 * still leave two copies to drift. The text is compiled from
 * `store/privacy-policy.md` at build time, so the page, the repository and the
 * document submitted to the store cannot disagree.
 */

function Spans({ spans }: { spans: Span[] }) {
  return (
    <>
      {spans.map((span, i) =>
        span.t === 'strong' ? (
          <strong key={i} className="font-semibold text-ink dark:text-ink-dark">
            {span.v}
          </strong>
        ) : span.t === 'code' ? (
          <code
            key={i}
            className="rounded-[4px] bg-card px-1 py-0.5 font-mono text-sm text-ink dark:bg-card-dark dark:text-ink-dark"
          >
            {span.v}
          </code>
        ) : (
          <span key={i}>{span.v}</span>
        ),
      )}
    </>
  )
}

function Rendered({ block }: { block: Block }) {
  switch (block.kind) {
    case 'h1':
      return (
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink dark:text-ink-dark">
          <Spans spans={block.spans} />
        </h1>
      )
    case 'h2':
      return (
        <h2 className="mt-9 text-lg font-medium text-ink dark:text-ink-dark">
          <Spans spans={block.spans} />
        </h2>
      )
    case 'h3':
      return (
        <h3 className="mt-6 text-base font-medium text-ink dark:text-ink-dark">
          <Spans spans={block.spans} />
        </h3>
      )
    case 'meta':
      return (
        <p className="mt-1 text-sm text-muted dark:text-muted-dark">
          <Spans spans={block.spans} />
        </p>
      )
    case 'ul':
      return (
        <ul className="mt-3 space-y-2">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-2.5 text-base leading-relaxed text-muted dark:text-muted-dark">
              <span
                aria-hidden="true"
                className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-muted dark:bg-muted-dark"
              />
              <span>
                <Spans spans={item} />
              </span>
            </li>
          ))}
        </ul>
      )
    default:
      return (
        <p className="mt-3 text-base leading-relaxed text-muted dark:text-muted-dark">
          <Spans spans={block.spans} />
        </p>
      )
  }
}

export function PrivacyApp() {
  return (
    <div className="min-h-screen bg-bg text-ink dark:bg-bg-dark dark:text-ink-dark">
      <main className="mx-auto max-w-2xl px-6 py-14">
        {POLICY.map((block, i) => (
          <Rendered key={i} block={block} />
        ))}

        <p className="mt-12 border-t border-line pt-5 text-sm text-muted dark:border-line-dark dark:text-muted-dark">
          This page ships inside the extension. It needs no network connection and
          is the same text submitted to the Chrome Web Store.
        </p>
      </main>
    </div>
  )
}
