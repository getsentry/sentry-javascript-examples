import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url }) => {
	const pathname = url.pathname;
	const parts = pathname.split('/');
	const param = parts[parts.length - 1];

	return Response.json({ paramWas: param });
};
