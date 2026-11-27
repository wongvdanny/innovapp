import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/authOptions'
import { isAdmin } from '../../../lib/isAdmin'
import { prisma } from '../../../lib/prisma'
import { deleteServixTenant } from '../../../lib/provisioning/servix'
import { deleteGymstackTenant, GymstackTenantHasInvoicesError } from '../../../lib/provisioning/gymstack'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') return res.status(405).end()
  const session = await getServerSession(req, res, authOptions)
  if (!isAdmin(session)) return res.status(403).json({ error: 'No autorizado' })
  const { subscriptionId } = req.body
  if (!subscriptionId) return res.status(400).json({ error: 'Falta subscriptionId' })

  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { provisioning: true, plan: { include: { Product: true } as any } },
  })
  if (!sub) return res.status(404).json({ error: 'No encontrada' })

  const product = (sub.plan as any)?.Product as { slug: string } | null
  const productSlug = product?.slug || (sub.servixRestaurantId ? 'servix' : (sub as any).provisioning ? 'gymstack' : 'unknown')

  if (productSlug === 'gymstack' && (sub as any).provisioning?.externalId) {
    // Si el borrado en GymStack falla, la suscripción NO se desvincula: antes se desvinculaba
    // igualmente y el gimnasio quedaba huérfano (y activo) en GymStack
    try {
      await deleteGymstackTenant((sub as any).provisioning.externalId)
    } catch (e: any) {
      if (e instanceof GymstackTenantHasInvoicesError) return res.status(409).json({ error: e.message })
      console.error('Error borrando GymStack:', e.message)
      return res.status(500).json({ error: 'No se pudo borrar el gimnasio en GymStack: ' + e.message })
    }
  } else if (sub.servixRestaurantId) {
    try {
      await deleteServixTenant(sub.servixRestaurantId)
    } catch (e: any) {
      console.error('Error borrando Servix:', e.message)
    }
  }

  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      servixRestaurantId: null,
      servixSlug: null,
      ...((sub as any).provisioning ? { provisioning: { delete: true } } : {}),
    } as any,
  })

  return res.json({ ok: true })
}
