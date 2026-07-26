import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/authOptions'
import { prisma } from '../../../lib/prisma'
import { Pool } from 'pg'
import { deactivateGymstackTenant } from '../../../lib/provisioning/gymstack'
import { sendCancellationEmail } from '../../../lib/email'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.email) return res.status(401).end()

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      subscriptions: {
        include: { plan: { include: { Product: true } as any }, provisioning: true } as any
      }
    }
  })
  const activeSub = user?.subscriptions?.find(s => s.status === 'active') as any
  if (!activeSub) return res.status(404).json({ error: 'Sin suscripción activa' })

  const product = activeSub.plan?.Product as { slug: string } | null
  const productSlug = product?.slug || (activeSub.servixRestaurantId ? 'servix' : 'unknown')

  // Cancelar en innovapp
  await prisma.subscription.update({
    where: { id: activeSub.id },
    data: { status: 'cancelled' }
  })

  if (productSlug === 'servix' && activeSub.servixRestaurantId) {
    const pool = new Pool({ connectionString: process.env.SERVIX_DB_URL })
    try {
      await pool.query('UPDATE "Restaurant" SET active = false WHERE id = $1', [activeSub.servixRestaurantId])
      await pool.query("UPDATE \"User\" SET password = 'SUSPENDED_' || extract(epoch from now()) WHERE email = $1", [session.user.email])
    } catch (e) { console.error('Error Servix cancel:', e) }
    finally { await pool.end() }
  } else if (productSlug === 'gymstack' && activeSub.provisioning?.externalId) {
    try {
      await deactivateGymstackTenant(activeSub.provisioning.externalId)
    } catch (e: any) { console.error('Error GymStack cancel:', e.message) }
  }

  try {
    await sendCancellationEmail(session.user.email, user?.name || '', productSlug)
  } catch (e: any) { console.error('Error email cancelación:', e.message) }

  return res.json({ ok: true })
}
