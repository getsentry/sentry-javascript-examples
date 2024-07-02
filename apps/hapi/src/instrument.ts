import * as Sentry from '@sentry/node';
import dotenv from 'dotenv';

dotenv.config({ path: './../../.env' });

Sentry.init({
  environment: 'qa', // dynamic sampling bias to keep transactions
  dsn: process.env.SENTRY_DSN,
  includeLocalVariables: true,
  // tunnel: `http://localhost:3031/`, // proxy server
  tracesSampleRate: 1,
});
