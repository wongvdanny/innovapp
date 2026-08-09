import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/authOptions'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if ((session?.user as any)?.role !== 'admin') return res.status(403).end()

  if (req.method === 'POST') {
    const { secretKey, ...rest } = req.body
    const existing = await prisma.stripeConfig.findFirst()
    const data = secretKey ? { ...rest, secretKey } : rest

    const config = existing
      ? await prisma.stripeConfig.update({ where: { id: existing.id }, data })
      : await prisma.stripeConfig.create({ data: secretKey ? data : { ...data, secretKey: '' } })

    const { secretKey: _omit, ...safeConfig } = config
    return res.json({ ...safeConfig, hasSecretKey: !!config.secretKey })
  }

  const config = await prisma.stripeConfig.findFirst()
  if (!config) return res.json(null)
  const { secretKey: _omit, ...safeConfig } = config
  return res.json({ ...safeConfig, hasSecretKey: !!config.secretKey })
}
