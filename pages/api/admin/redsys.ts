import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/authOptions'
import { isAdmin } from '../../../lib/isAdmin'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!isAdmin(session)) return res.status(403).end()

  if (req.method === 'POST') {
    const { merchantCode, secretKey, terminal, currency, environment, enabled } = req.body ?? {}
    const rest = { merchantCode, terminal, currency, environment, ...(enabled !== undefined ? { enabled: !!enabled } : {}) }
    const existing = await prisma.redsysConfig.findFirst()
    const data = secretKey ? { ...rest, secretKey } : rest

    const config = existing
      ? await prisma.redsysConfig.update({ where: { id: existing.id }, data })
      : await prisma.redsysConfig.create({ data: { ...data, secretKey: secretKey || '' } })

    const { secretKey: _omit, ...safeConfig } = config
    return res.json({ ...safeConfig, hasSecretKey: !!config.secretKey })
  }

  const config = await prisma.redsysConfig.findFirst()
  if (!config) return res.json(null)
  const { secretKey: _omit, ...safeConfig } = config
  return res.json({ ...safeConfig, hasSecretKey: !!config.secretKey })
}
