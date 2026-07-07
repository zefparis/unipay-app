const createNextIntlPlugin = require('next-intl/plugin');
const withPWA = require('@ducanh2912/next-pwa').default;

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control',   value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options',          value: 'DENY' },
  { key: 'X-Content-Type-Options',   value: 'nosniff' },
  { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',       value: 'camera=(self), microphone=(self), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://js.stripe.com https://*.stripe.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self' https://vercel.live https://*.vercel.live https://unipay-api.onrender.com https://api.coingecko.com https://api.dexscreener.com https://api.stripe.com https://m.stripe.com https://m.stripe.network https://q.stripe.com",
      "frame-src https://js.stripe.com https://hooks.stripe.com https://*.stripe.com https://*.stripe.network",
      "frame-ancestors 'none'",
    ].join('; '),
  },
];

const nextConfig = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

const withPWAConfig = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  customWorkerSrc: 'worker',
  // Custom rules are registered BEFORE the plugin's defaults (first match wins in
  // workbox), so session-sensitive routes below are never served from the SW cache
  // even though cacheOnFrontEndNav writes them into the "pages" cache.
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    runtimeCaching: [
      // Wallet pages (with or without /fr|/en locale prefix) — always network,
      // never cache: HTML/RSC reflects session state (isLoggedIn, balances, KYC).
      {
        urlPattern: /^https?:\/\/[^/]+\/((fr|en)\/)?wallet(\/.*)?$/,
        handler: 'NetworkOnly',
      },
      // Wallet + auth API proxies — the default "apis" rule is NetworkFirst
      // (cacheable); session data must never be served stale.
      {
        urlPattern: /^https?:\/\/[^/]+\/api\/(wallet|auth)(\/.*)?$/,
        handler: 'NetworkOnly',
      },
    ],
  },
});

module.exports = withNextIntl(withPWAConfig(nextConfig));
