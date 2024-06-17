import type { APIRoute } from 'astro';
import * as Sentry from '@sentry/astro';

export const prerender = false;

export const GET: APIRoute = ({ params }) => {
  const param = params.param?.toString();

  const exceptionId = Sentry.captureException(new Error('This is an error'));

  return new Response(JSON.stringify({ exceptionId, paramWas: param }), {
    status: 500,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
