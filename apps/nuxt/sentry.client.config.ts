import * as Sentry from '@sentry/nuxt';

Sentry.init({
  dsn: 'your-dsn',
  debug: true,
  tracesSampleRate: 1,
  integrations: [Sentry.browserTracingIntegration()],
});
