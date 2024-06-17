import { env } from '$env/dynamic/public';
import * as Sentry from '@sentry/sveltekit';

Sentry.init({
	environment: 'qa', // dynamic sampling bias to keep transactions
	dsn: env.PUBLIC_SENTRY_DSN,
	includeLocalVariables: true,
	tunnel: `http://localhost:3031/`, // proxy server
	tracesSampleRate: 1
});

const myErrorHandler = ({ error, event }: any) => {
	console.error('An error occurred on the client side:', error, event);
};

export const handleError = Sentry.handleErrorWithSentry(myErrorHandler);
