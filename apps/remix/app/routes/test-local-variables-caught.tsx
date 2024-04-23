import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
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

  return json({ exceptionId, randomVariableToRecord });
};

export default function TestLocalVariablesCaught() {
  const data = useLoaderData<typeof loader>();

  return <pre>{data ? stringify(data) : 'Not Found'}</pre>;
}
