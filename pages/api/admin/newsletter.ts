import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { prisma } from '../../../lib/prisma'

const ADMIN_EMAIL = 'wongvdanny@gmail.com'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if ((session?.user as any)?.role !== 'admin') return res.status(403).end()
  const subs = await prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: 'desc' } })
  return res.json(subs)
}
