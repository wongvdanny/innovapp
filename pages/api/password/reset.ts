import { NextApiRequest, NextApiResponse } from 'next'
import { restablecerConToken } from '../../../lib/password'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const error = await restablecerConToken(req.body?.token, req.body?.password)
  if (error) return res.status(400).json({ error })
  return res.json({ ok: true })
}
