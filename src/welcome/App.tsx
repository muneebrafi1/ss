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

export function WelcomeApp() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-bg px-6 py-16 text-ink dark:bg-bg-dark dark:text-ink-dark">
      <h1 className="text-[28px] font-semibold tracking-tight">StackLens is installed</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-muted dark:text-muted-dark">
        See what any website is built with, in one click.
      </p>

      <ol className="mt-12 space-y-8">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex gap-4">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line text-[12px] font-semibold text-muted dark:border-line-dark dark:text-muted-dark">
              {i + 1}
            </span>
            <div>
              <h2 className="text-[15px] font-medium">{step.title}</h2>
              <p className="mt-1 text-[14px] leading-relaxed text-muted dark:text-muted-dark">
                {step.body}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-12 flex flex-wrap items-center gap-3">
        <a
          href="https://vercel.com"
          target="_blank"
          rel="noreferrer"
          className="rounded-btn bg-ink px-4 py-2 text-[13px] font-medium text-bg transition-opacity hover:opacity-90 dark:bg-ink-dark dark:text-bg-dark"
        >
          Try it on a site
        </a>
        <span className="text-[13px] text-muted dark:text-muted-dark">
          Then click the StackLens icon.
        </span>
      </div>

      <section className="mt-16 border-t border-line pt-6 dark:border-line-dark">
        <h2 className="text-[14px] font-medium">A note on what it can and can&apos;t see</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-muted dark:text-muted-dark">
          Hosting, payments, auth, analytics and support tools have to run in your browser to work,
          so they are detected reliably. AI models usually do not — when a site asks GPT or Claude
          something, that happens between their servers and the model provider, where the browser
          cannot see it. StackLens shows a tool only when it has real evidence, and stays quiet
          rather than guessing.
        </p>
        <p className="mt-3 text-[14px] leading-relaxed text-muted dark:text-muted-dark">
          Everything is analysed on your own device. There is no account, no tracking, and nothing
          about the sites you visit is ever sent anywhere.
        </p>
      </section>
    </main>
  )
}
