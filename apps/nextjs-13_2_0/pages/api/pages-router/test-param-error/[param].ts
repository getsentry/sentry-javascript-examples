import type { NextApiRequest, NextApiResponse } from 'next';
import * as Sentry from '@sentry/nextjs';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ exceptionId: string; paramWas: string }>,
) {
  const exceptionId = Sentry.captureException(new Error('This is an error'));
  res.status(500).json({ exceptionId, paramWas: req.query.param?.toString() || '' });
}
