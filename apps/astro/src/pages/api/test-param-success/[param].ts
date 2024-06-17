import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = ({ params }) => {
  const param = params.param?.toString();

  return new Response(JSON.stringify({ paramWas: param }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
