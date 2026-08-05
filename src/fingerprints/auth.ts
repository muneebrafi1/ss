import type { Fingerprint } from '@/types'

/**
 * Authentication providers.
 *
 * Reliable by necessity: a login flow has to run in the browser, so it leaves
 * behind a session cookie, a hosted script, or a redirect to the provider's
 * domain. Cookie signals here match NAMES only — values are never read.
 *
 * Several entries imply their parent platform, which is exactly the case the
 * implication discount exists for: seeing `sb-*-auth-token` is strong evidence
 * of Supabase Auth and good-but-weaker evidence of Supabase itself.
 */
export const AUTH: Fingerprint[] = [
  {
    id: 'clerk',
    name: 'Clerk',
    category: 'auth',
    description: 'User login, accounts, and organizations',
    icon: 'clerk',
    website: 'https://clerk.com',
    signals: [
      { type: 'global', path: 'Clerk', weight: 0.95 },
      { type: 'request', pattern: /clerk\.[\w.-]*(?:accounts\.dev|clerk\.com)/, weight: 0.9 },
      { type: 'request', pattern: /(^|\.)api\.clerk\.(?:com|dev)/, weight: 0.95 },
      { type: 'cookie', pattern: /^__clerk|^__client_uat$/, weight: 0.9 },
      { type: 'script', pattern: /clerk[\w.-]*\.js|clerk\.browser\.js/, weight: 0.9 },
      { type: 'bundle', pattern: /@clerk\/(?:nextjs|clerk-js|clerk-react)/, weight: 0.8 },
    ],
  },
  {
    id: 'auth0',
    name: 'Auth0',
    category: 'auth',
    description: 'Identity platform by Okta',
    icon: 'auth0',
    website: 'https://auth0.com',
    signals: [
      { type: 'request', pattern: /[\w-]+\.(?:[\w-]+\.)?auth0\.com\//, weight: 0.95 },
      { type: 'global', path: 'auth0', weight: 0.85 },
      { type: 'script', pattern: /auth0(?:-spa-js|\.min)?\.js|cdn\.auth0\.com/, weight: 0.9 },
      { type: 'cookie', pattern: /^auth0\.|^_legacy_auth0\./, weight: 0.85 },
    ],
  },
  {
    id: 'firebase-auth',
    name: 'Firebase Auth',
    category: 'auth',
    description: 'Authentication by Google',
    icon: 'firebase',
    website: 'https://firebase.google.com/products/auth',
    implies: ['firebase'],
    signals: [
      { type: 'request', pattern: /identitytoolkit\.googleapis\.com/, weight: 0.95 },
      { type: 'request', pattern: /securetoken\.googleapis\.com/, weight: 0.95 },
      { type: 'storage', pattern: /^firebase:authUser:/, weight: 0.9 },
    ],
  },
  {
    id: 'supabase-auth',
    name: 'Supabase Auth',
    category: 'auth',
    description: 'Authentication built into Supabase',
    icon: 'supabase',
    website: 'https://supabase.com/auth',
    implies: ['supabase'],
    signals: [
      { type: 'storage', pattern: /^sb-[\w-]+-auth-token/, weight: 0.9 },
      { type: 'cookie', pattern: /^sb-[\w-]+-auth-token/, weight: 0.9 },
      // Anchored to the vendor host. `/auth/v1/token` is an unremarkable
      // first-party API path, and at 0.8 it carried Supabase Auth alone — and
      // via `implies`, dragged Supabase in behind it.
      { type: 'request', pattern: /\.supabase\.(?:co|in|net)\/auth\/v1\//, weight: 0.9 },
      { type: 'request', pattern: /\/auth\/v1\/(?:token|user|authorize)/, weight: 0.35 },
    ],
  },
  {
    id: 'nextauth',
    name: 'Auth.js',
    category: 'auth',
    description: 'Authentication for Next.js, formerly NextAuth',
    icon: 'auth0',
    website: 'https://authjs.dev',
    signals: [
      { type: 'cookie', pattern: /^(?:__Secure-)?(?:next-auth|authjs)\.session-token$/, weight: 0.95 },
      { type: 'cookie', pattern: /^(?:__Host-)?(?:next-auth|authjs)\.csrf-token$/, weight: 0.9 },
      { type: 'request', pattern: /\/api\/auth\/(?:session|providers|csrf)(?:$|\?)/, weight: 0.55 },
    ],
  },
  {
    id: 'better-auth',
    name: 'Better Auth',
    category: 'auth',
    description: 'TypeScript authentication framework',
    icon: 'betterauth',
    website: 'https://better-auth.com',
    signals: [
      { type: 'cookie', pattern: /^(?:__Secure-)?better-auth\./, weight: 0.95 },
      { type: 'request', pattern: /\/api\/auth\/get-session(?:$|\?)/, weight: 0.55 },
      { type: 'bundle', pattern: /better-auth\/(?:client|react)/, weight: 0.8 },
    ],
  },
  {
    id: 'stytch',
    name: 'Stytch',
    category: 'auth',
    description: 'Passwordless authentication',
    icon: 'stytch',
    website: 'https://stytch.com',
    signals: [
      { type: 'request', pattern: /[\w-]+\.stytch\.com\/|(^|\.)api\.stytch\.com/, weight: 0.95 },
      { type: 'cookie', pattern: /^stytch_session/, weight: 0.9 },
      { type: 'bundle', pattern: /@stytch\/(?:react|vanilla-js)/, weight: 0.8 },
    ],
  },
  {
    id: 'workos',
    name: 'WorkOS',
    category: 'auth',
    description: 'Enterprise SSO and directory sync',
    icon: 'workos',
    website: 'https://workos.com',
    signals: [
      { type: 'request', pattern: /(^|\.)api\.workos\.com/, weight: 0.95 },
      { type: 'cookie', pattern: /^wos-session$/, weight: 0.9 },
    ],
  },
  {
    id: 'okta',
    name: 'Okta',
    category: 'auth',
    description: 'Enterprise identity management',
    icon: 'okta',
    website: 'https://okta.com',
    signals: [
      { type: 'request', pattern: /[\w-]+\.okta(?:preview)?\.com\//, weight: 0.95 },
      { type: 'global', path: 'OktaAuth', weight: 0.9 },
    ],
  },
  {
    id: 'kinde',
    name: 'Kinde',
    category: 'auth',
    description: 'Authentication and user management',
    icon: 'kinde',
    website: 'https://kinde.com',
    signals: [
      { type: 'request', pattern: /[\w-]+\.kinde\.com\//, weight: 0.95 },
      { type: 'bundle', pattern: /@kinde-oss\/kinde-auth/, weight: 0.85 },
    ],
  },
  {
    id: 'descope',
    name: 'Descope',
    category: 'auth',
    description: 'Drag-and-drop authentication flows',
    icon: 'descope',
    website: 'https://descope.com',
    signals: [
      { type: 'request', pattern: /(^|\.)api\.descope\.com/, weight: 0.95 },
      { type: 'bundle', pattern: /@descope\/(?:react-sdk|web-js-sdk)/, weight: 0.85 },
    ],
  },
  {
    id: 'cognito',
    name: 'Amazon Cognito',
    category: 'auth',
    description: 'AWS user directory and authentication',
    icon: 'amazonwebservices',
    website: 'https://aws.amazon.com/cognito',
    signals: [
      { type: 'request', pattern: /cognito-(?:idp|identity)\.[\w-]+\.amazonaws\.com/, weight: 0.95 },
      { type: 'storage', pattern: /^CognitoIdentityServiceProvider\./, weight: 0.9 },
    ],
  },
  {
    id: 'keycloak',
    name: 'Keycloak',
    category: 'auth',
    description: 'Open-source identity server',
    icon: 'keycloak',
    website: 'https://keycloak.org',
    signals: [
      { type: 'request', pattern: /\/realms\/[\w-]+\/protocol\/openid-connect/, weight: 0.9 },
      { type: 'global', path: 'Keycloak', weight: 0.9 },
    ],
  },
  {
    id: 'magic-link',
    name: 'Magic',
    category: 'auth',
    description: 'Passwordless and wallet authentication',
    icon: 'magic',
    website: 'https://magic.link',
    signals: [
      { type: 'request', pattern: /(^|\.)api\.magic\.link|auth\.magic\.link/, weight: 0.95 },
      { type: 'bundle', pattern: /magic-sdk/, weight: 0.8 },
    ],
  },
  {
    id: 'logto',
    name: 'Logto',
    category: 'auth',
    description: 'Open-source identity platform',
    icon: 'logto',
    website: 'https://logto.io',
    signals: [
      { type: 'request', pattern: /[\w-]+\.logto\.app\//, weight: 0.95 },
      { type: 'bundle', pattern: /@logto\/(?:react|browser)/, weight: 0.85 },
    ],
  },
  {
    id: 'supertokens',
    name: 'SuperTokens',
    category: 'auth',
    description: 'Open-source authentication',
    icon: 'supertokens',
    website: 'https://supertokens.com',
    signals: [
      { type: 'cookie', pattern: /^(?:sAccessToken|sFrontToken|st-last-access-token-update)$/, weight: 0.95 },
      { type: 'bundle', pattern: /supertokens-(?:auth-react|website)/, weight: 0.85 },
    ],
  },
  {
    id: 'fusionauth',
    name: 'FusionAuth',
    category: 'auth',
    description: 'Self-hostable identity platform',
    icon: 'fusionauth',
    website: 'https://fusionauth.io',
    signals: [{ type: 'request', pattern: /[\w-]+\.fusionauth\.io/, weight: 0.95 }],
  },
  {
    id: 'ory',
    name: 'Ory',
    category: 'auth',
    description: 'Open-source identity infrastructure',
    icon: 'ory',
    website: 'https://ory.sh',
    signals: [
      { type: 'request', pattern: /[\w-]+\.projects\.oryapis\.com/, weight: 0.95 },
      { type: 'cookie', pattern: /^ory_session/, weight: 0.9 },
    ],
  },
  {
    id: 'frontegg',
    name: 'Frontegg',
    category: 'auth',
    description: 'User management for B2B products',
    icon: 'frontegg',
    website: 'https://frontegg.com',
    signals: [{ type: 'request', pattern: /[\w-]+\.frontegg\.com/, weight: 0.95 }],
  },
]
