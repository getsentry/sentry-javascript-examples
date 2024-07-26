import * as Sentry from '@sentry/nuxt';

if(process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1,
    debug: true,
  });
}