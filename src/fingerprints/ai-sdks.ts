import type { Fingerprint } from '@/types'

/**
 * AI orchestration libraries.
 *
 * The Vercel AI SDK is the one member of this group with a genuine passive
 * signal: its data-stream protocol sets a response header on the streaming
 * route, so it is detectable without a deep scan. The rest are server-side
 * libraries that only leave traces in client bundles.
 */
export const AI_SDKS: Fingerprint[] = [
  {
    id: 'vercel-ai-sdk',
    name: 'Vercel AI SDK',
    category: 'ai-sdks',
    description: 'Streaming AI responses into the UI',
    icon: 'vercel',
    website: 'https://sdk.vercel.ai',
    signals: [
      { type: 'header', name: 'x-vercel-ai-data-stream', weight: 0.95 },
      { type: 'header', name: 'x-vercel-ai-ui-message-stream', weight: 0.95 },
      { type: 'bundle', pattern: /\bai\/react\b|useChat.{0,40}streamProtocol/, weight: 0.7 },
      { type: 'bundle', pattern: /@ai-sdk\/(?:react|openai|anthropic|google)/, weight: 0.8 },
    ],
  },
  {
    id: 'langchain',
    name: 'LangChain',
    category: 'ai-sdks',
    description: 'Framework for chaining LLM calls',
    icon: 'langchain',
    website: 'https://langchain.com',
    signals: [
      { type: 'bundle', pattern: /@langchain\/(?:core|openai|community|anthropic)/, weight: 0.85 },
      { type: 'bundle', pattern: /langchain[\w/-]*\/(?:chains|agents|prompts)/, weight: 0.7 },
      { type: 'request', pattern: /(^|\.)api\.smith\.langchain\.com/, weight: 0.9 },
    ],
  },
  {
    id: 'llamaindex',
    name: 'LlamaIndex',
    category: 'ai-sdks',
    description: 'Data framework for retrieval-augmented generation',
    icon: 'llamaindex',
    website: 'https://llamaindex.ai',
    signals: [
      { type: 'bundle', pattern: /\bllamaindex\b|@llamaindex\//, weight: 0.8 },
      { type: 'request', pattern: /(^|\.)api\.cloud\.llamaindex\.ai/, weight: 0.9 },
    ],
  },
  {
    id: 'mastra',
    name: 'Mastra',
    category: 'ai-sdks',
    description: 'TypeScript framework for AI agents',
    icon: 'mastra',
    website: 'https://mastra.ai',
    signals: [{ type: 'bundle', pattern: /@mastra\/(?:core|client-js)/, weight: 0.85 }],
  },
  {
    id: 'assistant-ui',
    name: 'assistant-ui',
    category: 'ai-sdks',
    description: 'React components for chat interfaces',
    icon: 'react',
    website: 'https://assistant-ui.com',
    signals: [{ type: 'bundle', pattern: /@assistant-ui\/react/, weight: 0.85 }],
  },
  {
    id: 'copilotkit',
    name: 'CopilotKit',
    category: 'ai-sdks',
    description: 'In-app AI copilot components',
    icon: 'copilotkit',
    website: 'https://copilotkit.ai',
    signals: [
      { type: 'bundle', pattern: /@copilotkit\/(?:react-core|react-ui)/, weight: 0.85 },
      { type: 'request', pattern: /(^|\.)api\.cloud\.copilotkit\.ai/, weight: 0.9 },
    ],
  },
  {
    id: 'transformers-js',
    name: 'Transformers.js',
    category: 'ai-sdks',
    description: 'Running models directly in the browser',
    icon: 'huggingface',
    website: 'https://huggingface.co/docs/transformers.js',
    signals: [
      { type: 'bundle', pattern: /@(?:xenova|huggingface)\/transformers/, weight: 0.85 },
      { type: 'request', pattern: /\.onnx(?:\?|$)/, weight: 0.5 },
    ],
  },
  {
    id: 'onnx-runtime-web',
    name: 'ONNX Runtime Web',
    category: 'ai-sdks',
    description: 'Model inference in the browser',
    icon: 'onnx',
    website: 'https://onnxruntime.ai',
    signals: [
      { type: 'script', pattern: /onnxruntime-web|ort(?:\.min)?\.js/, weight: 0.85 },
      { type: 'global', path: 'ort', weight: 0.8 },
    ],
  },
  {
    id: 'tensorflow-js',
    name: 'TensorFlow.js',
    category: 'ai-sdks',
    description: 'Machine learning in the browser',
    icon: 'tensorflow',
    website: 'https://tensorflow.org/js',
    signals: [
      { type: 'global', path: 'tf', weight: 0.8 },
      { type: 'script', pattern: /tfjs|tensorflow(?:\.min)?\.js/, weight: 0.9 },
    ],
  },
]
