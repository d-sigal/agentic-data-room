import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Lower sample rate for edge (middleware runs on every request)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,

  // Only enable in production to avoid noise during development
  enabled: process.env.NODE_ENV === 'production',
});
