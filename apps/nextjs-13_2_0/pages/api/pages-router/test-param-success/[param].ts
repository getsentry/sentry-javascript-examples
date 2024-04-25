import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse<{ paramWas: string }>) {
  res.status(200).json({ paramWas: req.query.param?.toString() || '' });
}
