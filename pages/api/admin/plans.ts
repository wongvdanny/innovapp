import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/authOptions'
import { isAdmin } from '../../../lib/isAdmin'
import { prisma } from '../../../lib/prisma'
import { datosPlan } from '../../../lib/admin/planes'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!isAdmin(session)) return res.status(403).end()
  if (req.method === 'POST') {
    const r = datosPlan(req.body, true)
    if ('error' in r) return res.status(400).json({ error: r.error })
    if (!(await prisma.product.findUnique({ where: { id: r.data.productId as string } }))) return res.status(400).json({ error: 'El producto no existe' })
    const plan = await prisma.plan.create({ data: r.data as any })
    return res.json(plan)
  }
  const plans = await prisma.plan.findMany()
  return res.json(plans)
}
