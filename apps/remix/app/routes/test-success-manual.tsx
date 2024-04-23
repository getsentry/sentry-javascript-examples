import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { stringify } from '~/utils/stringify';
import * as Sentry from '@sentry/remix';

export const loader = async ({}: LoaderFunctionArgs) => {
  Sentry.startSpan({ name: 'test-transaction', op: 'e2e-test' }, () => {
    Sentry.startSpan({ name: 'test-span' }, () => undefined);
  });

  await Sentry.flush();

  return json({ manual: 'success' });
};

export default function TestSuccessManual() {
  const data = useLoaderData<typeof loader>();

  return <pre>{data ? stringify(data) : 'Not Found'}</pre>;
}
