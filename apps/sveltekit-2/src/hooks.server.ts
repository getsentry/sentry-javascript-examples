import { env } from '$env/dynamic/public';
import * as Sentry from '@sentry/sveltekit';

Sentry.init({
	environment: 'qa', // dynamic sampling bias to keep transactions
	dsn: env.PUBLIC_SENTRY_DSN,
	includeLocalVariables: true,
	tunnel: `http://localhost:3031/`, // proxy server
	tracesSampleRate: 1
});

// not logging anything to console to avoid noise in the test output
export const handleError = Sentry.handleErrorWithSentry(() => {});

export const handle = Sentry.sentryHandle();
