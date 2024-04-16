import * as Sentry from '@sentry/nextjs';

export async function GET() {
  Sentry.startSpan({ name: 'test-span' }, () => {
    Sentry.startSpan({ name: 'child-span' }, () => {});
  });

  await Sentry.flush();

  return Response.json({ data: 'test-success-body' });
}
