import type { Fingerprint } from '@/types'

/**
 * File storage, image delivery, and asset CDNs.
 *
 * Detected from the delivery domains of images and files on the page. Reliable,
 * since the whole purpose of these services is to serve assets straight to the
 * browser from their own hostnames.
 */
export const STORAGE: Fingerprint[] = [
  {
    id: 'cloudinary',
    name: 'Cloudinary',
    category: 'storage',
    description: 'Image and video delivery with transforms',
    icon: 'cloudinary',
    website: 'https://cloudinary.com',
    signals: [
      { type: 'request', pattern: /res\.cloudinary\.com|[\w-]+-res\.cloudinary\.com/, weight: 0.95 },
      { type: 'global', path: 'cloudinary', weight: 0.9 },
      { type: 'html', pattern: /res\.cloudinary\.com/, weight: 0.85 },
    ],
  },
  {
    id: 'uploadthing',
    name: 'UploadThing',
    category: 'storage',
    description: 'File uploads for full-stack apps',
    icon: 'uploadthing',
    website: 'https://uploadthing.com',
    signals: [
      { type: 'request', pattern: /utfs\.io|[\w-]+\.ufs\.sh|(^|\.)api\.uploadthing\.com/, weight: 0.95 },
      { type: 'bundle', pattern: /@uploadthing\/react|uploadthing\/client/, weight: 0.85 },
    ],
  },
  {
    id: 'imagekit',
    name: 'ImageKit',
    category: 'storage',
    description: 'Image optimization and delivery',
    icon: 'imagekit',
    website: 'https://imagekit.io',
    signals: [
      { type: 'request', pattern: /ik\.imagekit\.io/, weight: 0.95 },
      { type: 'bundle', pattern: /imagekitio-react|imagekit-javascript/, weight: 0.85 },
    ],
  },
  {
    id: 'amazon-s3',
    name: 'Amazon S3',
    category: 'storage',
    description: 'Object storage on AWS',
    icon: 'amazons3',
    website: 'https://aws.amazon.com/s3',
    signals: [
      { type: 'request', pattern: /[\w.-]+\.s3[\w.-]*\.amazonaws\.com|s3[\w.-]*\.amazonaws\.com\//, weight: 0.9 },
      { type: 'header', name: 'server', pattern: /AmazonS3/i, weight: 0.9 },
    ],
  },
  {
    id: 'cloudflare-r2',
    name: 'Cloudflare R2',
    category: 'storage',
    description: 'Object storage without egress fees',
    icon: 'cloudflare',
    website: 'https://cloudflare.com/products/r2',
    signals: [
      { type: 'request', pattern: /[\w-]+\.r2\.cloudflarestorage\.com|[\w-]+\.r2\.dev/, weight: 0.95 },
    ],
  },
  {
    id: 'vercel-blob',
    name: 'Vercel Blob',
    category: 'storage',
    description: 'File storage on Vercel',
    icon: 'vercel',
    website: 'https://vercel.com/storage/blob',
    signals: [
      { type: 'request', pattern: /[\w-]+\.public\.blob\.vercel-storage\.com/, weight: 0.95 },
    ],
  },
  {
    id: 'supabase-storage',
    name: 'Supabase Storage',
    category: 'storage',
    description: 'File storage built into Supabase',
    icon: 'supabase',
    website: 'https://supabase.com/storage',
    implies: ['supabase'],
    signals: [
      { type: 'request', pattern: /\.supabase\.co\/storage\/v1\//, weight: 0.95 },
    ],
  },
  {
    id: 'google-cloud-storage',
    name: 'Google Cloud Storage',
    category: 'storage',
    description: 'Object storage on Google Cloud',
    icon: 'googlecloud',
    website: 'https://cloud.google.com/storage',
    signals: [
      { type: 'request', pattern: /storage\.googleapis\.com|[\w.-]+\.storage\.googleapis\.com/, weight: 0.9 },
    ],
  },
  {
    id: 'azure-blob',
    name: 'Azure Blob Storage',
    category: 'storage',
    description: 'Object storage on Azure',
    icon: 'microsoftazure',
    website: 'https://azure.microsoft.com/products/storage/blobs',
    signals: [
      { type: 'request', pattern: /[\w-]+\.blob\.core\.windows\.net/, weight: 0.9 },
    ],
  },
  {
    id: 'jsdelivr',
    name: 'jsDelivr',
    category: 'storage',
    description: 'Open-source package CDN',
    icon: 'jsdelivr',
    website: 'https://jsdelivr.com',
    signals: [{ type: 'request', pattern: /cdn\.jsdelivr\.net/, weight: 0.9 }],
  },
  {
    id: 'unpkg',
    name: 'unpkg',
    category: 'storage',
    description: 'CDN for npm packages',
    icon: 'unpkg',
    website: 'https://unpkg.com',
    signals: [{ type: 'request', pattern: /unpkg\.com\//, weight: 0.9 }],
  },
  {
    id: 'google-fonts',
    name: 'Google Fonts',
    category: 'storage',
    description: 'Hosted web fonts',
    icon: 'googlefonts',
    website: 'https://fonts.google.com',
    signals: [
      { type: 'request', pattern: /fonts\.(?:googleapis|gstatic)\.com/, weight: 0.95 },
      { type: 'html', pattern: /fonts\.googleapis\.com/, weight: 0.85 },
    ],
  },
]
