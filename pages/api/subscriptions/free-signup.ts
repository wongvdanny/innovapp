import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import bcrypt from 'bcryptjs'
import { createServixTenant } from '../../../lib/provisioning/servix'
import { createGymstackTenant } from '../../../lib/provisioning/gymstack'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const { name, restaurantName, entityName, email, password, phone, planId } = req.body
    const finalEntityName = entityName || restaurantName
    if (!name || !finalEntityName || !email || !password) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' })
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' })
    }
    const plan = await prisma.plan.findUnique({
      where: { id: planId || 'plan_free' },
      include: { Product: true } as any,
    })
    if (!plan) return res.status(400).json({ error: 'Plan no encontrado' })
    const product = (plan as any).Product as { slug: string } | null
    const productSlug = product?.slug
    if (productSlug !== 'servix' && productSlug !== 'gymstack') {
      return res.status(400).json({ error: 'El alta gratuita automática todavía no está disponible para este producto. Contacta con soporte.' })
    }
    let user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      const hash = await bcrypt.hash(password, 10)
      user = await prisma.user.create({
        data: { name, email, password: hash, phone: phone || null }
      })
    } else {
      const existingSub = await prisma.subscription.findFirst({
        where: { userId: user.id, productId: plan.productId, status: { in: ['active', 'pending'] } }
      })
      if (existingSub) {
        const productLabel = productSlug === 'gymstack' ? 'GymStack' : productSlug === 'servix' ? 'Servix' : 'este producto'
        const msg = existingSub.status === 'active'
          ? `Ya tienes una cuenta activa de ${productLabel} con este email. Inicia sesión.`
          : `Ya tienes un registro pendiente de ${productLabel} con este email. Contacta con soporte si crees que es un error.`
        return res.status(400).json({ error: msg })
      }
    }
    await prisma.subscription.updateMany({
      where: { userId: user.id, status: 'pending', productId: { not: plan.productId } },
      data: { status: 'cancelled' }
    })
    const startDate = new Date()
    const sub = await prisma.subscription.create({
      data: {
        userId: user.id,
        planId: plan.id,
        productId: plan.productId,
        status: 'active',
        type: 'FREE',
        startDate,
        billingData: JSON.stringify({ entityName: finalEntityName }) as any,
      } as any
    })

    let restaurantId: string | null = null
    let gymId: string | null = null
    let slug = ''

    try {
      if (productSlug === 'gymstack') {
        const result = await createGymstackTenant({
          name: user.name,
          gymName: finalEntityName,
          email: user.email,
          passwordHash: user.password,
          innovappSubscriptionId: sub.id,
        })
        gymId = result.gymId
        slug = result.slug
      } else {
        const result = await createServixTenant({
          name: user.name,
          restaurantName: finalEntityName,
          email: user.email,
          passwordHash: user.password,
        })
        restaurantId = result.restaurantId
        slug = result.slug
      }
    } catch (e: any) {
      console.error(`Error provisionando tenant FREE (${productSlug}):`, e.message)
    }

    const externalId = restaurantId || gymId
    if (!externalId) {
      return res.status(500).json({ error: 'No se pudo crear tu cuenta. Contacta con soporte.' })
    }

    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        ...(restaurantId ? { servixRestaurantId: restaurantId, servixSlug: slug } as any : {}),
        provisioning: { create: { externalId, slug, status: 'active' } },
      } as any
    })

    return res.json({ ok: true, subscriptionId: sub.id, slug })
  } catch (e: any) {
    console.error('Free signup error:', e)
    return res.status(500).json({ error: e.message || 'Error interno' })
  }
}
