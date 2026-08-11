import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import bcrypt from 'bcryptjs'
import { createNewsTenant } from '../../../lib/provisioning/news'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const { name, email, password, country } = req.body
    if (!name || !email || !password || !country) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' })
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' })
    }

    const plan = await prisma.plan.findFirst({
      where: { Product: { slug: 'news' }, price: 0 } as any,
      include: { Product: true } as any,
    })
    if (!plan) return res.status(400).json({ error: 'Plan gratuito de News no encontrado' })

    let user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      const hash = await bcrypt.hash(password, 10)
      user = await prisma.user.create({ data: { name, email, password: hash } })
    } else {
      const existingSub = await prisma.subscription.findFirst({
        where: { userId: user.id, productId: plan.productId, status: { in: ['active', 'pending'] } }
      })
      if (existingSub) {
        return res.status(400).json({ error: 'Ya tienes una cuenta de News con este email. Inicia sesión.' })
      }
    }

    const sub = await prisma.subscription.create({
      data: {
        userId: user.id,
        planId: plan.id,
        productId: plan.productId,
        status: 'active',
        type: 'FREE',
        startDate: new Date(),
        billingData: JSON.stringify({ country }) as any,
      } as any
    })

    let externalUserId: string | null = null
    try {
      const result = await createNewsTenant({
        name: user.name,
        email: user.email,
        passwordHash: user.password,
        country,
      })
      externalUserId = result.userId
    } catch (e: any) {
      console.error('Error provisionando tenant News:', e.message)
    }

    if (!externalUserId) {
      return res.status(500).json({ error: 'No se pudo crear tu cuenta. Contacta con soporte.' })
    }

    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        provisioning: { create: { externalId: externalUserId, slug: 'news', status: 'active' } },
      } as any
    })

    return res.json({ ok: true, subscriptionId: sub.id })
  } catch (e: any) {
    console.error('Free signup News error:', e)
    return res.status(500).json({ error: e.message || 'Error interno' })
  }
}
