import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	const randomVariableToRecord = 'LOCAL_VARIABLE';
	throw new Error(`Uncaught Local Variable Error - ${JSON.stringify({ randomVariableToRecord })}`);
};
