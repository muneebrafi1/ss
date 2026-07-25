import type { Fingerprint } from '@/types'

/**
 * Realtime messaging and collaboration.
 *
 * Very detectable: a persistent WebSocket to the provider's domain is the whole
 * point of these services, so the connection shows up in the request log
 * immediately and unambiguously.
 */
export const REALTIME: Fingerprint[] = [
  {
    id: 'pusher',
    name: 'Pusher',
    category: 'realtime',
    description: 'Hosted realtime messaging',
    icon: 'pusher',
    website: 'https://pusher.com',
    signals: [
      { type: 'global', path: 'Pusher', weight: 0.95 },
      { type: 'request', pattern: /ws-[\w-]+\.pusher(?:app)?\.com|sockjs.*\.pusher\.com/, weight: 0.95 },
      { type: 'script', pattern: /js\.pusher\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'ably',
    name: 'Ably',
    category: 'realtime',
    description: 'Realtime messaging infrastructure',
    icon: 'ably',
    website: 'https://ably.com',
    signals: [
      { type: 'global', path: 'Ably', weight: 0.95 },
      { type: 'request', pattern: /(?:realtime|rest)\.ably\.io|[\w-]+\.ably-realtime\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'liveblocks',
    name: 'Liveblocks',
    category: 'realtime',
    description: 'Collaborative editing and presence',
    icon: 'liveblocks',
    website: 'https://liveblocks.io',
    signals: [
      { type: 'request', pattern: /(?:^|\.)(?:api|liveblocks)\.liveblocks\.io/, weight: 0.95 },
      { type: 'bundle', pattern: /@liveblocks\/(?:client|react)/, weight: 0.85 },
    ],
  },
  {
    id: 'partykit',
    name: 'PartyKit',
    category: 'realtime',
    description: 'Realtime multiplayer backends',
    icon: 'partykit',
    website: 'https://partykit.io',
    signals: [
      { type: 'request', pattern: /[\w-]+\.[\w-]+\.partykit\.dev/, weight: 0.95 },
      { type: 'bundle', pattern: /partysocket|partykit\/client/, weight: 0.85 },
    ],
  },
  {
    id: 'socketio',
    name: 'Socket.IO',
    category: 'realtime',
    description: 'WebSocket library for realtime apps',
    icon: 'socketdotio',
    website: 'https://socket.io',
    signals: [
      { type: 'global', path: 'io', weight: 0.75 },
      { type: 'request', pattern: /\/socket\.io\/\?EIO=/, weight: 0.95 },
      { type: 'script', pattern: /socket\.io(?:\.min)?\.js/, weight: 0.9 },
    ],
  },
  {
    id: 'livekit',
    name: 'LiveKit',
    category: 'realtime',
    description: 'Open-source realtime audio and video',
    icon: 'livekit',
    website: 'https://livekit.io',
    signals: [
      { type: 'request', pattern: /[\w-]+\.livekit\.cloud/, weight: 0.95 },
      { type: 'bundle', pattern: /livekit-client|@livekit\/components-react/, weight: 0.85 },
    ],
  },
  {
    id: 'daily',
    name: 'Daily',
    category: 'realtime',
    description: 'Video and audio calling API',
    icon: 'daily',
    website: 'https://daily.co',
    signals: [
      { type: 'global', path: 'DailyIframe', weight: 0.95 },
      { type: 'request', pattern: /[\w-]+\.daily\.co|c\.daily\.co/, weight: 0.9 },
      { type: 'script', pattern: /unpkg\.com\/@daily-co\/daily-js/, weight: 0.95 },
    ],
  },
  {
    id: 'agora',
    name: 'Agora',
    category: 'realtime',
    description: 'Realtime voice and video SDK',
    icon: 'agora',
    website: 'https://agora.io',
    signals: [
      { type: 'global', path: 'AgoraRTC', weight: 0.95 },
      { type: 'request', pattern: /[\w-]*\.?agora\.io|webrtc[\w-]*\.agora/, weight: 0.9 },
    ],
  },
  {
    id: 'twilio',
    name: 'Twilio',
    category: 'realtime',
    description: 'Messaging, voice, and video APIs',
    icon: 'twilio',
    website: 'https://twilio.com',
    signals: [
      { type: 'global', path: 'Twilio', weight: 0.95 },
      { type: 'request', pattern: /(?:^|\.)(?:api|media|chunderw-\w+)\.twilio\.com/, weight: 0.9 },
      { type: 'script', pattern: /sdk\.twilio\.com|media\.twiliocdn\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'yjs',
    name: 'Yjs',
    category: 'realtime',
    description: 'Conflict-free collaborative data types',
    icon: 'yjs',
    website: 'https://yjs.dev',
    signals: [
      { type: 'bundle', pattern: /\by-websocket\b|\byjs\/dist\b|y-prosemirror/, weight: 0.8 },
    ],
  },
]
