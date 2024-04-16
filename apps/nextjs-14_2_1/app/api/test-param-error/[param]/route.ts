import { NextRequest } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export async function GET(request: NextRequest) {
  const exceptionId = Sentry.captureException(new Error('This is an error'));

  await Sentry.flush(2000);

  const { pathname } = new URL(request.url);

  const params = pathname.split('/').filter(Boolean);
  const param = params[params.length - 1];

  return Response.json({ exceptionId, paramWas: param });
}
