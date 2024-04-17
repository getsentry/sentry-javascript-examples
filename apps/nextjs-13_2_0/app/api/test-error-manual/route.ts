import * as Sentry from '@sentry/nextjs';

export async function GET() {
  Sentry.startSpan({ name: 'test-span' }, () => {
    Sentry.startSpan({ name: 'child-span' }, () => {
      Sentry.captureException(new Error('This is an error'));
    });
  });

  await Sentry.flush();

  return Response.json({ data: 'test-error-body' });
}
