import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma'
import { PrismaClient } from '@prisma/client'

const servixPrisma = new PrismaClient({ datasources: { db: { url: process.env.SERVIX_DB_URL } } })

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') return res.status(405).end()
  const session = await getServerSession(req, res, authOptions)
  if (session?.user?.email !== 'wongvdanny@gmail.com') return res.status(403).json({ error: 'No autorizado' })
  const { subscriptionId } = req.body
  if (!subscriptionId) return res.status(400).json({ error: 'Falta subscriptionId' })

  const sub = await prisma.subscription.findUnique({ where: { id: subscriptionId } })
  if (!sub) return res.status(404).json({ error: 'No encontrada' })

  const restaurantId = (sub as any).servixRestaurantId
  if (restaurantId) {
    try {
      await servixPrisma.employee.deleteMany({ where: { restaurantId } })
      await servixPrisma.orderItem.deleteMany({ where: { order: { table: { restaurantId } } } })
      await servixPrisma.order.deleteMany({ where: { table: { restaurantId } } })
      await servixPrisma.table.deleteMany({ where: { zone: { restaurantId } } })
      await servixPrisma.zone.deleteMany({ where: { restaurantId } })
      await servixPrisma.product.deleteMany({ where: { restaurantId } })
      await servixPrisma.restaurant.delete({ where: { id: restaurantId } })
    } catch (e: any) { console.error('Error borrando Servix:', e.message) }
  }

  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { servixRestaurantId: null, servixSlug: null } as any
  })
  return res.json({ ok: true })
}
