import * as Sentry from '@sentry/nuxt';

// make sure this is only called once
if(process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1,
    debug: true,
  });
}