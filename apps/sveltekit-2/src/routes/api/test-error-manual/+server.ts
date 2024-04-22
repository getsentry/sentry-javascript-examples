import type { RequestHandler } from './$types';
import * as Sentry from '@sentry/nextjs';

export const GET: RequestHandler = async () => {
	Sentry.startSpan({ name: 'test-span' }, () => {
		Sentry.startSpan({ name: 'child-span' }, () => {
			Sentry.captureException(new Error('This is an error'));
		});
	});

	await Sentry.flush();

	return Response.json({ data: 'test-error-body' });
};
