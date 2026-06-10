import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import bcrypt from 'bcryptjs'
import { Pool } from 'pg'

function generateSlug(name: string) {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40) + '-' + Date.now().toString(36)
}

const FREE_LIMITS = JSON.stringify({ tables: 5, waiters: 1, orderHistoryDays: 7 })

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const { name, restaurantName, email, password, phone, planId } = req.body
    if (!name || !restaurantName || !email || !password) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' })
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' })
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId || 'plan_free' } })
    if (!plan) return res.status(400).json({ error: 'Plan no encontrado' })

    let user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      const hash = await bcrypt.hash(password, 10)
      user = await prisma.user.create({
        data: { name, email, password: hash, phone: phone || null }
      })
    } else {
      const activeSub = await prisma.subscription.findFirst({
        where: { userId: user.id, status: 'active' }
      })
      if (activeSub) {
        return res.status(400).json({ error: 'Ya existe una cuenta activa con este email. Inicia sesión.' })
      }
    }

    await prisma.subscription.updateMany({
      where: { userId: user.id, status: 'pending' },
      data: { status: 'cancelled' }
    })

    const startDate = new Date()

    const sub = await prisma.subscription.create({
      data: {
        userId: user.id,
        planId: plan.id,
        status: 'active',
        type: 'FREE',
        startDate,
        billingData: JSON.stringify({ restaurantName }) as any,
      } as any
    })

    let servixRestaurantId: string | null = null
    let slug = ''
    const pool = new Pool({ connectionString: process.env.SERVIX_DB_URL })

    try {
      const userRes = await pool.query('SELECT id FROM "User" WHERE email = $1', [user.email])
      let servixUserId: string
      if (userRes.rows.length === 0) {
        const newId = 'usr-' + Date.now()
        await pool.query(
          'INSERT INTO "User" (id, name, email, password) VALUES ($1,$2,$3,$4)',
          [newId, user.name, user.email, user.password]
        )
        servixUserId = newId
      } else {
        servixUserId = userRes.rows[0].id
      }

      slug = generateSlug(restaurantName)

      const restId = 'rest-' + Date.now() + '-' + Math.random().toString(36).slice(2,6)
      await pool.query(
        'INSERT INTO "Restaurant" (id, name, slug, "ownerId", plan, "planLimits") VALUES ($1,$2,$3,$4,$5,$6::jsonb)',
        [restId, restaurantName, slug, servixUserId, 'FREE', FREE_LIMITS]
      )
      servixRestaurantId = restId

      const empId = 'emp-' + Date.now()
      await pool.query(
        'INSERT INTO "Employee" (id, name, email, role, pin, "restaurantId") VALUES ($1,$2,$3,$4,$5,$6)',
        [empId, user.name, user.email, 'admin', '1234', restId]
      )

      console.log('Restaurante FREE creado:', restId, slug)
    } catch (e: any) {
      console.error('Error provisionando restaurante FREE:', e.message)
    } finally {
      await pool.end()
    }

    if (!servixRestaurantId) {
      return res.status(500).json({ error: 'No se pudo crear tu restaurante. Contacta con soporte.' })
    }

    await prisma.subscription.update({
      where: { id: sub.id },
      data: { servixRestaurantId, servixSlug: slug } as any
    })

    return res.json({ ok: true, subscriptionId: sub.id, slug })
  } catch (e: any) {
    console.error('Free signup error:', e)
    return res.status(500).json({ error: e.message || 'Error interno' })
  }
}
