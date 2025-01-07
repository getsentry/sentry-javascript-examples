import { type LoaderFunctionArgs } from 'react-router';
import { useLoaderData } from 'react-router';
import { stringify } from '~/utils/stringify';
import * as Sentry from '@sentry/remix';

export const loader = async ({}: LoaderFunctionArgs) => {
  const randomVariableToRecord = 'LOCAL VARIABLE';

  let exceptionId: string;
  try {
    throw new Error('Local Variable Error');
  } catch (e) {
    exceptionId = Sentry.captureException(e);
  }

  return Response.json({ exceptionId, randomVariableToRecord });
};

export default function TestLocalVariablesCaught() {
  const data = useLoaderData<typeof loader>();

  return <pre>{data ? stringify(data) : 'Not Found'}</pre>;
}
