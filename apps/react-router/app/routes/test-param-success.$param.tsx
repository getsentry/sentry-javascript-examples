import { json, type LoaderFunctionArgs } from 'react-router';
import { useLoaderData } from 'react-router';
import { stringify } from '~/utils/stringify';

export const loader = async ({ params }: LoaderFunctionArgs) => {
  return json({ paramWas: params.param });
};

export default function TestParamSuccess() {
  const data = useLoaderData<typeof loader>();

  return <pre>{data ? stringify(data) : 'Not Found'}</pre>;
}
