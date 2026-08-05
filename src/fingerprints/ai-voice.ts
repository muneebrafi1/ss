import type { Fingerprint } from '@/types'

/**
 * Voice AI — text-to-speech, speech-to-text, and voice agents.
 *
 * More detectable than text models: audio is streamed straight to the browser
 * to keep latency down, so the provider's domain usually appears in the request
 * log even when the site's text generation is entirely server-side.
 */
export const AI_VOICE: Fingerprint[] = [
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    category: 'ai-voice',
    description: 'AI voice generation and cloning',
    icon: 'elevenlabs',
    website: 'https://elevenlabs.io',
    signals: [
      { type: 'request', pattern: /(^|\.)api\.elevenlabs\.io/, weight: 0.95 },
      { type: 'request', pattern: /(^|\.)api\.us\.elevenlabs\.io/, weight: 0.95 },
      { type: 'script', pattern: /elevenlabs.*convai|convai-widget/, weight: 0.9 },
      { type: 'dom', selector: 'elevenlabs-convai', weight: 0.9 },
      { type: 'bundle', pattern: /@elevenlabs\/(?:react|client|elevenlabs-js)/, weight: 0.8 },
    ],
  },
  {
    id: 'deepgram',
    name: 'Deepgram',
    category: 'ai-voice',
    description: 'Speech-to-text transcription',
    icon: 'deepgram',
    website: 'https://deepgram.com',
    signals: [
      { type: 'request', pattern: /(^|\.)api\.deepgram\.com/, weight: 0.95 },
      { type: 'bundle', pattern: /@deepgram\/sdk/, weight: 0.8 },
    ],
  },
  {
    id: 'assemblyai',
    name: 'AssemblyAI',
    category: 'ai-voice',
    description: 'Speech-to-text and audio intelligence',
    icon: 'assemblyai',
    website: 'https://assemblyai.com',
    signals: [
      { type: 'request', pattern: /(^|\.)api\.assemblyai\.com/, weight: 0.95 },
      { type: 'request', pattern: /streaming\.assemblyai\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'cartesia',
    name: 'Cartesia',
    category: 'ai-voice',
    description: 'Low-latency voice generation',
    icon: 'cartesia',
    website: 'https://cartesia.ai',
    signals: [
      { type: 'request', pattern: /(^|\.)api\.cartesia\.ai/, weight: 0.95 },
      { type: 'bundle', pattern: /@cartesia\/cartesia-js/, weight: 0.8 },
    ],
  },
  {
    id: 'playht',
    name: 'PlayHT',
    category: 'ai-voice',
    description: 'AI voice generation',
    icon: 'playht',
    website: 'https://play.ht',
    signals: [
      { type: 'request', pattern: /(^|\.)api\.play\.ht/, weight: 0.95 },
      { type: 'script', pattern: /play\.ht\/.*widget/, weight: 0.85 },
    ],
  },
  {
    id: 'vapi',
    name: 'Vapi',
    category: 'ai-voice',
    description: 'Voice AI agents over phone and web',
    icon: 'vapi',
    website: 'https://vapi.ai',
    signals: [
      { type: 'request', pattern: /(^|\.)api\.vapi\.ai/, weight: 0.95 },
      { type: 'bundle', pattern: /@vapi-ai\/web/, weight: 0.85 },
    ],
  },
  {
    id: 'retell-ai',
    name: 'Retell AI',
    category: 'ai-voice',
    description: 'Voice agents for phone calls',
    icon: 'retell',
    website: 'https://retellai.com',
    signals: [
      { type: 'request', pattern: /(^|\.)api\.retellai\.com/, weight: 0.95 },
      { type: 'bundle', pattern: /retell-client-js-sdk/, weight: 0.85 },
    ],
  },
  {
    id: 'speechify',
    name: 'Speechify',
    category: 'ai-voice',
    description: 'Text-to-speech playback',
    icon: 'speechify',
    website: 'https://speechify.com',
    signals: [
      { type: 'request', pattern: /(^|\.)api\.sws\.speechify\.com/, weight: 0.95 },
      { type: 'script', pattern: /speechify.*widget|speechify-embed/, weight: 0.85 },
    ],
  },
  {
    id: 'whisper',
    name: 'Whisper',
    category: 'ai-voice',
    description: 'OpenAI speech recognition',
    icon: 'openai',
    website: 'https://openai.com/research/whisper',
    signals: [
      { type: 'request', pattern: /api\.openai\.com\/v1\/audio\/transcriptions/, weight: 0.95 },
      { type: 'bundle', pattern: /["'`]whisper-1["'`]|whisper-large-v[23]/, weight: 0.7 },
    ],
  },
  {
    id: 'hume',
    name: 'Hume AI',
    category: 'ai-voice',
    description: 'Emotionally expressive voice',
    icon: 'hume',
    website: 'https://hume.ai',
    signals: [{ type: 'request', pattern: /(^|\.)api\.hume\.ai/, weight: 0.95 }],
  },
  {
    id: 'gladia',
    name: 'Gladia',
    category: 'ai-voice',
    description: 'Speech-to-text and audio intelligence',
    icon: 'gladia',
    website: 'https://gladia.io',
    signals: [{ type: 'request', pattern: /(^|\.)api\.gladia\.io/, weight: 0.95 }],
  },
  {
    id: 'speechmatics',
    name: 'Speechmatics',
    category: 'ai-voice',
    description: 'Speech recognition',
    icon: 'speechmatics',
    website: 'https://speechmatics.com',
    signals: [{ type: 'request', pattern: /[\w-]*\.?speechmatics\.com/, weight: 0.95 }],
  },
  {
    id: 'resemble',
    name: 'Resemble AI',
    category: 'ai-voice',
    description: 'Voice cloning and synthesis',
    icon: 'resemble',
    website: 'https://resemble.ai',
    signals: [{ type: 'request', pattern: /(^|\.)(?:api|f)\.resemble\.ai/, weight: 0.95 }],
  },
  {
    id: 'murf',
    name: 'Murf AI',
    category: 'ai-voice',
    description: 'AI voiceover generation',
    icon: 'murf',
    website: 'https://murf.ai',
    signals: [{ type: 'request', pattern: /(^|\.)api\.murf\.ai/, weight: 0.95 }],
  },
]
