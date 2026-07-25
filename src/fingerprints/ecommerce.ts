import type { Fingerprint } from '@/types'

/**
 * Ecommerce platforms.
 *
 * Easy to detect: storefronts ship cart state, product data, and checkout logic
 * to the browser, and hosted platforms serve their assets from recognisable
 * CDNs.
 */
export const ECOMMERCE: Fingerprint[] = [
  {
    id: 'shopify',
    name: 'Shopify',
    category: 'ecommerce',
    description: 'Hosted ecommerce platform',
    icon: 'shopify',
    website: 'https://shopify.com',
    signals: [
      { type: 'global', path: 'Shopify', weight: 0.95 },
      { type: 'request', pattern: /cdn\.shopify\.com|[\w-]+\.myshopify\.com/, weight: 0.95 },
      { type: 'html', pattern: /cdn\.shopify\.com|Shopify\.theme/, weight: 0.9 },
      { type: 'cookie', pattern: /^_shopify_|^cart_currency$/, weight: 0.85 },
    ],
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    category: 'ecommerce',
    description: 'Ecommerce plugin for WordPress',
    icon: 'woocommerce',
    website: 'https://woocommerce.com',
    implies: ['wordpress', 'php'],
    signals: [
      { type: 'meta', name: 'generator', pattern: /WooCommerce/i, weight: 0.95 },
      { type: 'html', pattern: /woocommerce(?:-page|-js)?|wc-block/, weight: 0.85 },
      { type: 'cookie', pattern: /^woocommerce_|^wp_woocommerce_session_/, weight: 0.9 },
    ],
    version: [{ from: 'meta', name: 'generator', pattern: /WooCommerce\s+([\d.]+)/ }],
  },
  {
    id: 'bigcommerce',
    name: 'BigCommerce',
    category: 'ecommerce',
    description: 'Hosted ecommerce platform',
    icon: 'bigcommerce',
    website: 'https://bigcommerce.com',
    signals: [
      { type: 'request', pattern: /cdn\d*\.bigcommerce\.com|[\w-]+\.mybigcommerce\.com/, weight: 0.95 },
      { type: 'global', path: 'BCData', weight: 0.95 },
    ],
  },
  {
    id: 'magento',
    name: 'Magento',
    category: 'ecommerce',
    description: 'Open-source ecommerce platform',
    icon: 'magento',
    website: 'https://business.adobe.com/products/magento',
    implies: ['php'],
    signals: [
      { type: 'cookie', pattern: /^(?:mage-|X-Magento)/, weight: 0.9 },
      { type: 'html', pattern: /\/static\/version\d+\/frontend\/|Magento_/, weight: 0.9 },
      { type: 'global', path: 'requirejs', weight: 0.4 },
    ],
  },
  {
    id: 'prestashop',
    name: 'PrestaShop',
    category: 'ecommerce',
    description: 'Open-source ecommerce platform',
    icon: 'prestashop',
    website: 'https://prestashop.com',
    implies: ['php'],
    signals: [
      { type: 'meta', name: 'generator', pattern: /PrestaShop/i, weight: 0.95 },
      { type: 'global', path: 'prestashop', weight: 0.95 },
    ],
  },
  {
    id: 'snipcart',
    name: 'Snipcart',
    category: 'ecommerce',
    description: 'Cart for any website',
    icon: 'snipcart',
    website: 'https://snipcart.com',
    signals: [
      { type: 'global', path: 'Snipcart', weight: 0.95 },
      { type: 'script', pattern: /cdn\.snipcart\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'medusa',
    name: 'Medusa',
    category: 'ecommerce',
    description: 'Open-source commerce engine',
    icon: 'medusa',
    website: 'https://medusajs.com',
    signals: [
      { type: 'request', pattern: /\/store\/(?:products|carts|regions)\?/, weight: 0.75 },
      { type: 'bundle', pattern: /@medusajs\/(?:medusa-js|js-sdk)/, weight: 0.85 },
    ],
  },
  {
    id: 'swell',
    name: 'Swell',
    category: 'ecommerce',
    description: 'Headless ecommerce platform',
    icon: 'swell',
    website: 'https://swell.is',
    signals: [
      { type: 'request', pattern: /[\w-]+\.swell\.store|(^|\.)api\.swell\.store/, weight: 0.95 },
    ],
  },
  {
    id: 'salesforce-commerce',
    name: 'Salesforce Commerce Cloud',
    category: 'ecommerce',
    description: 'Enterprise commerce platform',
    icon: 'salesforce',
    website: 'https://salesforce.com/products/commerce',
    signals: [
      { type: 'request', pattern: /\.demandware\.net|\/on\/demandware\.store/, weight: 0.95 },
      { type: 'html', pattern: /demandware\.static|dwfrm_/, weight: 0.85 },
    ],
  },
  {
    id: 'vtex',
    name: 'VTEX',
    category: 'ecommerce',
    description: 'Commerce platform used across Latin America',
    icon: 'vtex',
    website: 'https://vtex.com',
    signals: [
      { type: 'global', path: 'vtex', weight: 0.9 },
      { type: 'request', pattern: /\.vtexassets\.com|\.vtexcommercestable\.com\.br/, weight: 0.95 },
    ],
  },
  {
    id: 'shopware',
    name: 'Shopware',
    category: 'ecommerce',
    description: 'Open-source commerce platform',
    icon: 'shopware',
    website: 'https://shopware.com',
    signals: [
      { type: 'meta', name: 'generator', pattern: /Shopware/i, weight: 0.95 },
      { type: 'html', pattern: /shopware\/storefront|data-cms-element-id/, weight: 0.8 },
      { type: 'cookie', pattern: /^session-\d+$|^sw-cache-hash$/, weight: 0.7 },
    ],
  },
  {
    id: 'saleor',
    name: 'Saleor',
    category: 'ecommerce',
    description: 'GraphQL-first commerce backend',
    icon: 'saleor',
    website: 'https://saleor.io',
    signals: [
      { type: 'request', pattern: /[\w-]+\.saleor\.cloud\/graphql/, weight: 0.95 },
      { type: 'bundle', pattern: /@saleor\/(?:sdk|app-sdk)/, weight: 0.85 },
    ],
  },
  {
    id: 'ecwid',
    name: 'Ecwid',
    category: 'ecommerce',
    description: 'Storefront widget for existing sites',
    icon: 'ecwid',
    website: 'https://ecwid.com',
    signals: [
      { type: 'global', path: 'Ecwid', weight: 0.95 },
      { type: 'script', pattern: /app\.ecwid\.com\/script\.js/, weight: 0.95 },
    ],
  },
  {
    id: 'opencart',
    name: 'OpenCart',
    category: 'ecommerce',
    description: 'Open-source PHP store platform',
    icon: 'opencart',
    website: 'https://opencart.com',
    signals: [
      { type: 'html', pattern: /index\.php\?route=(?:common|product|checkout)\//, weight: 0.9 },
      { type: 'cookie', pattern: /^OCSESSID$/, weight: 0.95 },
    ],
  },
  {
    id: 'big-cartel',
    name: 'Big Cartel',
    category: 'ecommerce',
    description: 'Stores for independent makers',
    icon: 'bigcartel',
    website: 'https://bigcartel.com',
    signals: [
      { type: 'request', pattern: /assets\.bigcartel\.com|\.bigcartel\.com\/(?:cart|product)/, weight: 0.95 },
    ],
  },
  {
    id: 'lightspeed',
    name: 'Lightspeed',
    category: 'ecommerce',
    description: 'Retail and commerce platform',
    icon: 'lightspeed',
    website: 'https://lightspeedhq.com',
    signals: [
      { type: 'request', pattern: /cdn\.shoplightspeed\.com|\.webshopapp\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'commercetools',
    name: 'commercetools',
    category: 'ecommerce',
    description: 'Headless commerce APIs',
    icon: 'commercetools',
    website: 'https://commercetools.com',
    signals: [
      { type: 'request', pattern: /api\.[\w-]+\.commercetools\.com/, weight: 0.95 },
      { type: 'bundle', pattern: /@commercetools\/(?:sdk|platform-sdk)/, weight: 0.85 },
    ],
  },
  {
    id: 'shopify-hydrogen',
    name: 'Shopify Hydrogen',
    category: 'ecommerce',
    description: "Shopify's React storefront framework",
    icon: 'shopify',
    website: 'https://hydrogen.shop',
    // Only the package specifier. `x-shopid` is served by every Shopify store,
    // Hydrogen or not, so as a 0.6 signal it cleared the display threshold alone
    // and labelled a plain Liquid storefront as Hydrogen.
    signals: [{ type: 'bundle', pattern: /@shopify\/hydrogen(?:-react)?/, weight: 0.9 }],
    implies: ['shopify'],
  },
]
