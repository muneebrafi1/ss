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
]
