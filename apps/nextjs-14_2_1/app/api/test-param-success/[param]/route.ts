import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { pathname } = new URL(request.url);

  const params = pathname.split('/').filter(Boolean);
  const param = params[params.length - 1];

  return Response.json({ paramWas: param });
}
