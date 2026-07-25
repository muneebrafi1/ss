import type { Fingerprint } from '@/types'

/**
 * Live chat, support widgets, and help centres.
 *
 * Trivially detectable — a chat widget is a visible iframe or launcher element
 * injected into the page, backed by a WebSocket to the vendor.
 */
export const CHAT: Fingerprint[] = [
  {
    id: 'intercom',
    name: 'Intercom',
    category: 'chat',
    description: 'Customer messaging and support',
    icon: 'intercom',
    website: 'https://intercom.com',
    signals: [
      { type: 'global', path: 'Intercom', weight: 0.95 },
      { type: 'request', pattern: /widget\.intercom\.io|(?:api|nexus)[\w-]*\.intercom\.io/, weight: 0.95 },
      { type: 'dom', selector: '#intercom-frame, .intercom-lightweight-app', weight: 0.9 },
    ],
  },
  {
    id: 'crisp',
    name: 'Crisp',
    category: 'chat',
    description: 'Live chat and shared inbox',
    icon: 'crisp',
    website: 'https://crisp.chat',
    signals: [
      { type: 'global', path: '$crisp', weight: 0.95 },
      { type: 'script', pattern: /client\.crisp\.chat/, weight: 0.95 },
      { type: 'dom', selector: '.crisp-client', weight: 0.9 },
    ],
  },
  {
    id: 'tidio',
    name: 'Tidio',
    category: 'chat',
    description: 'Live chat and chatbots',
    icon: 'tidio',
    website: 'https://tidio.com',
    signals: [
      { type: 'global', path: 'tidioChatApi', weight: 0.95 },
      { type: 'script', pattern: /code\.tidio\.co/, weight: 0.95 },
    ],
  },
  {
    id: 'zendesk',
    name: 'Zendesk',
    category: 'chat',
    description: 'Support ticketing and messaging',
    icon: 'zendesk',
    website: 'https://zendesk.com',
    signals: [
      { type: 'global', path: 'zE', weight: 0.95 },
      { type: 'script', pattern: /static\.zdassets\.com|zendesk\.com\/embeddable/, weight: 0.95 },
      { type: 'request', pattern: /[\w-]+\.zendesk\.com/, weight: 0.85 },
    ],
  },
  {
    id: 'drift',
    name: 'Drift',
    category: 'chat',
    description: 'Conversational marketing and sales chat',
    icon: 'drift',
    website: 'https://drift.com',
    signals: [
      { type: 'global', path: 'drift', weight: 0.95 },
      { type: 'script', pattern: /js\.driftt\.com|driftt\.com\/include/, weight: 0.95 },
    ],
  },
  {
    id: 'front',
    name: 'Front',
    category: 'chat',
    description: 'Shared inbox and customer communication',
    icon: 'front',
    website: 'https://front.com',
    signals: [
      { type: 'global', path: 'FrontChat', weight: 0.95 },
      { type: 'script', pattern: /chat-assets\.frontapp\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'livechat',
    name: 'LiveChat',
    category: 'chat',
    description: 'Live chat and help desk',
    icon: 'livechat',
    website: 'https://livechat.com',
    signals: [
      { type: 'global', path: 'LiveChatWidget', weight: 0.95 },
      { type: 'script', pattern: /cdn\.livechatinc\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'chatwoot',
    name: 'Chatwoot',
    category: 'chat',
    description: 'Open-source customer engagement',
    icon: 'chatwoot',
    website: 'https://chatwoot.com',
    signals: [
      { type: 'global', path: '$chatwoot', weight: 0.95 },
      { type: 'script', pattern: /[\w-]*\.?chatwoot\.com\/packs|sdk\.js.{0,20}chatwoot/, weight: 0.9 },
    ],
  },
  {
    id: 'helpscout',
    name: 'Help Scout',
    category: 'chat',
    description: 'Help desk and knowledge base',
    icon: 'helpscout',
    website: 'https://helpscout.com',
    signals: [
      { type: 'global', path: 'Beacon', weight: 0.9 },
      { type: 'script', pattern: /beacon-v2\.helpscout\.net/, weight: 0.95 },
    ],
  },
  {
    id: 'plain',
    name: 'Plain',
    category: 'chat',
    description: 'Support for technical products',
    icon: 'plain',
    website: 'https://plain.com',
    signals: [
      { type: 'global', path: 'Plain', weight: 0.9 },
      { type: 'script', pattern: /chat\.cdn-plain\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'pylon',
    name: 'Pylon',
    category: 'chat',
    description: 'B2B customer support platform',
    icon: 'pylon',
    website: 'https://usepylon.com',
    signals: [
      { type: 'global', path: 'Pylon', weight: 0.9 },
      { type: 'script', pattern: /widget\.usepylon\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'canny',
    name: 'Canny',
    category: 'chat',
    description: 'Feedback and feature request boards',
    icon: 'canny',
    website: 'https://canny.io',
    signals: [
      { type: 'global', path: 'Canny', weight: 0.95 },
      { type: 'script', pattern: /canny\.io\/sdk\.js/, weight: 0.95 },
    ],
  },
  {
    id: 'tawkto',
    name: 'Tawk.to',
    category: 'chat',
    description: 'Free live chat widget',
    icon: 'tawkto',
    website: 'https://tawk.to',
    signals: [
      { type: 'global', path: 'Tawk_API', weight: 0.95 },
      { type: 'script', pattern: /embed\.tawk\.to/, weight: 0.95 },
    ],
  },
  {
    id: 'freshdesk',
    name: 'Freshworks',
    category: 'chat',
    description: 'Support desk and messaging',
    icon: 'freshworks',
    website: 'https://freshworks.com',
    signals: [
      { type: 'global', path: 'fwSettings', weight: 0.9 },
      { type: 'script', pattern: /widget\.freshworks\.com|wchat\.freshchat\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'gorgias',
    name: 'Gorgias',
    category: 'chat',
    description: 'Support desk for ecommerce',
    icon: 'gorgias',
    website: 'https://gorgias.com',
    signals: [
      { type: 'global', path: 'GorgiasChat', weight: 0.95 },
      { type: 'script', pattern: /config\.gorgias\.chat|assets\.gorgias\.chat/, weight: 0.95 },
    ],
  },
  {
    id: 'olark',
    name: 'Olark',
    category: 'chat',
    description: 'Live chat',
    icon: 'olark',
    website: 'https://olark.com',
    signals: [
      { type: 'global', path: 'olark', weight: 0.95 },
      { type: 'script', pattern: /static\.olark\.com/, weight: 0.95 },
    ],
  },
]
