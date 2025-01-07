import { json, type LoaderFunctionArgs } from 'react-router';
import { useLoaderData } from 'react-router';
import { stringify } from '~/utils/stringify';

export const loader = async ({}: LoaderFunctionArgs) => {
  return json({ version: 'v1' });
};

export default function TestSuccess() {
  const data = useLoaderData<typeof loader>();

  return <pre>{data ? stringify(data) : 'Not Found'}</pre>;
}
