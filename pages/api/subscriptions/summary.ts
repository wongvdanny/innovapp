import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const { id } = req.query
  const sub = await prisma.subscription.findUnique({
    where: { id: String(id) },
    include: { plan: { include: { Product: true } as any }, provisioning: true } as any,
  })
  if (!sub) return res.status(404).json({ error: 'Suscripción no encontrada' })
  const product = ((sub as any).plan?.Product) as { slug: string; name: string } | null
  const slug = (sub as any).servixSlug || (sub as any).provisioning?.slug || null
  return res.json({
    status: sub.status,
    product: product ? { slug: product.slug, name: product.name } : null,
    slug,
  })
}
