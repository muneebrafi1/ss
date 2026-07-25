import type { Fingerprint } from '@/types'

/**
 * Video hosting and players.
 *
 * Straightforward to detect — the player script and the segment requests for
 * the video stream both come from the provider's own domains.
 */
export const MEDIA: Fingerprint[] = [
  {
    id: 'mux',
    name: 'Mux',
    category: 'media',
    description: 'Video streaming infrastructure',
    icon: 'mux',
    website: 'https://mux.com',
    signals: [
      { type: 'request', pattern: /stream\.mux\.com|image\.mux\.com|inferred\.litix\.io/, weight: 0.95 },
      { type: 'dom', selector: 'mux-player, mux-video', weight: 0.95 },
      { type: 'bundle', pattern: /@mux\/(?:mux-player|mux-video|playback-core)/, weight: 0.85 },
    ],
  },
  {
    id: 'cloudflare-stream',
    name: 'Cloudflare Stream',
    category: 'media',
    description: 'Video streaming and delivery',
    icon: 'cloudflare',
    website: 'https://cloudflare.com/products/cloudflare-stream',
    signals: [
      { type: 'request', pattern: /videodelivery\.net|customer-[\w]+\.cloudflarestream\.com/, weight: 0.95 },
      { type: 'dom', selector: 'stream, iframe[src*="cloudflarestream.com"]', weight: 0.9 },
    ],
  },
  {
    id: 'vimeo',
    name: 'Vimeo',
    category: 'media',
    description: 'Video hosting and player',
    icon: 'vimeo',
    website: 'https://vimeo.com',
    signals: [
      { type: 'global', path: 'Vimeo', weight: 0.9 },
      { type: 'request', pattern: /player\.vimeo\.com|vimeocdn\.com/, weight: 0.95 },
      { type: 'dom', selector: 'iframe[src*="player.vimeo.com"]', weight: 0.95 },
    ],
  },
  {
    id: 'youtube-embed',
    name: 'YouTube',
    category: 'media',
    description: 'Embedded video player',
    icon: 'youtube',
    website: 'https://youtube.com',
    signals: [
      { type: 'request', pattern: /www\.youtube(?:-nocookie)?\.com\/embed|i\.ytimg\.com/, weight: 0.9 },
      { type: 'dom', selector: 'iframe[src*="youtube.com/embed"], iframe[src*="youtube-nocookie.com"]', weight: 0.95 },
      { type: 'global', path: 'YT', weight: 0.85 },
    ],
  },
  {
    id: 'wistia',
    name: 'Wistia',
    category: 'media',
    description: 'Video hosting for marketing',
    icon: 'wistia',
    website: 'https://wistia.com',
    signals: [
      { type: 'global', path: 'Wistia', weight: 0.95 },
      { type: 'request', pattern: /fast\.wistia\.(?:net|com)|embedwistia/, weight: 0.95 },
    ],
  },
  {
    id: 'loom',
    name: 'Loom',
    category: 'media',
    description: 'Screen recording and video messaging',
    icon: 'loom',
    website: 'https://loom.com',
    signals: [
      { type: 'request', pattern: /cdn\.loom\.com|www\.loom\.com\/embed/, weight: 0.95 },
      { type: 'dom', selector: 'iframe[src*="loom.com/embed"]', weight: 0.95 },
    ],
  },
  {
    id: 'videojs',
    name: 'Video.js',
    category: 'media',
    description: 'Open-source HTML5 video player',
    icon: 'videodotjs',
    website: 'https://videojs.com',
    signals: [
      { type: 'global', path: 'videojs', weight: 0.95 },
      { type: 'script', pattern: /video(?:\.min)?\.js|videojs/, weight: 0.85 },
    ],
    version: [{ from: 'global', path: 'videojs.VERSION' }],
  },
  {
    id: 'hlsjs',
    name: 'hls.js',
    category: 'media',
    description: 'HLS streaming playback in the browser',
    icon: 'hlsjs',
    website: 'https://github.com/video-dev/hls.js',
    signals: [
      { type: 'global', path: 'Hls', weight: 0.9 },
      { type: 'script', pattern: /hls(?:\.min|\.light)?\.js/, weight: 0.85 },
    ],
  },
]
