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
      // Left-anchored so a first-party `hero-video.js` or `promo-video.js` does
      // not match, while `vjs.zencdn.net/8.x/video.min.js` still does.
      { type: 'script', pattern: /(?:^|\/)video(?:\.min)?\.js|videojs|video-js/, weight: 0.85 },
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
  {
    id: 'jw-player',
    name: 'JW Player',
    category: 'media',
    description: 'Video player and hosting',
    icon: 'jwplayer',
    website: 'https://jwplayer.com',
    signals: [
      { type: 'global', path: 'jwplayer', weight: 0.95 },
      { type: 'script', pattern: /(?:content|cdn)\.jwplatform\.com|ssl\.p\.jwpcdn\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'brightcove',
    name: 'Brightcove',
    category: 'media',
    description: 'Enterprise video platform',
    icon: 'brightcove',
    website: 'https://brightcove.com',
    signals: [
      { type: 'script', pattern: /players\.brightcove\.net/, weight: 0.95 },
      { type: 'request', pattern: /(?:edge|metrics)\.api\.brightcove\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'kaltura',
    name: 'Kaltura',
    category: 'media',
    description: 'Video platform for education and enterprise',
    icon: 'kaltura',
    website: 'https://kaltura.com',
    signals: [
      { type: 'script', pattern: /cdnapi(?:sec)?\.kaltura\.com/, weight: 0.95 },
      { type: 'global', path: 'kWidget', weight: 0.9 },
    ],
  },
  {
    id: 'bitmovin',
    name: 'Bitmovin',
    category: 'media',
    description: 'Adaptive streaming player and encoding',
    icon: 'bitmovin',
    website: 'https://bitmovin.com',
    signals: [
      { type: 'global', path: 'bitmovin', weight: 0.9 },
      { type: 'request', pattern: /cdn\.bitmovin\.com|analytics\.bitmovin\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'api-video',
    name: 'api.video',
    category: 'media',
    description: 'Video hosting and streaming API',
    icon: 'apivideo',
    website: 'https://api.video',
    signals: [
      { type: 'request', pattern: /(?:embed|vod|ws)\.api\.video/, weight: 0.95 },
    ],
  },
  {
    id: 'vidyard',
    name: 'Vidyard',
    category: 'media',
    description: 'Video for sales and marketing',
    icon: 'vidyard',
    website: 'https://vidyard.com',
    signals: [
      { type: 'script', pattern: /play\.vidyard\.com\/embed/, weight: 0.95 },
      { type: 'dom', selector: 'img.vidyard-player-embed, .vidyard-player-container', weight: 0.9 },
    ],
  },
  {
    id: 'shaka-player',
    name: 'Shaka Player',
    category: 'media',
    description: 'Open-source adaptive streaming player',
    icon: 'shaka',
    website: 'https://shaka-player-demo.appspot.com',
    signals: [
      { type: 'global', path: 'shaka', weight: 0.9 },
      { type: 'script', pattern: /shaka-player(?:\.compiled|\.ui)?(?:\.min)?\.js/, weight: 0.95 },
    ],
  },
  {
    id: 'plyr',
    name: 'Plyr',
    category: 'media',
    description: 'Lightweight media player',
    icon: 'plyr',
    website: 'https://plyr.io',
    signals: [
      { type: 'global', path: 'Plyr', weight: 0.9 },
      { type: 'dom', selector: '.plyr, .plyr__video-wrapper', weight: 0.9 },
    ],
  },
  {
    id: 'dailymotion',
    name: 'Dailymotion',
    category: 'media',
    description: 'Video hosting and embeds',
    icon: 'dailymotion',
    website: 'https://dailymotion.com',
    signals: [
      { type: 'dom', selector: 'iframe[src*="dailymotion.com"]', weight: 0.9 },
      { type: 'request', pattern: /(?:geo|www)\.dailymotion\.com\/(?:player|embed)/, weight: 0.95 },
    ],
  },
  {
    id: 'spotify-embed',
    name: 'Spotify Embed',
    category: 'media',
    description: 'Embedded music and podcast player',
    icon: 'spotify',
    website: 'https://developer.spotify.com/documentation/embeds',
    signals: [
      { type: 'dom', selector: 'iframe[src*="open.spotify.com/embed"]', weight: 0.9 },
      { type: 'request', pattern: /open\.spotify\.com\/embed/, weight: 0.95 },
    ],
  },
]
