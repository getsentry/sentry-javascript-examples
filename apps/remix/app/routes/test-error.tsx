import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { stringify } from '~/utils/stringify';
import * as Sentry from '@sentry/remix';

export const loader = async ({}: LoaderFunctionArgs) => {
  const exceptionId = Sentry.captureException(new Error('This is an error'));

  await Sentry.flush(2000);

  return json({ exceptionId });
};

export default function TestError() {
  const data = useLoaderData<typeof loader>();

  return <pre>{data ? stringify(data) : 'Not Found'}</pre>;
}
