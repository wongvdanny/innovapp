import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/authOptions'
import { isAdmin } from '../../../lib/isAdmin'
import { prisma } from '../../../lib/prisma'
import { Pool } from 'pg'

const newsPool = new Pool({ connectionString: process.env.NEWS_DATABASE_URL })

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
      plan: { Product: { slug: 'news' } },
      provisioning: { isNot: null },
    } as any,
    include: { user: true, plan: true, provisioning: true } as any,
  })

  if (subs.length === 0) return res.json([])

  const results = await Promise.all(subs.map(async (sub: any) => {
    const newsUserId = sub.provisioning?.externalId
    if (!newsUserId) return null
    try {
      const userRes = await newsPool.query(

        `SELECT id, name, email, country, province, city, topics, plan FROM "User" WHERE id = $1`,
        [newsUserId]
      )
      const nUser = userRes.rows[0]
      if (!nUser) return null

      const digestsRes = await newsPool.query(`
        SELECT COUNT(*)::int AS cnt, MAX(date) AS last_date
        FROM "NewsDigest"
        WHERE "userId" = $1 AND date >= $2 AND date <= $3
      `, [newsUserId, dateFrom, dateTo])

      return {
        id: newsUserId,
        name: nUser.name,
        email: nUser.email,
        country: nUser.country,
        province: nUser.province,
        city: nUser.city,
        topics: nUser.topics,
        plan: sub.plan.name,
        planPrice: sub.plan.price,
        endDate: sub.endDate,
        digestsGenerated: digestsRes.rows[0].cnt,
        lastDigestDate: digestsRes.rows[0].last_date,
      }
    } catch (e: any) {
      console.error('Error usuario News', newsUserId, e.message)
      return null
    }
  }))

  return res.json(results.filter(Boolean))
}
