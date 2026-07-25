import type { Fingerprint } from '@/types'

/**
 * Vector databases and search infrastructure.
 *
 * Worth more than its size suggests for AI detection: hosted search services
 * are queried straight from the browser for latency, so they are reliably
 * visible even on sites whose model calls happen entirely server-side. A
 * Pinecone or Weaviate request is often the clearest evidence that a site is
 * doing real retrieval work.
 */
export const VECTOR_SEARCH: Fingerprint[] = [
  {
    id: 'pinecone',
    name: 'Pinecone',
    category: 'vector-search',
    description: 'Managed vector database',
    icon: 'pinecone',
    website: 'https://pinecone.io',
    signals: [
      { type: 'request', pattern: /[\w-]+\.svc\.[\w-]+\.pinecone\.io/, weight: 0.95 },
      { type: 'request', pattern: /(^|\.)api\.pinecone\.io/, weight: 0.95 },
      { type: 'bundle', pattern: /@pinecone-database\/pinecone/, weight: 0.8 },
    ],
  },
  {
    id: 'weaviate',
    name: 'Weaviate',
    category: 'vector-search',
    description: 'Open-source vector database',
    icon: 'weaviate',
    website: 'https://weaviate.io',
    signals: [
      { type: 'request', pattern: /[\w-]+\.weaviate\.(?:network|cloud|io)/, weight: 0.95 },
      { type: 'bundle', pattern: /weaviate-(?:ts-)?client/, weight: 0.8 },
    ],
  },
  {
    id: 'qdrant',
    name: 'Qdrant',
    category: 'vector-search',
    description: 'Open-source vector database',
    icon: 'qdrant',
    website: 'https://qdrant.tech',
    signals: [
      { type: 'request', pattern: /[\w-]+\.(?:aws|gcp|azure)\.cloud\.qdrant\.io/, weight: 0.95 },
      { type: 'bundle', pattern: /@qdrant\/js-client/, weight: 0.8 },
    ],
  },
  {
    id: 'chroma',
    name: 'Chroma',
    category: 'vector-search',
    description: 'Open-source embedding database',
    icon: 'chroma',
    website: 'https://trychroma.com',
    signals: [
      { type: 'request', pattern: /(^|\.)api\.trychroma\.com/, weight: 0.95 },
      { type: 'bundle', pattern: /chromadb(?:-default-embed)?/, weight: 0.75 },
    ],
  },
  {
    id: 'milvus',
    name: 'Milvus',
    category: 'vector-search',
    description: 'Open-source vector database',
    icon: 'milvus',
    website: 'https://milvus.io',
    signals: [
      { type: 'request', pattern: /[\w-]+\.(?:api|serverless)\.[\w-]+\.zillizcloud\.com/, weight: 0.95 },
      { type: 'bundle', pattern: /@zilliz\/milvus2-sdk-node/, weight: 0.8 },
    ],
  },
  {
    id: 'turbopuffer',
    name: 'turbopuffer',
    category: 'vector-search',
    description: 'Vector and full-text search on object storage',
    icon: 'turbopuffer',
    website: 'https://turbopuffer.com',
    signals: [{ type: 'request', pattern: /(^|\.)api\.turbopuffer\.com/, weight: 0.95 }],
  },
  {
    id: 'algolia',
    name: 'Algolia',
    category: 'vector-search',
    description: 'Hosted search as a service',
    icon: 'algolia',
    website: 'https://algolia.com',
    signals: [
      { type: 'request', pattern: /[\w-]+(?:-dsn)?\.algolia(?:net\.com|\.net)/, weight: 0.95 },
      { type: 'request', pattern: /insights\.algolia\.io/, weight: 0.9 },
      { type: 'script', pattern: /algoliasearch|instantsearch/, weight: 0.85 },
      { type: 'global', path: 'algoliasearch', weight: 0.9 },
      { type: 'global', path: 'instantsearch', weight: 0.85 },
    ],
  },
  {
    id: 'typesense',
    name: 'Typesense',
    category: 'vector-search',
    description: 'Open-source search engine',
    icon: 'typesense',
    website: 'https://typesense.org',
    signals: [
      { type: 'request', pattern: /[\w-]+\.a1\.typesense\.net/, weight: 0.95 },
      { type: 'script', pattern: /typesense(?:-instantsearch)?/, weight: 0.8 },
    ],
  },
  {
    id: 'meilisearch',
    name: 'Meilisearch',
    category: 'vector-search',
    description: 'Open-source search engine',
    icon: 'meilisearch',
    website: 'https://meilisearch.com',
    signals: [
      { type: 'request', pattern: /[\w-]+\.meilisearch\.io/, weight: 0.95 },
      { type: 'script', pattern: /meilisearch/, weight: 0.8 },
    ],
  },
  {
    id: 'elasticsearch',
    name: 'Elastic',
    category: 'vector-search',
    description: 'Search and analytics engine',
    icon: 'elastic',
    website: 'https://elastic.co',
    signals: [
      { type: 'request', pattern: /[\w-]+\.(?:es|kb)\.[\w-]+\.(?:aws|gcp|azure)\.(?:elastic-)?cloud\.com/, weight: 0.9 },
      { type: 'request', pattern: /\/_search\?|\/_msearch/, weight: 0.5 },
    ],
  },
  {
    id: 'orama',
    name: 'Orama',
    category: 'vector-search',
    description: 'Search running in the browser',
    icon: 'orama',
    website: 'https://orama.com',
    signals: [
      { type: 'bundle', pattern: /@orama\/(?:orama|client)/, weight: 0.85 },
      { type: 'request', pattern: /cloud\.orama(?:search)?\.(?:run|com)/, weight: 0.9 },
    ],
  },
]
