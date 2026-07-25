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
    // A scoped npm specifier cannot appear in a bundle by coincidence.
    signals: [{ type: 'bundle', pattern: /@mastra\/(?:core|client-js)/, weight: 0.9 }],
  },
  {
    id: 'assistant-ui',
    name: 'assistant-ui',
    category: 'ai-sdks',
    description: 'React components for chat interfaces',
    icon: 'react',
    website: 'https://assistant-ui.com',
    // Same: the scope makes this proof rather than a hint.
    signals: [{ type: 'bundle', pattern: /@assistant-ui\/react/, weight: 0.9 }],
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
  {
    id: 'langfuse',
    name: 'Langfuse',
    category: 'ai-sdks',
    description: 'Tracing and evaluation for LLM apps',
    icon: 'langfuse',
    website: 'https://langfuse.com',
    signals: [
      { type: 'request', pattern: /cloud\.langfuse\.com|(^|\.)api\.langfuse\.com/, weight: 0.95 },
      { type: 'bundle', pattern: /langfuse(?:-langchain|\/web)?/, weight: 0.7 },
    ],
  },
  {
    id: 'helicone',
    name: 'Helicone',
    category: 'ai-sdks',
    description: 'Observability proxy for LLM calls',
    icon: 'helicone',
    website: 'https://helicone.ai',
    signals: [
      { type: 'request', pattern: /oai\.helicone\.ai|(^|\.)api\.helicone\.ai/, weight: 0.95 },
      { type: 'header', name: 'helicone-id', weight: 0.9 },
    ],
  },
  {
    id: 'portkey',
    name: 'Portkey',
    category: 'ai-sdks',
    description: 'AI gateway and routing',
    icon: 'portkey',
    website: 'https://portkey.ai',
    signals: [{ type: 'request', pattern: /(^|\.)api\.portkey\.ai/, weight: 0.95 }],
  },
  {
    id: 'braintrust',
    name: 'Braintrust',
    category: 'ai-sdks',
    description: 'Evaluation and logging for AI products',
    icon: 'braintrust',
    website: 'https://braintrust.dev',
    signals: [{ type: 'request', pattern: /(^|\.)api\.braintrust\.dev|braintrustdata\.com/, weight: 0.95 }],
  },
  /*
   * CrewAI and Pydantic AI used to sit here and have been removed on purpose.
   *
   * Both are Python-only server frameworks with no browser artefact of any
   * kind, so the only thing their patterns could ever match is a page that
   * *mentions* them — a docs site, a comparison post, a job ad. That is a
   * detector for the word, not for the technology, and shipping it would break
   * the one promise the panel makes by showing nothing at all when it is
   * unsure. LangChain and LlamaIndex stay because both publish JavaScript
   * packages that genuinely run in the browser.
   */
  {
    id: 'litellm',
    name: 'LiteLLM',
    category: 'ai-sdks',
    description: 'One interface across model providers',
    icon: 'litellm',
    website: 'https://litellm.ai',
    signals: [
      { type: 'bundle', pattern: /\blitellm\b/, weight: 0.75 },
      { type: 'header', name: 'x-litellm-model-id', weight: 0.95 },
    ],
  },
  {
    id: 'mcp',
    name: 'Model Context Protocol',
    category: 'ai-sdks',
    description: 'Standard for connecting tools to models',
    icon: 'mcp',
    website: 'https://modelcontextprotocol.io',
    signals: [
      { type: 'bundle', pattern: /@modelcontextprotocol\/sdk/, weight: 0.85 },
      { type: 'request', pattern: /\/mcp(?:\/sse|\/messages)?(?:$|\?)/, weight: 0.55 },
    ],
  },
]
