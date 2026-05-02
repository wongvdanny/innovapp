import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (session?.user?.email !== 'wongvdanny@gmail.com') return res.status(403).end()
  const subs = await prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: 'desc' } })
  return res.json(subs)
}
