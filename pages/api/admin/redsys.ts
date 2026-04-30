import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/authOptions'
import { prisma } from '../../../lib/prisma'

const ADMIN_EMAIL = 'wongvdanny@gmail.com'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if ((session?.user as any)?.role !== 'admin') return res.status(403).end()
  if (req.method === 'POST') {
    const existing = await prisma.redsysConfig.findFirst()
    const config = existing
      ? await prisma.redsysConfig.update({ where: { id: existing.id }, data: req.body })
      : await prisma.redsysConfig.create({ data: req.body })
    return res.json(config)
  }
  const config = await prisma.redsysConfig.findFirst()
  return res.json(config)
}
