import * as Sentry from '@sentry/astro';

Sentry.init({
  environment: 'qa', // dynamic sampling bias to keep transactions
  dsn: import.meta.env.PUBLIC_SENTRY_DSN,
  includeLocalVariables: true,
  tunnel: `http://localhost:3031/`, // proxy server
  tracesSampleRate: 1,
  debug: true,
});
