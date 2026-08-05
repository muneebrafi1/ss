import type { Fingerprint } from '@/types'

/**
 * Frontend frameworks and UI libraries.
 *
 * Highly reliable: a frontend framework has to ship to the browser to do its
 * job, so it always leaves a global, a marker attribute, or a build directory
 * behind. Several expose their own version at runtime, which is why this
 * category carries more real version numbers than any other.
 */
export const FRAMEWORKS: Fingerprint[] = [
  {
    id: 'nextjs',
    name: 'Next.js',
    category: 'frameworks',
    description: 'React framework with server rendering',
    icon: 'nextdotjs',
    website: 'https://nextjs.org',
    implies: ['react'],
    signals: [
      { type: 'global', path: '__NEXT_DATA__', weight: 0.9 },
      // `window.next` is NOT a Next.js signal. Named element access means any
      // `<button id="next">` — pagination, a carousel, a multi-step form —
      // defines it, and at 0.6 it cleared the display threshold on its own.
      // __NEXT_DATA__, /_next/static/ and #__next below cover Next.js without it.
      { type: 'script', pattern: /\/_next\/static\//, weight: 0.9 },
      { type: 'header', name: 'x-powered-by', pattern: /Next\.js/, weight: 0.9 },
      { type: 'header', name: 'x-nextjs-prerender', weight: 0.85 },
      { type: 'dom', selector: '#__next', weight: 0.8 },
      { type: 'html', pattern: /\/_next\/(?:static|image)/, weight: 0.8 },
    ],
    version: [{ from: 'header', name: 'x-powered-by', pattern: /Next\.js\s+([\d.]+)/ }],
  },
  {
    id: 'react',
    name: 'React',
    category: 'frameworks',
    description: 'UI library for building interfaces',
    icon: 'react',
    website: 'https://react.dev',
    signals: [
      { type: 'global', path: 'React', weight: 0.85 },
      { type: 'html', pattern: /data-reactroot|__reactContainer|<!--\$-->/, weight: 0.7 },
      { type: 'bundle', pattern: /react-dom\.production\.min\.js|__SECRET_INTERNALS_DO_NOT_USE/, weight: 0.8 },
    ],
    version: [{ from: 'global', path: 'React.version' }],
  },
  {
    id: 'vue',
    name: 'Vue',
    category: 'frameworks',
    description: 'Progressive JavaScript framework',
    icon: 'vuedotjs',
    website: 'https://vuejs.org',
    signals: [
      { type: 'global', path: 'Vue', weight: 0.9 },
      { type: 'dom', selector: '[data-v-app]', weight: 0.85 },
      { type: 'html', pattern: /data-v-[0-9a-f]{8}|__vue__/, weight: 0.75 },
    ],
    version: [{ from: 'global', path: 'Vue.version' }],
  },
  {
    id: 'nuxt',
    name: 'Nuxt',
    category: 'frameworks',
    description: 'Vue framework with server rendering',
    icon: 'nuxt',
    website: 'https://nuxt.com',
    implies: ['vue'],
    signals: [
      { type: 'global', path: '__NUXT__', weight: 0.95 },
      { type: 'script', pattern: /\/_nuxt\//, weight: 0.9 },
      { type: 'dom', selector: '#__nuxt', weight: 0.85 },
      { type: 'html', pattern: /__NUXT_DATA__|\/_nuxt\//, weight: 0.8 },
    ],
  },
  {
    id: 'svelte',
    name: 'Svelte',
    category: 'frameworks',
    description: 'Compiler-based UI framework',
    icon: 'svelte',
    website: 'https://svelte.dev',
    signals: [
      { type: 'html', pattern: /\bsvelte-[a-z0-9]{6,}\b/, weight: 0.75 },
      { type: 'bundle', pattern: /svelte\/internal|\$\$invalidate/, weight: 0.8 },
    ],
  },
  {
    id: 'sveltekit',
    name: 'SvelteKit',
    category: 'frameworks',
    description: 'Svelte application framework',
    icon: 'svelte',
    website: 'https://kit.svelte.dev',
    implies: ['svelte'],
    signals: [
      { type: 'global', path: '__sveltekit', weight: 0.9 },
      { type: 'script', pattern: /\/_app\/immutable\//, weight: 0.9 },
      { type: 'html', pattern: /\/_app\/immutable\/|data-sveltekit-/, weight: 0.85 },
    ],
  },
  {
    id: 'astro',
    name: 'Astro',
    category: 'frameworks',
    description: 'Content-focused web framework',
    icon: 'astro',
    website: 'https://astro.build',
    signals: [
      { type: 'meta', name: 'generator', pattern: /Astro/, weight: 0.95 },
      { type: 'dom', selector: 'astro-island', weight: 0.9 },
      { type: 'html', pattern: /astro-island|data-astro-(?:cid|source)/, weight: 0.85 },
    ],
    version: [{ from: 'meta', name: 'generator', pattern: /Astro\s+v?([\d.]+)/ }],
  },
  {
    id: 'angular',
    name: 'Angular',
    category: 'frameworks',
    description: 'Application framework by Google',
    icon: 'angular',
    website: 'https://angular.dev',
    signals: [
      { type: 'dom', selector: '[ng-version]', weight: 0.95 },
      { type: 'global', path: 'ng', weight: 0.75 },
      { type: 'html', pattern: /ng-version="|_nghost-|_ngcontent-/, weight: 0.85 },
    ],
    version: [{ from: 'html', pattern: /ng-version="([\d.]+)"/ }],
  },
  {
    id: 'remix',
    name: 'Remix',
    category: 'frameworks',
    description: 'Full-stack React framework',
    icon: 'remix',
    website: 'https://remix.run',
    implies: ['react'],
    signals: [
      { type: 'global', path: '__remixContext', weight: 0.95 },
      { type: 'global', path: '__remixManifest', weight: 0.95 },
      { type: 'html', pattern: /__remixContext|__remixRouteModules/, weight: 0.85 },
    ],
  },
  {
    id: 'gatsby',
    name: 'Gatsby',
    category: 'frameworks',
    description: 'React-based static site generator',
    icon: 'gatsby',
    website: 'https://gatsbyjs.com',
    implies: ['react'],
    signals: [
      { type: 'global', path: '___gatsby', weight: 0.9 },
      { type: 'dom', selector: '#___gatsby', weight: 0.9 },
      { type: 'meta', name: 'generator', pattern: /Gatsby/, weight: 0.95 },
      { type: 'script', pattern: /webpack-runtime-[\da-f]+\.js|app-[\da-f]+\.js/, weight: 0.5 },
    ],
    version: [{ from: 'meta', name: 'generator', pattern: /Gatsby\s+([\d.]+)/ }],
  },
  {
    id: 'qwik',
    name: 'Qwik',
    category: 'frameworks',
    description: 'Resumable web framework',
    icon: 'qwik',
    website: 'https://qwik.dev',
    signals: [
      { type: 'html', pattern: /q:container|q:base|q:render/, weight: 0.9 },
      { type: 'dom', selector: '[q\\:container]', weight: 0.9 },
    ],
  },
  {
    id: 'solidjs',
    name: 'SolidJS',
    category: 'frameworks',
    description: 'Reactive UI library',
    icon: 'solid',
    website: 'https://solidjs.com',
    signals: [
      { type: 'bundle', pattern: /solid-js\/(?:web|store)|_\$createComponent/, weight: 0.8 },
      { type: 'html', pattern: /<!--!\$-->|data-hk="/, weight: 0.55 },
    ],
  },
  {
    id: 'preact',
    name: 'Preact',
    category: 'frameworks',
    description: 'Small React-compatible library',
    icon: 'preact',
    website: 'https://preactjs.com',
    signals: [
      { type: 'global', path: 'preact', weight: 0.9 },
      { type: 'bundle', pattern: /preact\/(?:hooks|compat)|__PREACT_DEVTOOLS__/, weight: 0.8 },
    ],
  },
  {
    id: 'lit',
    name: 'Lit',
    category: 'frameworks',
    description: 'Library for web components',
    icon: 'lit',
    website: 'https://lit.dev',
    signals: [
      { type: 'bundle', pattern: /lit-html|lit-element|@lit\/reactive-element/, weight: 0.8 },
      { type: 'global', path: 'litElementVersions', weight: 0.9 },
    ],
  },
  {
    id: 'ember',
    name: 'Ember.js',
    category: 'frameworks',
    description: 'Opinionated application framework',
    icon: 'emberdotjs',
    website: 'https://emberjs.com',
    signals: [
      { type: 'global', path: 'Ember', weight: 0.9 },
      { type: 'dom', selector: '.ember-application', weight: 0.85 },
    ],
    version: [{ from: 'global', path: 'Ember.VERSION' }],
  },
  {
    id: 'htmx',
    name: 'htmx',
    category: 'frameworks',
    description: 'HTML-driven interactivity',
    icon: 'htmx',
    website: 'https://htmx.org',
    signals: [
      { type: 'global', path: 'htmx', weight: 0.95 },
      { type: 'html', pattern: /\shx-(?:get|post|target|swap|trigger)=/, weight: 0.9 },
      { type: 'script', pattern: /htmx(?:\.min)?\.js/, weight: 0.9 },
    ],
    version: [{ from: 'global', path: 'htmx.version' }],
  },
  {
    id: 'alpinejs',
    name: 'Alpine.js',
    category: 'frameworks',
    description: 'Lightweight declarative interactivity',
    icon: 'alpinedotjs',
    website: 'https://alpinejs.dev',
    signals: [
      { type: 'global', path: 'Alpine', weight: 0.95 },
      { type: 'html', pattern: /\sx-data=|\sx-show=|\sx-on:/, weight: 0.85 },
    ],
    version: [{ from: 'global', path: 'Alpine.version' }],
  },
  {
    id: 'jquery',
    name: 'jQuery',
    category: 'frameworks',
    description: 'Classic DOM manipulation library',
    icon: 'jquery',
    website: 'https://jquery.com',
    signals: [
      { type: 'global', path: 'jQuery', weight: 0.9 },
      { type: 'script', pattern: /jquery[.-][\d.]*(?:\.min)?\.js|jquery(?:\.min)?\.js/, weight: 0.9 },
    ],
    version: [
      { from: 'global', path: 'jQuery.fn.jquery' },
      { from: 'script', pattern: /jquery[.-]([\d.]+)(?:\.min)?\.js/ },
    ],
  },
  {
    id: 'bootstrap',
    name: 'Bootstrap',
    category: 'frameworks',
    description: 'CSS and component framework',
    icon: 'bootstrap',
    website: 'https://getbootstrap.com',
    signals: [
      { type: 'global', path: 'bootstrap', weight: 0.8 },
      { type: 'script', pattern: /bootstrap(?:\.bundle)?(?:\.min)?\.js/, weight: 0.9 },
      { type: 'html', pattern: /class="[^"]*\b(?:navbar-expand|container-fluid|btn-primary)\b/, weight: 0.7 },
    ],
    version: [{ from: 'script', pattern: /bootstrap[@/]([\d.]+)/ }],
  },
  {
    id: 'tailwindcss',
    name: 'Tailwind CSS',
    category: 'frameworks',
    description: 'Utility-first CSS framework',
    icon: 'tailwindcss',
    website: 'https://tailwindcss.com',
    signals: [
      // Utility class co-occurrence. Individually these words are common, so
      // the pattern requires a layout utility next to a spacing utility next
      // to an alignment utility — a combination that is distinctively Tailwind.
      { type: 'html', pattern: /class="[^"]*\bflex\b[^"]*\b(?:items-center|justify-between)\b[^"]*\b(?:gap-\d|px-\d|py-\d)\b/, weight: 0.7 },
      { type: 'html', pattern: /--tw-(?:ring-offset-shadow|translate-x|bg-opacity)/, weight: 0.8 },
    ],
  },
]
