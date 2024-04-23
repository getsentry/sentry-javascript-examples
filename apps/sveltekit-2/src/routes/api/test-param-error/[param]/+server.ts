import type { RequestHandler } from './$types';
import * as Sentry from '@sentry/sveltekit';

export const GET: RequestHandler = async ({ url }) => {
	const exceptionId = Sentry.captureException(new Error('This is an error'));

	await Sentry.flush(2000);

	const pathname = url.pathname;
	const parts = pathname.split('/');
	const param = parts[parts.length - 1];

	return Response.json({ exceptionId, paramWas: param });
};
