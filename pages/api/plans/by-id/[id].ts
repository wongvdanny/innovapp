import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const { id } = req.query
  const plan = await prisma.plan.findUnique({
    where: { id: String(id) },
    include: { Product: true } as any,
  })
  if (!plan || !plan.active) return res.status(404).json({ error: 'Plan no encontrado' })
  const product = (plan as any).Product as { slug: string; name: string } | null
  return res.json({
    plan: { id: plan.id, name: plan.name, price: plan.price, interval: plan.interval },
    product: product ? { slug: product.slug, name: product.name } : null,
  })
}
