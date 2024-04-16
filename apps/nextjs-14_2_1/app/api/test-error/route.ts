import * as Sentry from '@sentry/nextjs';

export async function GET() {
  const exceptionId = Sentry.captureException(new Error('This is an error'));

  await Sentry.flush(2000);
  return Response.json({ exceptionId });
}
