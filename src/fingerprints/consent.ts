import type { Fingerprint } from '@/types'

/**
 * Cookie consent and privacy compliance.
 *
 * Unmissable when present — a consent banner has to render before anything else
 * and blocks the page until answered. Its presence usually signals European
 * traffic or a compliance-conscious organisation.
 */
export const CONSENT: Fingerprint[] = [
  {
    id: 'onetrust',
    name: 'OneTrust',
    category: 'consent',
    description: 'Enterprise consent and privacy management',
    icon: 'onetrust',
    website: 'https://onetrust.com',
    signals: [
      { type: 'global', path: 'OneTrust', weight: 0.95 },
      { type: 'script', pattern: /cdn(?:-apac)?\.cookielaw\.org|cdn\.onetrust\.com/, weight: 0.95 },
      { type: 'dom', selector: '#onetrust-banner-sdk', weight: 0.9 },
      { type: 'cookie', pattern: /^OptanonConsent$/, weight: 0.9 },
    ],
  },
  {
    id: 'cookiebot',
    name: 'Cookiebot',
    category: 'consent',
    description: 'Cookie consent management',
    icon: 'cookiebot',
    website: 'https://cookiebot.com',
    signals: [
      { type: 'global', path: 'Cookiebot', weight: 0.95 },
      { type: 'script', pattern: /consent\.cookiebot\.com/, weight: 0.95 },
      { type: 'cookie', pattern: /^CookieConsent$/, weight: 0.85 },
    ],
  },
  {
    id: 'usercentrics',
    name: 'Usercentrics',
    category: 'consent',
    description: 'Consent management platform',
    icon: 'usercentrics',
    website: 'https://usercentrics.com',
    signals: [
      { type: 'global', path: 'UC_UI', weight: 0.95 },
      { type: 'script', pattern: /app\.usercentrics\.eu|privacy-proxy\.usercentrics\.eu/, weight: 0.95 },
    ],
  },
  {
    id: 'osano',
    name: 'Osano',
    category: 'consent',
    description: 'Consent and data privacy platform',
    icon: 'osano',
    website: 'https://osano.com',
    signals: [
      { type: 'global', path: 'Osano', weight: 0.95 },
      { type: 'script', pattern: /cmp\.osano\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'termly',
    name: 'Termly',
    category: 'consent',
    description: 'Privacy policies and consent banners',
    icon: 'termly',
    website: 'https://termly.io',
    signals: [
      { type: 'script', pattern: /app\.termly\.io/, weight: 0.95 },
      { type: 'dom', selector: '#termly-code-snippet-support', weight: 0.9 },
    ],
  },
  {
    id: 'cookieyes',
    name: 'CookieYes',
    category: 'consent',
    description: 'Cookie consent for small sites',
    icon: 'cookieyes',
    website: 'https://cookieyes.com',
    signals: [
      { type: 'script', pattern: /cdn-cookieyes\.com/, weight: 0.95 },
      { type: 'cookie', pattern: /^cookieyes-consent$/, weight: 0.9 },
    ],
  },
  {
    id: 'axeptio',
    name: 'Axeptio',
    category: 'consent',
    description: 'Consent management platform',
    icon: 'axeptio',
    website: 'https://axeptio.eu',
    signals: [
      { type: 'global', path: 'axeptioSDK', weight: 0.95 },
      { type: 'script', pattern: /static\.axept\.io/, weight: 0.95 },
    ],
  },
  {
    id: 'iubenda',
    name: 'Iubenda',
    category: 'consent',
    description: 'Privacy policies and consent',
    icon: 'iubenda',
    website: 'https://iubenda.com',
    signals: [
      { type: 'global', path: '_iub', weight: 0.95 },
      { type: 'script', pattern: /cdn\.iubenda\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'didomi',
    name: 'Didomi',
    category: 'consent',
    description: 'Consent management platform',
    icon: 'didomi',
    website: 'https://didomi.io',
    signals: [
      { type: 'global', path: 'Didomi', weight: 0.95 },
      { type: 'script', pattern: /sdk\.privacy-center\.org|(^|\.)api\.privacy-center\.org/, weight: 0.95 },
    ],
  },
  {
    id: 'complianz',
    name: 'Complianz',
    category: 'consent',
    description: 'WordPress consent plugin',
    icon: 'wordpress',
    website: 'https://complianz.io',
    implies: ['wordpress'],
    signals: [
      { type: 'html', pattern: /cmplz-|complianz/, weight: 0.85 },
      { type: 'cookie', pattern: /^cmplz_/, weight: 0.9 },
    ],
  },
  {
    id: 'trustarc',
    name: 'TrustArc',
    category: 'consent',
    description: 'Privacy compliance and consent',
    icon: 'trustarc',
    website: 'https://trustarc.com',
    signals: [
      { type: 'global', path: 'truste', weight: 0.95 },
      { type: 'script', pattern: /consent\.trustarc\.com|consent\.truste\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'ketch',
    name: 'Ketch',
    category: 'consent',
    description: 'Consent and data-rights platform',
    icon: 'ketch',
    website: 'https://ketch.com',
    signals: [
      { type: 'global', path: 'ketch', weight: 0.9 },
      { type: 'script', pattern: /global\.ketchcdn\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'sourcepoint',
    name: 'Sourcepoint',
    category: 'consent',
    description: 'Consent management for publishers',
    icon: 'sourcepoint',
    website: 'https://sourcepoint.com',
    signals: [
      { type: 'global', path: '_sp_', weight: 0.9 },
      { type: 'script', pattern: /cdn\.privacy-mgmt\.com|sourcepoint\.mgr\.consensu\.org/, weight: 0.95 },
    ],
  },
  {
    id: 'quantcast-choice',
    name: 'Quantcast Choice',
    category: 'consent',
    description: 'IAB-compliant consent banner',
    icon: 'quantcast',
    website: 'https://quantcast.com/products/choice-consent-management-platform',
    signals: [
      { type: 'global', path: '__tcfapi', weight: 0.5 },
      { type: 'script', pattern: /quantcast\.mgr\.consensu\.org|cmp\.quantcast\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'cookiefirst',
    name: 'CookieFirst',
    category: 'consent',
    description: 'Cookie banner and scanning',
    icon: 'cookiefirst',
    website: 'https://cookiefirst.com',
    signals: [
      { type: 'script', pattern: /consent\.cookiefirst\.com/, weight: 0.95 },
      { type: 'dom', selector: '[data-cookiefirst-widget], #cookiefirst-root', weight: 0.9 },
    ],
  },
  {
    id: 'klaro',
    name: 'Klaro',
    category: 'consent',
    description: 'Open-source consent manager',
    icon: 'klaro',
    website: 'https://klaro.org',
    signals: [
      { type: 'global', path: 'klaro', weight: 0.9 },
      { type: 'dom', selector: '#klaro, .klaro .cookie-modal', weight: 0.9 },
    ],
  },
  {
    id: 'cookie-script',
    name: 'CookieScript',
    category: 'consent',
    description: 'Consent banner and cookie audit',
    icon: 'cookiescript',
    website: 'https://cookie-script.com',
    signals: [
      { type: 'script', pattern: /cookie-script\.com\/s\/[\w]+\.js/, weight: 0.95 },
      { type: 'dom', selector: '#cookiescript_injected', weight: 0.9 },
    ],
  },
]
