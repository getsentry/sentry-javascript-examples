import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	return Response.json({ version: 'v1' });
};
