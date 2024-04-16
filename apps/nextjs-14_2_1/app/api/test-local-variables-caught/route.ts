import * as Sentry from '@sentry/nextjs';

export async function GET() {
  const randomVariableToRecord = 'LOCAL_VARIABLE';

  let exceptionId: string;
  try {
    throw new Error('Local Variable Error');
  } catch (e) {
    exceptionId = Sentry.captureException(e);
  }

  return Response.json({ exceptionId, randomVariableToRecord });
}
