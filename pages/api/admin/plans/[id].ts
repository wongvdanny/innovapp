import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/authOptions'
import { prisma } from '../../../../lib/prisma'

const ADMIN_EMAIL = 'wongvdanny@gmail.com'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if ((session?.user as any)?.role !== 'admin') return res.status(403).end()
  const { id } = req.query
  if (req.method === 'PUT') {
    const plan = await prisma.plan.update({ where: { id: String(id) }, data: req.body })
    return res.json(plan)
  }
  if (req.method === 'DELETE') {
    await prisma.plan.delete({ where: { id: String(id) } })
    return res.json({ ok: true })
  }
  res.status(405).end()
}
