import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Replay sessions for 10% of all sessions, 100% of sessions with errors
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Traces for 10% of requests in production, 100% in dev
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  integrations: [
    Sentry.replayIntegration(),
  ],

  // Only enable in production to avoid noise during development
  enabled: process.env.NODE_ENV === 'production',
});
