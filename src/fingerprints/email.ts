import type { Fingerprint } from '@/types'

/**
 * Transactional and marketing email.
 *
 * Weakly detectable by nature: sending mail is a server-side act, so the
 * browser rarely sees it. What does surface is embedded signup forms, tracking
 * pixels, and hosted form endpoints — which is what most of these match on.
 */
export const EMAIL: Fingerprint[] = [
  {
    id: 'resend',
    name: 'Resend',
    category: 'email',
    description: 'Transactional email for developers',
    icon: 'resend',
    website: 'https://resend.com',
    signals: [
      { type: 'request', pattern: /(^|\.)api\.resend\.com/, weight: 0.95 },
      { type: 'bundle', pattern: /\bresend\b.{0,30}emails\.send|@react-email\//, weight: 0.65 },
    ],
  },
  {
    id: 'loops',
    name: 'Loops',
    category: 'email',
    description: 'Email for software companies',
    icon: 'loops',
    website: 'https://loops.so',
    signals: [
      { type: 'request', pattern: /(^|\.)app\.loops\.so\/api/, weight: 0.95 },
      { type: 'dom', selector: 'form[action*="loops.so"]', weight: 0.9 },
    ],
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    category: 'email',
    description: 'Email delivery by Twilio',
    icon: 'sendgrid',
    website: 'https://sendgrid.com',
    signals: [
      { type: 'request', pattern: /(^|\.)api\.sendgrid\.com|sendgrid\.net/, weight: 0.9 },
      { type: 'html', pattern: /ct\.sendgrid\.net/, weight: 0.8 },
    ],
  },
  {
    id: 'mailgun',
    name: 'Mailgun',
    category: 'email',
    description: 'Email delivery API',
    icon: 'mailgun',
    website: 'https://mailgun.com',
    signals: [
      { type: 'request', pattern: /(^|\.)api\.mailgun\.(?:net|org)|mailgun\.org/, weight: 0.9 },
    ],
  },
  {
    id: 'postmark',
    name: 'Postmark',
    category: 'email',
    description: 'Transactional email delivery',
    icon: 'postmark',
    website: 'https://postmarkapp.com',
    signals: [
      { type: 'request', pattern: /(^|\.)api\.postmarkapp\.com|pstmrk\.it/, weight: 0.9 },
    ],
  },
  {
    id: 'customerio',
    name: 'Customer.io',
    category: 'email',
    description: 'Automated messaging and campaigns',
    icon: 'customerio',
    website: 'https://customer.io',
    signals: [
      { type: 'global', path: '_cio', weight: 0.95 },
      { type: 'script', pattern: /assets\.customer\.io|track\.customer\.io/, weight: 0.95 },
    ],
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    category: 'email',
    description: 'Email marketing and campaigns',
    icon: 'mailchimp',
    website: 'https://mailchimp.com',
    signals: [
      { type: 'script', pattern: /chimpstatic\.com|mailchimp\.com\/.*\/embed/, weight: 0.9 },
      { type: 'dom', selector: 'form[action*="list-manage.com"]', weight: 0.95 },
      { type: 'html', pattern: /list-manage\.com\/subscribe/, weight: 0.85 },
    ],
  },
  {
    id: 'klaviyo',
    name: 'Klaviyo',
    category: 'email',
    description: 'Ecommerce email and SMS marketing',
    icon: 'klaviyo',
    website: 'https://klaviyo.com',
    signals: [
      { type: 'global', path: 'klaviyo', weight: 0.95 },
      { type: 'global', path: '_learnq', weight: 0.9 },
      { type: 'script', pattern: /static\.klaviyo\.com|static-tracking\.klaviyo\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'beehiiv',
    name: 'beehiiv',
    category: 'email',
    description: 'Newsletter publishing platform',
    icon: 'beehiiv',
    website: 'https://beehiiv.com',
    signals: [
      { type: 'script', pattern: /subscribe-forms\.beehiiv\.com|beehiiv\.com\/.*embed/, weight: 0.95 },
      { type: 'dom', selector: 'iframe[src*="beehiiv.com"]', weight: 0.9 },
    ],
  },
  {
    id: 'convertkit',
    name: 'Kit',
    category: 'email',
    description: 'Email marketing for creators, formerly ConvertKit',
    icon: 'kit',
    website: 'https://kit.com',
    signals: [
      { type: 'script', pattern: /f\.convertkit\.com|kit\.com\/.*\/index\.js/, weight: 0.95 },
      { type: 'dom', selector: 'form[data-sv-form]', weight: 0.9 },
    ],
  },
  {
    id: 'substack',
    name: 'Substack',
    category: 'email',
    description: 'Newsletter publishing platform',
    icon: 'substack',
    website: 'https://substack.com',
    signals: [
      { type: 'request', pattern: /substackcdn\.com|[\w-]+\.substack\.com/, weight: 0.9 },
      { type: 'dom', selector: 'iframe[src*="substack.com/embed"]', weight: 0.95 },
    ],
  },
]
