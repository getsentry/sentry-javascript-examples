import * as Sentry from '@sentry/nextjs';

export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' || process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init({
      environment: 'qa', // dynamic sampling bias to keep transactions
      dsn: process.env.E2E_TEST_DSN,
      includeLocalVariables: true,
      tunnel: `http://localhost:3031/`, // proxy server
      tracesSampleRate: 1,
    });
  }
}
