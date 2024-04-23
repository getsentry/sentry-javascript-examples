import type { RequestHandler } from './$types';
import * as Sentry from '@sentry/sveltekit';

export const GET: RequestHandler = () => {
	const randomVariableToRecord = 'LOCAL_VARIABLE';

	let exceptionId: string;
	try {
		throw new Error('Local Variable Error');
	} catch (e) {
		exceptionId = Sentry.captureException(e);
	}

	return Response.json({ exceptionId, randomVariableToRecord });
};
