import * as Sentry from '@sentry/nuxt';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1,
  debug: true,
});
