import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/authOptions'
import { isAdmin } from '../../../lib/isAdmin'
import { prisma } from '../../../lib/prisma'
import { createServixTenant } from '../../../lib/provisioning/servix'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const session = await getServerSession(req, res, authOptions)
  if (!isAdmin(session)) return res.status(403).json({ error: 'No autorizado' })
  const { subscriptionId } = req.body
  if (!subscriptionId) return res.status(400).json({ error: 'Falta subscriptionId' })

  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { user: true, plan: true, provisioning: true },
  })
  if (!sub) return res.status(404).json({ error: 'No encontrada' })

  const startDate = new Date()
  const endDate = new Date()
  if ((sub.plan as any).interval === 'yearly') endDate.setFullYear(endDate.getFullYear() + 1)
  else endDate.setMonth(endDate.getMonth() + 1)

  await prisma.subscription.update({ where: { id: subscriptionId }, data: { status: 'active', startDate, endDate } })

  let slug = sub.servixSlug

  if (!sub.provisioning && !sub.servixRestaurantId) {
    try {
      let productId = sub.productId
      if (!productId) {
        const servixProduct = await prisma.product.findUnique({ where: { slug: 'servix' } })
        productId = servixProduct?.id ?? null
      }

      const { restaurantId, slug: newSlug } = await createServixTenant({
        name: sub.user.name,
        email: sub.user.email,
        passwordHash: sub.user.password,
      })
      slug = newSlug

      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          servixRestaurantId: restaurantId,
          servixSlug: newSlug,
          ...(productId ? { productId } : {}),
          provisioning: {
            create: { externalId: restaurantId, slug: newSlug, status: 'active' },
          },
        },
      })
    } catch (e: any) {
      console.error('Error creando restaurante:', e.message)
    }
  }

  return res.json({ ok: true, slug })
}
