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
  {
    id: 'brevo',
    name: 'Brevo',
    category: 'email',
    description: 'Email and marketing automation, formerly Sendinblue',
    icon: 'brevo',
    website: 'https://brevo.com',
    signals: [
      { type: 'script', pattern: /sibforms\.com|sibautomation\.com/, weight: 0.95 },
      { type: 'request', pattern: /(^|\.)api\.brevo\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'mailjet',
    name: 'Mailjet',
    category: 'email',
    description: 'Email delivery and campaigns',
    icon: 'mailjet',
    website: 'https://mailjet.com',
    signals: [{ type: 'request', pattern: /(^|\.)api\.mailjet\.com|mjt\.lu/, weight: 0.9 }],
  },
  {
    id: 'amazon-ses',
    name: 'Amazon SES',
    category: 'email',
    description: 'Email sending on AWS',
    icon: 'amazonwebservices',
    website: 'https://aws.amazon.com/ses',
    signals: [{ type: 'request', pattern: /email\.[\w-]+\.amazonaws\.com|[\w-]+\.awstrack\.me/, weight: 0.9 }],
  },
  {
    id: 'activecampaign',
    name: 'ActiveCampaign',
    category: 'email',
    description: 'Marketing automation and CRM',
    icon: 'activecampaign',
    website: 'https://activecampaign.com',
    signals: [
      { type: 'global', path: 'vgo', weight: 0.9 },
      { type: 'script', pattern: /diffuser-cdn\.app-us1\.com|prism\.app-us1\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'mailersend',
    name: 'MailerSend',
    category: 'email',
    description: 'Transactional email API',
    icon: 'mailersend',
    website: 'https://mailersend.com',
    signals: [
      { type: 'request', pattern: /api\.mailersend\.com/, weight: 0.95 },
      { type: 'html', pattern: /links\.mailersend\.com/, weight: 0.85 },
    ],
  },
  {
    id: 'sparkpost',
    name: 'SparkPost',
    category: 'email',
    description: 'Transactional email delivery',
    icon: 'sparkpost',
    website: 'https://sparkpost.com',
    signals: [
      { type: 'request', pattern: /api\.(?:eu\.)?sparkpost\.com|spgo\.io/, weight: 0.95 },
    ],
  },
  {
    id: 'buttondown',
    name: 'Buttondown',
    category: 'email',
    description: 'Newsletters for writers',
    icon: 'buttondown',
    website: 'https://buttondown.com',
    signals: [
      { type: 'dom', selector: 'form[action*="buttondown"]', weight: 0.95 },
      { type: 'request', pattern: /api\.buttondown\.(?:email|com)/, weight: 0.95 },
    ],
  },
  {
    id: 'emailoctopus',
    name: 'EmailOctopus',
    category: 'email',
    description: 'Low-cost email marketing',
    icon: 'emailoctopus',
    website: 'https://emailoctopus.com',
    signals: [
      { type: 'dom', selector: 'form[action*="emailoctopus.com"]', weight: 0.95 },
      { type: 'request', pattern: /(?:eocampaign1|emailoctopus)\.com\/(?:forms|api)/, weight: 0.95 },
    ],
  },
  {
    id: 'knock',
    name: 'Knock',
    category: 'email',
    description: 'Product notification infrastructure',
    icon: 'knock',
    website: 'https://knock.app',
    signals: [
      { type: 'request', pattern: /api\.knock\.app/, weight: 0.95 },
      { type: 'bundle', pattern: /@knocklabs\/(?:react|client)/, weight: 0.85 },
    ],
  },
  {
    id: 'courier',
    name: 'Courier',
    category: 'email',
    description: 'Multi-channel notification API',
    icon: 'courier',
    website: 'https://courier.com',
    signals: [
      { type: 'request', pattern: /api\.courier\.com|inbox\.courier\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'novu',
    name: 'Novu',
    category: 'email',
    description: 'Open-source notification infrastructure',
    icon: 'novu',
    website: 'https://novu.co',
    signals: [
      { type: 'request', pattern: /(?:api|ws)\.novu\.co/, weight: 0.95 },
      { type: 'bundle', pattern: /@novu\/(?:notification-center|react)/, weight: 0.85 },
    ],
  },
  {
    id: 'plunk',
    name: 'Plunk',
    category: 'email',
    description: 'Email for SaaS products',
    icon: 'plunk',
    website: 'https://useplunk.com',
    signals: [
      { type: 'request', pattern: /api\.useplunk\.com/, weight: 0.95 },
    ],
  },
]
