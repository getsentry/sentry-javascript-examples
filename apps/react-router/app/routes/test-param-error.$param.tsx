import { json, type LoaderFunctionArgs } from 'react-router';
import { useLoaderData } from 'react-router';
import { stringify } from '~/utils/stringify';
import * as Sentry from '@sentry/remix';

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const exceptionId = Sentry.captureException(new Error('This is an error'));

  await Sentry.flush(2000);

  return json({ exceptionId, paramWas: params.param });
};

export default function TestParamError() {
  const data = useLoaderData<typeof loader>();

  return <pre>{data ? stringify(data) : 'Not Found'}</pre>;
}
