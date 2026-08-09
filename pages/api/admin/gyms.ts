import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/authOptions'
import { isAdmin } from '../../../lib/isAdmin'
import { prisma } from '../../../lib/prisma'
import { Pool } from 'pg'

const gymstackPool = new Pool({ connectionString: process.env.GYMSTACK_DB_URL })

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const session = await getServerSession(req, res, authOptions)
  if (!isAdmin(session)) return res.status(403).json({ error: 'No autorizado' })

  const { from, to } = req.query
  const dateFrom = from ? new Date(String(from)) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const dateTo   = to   ? new Date(String(to))   : new Date()

  const subs = await prisma.subscription.findMany({
    where: {
      status: 'active',
      plan: { Product: { slug: 'gymstack' } },
      provisioning: { isNot: null },
    } as any,
    include: { user: true, plan: true, provisioning: true } as any,
  })

  if (subs.length === 0) return res.json([])

  const results = await Promise.all(subs.map(async (sub: any) => {
    const gymId = sub.provisioning?.externalId
    if (!gymId) return null
    try {
      const gymRes = await gymstackPool.query(
        `SELECT id, name, slug, active FROM gyms WHERE id = $1`,
        [gymId]
      )
      const gym = gymRes.rows[0]
      if (!gym) return null

      const paymentsRes = await gymstackPool.query(`
        SELECT
          COUNT(*)::int AS total_payments_count,
          COALESCE(SUM(amount), 0)::float AS total_payments
        FROM payments p
        JOIN members m ON m.id = p."memberId"
        WHERE m."gymId" = $1 AND p.status = 'PAID' AND p."paidAt" >= $2 AND p."paidAt" <= $3
      `, [gymId, dateFrom, dateTo])

      const bookingsRes = await gymstackPool.query(`
        SELECT COUNT(*)::int AS cnt
        FROM bookings
        WHERE "gymId" = $1 AND "createdAt" >= $2 AND "createdAt" <= $3
      `, [gymId, dateFrom, dateTo])

      const membersRes = await gymstackPool.query(
        `SELECT COUNT(*)::int AS cnt FROM members WHERE "gymId" = $1 AND status = 'ACTIVE'`,
        [gymId]
      )
      const staffRes = await gymstackPool.query(
        `SELECT COUNT(*)::int AS cnt FROM users WHERE "gymId" = $1`,
        [gymId]
      )

      return {
        id: gymId,
        name: gym.name,
        slug: gym.slug,
        active: gym.active,
        owner: sub.user.name,
        email: sub.user.email,
        plan: sub.plan.name,
        planPrice: sub.plan.price,
        endDate: sub.endDate,
        totalSales: Math.round(paymentsRes.rows[0].total_payments * 100) / 100,
        totalBookings: bookingsRes.rows[0].cnt,
        activeMembers: membersRes.rows[0].cnt,
        staff: staffRes.rows[0].cnt,
      }
    } catch (e: any) {
      console.error('Error gimnasio', gymId, e.message)
      return null
    }
  }))

  return res.json(results.filter(Boolean))
}
