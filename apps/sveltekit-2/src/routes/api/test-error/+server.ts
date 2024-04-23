import type { RequestHandler } from './$types';
import * as Sentry from '@sentry/sveltekit';

export const GET: RequestHandler = async () => {
	const exceptionId = Sentry.captureException(new Error('This is an error'));

	await Sentry.flush(2000);
	return Response.json({ exceptionId });
};
