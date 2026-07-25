import type { Fingerprint } from '@/types'

/**
 * Forms, scheduling, and embedded widgets.
 *
 * Nearly always embedded as an iframe or a script-injected widget, which makes
 * them straightforward to spot and common enough on real SaaS sites to be worth
 * covering.
 */
export const FORMS: Fingerprint[] = [
  {
    id: 'typeform',
    name: 'Typeform',
    category: 'forms',
    description: 'Conversational forms and surveys',
    icon: 'typeform',
    website: 'https://typeform.com',
    signals: [
      { type: 'script', pattern: /embed\.typeform\.com/, weight: 0.95 },
      { type: 'dom', selector: '[data-tf-live], iframe[src*="typeform.com"]', weight: 0.9 },
      { type: 'request', pattern: /[\w-]*\.?typeform\.com/, weight: 0.85 },
    ],
  },
  {
    id: 'tally',
    name: 'Tally',
    category: 'forms',
    description: 'Free form builder',
    icon: 'tally',
    website: 'https://tally.so',
    signals: [
      { type: 'script', pattern: /tally\.so\/widgets\/embed\.js/, weight: 0.95 },
      { type: 'dom', selector: 'iframe[src*="tally.so"]', weight: 0.9 },
    ],
  },
  {
    id: 'calendly',
    name: 'Calendly',
    category: 'forms',
    description: 'Meeting scheduling',
    icon: 'calendly',
    website: 'https://calendly.com',
    signals: [
      { type: 'global', path: 'Calendly', weight: 0.95 },
      { type: 'script', pattern: /assets\.calendly\.com/, weight: 0.95 },
      { type: 'dom', selector: '.calendly-inline-widget, iframe[src*="calendly.com"]', weight: 0.9 },
    ],
  },
  {
    id: 'cal-com',
    name: 'Cal.com',
    category: 'forms',
    description: 'Open-source scheduling',
    icon: 'caldotcom',
    website: 'https://cal.com',
    signals: [
      { type: 'global', path: 'Cal', weight: 0.9 },
      { type: 'script', pattern: /(?:app\.)?cal\.com\/embed(?:\/embed)?\.js/, weight: 0.95 },
      { type: 'dom', selector: 'iframe[src*="cal.com"]', weight: 0.85 },
    ],
  },
  {
    id: 'google-forms',
    name: 'Google Forms',
    category: 'forms',
    description: 'Embedded Google form',
    icon: 'googleforms',
    website: 'https://forms.google.com',
    signals: [
      { type: 'dom', selector: 'iframe[src*="docs.google.com/forms"]', weight: 0.95 },
      { type: 'request', pattern: /docs\.google\.com\/forms\//, weight: 0.9 },
    ],
  },
  {
    id: 'formspree',
    name: 'Formspree',
    category: 'forms',
    description: 'Form backend without a server',
    icon: 'formspree',
    website: 'https://formspree.io',
    signals: [
      { type: 'dom', selector: 'form[action*="formspree.io"]', weight: 0.95 },
      { type: 'request', pattern: /formspree\.io\/[fp]\//, weight: 0.95 },
    ],
  },
  {
    id: 'chilipiper',
    name: 'Chili Piper',
    category: 'forms',
    description: 'Inbound lead routing and scheduling',
    icon: 'chilipiper',
    website: 'https://chilipiper.com',
    signals: [
      { type: 'global', path: 'ChiliPiper', weight: 0.95 },
      { type: 'script', pattern: /js\.chilipiper\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'recaptcha',
    name: 'reCAPTCHA',
    category: 'forms',
    description: 'Bot protection by Google',
    icon: 'google',
    website: 'https://google.com/recaptcha',
    signals: [
      { type: 'global', path: 'grecaptcha', weight: 0.95 },
      { type: 'script', pattern: /www\.(?:google|recaptcha\.net)\.com\/recaptcha\//, weight: 0.95 },
    ],
  },
  {
    id: 'turnstile',
    name: 'Cloudflare Turnstile',
    category: 'forms',
    description: 'Privacy-friendly CAPTCHA alternative',
    icon: 'cloudflare',
    website: 'https://cloudflare.com/products/turnstile',
    signals: [
      { type: 'global', path: 'turnstile', weight: 0.95 },
      { type: 'script', pattern: /challenges\.cloudflare\.com\/turnstile/, weight: 0.95 },
    ],
  },
  {
    id: 'hcaptcha',
    name: 'hCaptcha',
    category: 'forms',
    description: 'Privacy-focused CAPTCHA',
    icon: 'hcaptcha',
    website: 'https://hcaptcha.com',
    signals: [
      { type: 'global', path: 'hcaptcha', weight: 0.95 },
      { type: 'script', pattern: /(?:js|newassets)\.hcaptcha\.com/, weight: 0.95 },
    ],
  },
]
