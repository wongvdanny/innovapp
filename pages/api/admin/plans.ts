import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/authOptions'
import { prisma } from '../../../lib/prisma'

const ADMIN_EMAIL = 'wongvdanny@gmail.com'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if ((session?.user as any)?.role !== 'admin') return res.status(403).end()
  if (req.method === 'POST') {
    const plan = await prisma.plan.create({ data: req.body })
    return res.json(plan)
  }
  const plans = await prisma.plan.findMany()
  return res.json(plans)
}
