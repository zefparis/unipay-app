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
  { key: 'Permissions-Policy',       value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://js.stripe.com https://*.stripe.com https://hcs-widget-mvp.vercel.app",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self' https://unipay-api.onrender.com https://api.coingecko.com https://api.dexscreener.com https://api.stripe.com https://m.stripe.com https://m.stripe.network https://q.stripe.com https://hcs-widget-mvp.vercel.app https://api.hcs-u7.org",
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
});

module.exports = withNextIntl(withPWAConfig(nextConfig));
