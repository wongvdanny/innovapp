import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/authOptions'
import { prisma } from '../../../lib/prisma'
import { Pool } from 'pg'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.email) return res.status(401).end()

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { subscriptions: true }
  })

  const activeSub = user?.subscriptions?.find(s => s.status === 'active')
  if (!activeSub) return res.status(404).json({ error: 'Sin suscripción activa' })

  // Cancelar en innovapp
  await prisma.subscription.update({
    where: { id: activeSub.id },
    data: { status: 'cancelled' }
  })

  // Desactivar restaurante en Servix via SQL
  if (activeSub.servixRestaurantId) {
    const pool = new Pool({ connectionString: process.env.SERVIX_DB_URL })
    try {
      await pool.query('UPDATE "Restaurant" SET active = false WHERE id = $1', [activeSub.servixRestaurantId])
      if (session.user.email) {
        await pool.query("UPDATE \"User\" SET password = 'SUSPENDED_' || extract(epoch from now()) WHERE email = $1", [session.user.email])
      }
    } catch (e) { console.error('Error Servix cancel:', e) }
    finally { await pool.end() }
  }

  return res.json({ ok: true })
}
