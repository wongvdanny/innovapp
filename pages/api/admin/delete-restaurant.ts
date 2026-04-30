import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/authOptions'
import { prisma } from '../../../lib/prisma'
import { PrismaClient } from '@prisma/client'

const servixPrisma = new PrismaClient({ datasources: { db: { url: process.env.SERVIX_DB_URL } } })

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') return res.status(405).end()
  const session = await getServerSession(req, res, authOptions)
  if ((session?.user as any)?.role !== 'admin') return res.status(403).end()

  const { subscriptionId } = req.body

  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { user: true }
  })
  if (!sub) return res.status(404).json({ error: 'Suscripción no encontrada' })

  try {
    // 1. Eliminar restaurante en Servix (cascade elimina mesas, pedidos, etc.)
    if (sub.servixRestaurantId) {
      // Primero eliminar orders items, orders, tables, etc. en cascada
      await servixPrisma.restaurant.delete({ where: { id: sub.servixRestaurantId } }).catch(e => console.error('Error borrando restaurante Servix:', e))
    }

    // 2. Eliminar usuario en Servix
    if (sub.user.email) {
      await servixPrisma.user.deleteMany({ where: { email: sub.user.email } }).catch(() => {})
    }

    // 3. Limpiar referencias en innovapp (sin borrar la suscripción)
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { servixRestaurantId: null, servixSlug: null, status: 'cancelled' }
    })

    return res.json({ ok: true })
  } catch (e: any) {
    console.error('Error eliminando restaurante:', e)
    return res.status(500).json({ error: e.message })
  }
}
