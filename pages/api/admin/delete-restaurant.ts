import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/authOptions'
import { isAdmin } from '../../../lib/isAdmin'
import { prisma } from '../../../lib/prisma'
import { deleteServixTenant } from '../../../lib/provisioning/servix'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') return res.status(405).end()
  const session = await getServerSession(req, res, authOptions)
  if (!isAdmin(session)) return res.status(403).json({ error: 'No autorizado' })
  const { subscriptionId } = req.body
  if (!subscriptionId) return res.status(400).json({ error: 'Falta subscriptionId' })

  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { provisioning: true },
  })
  if (!sub) return res.status(404).json({ error: 'No encontrada' })

  const restaurantId = sub.servixRestaurantId
  if (restaurantId) {
    try {
      await deleteServixTenant(restaurantId)
    } catch (e: any) {
      console.error('Error borrando Servix:', e.message)
    }
  }

  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      servixRestaurantId: null,
      servixSlug: null,
      ...(sub.provisioning ? { provisioning: { delete: true } } : {}),
    },
  })

  return res.json({ ok: true })
}
