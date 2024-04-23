import type { RequestHandler } from './$types';
import * as Sentry from '@sentry/sveltekit';

export const GET: RequestHandler = async () => {
	Sentry.startSpan({ name: 'test-span' }, () => {
		Sentry.startSpan({ name: 'child-span' }, () => {});
	});

	await Sentry.flush();

	return Response.json({ data: 'test-success-body' });
};
