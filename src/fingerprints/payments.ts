import type { Fingerprint } from '@/types'

/**
 * Payment processors.
 *
 * The single most reliable category. PCI requirements push card entry into a
 * provider-hosted iframe, so the provider's script and frame are always present
 * on any page that takes money — there is no server-side-only way to do this.
 */
export const PAYMENTS: Fingerprint[] = [
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'payments',
    description: 'Payments, billing, and subscriptions',
    icon: 'stripe',
    website: 'https://stripe.com',
    signals: [
      { type: 'global', path: 'Stripe', weight: 0.95 },
      { type: 'script', pattern: /js\.stripe\.com/, weight: 0.95 },
      { type: 'request', pattern: /(?:^|\.)(?:api|js|m|r|checkout)\.stripe\.com/, weight: 0.9 },
      { type: 'cookie', pattern: /^__stripe_(?:mid|sid)$/, weight: 0.9 },
      { type: 'dom', selector: 'iframe[name^="__privateStripeFrame"]', weight: 0.9 },
    ],
  },
  {
    id: 'paddle',
    name: 'Paddle',
    category: 'payments',
    description: 'Merchant of record for software',
    icon: 'paddle',
    website: 'https://paddle.com',
    signals: [
      { type: 'global', path: 'Paddle', weight: 0.95 },
      { type: 'script', pattern: /(?:cdn|buy)\.paddle\.com/, weight: 0.95 },
      { type: 'request', pattern: /checkout-service\.paddle\.com|(^|\.)api\.paddle\.com/, weight: 0.9 },
    ],
  },
  {
    id: 'lemon-squeezy',
    name: 'Lemon Squeezy',
    category: 'payments',
    description: 'Merchant of record for digital products',
    icon: 'lemonsqueezy',
    website: 'https://lemonsqueezy.com',
    signals: [
      { type: 'global', path: 'LemonSqueezy', weight: 0.95 },
      { type: 'script', pattern: /lemonsqueezy|lmsqueezy/, weight: 0.9 },
      { type: 'request', pattern: /[\w-]*\.?lemonsqueezy\.com\//, weight: 0.9 },
    ],
  },
  {
    id: 'polar',
    name: 'Polar',
    category: 'payments',
    description: 'Monetization for developers',
    icon: 'polar',
    website: 'https://polar.sh',
    signals: [
      { type: 'request', pattern: /(^|\.)api\.polar\.sh|buy\.polar\.sh/, weight: 0.95 },
      { type: 'bundle', pattern: /@polar-sh\/(?:sdk|checkout)/, weight: 0.85 },
    ],
  },
  {
    id: 'paypal',
    name: 'PayPal',
    category: 'payments',
    description: 'Online payments and checkout',
    icon: 'paypal',
    website: 'https://paypal.com',
    signals: [
      { type: 'global', path: 'paypal', weight: 0.9 },
      { type: 'script', pattern: /www\.paypal\.com\/sdk\/js|paypalobjects\.com/, weight: 0.9 },
      { type: 'request', pattern: /(?:^|\.)(?:www|api-m)\.paypal\.com\//, weight: 0.85 },
    ],
  },
  {
    id: 'razorpay',
    name: 'Razorpay',
    category: 'payments',
    description: 'Payments for Indian businesses',
    icon: 'razorpay',
    website: 'https://razorpay.com',
    signals: [
      { type: 'global', path: 'Razorpay', weight: 0.95 },
      { type: 'script', pattern: /checkout\.razorpay\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'square',
    name: 'Square',
    category: 'payments',
    description: 'Payments and point of sale',
    icon: 'square',
    website: 'https://squareup.com',
    signals: [
      { type: 'global', path: 'Square', weight: 0.9 },
      { type: 'script', pattern: /web\.squarecdn\.com|js\.squareup\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'adyen',
    name: 'Adyen',
    category: 'payments',
    description: 'Enterprise payment platform',
    icon: 'adyen',
    website: 'https://adyen.com',
    signals: [
      { type: 'global', path: 'AdyenCheckout', weight: 0.95 },
      { type: 'script', pattern: /checkoutshopper-(?:live|test)\.adyen\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'braintree',
    name: 'Braintree',
    category: 'payments',
    description: 'Payments platform owned by PayPal',
    icon: 'braintree',
    website: 'https://braintreepayments.com',
    signals: [
      { type: 'global', path: 'braintree', weight: 0.9 },
      { type: 'script', pattern: /js\.braintreegateway\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'chargebee',
    name: 'Chargebee',
    category: 'payments',
    description: 'Subscription billing and revenue',
    icon: 'chargebee',
    website: 'https://chargebee.com',
    signals: [
      { type: 'global', path: 'Chargebee', weight: 0.95 },
      { type: 'script', pattern: /js\.chargebee\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'mollie',
    name: 'Mollie',
    category: 'payments',
    description: 'European payment processing',
    icon: 'mollie',
    website: 'https://mollie.com',
    signals: [
      { type: 'global', path: 'Mollie', weight: 0.9 },
      { type: 'script', pattern: /js\.mollie\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'klarna',
    name: 'Klarna',
    category: 'payments',
    description: 'Buy now, pay later',
    icon: 'klarna',
    website: 'https://klarna.com',
    signals: [
      { type: 'global', path: 'Klarna', weight: 0.9 },
      { type: 'script', pattern: /x\.klarnacdn\.net|js\.klarna\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'afterpay',
    name: 'Afterpay',
    category: 'payments',
    description: 'Buy now, pay later',
    icon: 'afterpay',
    website: 'https://afterpay.com',
    signals: [
      { type: 'script', pattern: /static\.afterpay\.com|js\.afterpay\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'affirm',
    name: 'Affirm',
    category: 'payments',
    description: 'Pay-over-time financing',
    icon: 'affirm',
    website: 'https://affirm.com',
    signals: [
      { type: 'global', path: 'affirm', weight: 0.9 },
      { type: 'script', pattern: /cdn1?\.affirm\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'gumroad',
    name: 'Gumroad',
    category: 'payments',
    description: 'Selling digital products',
    icon: 'gumroad',
    website: 'https://gumroad.com',
    signals: [
      { type: 'script', pattern: /gumroad\.com\/js|assets\.gumroad\.com/, weight: 0.9 },
    ],
  },
  {
    id: 'revenuecat',
    name: 'RevenueCat',
    category: 'payments',
    description: 'Subscription infrastructure',
    icon: 'revenuecat',
    website: 'https://revenuecat.com',
    signals: [
      { type: 'request', pattern: /(^|\.)api\.revenuecat\.com/, weight: 0.95 },
      { type: 'bundle', pattern: /@revenuecat\/purchases-js/, weight: 0.85 },
    ],
  },
  {
    id: 'paystack',
    name: 'Paystack',
    category: 'payments',
    description: 'Payments for African businesses',
    icon: 'paystack',
    website: 'https://paystack.com',
    signals: [
      { type: 'global', path: 'PaystackPop', weight: 0.95 },
      { type: 'script', pattern: /js\.paystack\.co/, weight: 0.95 },
    ],
  },
  {
    id: 'flutterwave',
    name: 'Flutterwave',
    category: 'payments',
    description: 'Payments across Africa',
    icon: 'flutterwave',
    website: 'https://flutterwave.com',
    signals: [
      { type: 'global', path: 'FlutterwaveCheckout', weight: 0.95 },
      { type: 'script', pattern: /checkout\.flutterwave\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'mercadopago',
    name: 'Mercado Pago',
    category: 'payments',
    description: 'Payments across Latin America',
    icon: 'mercadopago',
    website: 'https://mercadopago.com',
    signals: [
      { type: 'global', path: 'MercadoPago', weight: 0.95 },
      { type: 'script', pattern: /sdk\.mercadopago\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'shopify-payments',
    name: 'Shop Pay',
    category: 'payments',
    description: "Shopify's accelerated checkout",
    icon: 'shopify',
    website: 'https://shop.app',
    implies: ['shopify'],
    signals: [
      { type: 'request', pattern: /portal\.shop\.app|pay\.shopify\.com/, weight: 0.95 },
    ],
  },
]
