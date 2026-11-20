import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Traces for 10% of requests in production, 100% in dev
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Only enable in production to avoid noise during development
  enabled: process.env.NODE_ENV === 'production',
});
