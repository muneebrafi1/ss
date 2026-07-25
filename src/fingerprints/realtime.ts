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
      // Package paths, not words — none of these three occur in prose.
      { type: 'bundle', pattern: /\by-websocket\b|\byjs\/dist\b|y-prosemirror/, weight: 0.9 },
    ],
  },
  {
    id: 'getstream',
    name: 'Stream',
    category: 'realtime',
    description: 'Chat, feeds, and video APIs',
    icon: 'getstream',
    website: 'https://getstream.io',
    signals: [
      { type: 'request', pattern: /chat[\w-]*\.stream-io-api\.com|getstream\.io\/api/, weight: 0.95 },
      { type: 'bundle', pattern: /stream-chat-react|@stream-io\/video-react-sdk/, weight: 0.85 },
    ],
  },
  {
    id: 'hundred-ms',
    name: '100ms',
    category: 'realtime',
    description: 'Live video and audio infrastructure',
    icon: 'hundredms',
    website: 'https://100ms.live',
    signals: [
      { type: 'request', pattern: /[\w-]+\.app\.100ms\.live|prod-in2?\.100ms\.live/, weight: 0.95 },
      { type: 'bundle', pattern: /@100mslive\/(?:react-sdk|hms-video)/, weight: 0.85 },
    ],
  },
  {
    id: 'twilio-video',
    name: 'Twilio Video',
    category: 'realtime',
    description: 'Programmable video rooms',
    icon: 'twilio',
    website: 'https://twilio.com/video',
    signals: [
      { type: 'global', path: 'Twilio.Video', weight: 0.9 },
      { type: 'request', pattern: /(?:global|ers)\.vss\.twilio\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'whereby',
    name: 'Whereby',
    category: 'realtime',
    description: 'Embeddable video meetings',
    icon: 'whereby',
    website: 'https://whereby.com',
    signals: [
      { type: 'dom', selector: 'whereby-embed, iframe[src*="whereby.com"]', weight: 0.9 },
      { type: 'request', pattern: /[\w-]*\.whereby\.com\/(?:embed|room)/, weight: 0.95 },
    ],
  },
  {
    id: 'jitsi',
    name: 'Jitsi',
    category: 'realtime',
    description: 'Open-source video conferencing',
    icon: 'jitsi',
    website: 'https://jitsi.org',
    signals: [
      { type: 'global', path: 'JitsiMeetExternalAPI', weight: 0.95 },
      { type: 'script', pattern: /external_api(?:\.min)?\.js|meet\.jit\.si/, weight: 0.9 },
    ],
  },
  {
    id: 'centrifugo',
    name: 'Centrifugo',
    category: 'realtime',
    description: 'Open-source realtime messaging server',
    icon: 'centrifugo',
    website: 'https://centrifugal.dev',
    signals: [
      { type: 'global', path: 'Centrifuge', weight: 0.9 },
      { type: 'bundle', pattern: /centrifuge(?:-js)?\/dist|\bCentrifuge\b.{0,20}subscribe/, weight: 0.8 },
    ],
  },
  {
    id: 'signalr',
    name: 'SignalR',
    category: 'realtime',
    description: 'Realtime messaging for ASP.NET',
    icon: 'dotnet',
    website: 'https://dotnet.microsoft.com/apps/aspnet/signalr',
    signals: [
      { type: 'request', pattern: /\/(?:signalr|hubs)\/negotiate/, weight: 0.9 },
      { type: 'bundle', pattern: /@microsoft\/signalr|HubConnectionBuilder/, weight: 0.85 },
    ],
  },
  {
    id: 'dyte',
    name: 'Dyte',
    category: 'realtime',
    description: 'Live video and voice SDK',
    icon: 'dyte',
    website: 'https://dyte.io',
    signals: [
      { type: 'request', pattern: /api\.(?:cluster\.)?dyte\.(?:io|in)/, weight: 0.95 },
      { type: 'bundle', pattern: /@dytesdk\/(?:react-web-core|web-core)/, weight: 0.85 },
    ],
  },
  {
    id: 'zoom-meeting-sdk',
    name: 'Zoom Meeting SDK',
    category: 'realtime',
    description: 'Embedded Zoom meetings',
    icon: 'zoom',
    website: 'https://developers.zoom.us/docs/meeting-sdk/web',
    signals: [
      { type: 'global', path: 'ZoomMtg', weight: 0.95 },
      { type: 'script', pattern: /source\.zoom\.us\/\d[\w.]*\/lib/, weight: 0.95 },
    ],
  },
]
