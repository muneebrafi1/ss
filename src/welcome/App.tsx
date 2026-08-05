/**
 * First-run page.
 *
 * The pin step is the reason this page exists. An extension the user never
 * pins is an extension they forget they installed, and that is the single
 * largest cause of an install going unused — so it gets equal billing with
 * explaining what the thing does.
 */

const STEPS = [
  {
    title: 'Pin StackLens',
    body: 'Click the puzzle-piece icon in your toolbar, then the pin next to StackLens. Without it the icon stays hidden in that menu.',
  },
  {
    title: 'Visit any website',
    body: 'StackLens reads what the page loads as it loads, the same information any developer can see in browser dev tools.',
  },
  {
    title: 'Click the icon',
    body: "See the hosting, database, auth, payments, analytics and AI tools behind the site — grouped, with the rest a click away.",
  },
]

/*
 * Background on the full-bleed wrapper, width on the inner column — the split
 * `src/ui/Page.tsx` already uses. Painting the background on the 672px column
 * meant this page, the first screen every dark-mode user sees on install,
 * rendered as a dark band floating in white gutters with a white scrollbar. It
 * went unnoticed because it is the one surface with no screenshot; there are
 * two now.
 */
export function WelcomeApp() {
  return (
    <div className="min-h-screen bg-bg text-ink dark:bg-bg-dark dark:text-ink-dark">
      <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">StackLens is installed</h1>
      <p className="mt-2 text-lg leading-relaxed text-muted dark:text-muted-dark">
        See what any website is built with, in one click.
      </p>

      <ol className="mt-12 space-y-8">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex gap-4">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line text-sm font-semibold text-muted dark:border-line-dark dark:text-muted-dark">
              {i + 1}
            </span>
            <div>
              <h2 className="text-lg font-medium">{step.title}</h2>
              <p className="mt-1 text-base leading-relaxed text-muted dark:text-muted-dark">
                {step.body}
              </p>
            </div>
          </li>
        ))}
      </ol>

      {/*
        No "try it on this site" button here. It sent a brand-new user off to a
        third party's homepage, which is both a strange first act for a tool
        that has just been installed and indistinguishable from a placement.
        Any site works; saying so is enough.
      */}
      <div className="mt-12 rounded-card border border-line px-4 py-3 dark:border-line-dark">
        <p className="text-base text-muted dark:text-muted-dark">
          Open any website in a new tab and click the StackLens icon — or press{' '}
          <kbd className="rounded-[4px] border border-line px-1.5 py-0.5 font-sans text-sm text-ink dark:border-line-dark dark:text-ink-dark">
            Alt
          </kbd>{' '}
          <kbd className="rounded-[4px] border border-line px-1.5 py-0.5 font-sans text-sm text-ink dark:border-line-dark dark:text-ink-dark">
            Shift
          </kbd>{' '}
          <kbd className="rounded-[4px] border border-line px-1.5 py-0.5 font-sans text-sm text-ink dark:border-line-dark dark:text-ink-dark">
            S
          </kbd>
          .
        </p>
      </div>

      <section className="mt-16 border-t border-line pt-6 dark:border-line-dark">
        <h2 className="text-lg font-medium">A note on what it can and can&apos;t see</h2>
        <p className="mt-2 text-base leading-relaxed text-muted dark:text-muted-dark">
          Hosting, payments, auth, analytics and support tools have to run in your browser to work,
          so they are detected reliably. AI models usually do not — when a site asks GPT or Claude
          something, that happens between their servers and the model provider, where the browser
          cannot see it. StackLens shows a tool only when it has real evidence, and stays quiet
          rather than guessing.
        </p>
        <p className="mt-3 text-base leading-relaxed text-muted dark:text-muted-dark">
          Everything is analysed on your own device. There is no account and no tracking, and
          nothing about the sites you visit is ever sent anywhere. The one exception is Deep scan,
          which runs only when you press it: it downloads scripts the page already loaded and
          reads them as text.
        </p>
      </section>

      {/*
        StackLens has six surfaces and four of them lived behind an unlabeled
        three-dot menu that this page never mentioned — so the catalogue, the
        history and the full report were, for most users, features that did not
        exist. Naming them on the one page everybody sees costs nothing.
      */}
      <section className="mt-12 border-t border-line pt-6 dark:border-line-dark">
        <h2 className="text-lg font-medium">There is more than the panel</h2>
        <p className="mt-2 text-base leading-relaxed text-muted dark:text-muted-dark">
          Reachable any time from the menu in the panel&apos;s top-right corner.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {[
            { file: 'report.html', label: 'This site', body: 'The full stack, with descriptions and a shareable card' },
            { file: 'history.html', label: 'History', body: 'What every site you visit was built with, kept locally' },
            { file: 'technologies.html', label: 'Technologies', body: 'Browse everything StackLens can detect' },
          ].map((page) => (
            <a
              key={page.file}
              href={page.file}
              className="rounded-card border border-line px-3 py-2.5 no-underline transition-colors hover:bg-card dark:border-line-dark dark:hover:bg-card-dark"
            >
              <span className="block text-base font-medium text-ink dark:text-ink-dark">
                {page.label}
              </span>
              <span className="mt-0.5 block text-sm leading-snug text-muted dark:text-muted-dark">
                {page.body}
              </span>
            </a>
          ))}
        </div>
      </section>
      </main>
    </div>
  )
}
