import type { Fingerprint } from '@/types'

/**
 * Marketing automation, CRM, and advertising pixels.
 *
 * Reliably visible because tracking only works from the browser. Useful beyond
 * curiosity — an agency or salesperson can read a site's go-to-market stack
 * straight off this list.
 */
export const MARKETING: Fingerprint[] = [
  {
    id: 'hubspot',
    name: 'HubSpot',
    category: 'marketing',
    description: 'CRM, marketing, and sales platform',
    icon: 'hubspot',
    website: 'https://hubspot.com',
    signals: [
      { type: 'global', path: '_hsq', weight: 0.95 },
      { type: 'script', pattern: /js(?:-\w+)?\.hs-scripts\.com|js\.hsforms\.net|js\.hsadspixel\.net/, weight: 0.95 },
      { type: 'request', pattern: /(?:track|forms)\.hubspot\.com|api\.hubapi\.com/, weight: 0.9 },
      { type: 'cookie', pattern: /^(?:hubspotutk|__hs)/, weight: 0.85 },
    ],
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    category: 'marketing',
    description: 'Enterprise CRM',
    icon: 'salesforce',
    website: 'https://salesforce.com',
    signals: [
      { type: 'request', pattern: /[\w-]+\.(?:my\.)?salesforce\.com|[\w-]+\.force\.com/, weight: 0.9 },
      { type: 'script', pattern: /embeddedservice|sfdc-|pardot/, weight: 0.75 },
    ],
  },
  {
    id: 'braze',
    name: 'Braze',
    category: 'marketing',
    description: 'Customer engagement platform',
    icon: 'braze',
    website: 'https://braze.com',
    signals: [
      { type: 'global', path: 'appboy', weight: 0.95 },
      { type: 'global', path: 'braze', weight: 0.95 },
      { type: 'request', pattern: /sdk\.iad-\d+\.braze\.com|[\w-]+\.braze(?:\.eu)?\.com/, weight: 0.9 },
    ],
  },
  {
    id: 'iterable',
    name: 'Iterable',
    category: 'marketing',
    description: 'Cross-channel marketing platform',
    icon: 'iterable',
    website: 'https://iterable.com',
    signals: [{ type: 'request', pattern: /(^|\.)api\.iterable\.com|links\.\w+\.iterable\.com/, weight: 0.95 }],
  },
  {
    id: 'meta-pixel',
    name: 'Meta Pixel',
    category: 'marketing',
    description: 'Facebook and Instagram ad tracking',
    icon: 'meta',
    website: 'https://facebook.com/business/tools/meta-pixel',
    signals: [
      { type: 'global', path: 'fbq', weight: 0.95 },
      { type: 'script', pattern: /connect\.facebook\.net\/.*\/fbevents\.js/, weight: 0.95 },
      { type: 'request', pattern: /www\.facebook\.com\/tr\//, weight: 0.9 },
    ],
  },
  {
    id: 'google-ads',
    name: 'Google Ads',
    category: 'marketing',
    description: 'Ad conversion tracking and remarketing',
    icon: 'googleads',
    website: 'https://ads.google.com',
    signals: [
      { type: 'request', pattern: /googleads\.g\.doubleclick\.net|www\.googleadservices\.com/, weight: 0.9 },
      { type: 'script', pattern: /googletagmanager\.com\/gtag\/js\?id=AW-/, weight: 0.95 },
    ],
  },
  {
    id: 'linkedin-insight',
    name: 'LinkedIn Insight',
    category: 'marketing',
    description: 'LinkedIn ad conversion tracking',
    icon: 'linkedin',
    website: 'https://business.linkedin.com',
    signals: [
      { type: 'global', path: '_linkedin_partner_id', weight: 0.95 },
      { type: 'script', pattern: /snap\.licdn\.com\/li\.lms-analytics/, weight: 0.95 },
    ],
  },
  {
    id: 'tiktok-pixel',
    name: 'TikTok Pixel',
    category: 'marketing',
    description: 'TikTok ad conversion tracking',
    icon: 'tiktok',
    website: 'https://ads.tiktok.com',
    signals: [
      { type: 'global', path: 'ttq', weight: 0.95 },
      { type: 'script', pattern: /analytics\.tiktok\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'reddit-pixel',
    name: 'Reddit Pixel',
    category: 'marketing',
    description: 'Reddit ad conversion tracking',
    icon: 'reddit',
    website: 'https://ads.reddit.com',
    signals: [
      { type: 'global', path: 'rdt', weight: 0.9 },
      { type: 'script', pattern: /www\.redditstatic\.com\/ads\/pixel\.js/, weight: 0.95 },
    ],
  },
  {
    id: 'attio',
    name: 'Attio',
    category: 'marketing',
    description: 'Modern CRM',
    icon: 'attio',
    website: 'https://attio.com',
    signals: [{ type: 'request', pattern: /(^|\.)api\.attio\.com/, weight: 0.95 }],
  },
  {
    id: 'koala',
    name: 'Koala',
    category: 'marketing',
    description: 'Buyer intent and website visitor tracking',
    icon: 'koala',
    website: 'https://getkoala.com',
    signals: [
      { type: 'global', path: 'ko', weight: 0.7 },
      { type: 'script', pattern: /cdn\.getkoala\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'rb2b',
    name: 'RB2B',
    category: 'marketing',
    description: 'Identifies anonymous website visitors',
    icon: 'rb2b',
    website: 'https://rb2b.com',
    signals: [{ type: 'script', pattern: /ddwl4m2hdecbv\.cloudfront\.net|s3\.amazonaws\.com\/rb2b/, weight: 0.9 }],
  },
]
