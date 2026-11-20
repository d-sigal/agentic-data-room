const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pino', 'pino-pretty'],
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    }];
  },
};

module.exports = withSentryConfig(nextConfig, {
  // Sentry organization and project (set via env or hardcode after setup)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Auth token for uploading source maps (set SENTRY_AUTH_TOKEN in CI/env)
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Silences Sentry CLI output during build
  silent: !process.env.CI,

  // Upload source maps to Sentry for readable stack traces
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // Automatically instrument Next.js server-side error handling
  autoInstrumentServerFunctions: true,

  // Automatically wrap middleware
  autoInstrumentMiddleware: true,

  // Proxy Sentry requests through our own domain to bypass ad-blockers
  tunnelRoute: '/api/monitoring',
});
