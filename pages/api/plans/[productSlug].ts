import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const { productSlug } = req.query

  const product = await prisma.product.findUnique({ where: { slug: String(productSlug) } })
  if (!product || !product.active) return res.status(404).json({ error: 'Producto no encontrado' })

  const plans = await prisma.plan.findMany({
    where: { productId: product.id, active: true },
    orderBy: { price: 'asc' },
  })

  return res.json({
    product: { slug: product.slug, name: product.name },
    plans,
  })
}
