import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma'
import { PrismaClient } from '@prisma/client'

const servixPrisma = new PrismaClient({ datasources: { db: { url: process.env.SERVIX_DB_URL } } })

function generateSlug(name: string) {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40) + '-' + Date.now().toString(36)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const session = await getServerSession(req, res, authOptions)
  if (session?.user?.email !== 'wongvdanny@gmail.com') return res.status(403).json({ error: 'No autorizado' })
  const { subscriptionId } = req.body
  if (!subscriptionId) return res.status(400).json({ error: 'Falta subscriptionId' })

  const sub = await prisma.subscription.findUnique({ where: { id: subscriptionId }, include: { user: true, plan: true } })
  if (!sub) return res.status(404).json({ error: 'No encontrada' })

  const startDate = new Date()
  const endDate = new Date()
  if ((sub.plan as any).interval === 'yearly') endDate.setFullYear(endDate.getFullYear() + 1)
  else endDate.setMonth(endDate.getMonth() + 1)

  await prisma.subscription.update({ where: { id: subscriptionId }, data: { status: 'active', startDate, endDate } })

  let slug = (sub as any).servixSlug

  if (!(sub as any).servixRestaurantId) {
    try {
      let servixUser = await servixPrisma.user.findUnique({ where: { email: sub.user.email } })
      if (!servixUser) {
        servixUser = await servixPrisma.user.create({
          data: { id: 'usr-' + Date.now(), name: sub.user.name, email: sub.user.email, password: sub.user.password }
        })
      }
      slug = generateSlug(sub.user.name + ' restaurante')
      const restaurant = await servixPrisma.restaurant.create({
        data: { name: 'Restaurante de ' + sub.user.name, slug, ownerId: servixUser.id }
      })
      const pin = String(Math.floor(1000 + Math.random() * 9000))
      await servixPrisma.employee.create({
        data: { name: sub.user.name, email: sub.user.email, role: 'admin', pin, restaurantId: restaurant.id }
      })
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: { servixRestaurantId: restaurant.id, servixSlug: slug } as any
      })
    } catch (e: any) {
      console.error('Error creando restaurante:', e.message)
    }
  }

  return res.json({ ok: true, slug })
}
