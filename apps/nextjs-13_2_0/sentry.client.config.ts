import * as Sentry from '@sentry/nextjs';

Sentry.init({
  environment: 'qa', // dynamic sampling bias to keep transactions
  dsn: 'https://3b6c388182fb435097f41d181be2b2ba@o4504321058471936.ingest.sentry.io/4504321066008576',
  includeLocalVariables: true,
  tunnel: `http://localhost:3031/`, // proxy server
  tracesSampleRate: 1,
});
