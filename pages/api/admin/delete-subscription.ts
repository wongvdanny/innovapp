import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/authOptions'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') return res.status(405).end()
  const session = await getServerSession(req, res, authOptions)
  if (session?.user?.email !== 'wongvdanny@gmail.com') return res.status(403).json({ error: 'No autorizado' })
  const { subscriptionId } = req.body
  if (!subscriptionId) return res.status(400).json({ error: 'Falta subscriptionId' })
  await prisma.invoice.deleteMany({ where: { subscriptionId } })
  await prisma.subscription.delete({ where: { id: subscriptionId } })
  return res.json({ ok: true })
}
